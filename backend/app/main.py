from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session as OrmSession

from app.api import (
    admin_content,
    admin_reports,
    admin_links,
    admin_operations,
    admin_users,
    adult_summaries,
    auth,
    chat,
    me,
    parent,
    privacy,
    sos,
    student,
    student_scenarios,
    student_self_checks,
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
    app = FastAPI(title="BeYou API")
    settings = get_settings()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_frontend_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
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
    app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
    app.include_router(parent.router, prefix="/api/parent", tags=["parent"])
    app.include_router(adult_summaries.router, prefix="/api", tags=["adult-summaries"])
    app.include_router(sos.router, prefix="/api", tags=["sos"])
    app.include_router(chat.router, prefix="/api", tags=["chat"])
    app.include_router(admin_users.router, prefix="/api/admin/users", tags=["admin"])
    app.include_router(admin_links.router, prefix="/api/admin/links", tags=["admin"])
    app.include_router(admin_content.router, prefix="/api/admin/content", tags=["admin"])
    app.include_router(admin_reports.router, prefix="/api/admin/reports", tags=["admin"])
    app.include_router(admin_operations.router, prefix="/api/admin/operations", tags=["admin"])

    return app


app = create_app()
