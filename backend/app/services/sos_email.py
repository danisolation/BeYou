from __future__ import annotations

import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.db.models import (
    SosAlert,
    SosNotificationDelivery,
    SosNotificationDeliveryStatus,
    User,
    utc_now,
)
from app.services.audit import record_audit_event

EMAIL_CHANNEL = "email"
PROVIDER_DISABLED = "disabled"
PROVIDER_LOCAL_OUTBOX = "local_outbox"
PROVIDER_SMTP = "smtp"


def _delivery_audit_metadata(delivery: SosNotificationDelivery) -> dict[str, str | bool | int | None]:
    return {
        "alert_id": str(delivery.alert_id),
        "recipient_id": str(delivery.recipient_id),
        "recipient_role": delivery.recipient_role_snapshot,
        "channel": delivery.channel,
        "provider": delivery.provider,
        "status": delivery.status,
        "attempt_count": delivery.attempt_count,
        "error_code": delivery.error_code,
        "is_demo": delivery.is_demo,
    }


def _record_delivery_audit(
    db: OrmSession,
    *,
    actor: User,
    delivery: SosNotificationDelivery,
) -> None:
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action=f"sos_email_delivery_{delivery.status}",
        resource_type="sos_email_delivery",
        resource_id=str(delivery.id),
        status_value=delivery.status,
        reason="safety_escalation",
        metadata_summary=_delivery_audit_metadata(delivery),
        is_demo=delivery.is_demo,
    )


def _minimal_email_message(
    *,
    settings: Settings,
    recipient: User,
) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = "BeYou: Co tin hieu SOS moi"
    message["From"] = settings.smtp_from
    message["To"] = recipient.email
    message.set_content(
        "BeYou co tin hieu SOS moi tu mot hoc sinh duoc lien ket voi ban.\n\n"
        "Hay dang nhap BeYou de xem thong tin duoc phep va ho tro theo quy trinh trong ung dung.\n"
        "Email nay khong chua ghi chu rieng tu, cau tra loi tu kiem tra hay noi dung chatbot cua hoc sinh."
    )
    return message


def _send_smtp_message(settings: Settings, message: EmailMessage) -> None:
    if not settings.smtp_host or not settings.smtp_from:
        raise ValueError("smtp_configuration_missing")

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        timeout=settings.smtp_timeout_seconds,
    ) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


def _error_code(exc: Exception) -> str:
    if isinstance(exc, ValueError) and str(exc) == "smtp_configuration_missing":
        return "smtp_configuration_missing"
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return "smtp_authentication_failed"
    if isinstance(exc, smtplib.SMTPException):
        return "smtp_delivery_failed"
    return "smtp_error"


def _create_delivery(
    db: OrmSession,
    *,
    alert: SosAlert,
    recipient: User,
    provider: str,
    status: str,
    attempt_count: int,
    error_code: str | None = None,
) -> SosNotificationDelivery:
    now = utc_now()
    delivery = SosNotificationDelivery(
        alert_id=alert.id,
        recipient_id=recipient.id,
        channel=EMAIL_CHANNEL,
        provider=provider,
        recipient_role_snapshot=recipient.role,
        status=status,
        attempt_count=attempt_count,
        last_attempt_at=now if attempt_count > 0 else None,
        delivered_at=now if status == SosNotificationDeliveryStatus.SENT.value else None,
        error_code=error_code,
        is_demo=alert.is_demo or recipient.is_demo,
    )
    db.add(delivery)
    db.flush()
    return delivery


def create_sos_email_deliveries(
    db: OrmSession,
    *,
    alert: SosAlert,
    student: User,
    recipients: list[User],
    settings: Settings,
) -> list[SosNotificationDelivery]:
    provider = settings.sos_email_provider
    if provider == PROVIDER_DISABLED:
        return []

    deliveries: list[SosNotificationDelivery] = []
    for recipient in recipients:
        if provider == PROVIDER_LOCAL_OUTBOX:
            delivery = _create_delivery(
                db,
                alert=alert,
                recipient=recipient,
                provider=provider,
                status=SosNotificationDeliveryStatus.QUEUED.value,
                attempt_count=0,
            )
            _record_delivery_audit(db, actor=student, delivery=delivery)
            deliveries.append(delivery)
            continue

        delivery = _create_delivery(
            db,
            alert=alert,
            recipient=recipient,
            provider=provider,
            status=SosNotificationDeliveryStatus.QUEUED.value,
            attempt_count=1,
        )
        try:
            _send_smtp_message(settings, _minimal_email_message(settings=settings, recipient=recipient))
        except Exception as exc:
            delivery.status = SosNotificationDeliveryStatus.FAILED.value
            delivery.error_code = _error_code(exc)
        else:
            delivery.status = SosNotificationDeliveryStatus.SENT.value
            delivery.delivered_at = utc_now()
        delivery.updated_at = utc_now()
        _record_delivery_audit(db, actor=student, delivery=delivery)
        deliveries.append(delivery)

    return deliveries

