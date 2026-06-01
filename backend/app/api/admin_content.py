from __future__ import annotations

import uuid

from fastapi import APIRouter
from fastapi import Depends, Request, Response, status
from sqlalchemy.orm import Session as OrmSession

from app.api.admin_users import _require_admin
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User
from app.db.session import get_db
from app.schemas.admin_content import (
    AdminScenarioResponse,
    AdminScenarioUpsert,
    AdminSelfCheckTestResponse,
    AdminSelfCheckTestUpsert,
)
from app.services import admin_content

router = APIRouter()

SELF_CHECK_PUBLISH_VALIDATION_DETAIL = (
    "Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm."
)
SCENARIO_PUBLISH_VALIDATION_DETAIL = (
    "Chưa thể xuất bản vì nội dung tình huống còn thiếu lựa chọn, phản hồi hoặc bài học."
)


def _self_check_response(test) -> AdminSelfCheckTestResponse:
    test.questions.sort(key=lambda item: (item.sort_order, str(item.id)))
    for question in test.questions:
        question.choices.sort(key=lambda item: (item.sort_order, str(item.id)))
    test.thresholds.sort(key=lambda item: (item.min_score, item.max_score, item.state_label))
    return AdminSelfCheckTestResponse.model_validate(test)


def _scenario_response(scenario) -> AdminScenarioResponse:
    scenario.choices.sort(key=lambda item: (item.sort_order, str(item.id)))
    return AdminScenarioResponse.model_validate(scenario)


@router.get("/self-checks", response_model=list[AdminSelfCheckTestResponse])
def get_self_checks(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdminSelfCheckTestResponse]:
    _require_admin(db, current_user)
    return [_self_check_response(item) for item in admin_content.list_self_check_tests(db)]


@router.post(
    "/self-checks", response_model=AdminSelfCheckTestResponse, status_code=status.HTTP_201_CREATED
)
def post_self_check(
    payload: AdminSelfCheckTestUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminSelfCheckTestResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _self_check_response(
        admin_content.create_self_check_test(db, actor=current_user, payload=payload)
    )


@router.patch("/self-checks/{test_id}", response_model=AdminSelfCheckTestResponse)
def patch_self_check(
    test_id: uuid.UUID,
    payload: AdminSelfCheckTestUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminSelfCheckTestResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _self_check_response(
        admin_content.update_self_check_test(
            db, actor=current_user, test_id=test_id, payload=payload
        )
    )


@router.post("/self-checks/{test_id}/publish", response_model=AdminSelfCheckTestResponse)
def publish_self_check(
    test_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminSelfCheckTestResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _self_check_response(
        admin_content.publish_self_check_test(db, actor=current_user, test_id=test_id)
    )


@router.post("/self-checks/{test_id}/archive", response_model=AdminSelfCheckTestResponse)
def archive_self_check(
    test_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminSelfCheckTestResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _self_check_response(
        admin_content.archive_self_check_test(db, actor=current_user, test_id=test_id)
    )


@router.delete("/self-checks/{test_id}", response_model=AdminSelfCheckTestResponse | None)
def delete_self_check(
    test_id: uuid.UUID,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminSelfCheckTestResponse | None:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    deleted = admin_content.delete_unused_draft_self_check_test(
        db, actor=current_user, test_id=test_id
    )
    response.status_code = status.HTTP_200_OK
    return _self_check_response(deleted)


@router.get("/scenarios", response_model=list[AdminScenarioResponse])
def get_scenarios(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdminScenarioResponse]:
    _require_admin(db, current_user)
    return [_scenario_response(item) for item in admin_content.list_scenarios(db)]


@router.post(
    "/scenarios", response_model=AdminScenarioResponse, status_code=status.HTTP_201_CREATED
)
def post_scenario(
    payload: AdminScenarioUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminScenarioResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _scenario_response(
        admin_content.create_scenario(db, actor=current_user, payload=payload)
    )


@router.patch("/scenarios/{scenario_id}", response_model=AdminScenarioResponse)
def patch_scenario(
    scenario_id: uuid.UUID,
    payload: AdminScenarioUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminScenarioResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _scenario_response(
        admin_content.update_scenario(
            db, actor=current_user, scenario_id=scenario_id, payload=payload
        )
    )


@router.post("/scenarios/{scenario_id}/publish", response_model=AdminScenarioResponse)
def publish_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminScenarioResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _scenario_response(
        admin_content.publish_scenario(db, actor=current_user, scenario_id=scenario_id)
    )


@router.post("/scenarios/{scenario_id}/archive", response_model=AdminScenarioResponse)
def archive_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminScenarioResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _scenario_response(
        admin_content.archive_scenario(db, actor=current_user, scenario_id=scenario_id)
    )


@router.delete("/scenarios/{scenario_id}", response_model=AdminScenarioResponse | None)
def delete_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminScenarioResponse | None:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    deleted = admin_content.delete_unused_draft_scenario(
        db, actor=current_user, scenario_id=scenario_id
    )
    response.status_code = status.HTTP_200_OK
    return _scenario_response(deleted)
