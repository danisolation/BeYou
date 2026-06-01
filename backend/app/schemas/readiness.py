from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ReadinessCheckStatus = Literal["pass", "warn", "fail"]
ReadinessOverallStatus = Literal["ready", "degraded", "not_ready"]


class ReadinessCheck(BaseModel):
    key: str
    category: str
    status: ReadinessCheckStatus
    summary: str
    remediation: str | None = None


class ReadinessReport(BaseModel):
    status: ReadinessOverallStatus
    generated_at: datetime
    checks: list[ReadinessCheck]


class PublicReadinessResponse(BaseModel):
    status: ReadinessOverallStatus
    generated_at: datetime
