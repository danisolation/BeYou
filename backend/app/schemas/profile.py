from __future__ import annotations

import uuid

from pydantic import BaseModel


class LinkedAdultResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    relationship_type: str
    link_status: str
    is_demo: bool


class StudentProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    school: str | None
    class_name: str | None
    is_demo: bool
    linked_adults: list[LinkedAdultResponse]


class LinkedStudentResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    school: str | None
    class_name: str | None
    relationship_type: str
    link_status: str
    is_demo: bool
