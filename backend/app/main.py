from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, me, parent, privacy, student, teacher
from app.core.config import get_settings


def create_app() -> FastAPI:
    app = FastAPI(title="BeYou API")
    settings = get_settings()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(me.router, prefix="/api/auth", tags=["auth"])
    app.include_router(privacy.router, prefix="/api/privacy", tags=["privacy"])
    app.include_router(student.router, prefix="/api/student", tags=["student"])
    app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
    app.include_router(parent.router, prefix="/api/parent", tags=["parent"])

    return app


app = create_app()
