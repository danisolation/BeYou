from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session as OrmSession

from app.api import (
    admin_content,
    admin_mood_checkins,
    admin_reports,
    admin_links,
    admin_operations,
    admin_privacy_policy,
    admin_users,
    adult_summaries,
    auth,
    chat,
    internal,
    me,
    parent,
    privacy,
    sos,
    student,
    student_mood_checkins,
    student_notification_preferences,
    student_reminders,
    student_scenarios,
    student_self_checks,
    student_support_plan,
    teacher,
)
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.readiness import PublicReadinessResponse
from app.services.readiness import (
    build_readiness_report,
    public_readiness_from_report,
    readiness_http_status,
)


def create_app() -> FastAPI:
    app = FastAPI(title="Peerlight AI API")
    settings = get_settings()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_frontend_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Reset-Token"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/live")
    def health_live() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready", response_model=PublicReadinessResponse)
    def health_ready(
        db: OrmSession = Depends(get_db),
        current_settings: Settings = Depends(get_settings),
    ) -> JSONResponse:
        report = build_readiness_report(db, current_settings)
        public_response = public_readiness_from_report(report)
        return JSONResponse(
            status_code=readiness_http_status(report),
            content=public_response.model_dump(mode="json"),
        )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(me.router, prefix="/api/auth", tags=["auth"])
    app.include_router(privacy.router, prefix="/api/privacy", tags=["privacy"])
    app.include_router(student.router, prefix="/api/student", tags=["student"])
    app.include_router(
        student_self_checks.router, prefix="/api/student/self-checks", tags=["student"]
    )
    app.include_router(student_scenarios.router, prefix="/api/student/scenarios", tags=["student"])
    app.include_router(
        student_support_plan.router, prefix="/api/student/support-plan", tags=["student"]
    )
    app.include_router(
        student_mood_checkins.router, prefix="/api/student/mood-check-ins", tags=["student"]
    )
    app.include_router(
        student_notification_preferences.router,
        prefix="/api/student/notification-preferences",
        tags=["student"],
    )
    app.include_router(student_reminders.router, prefix="/api/student/reminders", tags=["student"])
    app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
    app.include_router(parent.router, prefix="/api/parent", tags=["parent"])
    app.include_router(adult_summaries.router, prefix="/api", tags=["adult-summaries"])
    app.include_router(sos.router, prefix="/api", tags=["sos"])
    app.include_router(chat.router, prefix="/api", tags=["chat"])
    app.include_router(admin_users.router, prefix="/api/admin/users", tags=["admin"])
    app.include_router(admin_links.router, prefix="/api/admin/links", tags=["admin"])
    app.include_router(admin_content.router, prefix="/api/admin/content", tags=["admin"])
    app.include_router(
        admin_mood_checkins.router, prefix="/api/admin/mood-checkins", tags=["admin"]
    )
    app.include_router(admin_reports.router, prefix="/api/admin/reports", tags=["admin"])
    app.include_router(admin_operations.router, prefix="/api/admin/operations", tags=["admin"])
    app.include_router(
        admin_privacy_policy.router, prefix="/api/admin/privacy-policy", tags=["admin"]
    )
    app.include_router(internal.router, prefix="/api/internal", tags=["internal"])

    @app.on_event("startup")
    def warm_db_pool() -> None:
        """Pre-warm a DB connection so first request isn't slow after cold start."""
        from app.db.session import engine

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

    return app


app = create_app()
