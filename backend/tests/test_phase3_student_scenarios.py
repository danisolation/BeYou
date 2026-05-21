from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ContentStatus,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            ScenarioAttempt,
            ScenarioChoice,
            Scenario,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckThreshold,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            AuditEvent,
            StudentAdultLink,
            PrivacyAcknowledgement,
            UserSession,
            User,
        ):
            db.execute(delete(model))
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


def _student(db: OrmSession, email: str = "student-scenario@example.test") -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=UserRole.STUDENT.value,
        status=AccountStatus.ACTIVE.value,
        full_name="Học sinh Demo",
        school="THPT Demo",
        class_name="10A1",
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _scenario(
    db: OrmSession,
    *,
    title: str = "Rủ rê sau giờ học",
    status_value: str = ContentStatus.PUBLISHED.value,
    is_demo: bool = True,
) -> tuple[Scenario, list[ScenarioChoice]]:
    scenario = Scenario(
        title=title,
        situation="Một nhóm bạn rủ em bỏ tiết phụ đạo để đi chơi.",
        skill_tag="Từ chối an toàn",
        status=status_value,
        recommended_response="Em có thể nói: 'Mình không đi được, mình cần vào lớp. Hẹn các bạn lúc khác nhé.'",
        lesson="Từ chối rõ ràng và bình tĩnh giúp em giữ ranh giới mà không làm căng thẳng thêm.",
        is_demo=is_demo,
    )
    db.add(scenario)
    db.flush()
    choices = [
        ScenarioChoice(
            scenario_id=scenario.id,
            text="Nói rõ là em không tham gia và đề nghị gặp lại sau.",
            signal="constructive",
            feedback="Lựa chọn này có điểm tích cực vì em giữ ranh giới rõ ràng và vẫn tôn trọng bạn bè.",
            sort_order=1,
            is_demo=is_demo,
        ),
        ScenarioChoice(
            scenario_id=scenario.id,
            text="Đi theo nhóm dù trong lòng không muốn.",
            signal="risky",
            feedback="Lựa chọn này có thể khiến tình huống khó hơn vì em bỏ qua cảm giác không an toàn của mình.",
            sort_order=2,
            is_demo=is_demo,
        ),
    ]
    db.add_all(choices)
    db.commit()
    db.refresh(scenario)
    for choice in choices:
        db.refresh(choice)
    return scenario, choices


def test_scenario_service_lists_published_detail_and_preserves_attempt_snapshots(db: OrmSession) -> None:
    from app.services.scenarios import (
        get_published_scenario_detail,
        list_published_scenarios,
        list_student_scenario_attempts,
        submit_scenario_attempt,
    )

    student = _student(db)
    other_student = _student(db, "other-scenario-student@example.test")
    scenario, choices = _scenario(db)
    _scenario(db, title="Bản nháp", status_value=ContentStatus.DRAFT.value)
    _scenario(db, title="Đã lưu trữ", status_value=ContentStatus.ARCHIVED.value)

    listed = list_published_scenarios(db)
    assert [item.title for item in listed] == ["Rủ rê sau giờ học"]

    detail = get_published_scenario_detail(db, scenario.id)
    assert detail.recommended_response.startswith("Em có thể nói")
    assert [choice.signal for choice in detail.choices] == ["constructive", "risky"]

    attempt = submit_scenario_attempt(db, student, scenario.id, choices[1].id)
    assert attempt.selected_choice_snapshot == "Đi theo nhóm dù trong lòng không muốn."
    assert attempt.signal_snapshot == "risky"
    assert attempt.feedback_snapshot.startswith("Lựa chọn này có thể khiến")
    assert attempt.recommended_response_snapshot == scenario.recommended_response
    assert attempt.lesson_snapshot == scenario.lesson
    assert attempt.skill_tag_snapshot == "Từ chối an toàn"
    assert attempt.completed_at is not None
    assert attempt.is_demo is True

    scenario.title = "Tiêu đề đã chỉnh sửa"
    scenario.recommended_response = "Nội dung mới cho lần sau."
    scenario.lesson = "Bài học mới cho lần sau."
    scenario.skill_tag = "Kỹ năng mới"
    choices[1].text = "Lựa chọn đã chỉnh sửa"
    choices[1].feedback = "Phản hồi mới"
    choices[1].signal = "constructive"
    db.commit()
    db.expire_all()

    saved = db.get(ScenarioAttempt, attempt.id)
    assert saved is not None
    assert saved.scenario_title_snapshot == "Rủ rê sau giờ học"
    assert saved.selected_choice_snapshot == "Đi theo nhóm dù trong lòng không muốn."
    assert saved.signal_snapshot == "risky"
    assert saved.feedback_snapshot.startswith("Lựa chọn này có thể khiến")
    assert saved.recommended_response_snapshot.startswith("Em có thể nói")
    assert saved.lesson_snapshot.startswith("Từ chối rõ ràng")
    assert saved.skill_tag_snapshot == "Từ chối an toàn"

    assert [item.id for item in list_student_scenario_attempts(db, student)] == [attempt.id]
    assert list_student_scenario_attempts(db, other_student) == []


def test_scenario_service_rejects_unpublished_scenarios_and_foreign_choices(db: OrmSession) -> None:
    from app.services.scenarios import submit_scenario_attempt

    student = _student(db)
    draft, draft_choices = _scenario(db, title="Nháp", status_value=ContentStatus.DRAFT.value)
    published, _choices = _scenario(db)
    _other, other_choices = _scenario(db, title="Bạn bè trêu chọc online")

    with pytest.raises(HTTPException) as draft_exc:
        submit_scenario_attempt(db, student, draft.id, draft_choices[0].id)
    assert draft_exc.value.status_code == 404

    with pytest.raises(HTTPException) as choice_exc:
        submit_scenario_attempt(db, student, published.id, other_choices[0].id)
    assert choice_exc.value.status_code == 400

    assert db.scalar(select(func.count()).select_from(ScenarioAttempt)) == 0
