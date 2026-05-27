from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User
from app.db.session import get_db
from app.schemas.privacy_controls import SchoolPrivacyPolicyDefaultsResponse, SchoolPrivacyPolicyDefaultsUpdate
from app.services.privacy_controls import read_admin_school_privacy_policy, update_admin_school_privacy_policy

router = APIRouter()


@router.get("", response_model=SchoolPrivacyPolicyDefaultsResponse)
def read_privacy_policy(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SchoolPrivacyPolicyDefaultsResponse:
    return read_admin_school_privacy_policy(db, actor=current_user)


@router.put("", response_model=SchoolPrivacyPolicyDefaultsResponse)
def update_privacy_policy(
    payload: SchoolPrivacyPolicyDefaultsUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SchoolPrivacyPolicyDefaultsResponse:
    require_same_site_mutation(request, settings)
    return update_admin_school_privacy_policy(db, actor=current_user, payload=payload)

