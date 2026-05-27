from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

DemoScope = Literal["all", "demo", "real"]


class ExactCountBucket(BaseModel):
    key: str
    label: str
    count: int


class PrivacyCountBucket(BaseModel):
    key: str
    label: str
    count: int | None
    suppressed: bool = False


class UserAggregateReport(BaseModel):
    total: int
    by_role: list[ExactCountBucket]
    by_status: list[ExactCountBucket]
    by_demo_status: list[ExactCountBucket]


class LinkedStudentsAggregateReport(BaseModel):
    linked_students: int
    total_active_links: int
    by_relationship: list[ExactCountBucket]


class SelfCheckAggregateReport(BaseModel):
    total_completed: PrivacyCountBucket
    by_test: list[PrivacyCountBucket]
    risk_distribution: list[PrivacyCountBucket]


class SosAggregateReport(BaseModel):
    total_alerts: PrivacyCountBucket
    by_status: list[PrivacyCountBucket]
    by_severity: list[PrivacyCountBucket]
    by_source: list[PrivacyCountBucket]


class ScenarioAggregateReport(BaseModel):
    total_completed: PrivacyCountBucket
    popular_scenarios: list[PrivacyCountBucket]


class ChatbotSafetyAggregateReport(BaseModel):
    high_risk_signals: PrivacyCountBucket
    sos_suggested_signals: PrivacyCountBucket
    by_stage: list[PrivacyCountBucket]


class AdminAggregateReportResponse(BaseModel):
    generated_at: datetime
    demo_scope: DemoScope
    suppression_threshold: int
    privacy_notes: list[str]
    user_counts: UserAggregateReport
    linked_students: LinkedStudentsAggregateReport
    self_check_usage: SelfCheckAggregateReport
    sos_counts: SosAggregateReport
    scenario_usage: ScenarioAggregateReport
    chatbot_safety: ChatbotSafetyAggregateReport
