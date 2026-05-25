from __future__ import annotations

import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import inspect

from app.core.authorization import require_permission
from app.db.models import LinkStatus, RelationshipType, SosAlert, StudentAdultLink, User, UserRole
from app.db.session import engine
from app.db.session import SessionLocal


PHASE3_TABLES = {
    "self_check_tests",
    "self_check_questions",
    "self_check_choices",
    "self_check_thresholds",
    "self_check_attempts",
    "self_check_attempt_answers",
    "scenarios",
    "scenario_choices",
    "scenario_attempts",
}


def test_phase3_migration_creates_content_and_attempt_tables() -> None:
    inspector = inspect(engine)

    assert PHASE3_TABLES.issubset(set(inspector.get_table_names()))


def test_phase3_models_expose_locked_enum_values() -> None:
    from app.db.models import ContentStatus, RiskStateLabel, ScenarioSignal

    assert {status.value for status in ContentStatus} == {"draft", "published", "archived"}
    assert {label.value for label in RiskStateLabel} == {
        "On dinh",
        "Can chu y",
        "Nen tim ho tro",
        "Can ho tro som",
    }
    assert {signal.value for signal in ScenarioSignal} == {"constructive", "risky"}


def test_phase3_snapshot_and_demo_columns_exist() -> None:
    inspector = inspect(engine)
    columns_by_table = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in PHASE3_TABLES
    }

    for table_name, columns in columns_by_table.items():
        assert "is_demo" in columns, f"{table_name} must preserve demo/real data separation"

    assert {"test_snapshot", "test_title_snapshot"}.issubset(
        columns_by_table["self_check_attempts"]
    )
    assert {
        "question_text_snapshot",
        "choice_text_snapshot",
        "score_value_snapshot",
    }.issubset(columns_by_table["self_check_attempt_answers"])
    assert {
        "selected_choice_snapshot",
        "feedback_snapshot",
        "recommended_response_snapshot",
        "lesson_snapshot",
        "skill_tag_snapshot",
    }.issubset(columns_by_table["scenario_attempts"])


def test_phase3_authorization_keeps_raw_answers_student_private() -> None:
    student = User(
        email=f"student-{uuid.uuid4()}@example.test",
        password_hash="hash",
        role=UserRole.STUDENT.value,
        full_name="Hoc sinh Demo",
    )
    teacher = User(
        email=f"teacher-{uuid.uuid4()}@example.test",
        password_hash="hash",
        role=UserRole.TEACHER.value,
        full_name="Giao vien Demo",
    )
    admin = User(
        email=f"admin-{uuid.uuid4()}@example.test",
        password_hash="hash",
        role=UserRole.ADMIN.value,
        full_name="Quan tri Demo",
    )

    with SessionLocal() as db:
        db.add_all([student, teacher, admin])
        db.flush()
        db.add(
            StudentAdultLink(
                student_id=student.id,
                adult_id=teacher.id,
                relationship_type=RelationshipType.TEACHER.value,
                status=LinkStatus.ACTIVE.value,
                created_by=admin.id,
            )
        )
        db.add(
            SosAlert(
                student_id=student.id,
                student_full_name_snapshot=student.full_name,
                student_school_snapshot=None,
                student_class_name_snapshot=None,
                severity="support",
                source="test",
                current_status="sent",
                is_demo=True,
            )
        )
        db.commit()

        require_permission(
            db,
            student,
            resource_type="self_check_raw_answers",
            action="read",
            purpose="student_reflection",
            student_id=student.id,
        )

        require_permission(
            db,
            teacher,
            resource_type="self_check_summary",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )

        with pytest.raises(HTTPException):
            require_permission(
                db,
                teacher,
                resource_type="self_check_raw_answers",
                action="read",
                purpose="support_not_surveillance",
                student_id=student.id,
            )

        with pytest.raises(HTTPException):
            require_permission(
                db,
                admin,
                resource_type="self_check_raw_answers",
                action="read",
                purpose="admin_operations",
                student_id=student.id,
            )


def test_phase3_admin_content_permissions_are_explicit() -> None:
    admin = User(
        email=f"admin-{uuid.uuid4()}@example.test",
        password_hash="hash",
        role=UserRole.ADMIN.value,
        full_name="Quan tri Demo",
    )
    student = User(
        email=f"student-{uuid.uuid4()}@example.test",
        password_hash="hash",
        role=UserRole.STUDENT.value,
        full_name="Hoc sinh Demo",
    )

    with SessionLocal() as db:
        db.add_all([admin, student])
        db.commit()

        for resource_type in ("self_check_content", "scenario_content"):
            require_permission(
                db,
                admin,
                resource_type=resource_type,
                action="manage",
                purpose="admin_operations",
            )

        with pytest.raises(HTTPException):
            require_permission(
                db,
                student,
                resource_type="self_check_content",
                action="manage",
                purpose="admin_operations",
            )


def test_phase3_schema_contracts_import_without_adult_raw_answer_dtos() -> None:
    from app.schemas.scenarios import ScenarioFeedbackResponse
    from app.schemas.self_checks import (
        SelfCheckAttemptSubmitRequest,
        SelfCheckResultResponse,
        SelfCheckStateLabel,
    )

    assert SelfCheckStateLabel.CAN_HO_TRO_SOM.value == "Can ho tro som"
    assert "answers" in SelfCheckAttemptSubmitRequest.model_fields
    assert "suggested_next_action" in SelfCheckResultResponse.model_fields
    assert "recommended_response" in ScenarioFeedbackResponse.model_fields
    assert "full_self_check_answers" not in SelfCheckResultResponse.model_fields
