from __future__ import annotations

import json
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.db.models import SosAlert, User, WebPushSubscription, utc_now
from app.schemas.sos import WebPushSubscriptionResponse, WebPushSubscriptionUpsert
from app.services.audit import record_audit_event

logger = logging.getLogger("beyou.web_push")


def web_push_enabled(settings: Settings) -> bool:
    return bool(settings.web_push_vapid_public_key and settings.web_push_vapid_private_key)


def upsert_web_push_subscription(
    db: OrmSession,
    *,
    user: User,
    payload: WebPushSubscriptionUpsert,
    user_agent: str | None,
    settings: Settings,
) -> WebPushSubscriptionResponse:
    if not web_push_enabled(settings):
        return WebPushSubscriptionResponse(enabled=False, endpoint=None)

    now = utc_now()
    subscription = db.scalar(
        select(WebPushSubscription).where(WebPushSubscription.endpoint == payload.endpoint)
    )
    if subscription is None:
        subscription = WebPushSubscription(
            user_id=user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
            user_agent=user_agent,
            is_demo=user.is_demo,
            last_seen_at=now,
        )
        db.add(subscription)
    else:
        subscription.user_id = user.id
        subscription.p256dh = payload.keys.p256dh
        subscription.auth = payload.keys.auth
        subscription.user_agent = user_agent
        subscription.is_demo = user.is_demo
        subscription.last_seen_at = now
        subscription.updated_at = now

    db.commit()
    record_audit_event(
        db,
        actor=user,
        actor_role=user.role,
        action="web_push_subscription_upserted",
        resource_type="web_push_subscription",
        resource_id=str(subscription.id),
        status_value="success",
        reason="notification_consent",
        metadata_summary={"is_demo": user.is_demo, "endpoint_present": True},
    )
    db.commit()
    return WebPushSubscriptionResponse(enabled=True, endpoint=subscription.endpoint)


def delete_web_push_subscription(db: OrmSession, *, user: User, endpoint: str) -> None:
    subscription = db.scalar(
        select(WebPushSubscription).where(
            WebPushSubscription.user_id == user.id,
            WebPushSubscription.endpoint == endpoint,
        )
    )
    if subscription is None:
        return

    subscription_id = subscription.id
    db.delete(subscription)
    record_audit_event(
        db,
        actor=user,
        actor_role=user.role,
        action="web_push_subscription_deleted",
        resource_type="web_push_subscription",
        resource_id=str(subscription_id),
        status_value="success",
        reason="notification_consent",
        metadata_summary={"is_demo": user.is_demo},
    )
    db.commit()


def send_sos_web_push_notifications(
    db: OrmSession,
    *,
    alert: SosAlert,
    recipients: list[User],
    settings: Settings,
) -> None:
    if not web_push_enabled(settings) or not recipients:
        return

    try:
        from pywebpush import WebPushException, webpush
    except Exception as exc:  # pragma: no cover - import guard for misconfigured envs
        logger.warning("web_push_import_failed", extra={"error": type(exc).__name__})
        return

    recipient_ids = [recipient.id for recipient in recipients]
    subscriptions = list(
        db.scalars(
            select(WebPushSubscription).where(WebPushSubscription.user_id.in_(recipient_ids))
        )
    )
    if not subscriptions:
        return

    href_by_recipient = {
        recipient.id: f"/{recipient.role}/sos-alerts/{alert.id}"
        for recipient in recipients
        if recipient.role in {"teacher", "parent"}
    }
    payload = {
        "title": "Peerlight AI SOS",
        "body": "Có tín hiệu SOS mới cần chú ý trong Peerlight AI.",
        "href": None,
        "tag": f"sos-{alert.id}",
    }

    for subscription in subscriptions:
        # Per-recipient href keeps teacher/parent routes correct without exposing sensitive content.
        payload["href"] = href_by_recipient.get(subscription.user_id, "/")
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.web_push_vapid_private_key,
                vapid_claims={"sub": settings.web_push_subject},
            )
        except WebPushException as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code in {404, 410}:
                db.delete(subscription)
            logger.warning(
                "web_push_send_failed",
                extra={"subscription_id": str(subscription.id), "status_code": status_code},
            )
        except Exception as exc:  # pragma: no cover - provider/runtime failure should not block SOS
            logger.warning(
                "web_push_send_error",
                extra={"subscription_id": str(subscription.id), "error": type(exc).__name__},
            )
    db.flush()
