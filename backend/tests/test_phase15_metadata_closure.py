from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    MoodCheckInConfig,
    PrivacyAcknowledgement,
    Session as UserSession,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PRIVATE_PHASE15"


def _config_payload(*, status_value: str = "published", unsafe: bool = False, missing: bool = False) -> dict:
    mood_options = [
        {"key": "steady", "label": "Khá ổn", "helper": "Em thấy tương đối cân bằng."},
        {"key": "okay", "label": "Bình thường", "helper": "Không quá tốt, không quá tệ."},
        {"key": "tired", "label": "Mệt", "helper": "Em thấy thiếu năng lượng."},
        {"key": "sad", "label": "Buồn", "helper": "Em đang thấy nặng lòng."},
        {"key": "anxious", "label": "Lo lắng", "helper": "Em thấy căng hoặc khó yên tâm."},
        {"key": "overwhelmed", "label": "Quá tải", "helper": "Em thấy mọi thứ hơi nhiều với mình."},
    ]
    context_tags = [
        {"key": "school", "label": "Trường/lớp"},
        {"key": "family", "label": "Gia đình"},
        {"key": "friends", "label": "Bạn bè"},
        {"key": "body", "label": "Cơ thể/sức khỏe"},
        {"key": "sleep", "label": "Giấc ngủ"},
        {"key": "future", "label": "Tương lai"},
        {"key": "other", "label": "Khác"},
    ]
    if missing:
        mood_options = mood_options[:2]
    return {
        "name": "phase15-default",
        "status": status_value,
        "student_prompt": "Dành một phút gọi tên cảm xúc hiện tại của em.",
        "adult_guidance": "Bắt đầu bằng lắng nghe và hỏi em muốn được hỗ trợ thế nào.",
        "mood_options": mood_options if not unsafe else [{**mood_options[0], "label": "Chẩn đoán nguy cơ"}] + mood_options[1:],
        "context_tags": context_tags,
        "sort_order": -100,
    }


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).where(User.email.like("%phase15%@example.test"))))
        config_ids = list(db.scalars(select(MoodCheckInConfig.id).where(MoodCheckInConfig.name.like("phase15%"))))
        if config_ids:
            db.execute(delete(AuditEvent).where(AuditEvent.resource_id.in_([str(config_id) for config_id in config_ids])))
            db.execute(delete(MoodCheckInConfig).where(MoodCheckInConfig.id.in_(config_ids)))
        db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(user_ids)))
        db.execute(delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id.in_(user_ids)))
        db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
        db.execute(delete(User).where(User.id.in_(user_ids)))
        db.commit()


@pytest.fixture()
def db() -> OrmSession:
    _clean_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_database()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = True) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Phase15",
        school="THPT Phase15" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _ack(db: OrmSession, student: User) -> None:
    db.add(PrivacyAcknowledgement(user_id=student.id, notice_version=NOTICE_VERSION, is_demo=True))
    db.commit()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def test_cors_allows_v1_2_put_mutations(client: TestClient) -> None:
    response = client.options(
        "/api/student/support-plan",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert "PUT" in response.headers["access-control-allow-methods"]


def test_admin_publishes_previews_and_student_options_use_mood_config(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin = _user(db, email="admin-phase15@example.test", role=UserRole.ADMIN.value)
    student = _user(db, email="student-phase15@example.test", role=UserRole.STUDENT.value)
    _ack(db, student)

    _login(client, admin.email)
    create_response = client.post(
        "/api/admin/mood-checkins/configs",
        json=_config_payload(),
        headers=ORIGIN_HEADERS,
    )
    assert create_response.status_code == 201
    config = create_response.json()
    assert config["status"] == "published"
    assert config["mood_options"][0]["key"] == "steady"

    preview_response = client.get(f"/api/admin/mood-checkins/configs/{config['id']}/preview")
    assert preview_response.status_code == 200
    assert preview_response.json()["student_prompt"] == "Dành một phút gọi tên cảm xúc hiện tại của em."

    client.cookies.clear()
    _login(client, student.email)
    options_response = client.get("/api/student/mood-check-ins/options")
    assert options_response.status_code == 200
    assert options_response.json()["student_prompt"] == "Dành một phút gọi tên cảm xúc hiện tại của em."

    audit_event = db.scalar(select(AuditEvent).where(AuditEvent.resource_type == "mood_checkin_config"))
    assert audit_event is not None
    assert audit_event.metadata_summary["mood_option_count"] == 6
    assert "student_prompt" not in audit_event.metadata_summary


def test_admin_config_validation_blocks_missing_options_and_unsafe_copy(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin = _user(db, email="admin-phase15-invalid@example.test", role=UserRole.ADMIN.value)
    _login(client, admin.email)

    missing_response = client.post(
        "/api/admin/mood-checkins/configs",
        json=_config_payload(missing=True),
        headers=ORIGIN_HEADERS,
    )
    unsafe_response = client.post(
        "/api/admin/mood-checkins/configs",
        json={**_config_payload(unsafe=True), "name": "phase15-unsafe"},
        headers=ORIGIN_HEADERS,
    )

    assert missing_response.status_code == 422
    assert unsafe_response.status_code == 422


def test_operations_dashboard_counts_v1_2_audit_and_sanitizes_raw_metadata(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin = _user(db, email="admin-phase15-ops@example.test", role=UserRole.ADMIN.value)
    db.add_all(
        [
            AuditEvent(
                actor_id=admin.id,
                actor_role=UserRole.STUDENT.value,
                action="mood_check_in_created",
                resource_type="mood_check_in",
                resource_id="mood-1",
                status="success",
                metadata_summary={"private_note": PRIVATE_MARKER, "trend_label": "Cần hỗ trợ sớm"},
                is_demo=True,
            ),
            AuditEvent(
                actor_id=admin.id,
                actor_role=UserRole.TEACHER.value,
                action="sensitive_resource_read",
                resource_type="adult_support_summary",
                resource_id="student-1",
                status="allowed",
                metadata_summary={"recent_mood_checkin_count": 1, "student_id": "student-1"},
                is_demo=True,
            ),
        ]
    )
    db.commit()

    _login(client, admin.email)
    response = client.get("/api/admin/operations/dashboard", params={"limit": 10})

    assert response.status_code == 200
    payload = response.json()
    buckets = {bucket["key"]: bucket["count"] for bucket in payload["v1_2_audit"]}
    assert buckets["mood_check_in"] >= 1
    assert buckets["adult_support_summary"] >= 1
    assert PRIVATE_MARKER not in response.text
    assert "student_id" not in response.text
