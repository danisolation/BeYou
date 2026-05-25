from __future__ import annotations

from typing import Any, cast

from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import (
    AccountStatus,
    ChatSafetySignal,
    LinkStatus,
    ScenarioAttempt,
    SelfCheckAttempt,
    SosAlert,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
)
from app.schemas.admin_reports import (
    AdminAggregateReportResponse,
    ChatbotSafetyAggregateReport,
    DemoScope,
    ExactCountBucket,
    LinkedStudentsAggregateReport,
    PrivacyCountBucket,
    ScenarioAggregateReport,
    SelfCheckAggregateReport,
    SosAggregateReport,
    UserAggregateReport,
)
from app.services.audit import record_audit_event

SUPPRESSION_THRESHOLD = 3
PRIVACY_NOTES = [
    "Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư. Trang này không hiển thị câu trả lời test tâm lý, tin nhắn chatbot, ghi chú SOS hay danh sách học sinh theo nguy cơ.",
    "Các nhóm nhạy cảm có ít hơn 3 bản ghi sẽ được ẩn để tránh nhận diện gián tiếp.",
    "Dùng báo cáo để cải thiện hỗ trợ chung, không dùng để xếp hạng hoặc giám sát từng học sinh.",
]
REPORT_SECTIONS = ["users", "links", "self_checks", "sos", "scenarios", "chatbot_safety"]

ROLE_LABELS = {
    UserRole.STUDENT.value: "Học sinh",
    UserRole.TEACHER.value: "Giáo viên",
    UserRole.PARENT.value: "Phụ huynh",
    UserRole.ADMIN.value: "Quản trị viên",
}
STATUS_LABELS = {
    AccountStatus.ACTIVE.value: "Đang hoạt động",
    AccountStatus.DISABLED.value: "Tạm khóa",
    AccountStatus.DELETED.value: "Đã xóa",
}
RELATIONSHIP_LABELS = {
    UserRole.TEACHER.value: "Giáo viên hỗ trợ",
    UserRole.PARENT.value: "Phụ huynh hỗ trợ",
}
SOS_STATUS_LABELS = {
    "sent": "Đã gửi",
    "received": "Đã nhận",
    "supporting": "Đang hỗ trợ",
    "completed": "Đã hoàn tất",
}
SOS_SEVERITY_LABELS = {"support": "Cần hỗ trợ", "urgent": "Không an toàn ngay lúc này"}
SOS_SOURCE_LABELS = {
    "student_dashboard": "Từ bảng điều khiển học sinh",
    "self_check_result": "Từ kết quả test tâm lý",
    "chatbot": "Từ chatbot hỗ trợ",
    "demo_seed": "Dữ liệu demo",
}
CHAT_STAGE_LABELS = {"input": "Tín hiệu từ chia sẻ của học sinh", "output": "Tín hiệu từ phản hồi chatbot"}


def _demo_condition(model: Any, demo_scope: DemoScope):
    if demo_scope == "demo":
        return model.is_demo.is_(True)
    if demo_scope == "real":
        return model.is_demo.is_(False)
    return None


def _conditions(model: Any, demo_scope: DemoScope, *extra: Any) -> list[Any]:
    conditions = [condition for condition in extra if condition is not None]
    demo_condition = _demo_condition(model, demo_scope)
    if demo_condition is not None:
        conditions.append(demo_condition)
    return conditions


def _scalar_count(db: OrmSession, model: Any, demo_scope: DemoScope, *extra: Any) -> int:
    stmt = select(func.count()).select_from(model).where(*_conditions(model, demo_scope, *extra))
    return int(db.scalar(stmt) or 0)


def _exact_bucket(key: str, count: int, labels: dict[str, str] | None = None) -> ExactCountBucket:
    return ExactCountBucket(key=key, label=(labels or {}).get(key, key), count=count)


def _is_suppressed(count: int) -> bool:
    return 0 < count < SUPPRESSION_THRESHOLD


def _privacy_bucket(key: str, count: int, labels: dict[str, str] | None = None) -> PrivacyCountBucket:
    suppressed = _is_suppressed(count)
    return PrivacyCountBucket(
        key=key,
        label=(labels or {}).get(key, key),
        count=None if suppressed else count,
        suppressed=suppressed,
    )


def _group_counts(
    db: OrmSession,
    *,
    model: Any,
    column: Any,
    demo_scope: DemoScope,
    labels: dict[str, str] | None = None,
    sensitive: bool,
    extra_conditions: tuple[Any, ...] = (),
    limit: int | None = None,
) -> list[ExactCountBucket] | list[PrivacyCountBucket]:
    count_expr = func.count()
    stmt = (
        select(column, count_expr)
        .select_from(model)
        .where(*_conditions(model, demo_scope, *extra_conditions))
        .group_by(column)
        .order_by(count_expr.desc(), column.asc())
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    rows = db.execute(stmt).all()
    if sensitive:
        return [_privacy_bucket(str(key), int(count), labels) for key, count in rows]
    return [_exact_bucket(str(key), int(count), labels) for key, count in rows]


def _user_counts(db: OrmSession, demo_scope: DemoScope) -> UserAggregateReport:
    total = _scalar_count(db, User, demo_scope)
    role_buckets = cast(
        list[ExactCountBucket],
        _group_counts(db, model=User, column=User.role, demo_scope=demo_scope, labels=ROLE_LABELS, sensitive=False),
    )
    status_buckets = cast(
        list[ExactCountBucket],
        _group_counts(
            db,
            model=User,
            column=User.status,
            demo_scope=demo_scope,
            labels=STATUS_LABELS,
            sensitive=False,
        ),
    )
    demo_rows = db.execute(
        select(User.is_demo, func.count())
        .select_from(User)
        .where(*_conditions(User, demo_scope))
        .group_by(User.is_demo)
        .order_by(User.is_demo.desc())
    ).all()
    demo_buckets = [
        ExactCountBucket(
            key="demo" if is_demo else "real",
            label="Dữ liệu demo" if is_demo else "Dữ liệu thật",
            count=int(count),
        )
        for is_demo, count in demo_rows
    ]
    return UserAggregateReport(
        total=total,
        by_role=role_buckets,
        by_status=status_buckets,
        by_demo_status=demo_buckets,
    )


def _linked_students(db: OrmSession, demo_scope: DemoScope) -> LinkedStudentsAggregateReport:
    active_condition = StudentAdultLink.status == LinkStatus.ACTIVE.value
    total_active_links = _scalar_count(db, StudentAdultLink, demo_scope, active_condition)
    linked_students_count = int(
        db.scalar(
            select(func.count(func.distinct(StudentAdultLink.student_id)))
            .select_from(StudentAdultLink)
            .where(*_conditions(StudentAdultLink, demo_scope, active_condition))
        )
        or 0
    )
    relationship_buckets = cast(
        list[ExactCountBucket],
        _group_counts(
            db,
            model=StudentAdultLink,
            column=StudentAdultLink.relationship_type,
            demo_scope=demo_scope,
            labels=RELATIONSHIP_LABELS,
            sensitive=False,
            extra_conditions=(active_condition,),
        ),
    )
    return LinkedStudentsAggregateReport(
        linked_students=linked_students_count,
        total_active_links=total_active_links,
        by_relationship=relationship_buckets,
    )


def _self_check_usage(db: OrmSession, demo_scope: DemoScope) -> SelfCheckAggregateReport:
    total = _scalar_count(db, SelfCheckAttempt, demo_scope)
    return SelfCheckAggregateReport(
        total_completed=_privacy_bucket("self_check_completed", total, {"self_check_completed": "Lượt test tâm lý"}),
        by_test=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=SelfCheckAttempt,
                column=SelfCheckAttempt.test_title_snapshot,
                demo_scope=demo_scope,
                sensitive=True,
                limit=10,
            ),
        ),
        risk_distribution=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=SelfCheckAttempt,
                column=SelfCheckAttempt.state_label,
                demo_scope=demo_scope,
                sensitive=True,
            ),
        ),
    )


def _sos_counts(db: OrmSession, demo_scope: DemoScope) -> SosAggregateReport:
    total = _scalar_count(db, SosAlert, demo_scope)
    return SosAggregateReport(
        total_alerts=_privacy_bucket("sos_alerts", total, {"sos_alerts": "Tín hiệu SOS"}),
        by_status=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=SosAlert,
                column=SosAlert.current_status,
                demo_scope=demo_scope,
                labels=SOS_STATUS_LABELS,
                sensitive=True,
            ),
        ),
        by_severity=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=SosAlert,
                column=SosAlert.severity,
                demo_scope=demo_scope,
                labels=SOS_SEVERITY_LABELS,
                sensitive=True,
            ),
        ),
        by_source=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=SosAlert,
                column=SosAlert.source,
                demo_scope=demo_scope,
                labels=SOS_SOURCE_LABELS,
                sensitive=True,
            ),
        ),
    )


def _scenario_usage(db: OrmSession, demo_scope: DemoScope) -> ScenarioAggregateReport:
    total = _scalar_count(db, ScenarioAttempt, demo_scope)
    return ScenarioAggregateReport(
        total_completed=_privacy_bucket("scenario_attempts", total, {"scenario_attempts": "Lượt luyện tình huống"}),
        popular_scenarios=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=ScenarioAttempt,
                column=ScenarioAttempt.scenario_title_snapshot,
                demo_scope=demo_scope,
                sensitive=True,
                limit=5,
            ),
        ),
    )


def _chatbot_safety(db: OrmSession, demo_scope: DemoScope) -> ChatbotSafetyAggregateReport:
    high_risk_count = _scalar_count(
        db,
        ChatSafetySignal,
        demo_scope,
        ChatSafetySignal.summary == "high_risk_detected",
    )
    sos_suggested_count = _scalar_count(
        db,
        ChatSafetySignal,
        demo_scope,
        ChatSafetySignal.summary == "high_risk_detected",
        ChatSafetySignal.sos_suggested.is_(True),
    )
    return ChatbotSafetyAggregateReport(
        high_risk_signals=_privacy_bucket(
            "high_risk_signals",
            high_risk_count,
            {"high_risk_signals": "Tín hiệu chatbot cần ưu tiên an toàn"},
        ),
        sos_suggested_signals=_privacy_bucket(
            "sos_suggested_signals",
            sos_suggested_count,
            {"sos_suggested_signals": "Tín hiệu chatbot gợi ý SOS/người lớn tin tưởng"},
        ),
        by_stage=cast(
            list[PrivacyCountBucket],
            _group_counts(
                db,
                model=ChatSafetySignal,
                column=ChatSafetySignal.stage,
                demo_scope=demo_scope,
                labels=CHAT_STAGE_LABELS,
                sensitive=True,
                extra_conditions=(ChatSafetySignal.summary == "high_risk_detected",),
            ),
        ),
    )


def get_admin_aggregate_report(
    db: OrmSession,
    *,
    actor: User,
    demo_scope: DemoScope = "all",
) -> AdminAggregateReportResponse:
    require_permission(
        db,
        actor,
        resource_type="aggregate_report",
        action="read",
        purpose="admin_operations",
    )
    report = AdminAggregateReportResponse(
        generated_at=utc_now(),
        demo_scope=demo_scope,
        suppression_threshold=SUPPRESSION_THRESHOLD,
        privacy_notes=PRIVACY_NOTES,
        user_counts=_user_counts(db, demo_scope),
        linked_students=_linked_students(db, demo_scope),
        self_check_usage=_self_check_usage(db, demo_scope),
        sos_counts=_sos_counts(db, demo_scope),
        scenario_usage=_scenario_usage(db, demo_scope),
        chatbot_safety=_chatbot_safety(db, demo_scope),
    )
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="sensitive_resource_read",
        resource_type="aggregate_report",
        resource_id="aggregate",
        status_value="allowed",
        reason="admin_aggregate_privacy_review",
        metadata_summary={
            "demo_scope": demo_scope,
            "suppression_threshold": SUPPRESSION_THRESHOLD,
            "sections": REPORT_SECTIONS,
            "decision": "aggregate_only_no_raw_exports",
        },
        is_demo=demo_scope == "demo",
    )
    db.commit()
    return report
