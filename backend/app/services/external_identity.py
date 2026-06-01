from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import AccountStatus, ExternalIdentity, ExternalIdentityStatus, User

ResolveExternalIdentityStatus = Literal[
    "linked_active_user",
    "pending_review",
    "disabled_identity",
    "deprovisioned_identity",
    "linked_user_inactive",
    "unknown_identity",
]


@dataclass(frozen=True)
class ExternalIdentityResolution:
    status: ResolveExternalIdentityStatus
    identity: ExternalIdentity | None
    user: User | None


def _normalize_provider_key(provider_key: str) -> str:
    return provider_key.strip().lower()


def hash_external_subject(provider_key: str, subject: str) -> str:
    normalized_provider_key = _normalize_provider_key(provider_key)
    return hashlib.sha256(f"{normalized_provider_key}:{subject}".encode("utf-8")).hexdigest()


def resolve_external_identity(
    db: OrmSession, provider_key: str, subject: str
) -> ExternalIdentityResolution:
    normalized_provider_key = _normalize_provider_key(provider_key)
    subject_hash = hash_external_subject(normalized_provider_key, subject)
    identity = db.scalar(
        select(ExternalIdentity).where(
            ExternalIdentity.provider_key == normalized_provider_key,
            ExternalIdentity.provider_subject_hash == subject_hash,
        )
    )
    if identity is None:
        return ExternalIdentityResolution(status="unknown_identity", identity=None, user=None)

    if identity.status == ExternalIdentityStatus.DISABLED.value:
        return ExternalIdentityResolution(status="disabled_identity", identity=identity, user=None)

    if identity.status == ExternalIdentityStatus.DEPROVISIONED.value:
        return ExternalIdentityResolution(
            status="deprovisioned_identity", identity=identity, user=None
        )

    if identity.status != ExternalIdentityStatus.LINKED.value or identity.linked_user_id is None:
        return ExternalIdentityResolution(status="pending_review", identity=identity, user=None)

    linked_user = db.get(User, identity.linked_user_id)
    if linked_user is None or linked_user.status != AccountStatus.ACTIVE.value:
        return ExternalIdentityResolution(
            status="linked_user_inactive", identity=identity, user=linked_user
        )

    return ExternalIdentityResolution(
        status="linked_active_user", identity=identity, user=linked_user
    )
