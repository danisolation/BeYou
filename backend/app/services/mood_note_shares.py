from __future__ import annotations

import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import (
    AccountStatus,
    LinkStatus,
    MoodCheckIn,
    MoodNoteShare,
    MoodNoteShareScope,
    StudentAdultLink,
    User,
    utc_now,
)
from app.schemas.mood_note_shares import (
    AdultSharedMoodNote,
    MoodNoteActiveShare,
    MoodNoteShareLinkedAdultOption,
    MoodNoteShareOptionsResponse,
    MoodNoteShareRequest,
    MoodNoteShareResponse,
    MoodNoteRevokeResponse,
)
from app.services.audit import record_audit_event

MOOD_NOTE_SHARE_PRIVACY_NOTES = [
    "Em chỉ chia sẻ nội dung của check-in em chọn.",
    "Người lớn chỉ xem được nội dung em đã đồng ý chia sẻ.",
    "Em có thể thu hồi quyền xem trong lịch sử check-in bất cứ lúc nào.",
]


def _active_linked_adult_rows(db: OrmSession, student_id: uuid.UUID) -> list[tuple[StudentAdultLink, User]]:
    return list(
        db.execute(
            select(StudentAdultLink, User)
            .join(User, User.id == StudentAdultLink.adult_id)
            .where(
                StudentAdultLink.student_id == student_id,
                StudentAdultLink.status == LinkStatus.ACTIVE.value,
                User.status == AccountStatus.ACTIVE.value,
            )
            .order_by(User.full_name.asc(), User.email.asc())
        ).all()
    )


def _active_share_items(
    db: OrmSession,
    *,
    student_id: uuid.UUID,
    checkin_ids: list[uuid.UUID],
) -> list[tuple[MoodNoteShare, MoodCheckIn, User]]:
    if not checkin_ids:
        return []
    return list(
        db.execute(
            select(MoodNoteShare, MoodCheckIn, User)
            .join(MoodCheckIn, MoodCheckIn.id == MoodNoteShare.mood_checkin_id)
            .join(User, User.id == MoodNoteShare.adult_id)
            .where(
                MoodNoteShare.student_id == student_id,
                MoodNoteShare.mood_checkin_id.in_(checkin_ids),
                MoodNoteShare.revoked_at.is_(None),
                User.status == AccountStatus.ACTIVE.value,
            )
            .order_by(MoodNoteShare.created_at.asc(), User.full_name.asc())
        ).all()
    )


def _active_share_schema(
    share: MoodNoteShare,
    checkin: MoodCheckIn,
    adult: User,
) -> MoodNoteActiveShare:
    return MoodNoteActiveShare(
        id=share.id,
        mood_checkin_id=share.mood_checkin_id,
        adult_id=share.adult_id,
        adult_full_name=adult.full_name,
        relationship_type=share.relationship_type_snapshot,
        share_scope=share.share_scope,
        has_private_note=checkin.private_note is not None,
        has_student_summary=share.student_summary is not None,
        created_at=share.created_at,
        is_demo=share.is_demo,
    )


def _safe_share_metadata(
    *,
    student_id: uuid.UUID,
    adult_id: uuid.UUID,
    share_id: uuid.UUID,
    mood_checkin_id: uuid.UUID,
    share_scope: str,
    relationship_type: str,
    has_private_note: bool,
    has_student_summary: bool,
    selected_adult_count: int,
) -> dict:
    return {
        "student_id": str(student_id),
        "adult_id": str(adult_id),
        "share_id": str(share_id),
        "mood_checkin_id": str(mood_checkin_id),
        "share_scope": share_scope,
        "relationship_type": relationship_type,
        "has_private_note": has_private_note,
        "has_student_summary": has_student_summary,
        "selected_adult_count": selected_adult_count,
        "decision": "metadata_only_student_consented_share",
    }


def _load_owned_checkin(db: OrmSession, student: User, checkin_id: uuid.UUID) -> MoodCheckIn:
    checkin = db.scalar(
        select(MoodCheckIn).where(
            MoodCheckIn.id == checkin_id,
            MoodCheckIn.student_id == student.id,
        )
    )
    if checkin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy check-in.")
    return checkin


def _validate_share_scope(checkin: MoodCheckIn, payload: MoodNoteShareRequest) -> str | None:
    if payload.share_scope == MoodNoteShareScope.PRIVATE_NOTE.value:
        if checkin.private_note is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Check-in này không có ghi chú riêng tư để chia sẻ.",
            )
        return None
    if payload.student_summary is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Em cần tự viết phần tóm tắt trước khi chia sẻ.",
        )
    return payload.student_summary


def _validate_selected_adults(
    db: OrmSession,
    student: User,
    adult_ids: list[uuid.UUID],
) -> list[tuple[StudentAdultLink, User]]:
    linked_by_adult_id = {adult.id: (link, adult) for link, adult in _active_linked_adult_rows(db, student.id)}
    missing = [adult_id for adult_id in adult_ids if adult_id not in linked_by_adult_id]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Chỉ có thể chọn người lớn đang được liên kết hoạt động với em.",
        )
    return [linked_by_adult_id[adult_id] for adult_id in adult_ids]


def list_share_options(db: OrmSession, student: User) -> MoodNoteShareOptionsResponse:
    require_permission(
        db,
        student,
        resource_type="mood_note_share",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    return MoodNoteShareOptionsResponse(
        available_adults=[
            MoodNoteShareLinkedAdultOption(
                id=adult.id,
                full_name=adult.full_name,
                relationship_type=link.relationship_type,
                is_demo=adult.is_demo,
            )
            for link, adult in _active_linked_adult_rows(db, student.id)
        ],
        privacy_notes=MOOD_NOTE_SHARE_PRIVACY_NOTES,
    )


def list_active_shares_for_student_checkins(
    db: OrmSession,
    student_id: uuid.UUID,
    checkin_ids: list[uuid.UUID],
) -> dict[uuid.UUID, list[MoodNoteActiveShare]]:
    shares_by_checkin: dict[uuid.UUID, list[MoodNoteActiveShare]] = defaultdict(list)
    for share, checkin, adult in _active_share_items(db, student_id=student_id, checkin_ids=checkin_ids):
        shares_by_checkin[share.mood_checkin_id].append(_active_share_schema(share, checkin, adult))
    return shares_by_checkin


def _response_for_checkin(
    db: OrmSession,
    checkin: MoodCheckIn,
    *,
    message: str,
) -> MoodNoteShareResponse:
    active_shares = list_active_shares_for_student_checkins(db, checkin.student_id, [checkin.id]).get(checkin.id, [])
    return MoodNoteShareResponse(
        mood_checkin_id=checkin.id,
        active_shares=active_shares,
        shareable=True,
        can_share_private_note=checkin.private_note is not None,
        message=message,
    )


def create_or_update_mood_note_shares(
    db: OrmSession,
    student: User,
    checkin_id: uuid.UUID,
    payload: MoodNoteShareRequest,
) -> MoodNoteShareResponse:
    require_permission(
        db,
        student,
        resource_type="mood_note_share",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    checkin = _load_owned_checkin(db, student, checkin_id)
    student_summary = _validate_share_scope(checkin, payload)
    selected_rows = _validate_selected_adults(db, student, payload.adult_ids)
    active_by_adult_id = {
        share.adult_id: share
        for share in db.scalars(
            select(MoodNoteShare).where(
                MoodNoteShare.mood_checkin_id == checkin.id,
                MoodNoteShare.adult_id.in_([adult.id for _, adult in selected_rows]),
                MoodNoteShare.revoked_at.is_(None),
            )
        )
    }

    for link, adult in selected_rows:
        share = active_by_adult_id.get(adult.id)
        created = share is None
        if share is None:
            share = MoodNoteShare(
                mood_checkin_id=checkin.id,
                student_id=student.id,
                adult_id=adult.id,
                relationship_type_snapshot=link.relationship_type,
                share_scope=payload.share_scope,
                student_summary=student_summary,
                is_demo=student.is_demo and adult.is_demo,
            )
            db.add(share)
        share.relationship_type_snapshot = link.relationship_type
        share.share_scope = payload.share_scope
        share.student_summary = student_summary
        share.is_demo = student.is_demo and adult.is_demo
        db.flush()
        record_audit_event(
            db,
            actor=student,
            actor_role=student.role,
            action="mood_note_share_created" if created else "mood_note_share_updated",
            resource_type="mood_note_share",
            resource_id=str(share.id),
            status_value="success",
            reason="student_consented_share",
            metadata_summary=_safe_share_metadata(
                student_id=student.id,
                adult_id=adult.id,
                share_id=share.id,
                mood_checkin_id=checkin.id,
                share_scope=share.share_scope,
                relationship_type=share.relationship_type_snapshot,
                has_private_note=checkin.private_note is not None,
                has_student_summary=share.student_summary is not None,
                selected_adult_count=len(selected_rows),
            ),
            is_demo=share.is_demo,
        )

    db.commit()
    return _response_for_checkin(
        db,
        checkin,
        message="Đã lưu quyền chia sẻ. Em có thể thu hồi trong thẻ check-in này bất cứ lúc nào.",
    )


def revoke_mood_note_share(
    db: OrmSession,
    student: User,
    checkin_id: uuid.UUID,
    adult_id: uuid.UUID,
) -> MoodNoteRevokeResponse:
    require_permission(
        db,
        student,
        resource_type="mood_note_share",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    checkin = _load_owned_checkin(db, student, checkin_id)
    share = db.scalar(
        select(MoodNoteShare).where(
            MoodNoteShare.mood_checkin_id == checkin.id,
            MoodNoteShare.student_id == student.id,
            MoodNoteShare.adult_id == adult_id,
            MoodNoteShare.revoked_at.is_(None),
        )
    )
    if share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy quyền chia sẻ đang hoạt động.")
    now = utc_now()
    share.revoked_at = now
    share.revoked_by_id = student.id
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="mood_note_share_revoked",
        resource_type="mood_note_share",
        resource_id=str(share.id),
        status_value="success",
        reason="student_revoked_share",
        metadata_summary={
            **_safe_share_metadata(
                student_id=student.id,
                adult_id=share.adult_id,
                share_id=share.id,
                mood_checkin_id=checkin.id,
                share_scope=share.share_scope,
                relationship_type=share.relationship_type_snapshot,
                has_private_note=checkin.private_note is not None,
                has_student_summary=share.student_summary is not None,
                selected_adult_count=1,
            ),
            "revoked_count": 1,
        },
        is_demo=share.is_demo,
    )
    db.commit()
    return MoodNoteRevokeResponse(
        mood_checkin_id=checkin.id,
        revoked_count=1,
        active_shares=list_active_shares_for_student_checkins(db, student.id, [checkin.id]).get(checkin.id, []),
        message="Đã thu hồi quyền xem.",
    )


def revoke_all_mood_note_shares(
    db: OrmSession,
    student: User,
    checkin_id: uuid.UUID,
) -> MoodNoteRevokeResponse:
    require_permission(
        db,
        student,
        resource_type="mood_note_share",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    checkin = _load_owned_checkin(db, student, checkin_id)
    shares = list(
        db.scalars(
            select(MoodNoteShare).where(
                MoodNoteShare.mood_checkin_id == checkin.id,
                MoodNoteShare.student_id == student.id,
                MoodNoteShare.revoked_at.is_(None),
            )
        )
    )
    now = utc_now()
    for share in shares:
        share.revoked_at = now
        share.revoked_by_id = student.id
        record_audit_event(
            db,
            actor=student,
            actor_role=student.role,
            action="mood_note_share_revoked",
            resource_type="mood_note_share",
            resource_id=str(share.id),
            status_value="success",
            reason="student_revoked_share",
            metadata_summary={
                **_safe_share_metadata(
                    student_id=student.id,
                    adult_id=share.adult_id,
                    share_id=share.id,
                    mood_checkin_id=checkin.id,
                    share_scope=share.share_scope,
                    relationship_type=share.relationship_type_snapshot,
                    has_private_note=checkin.private_note is not None,
                    has_student_summary=share.student_summary is not None,
                    selected_adult_count=len(shares),
                ),
                "revoked_count": len(shares),
            },
            is_demo=share.is_demo,
        )
    db.commit()
    return MoodNoteRevokeResponse(
        mood_checkin_id=checkin.id,
        revoked_count=len(shares),
        active_shares=list_active_shares_for_student_checkins(db, student.id, [checkin.id]).get(checkin.id, []),
        message="Đã thu hồi quyền xem.",
    )


def list_active_shared_notes_for_adult(
    db: OrmSession,
    adult: User,
    student_id: uuid.UUID,
    relationship_type: str,
) -> list[AdultSharedMoodNote]:
    require_permission(
        db,
        adult,
        resource_type="shared_mood_note",
        action="read",
        purpose="support_not_surveillance",
        student_id=student_id,
    )
    link = db.scalar(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == student_id,
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    )
    if link is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")

    rows = list(
        db.execute(
            select(MoodNoteShare, MoodCheckIn)
            .join(MoodCheckIn, MoodCheckIn.id == MoodNoteShare.mood_checkin_id)
            .where(
                MoodNoteShare.student_id == student_id,
                MoodNoteShare.adult_id == adult.id,
                MoodNoteShare.revoked_at.is_(None),
            )
            .order_by(MoodCheckIn.created_at.desc(), MoodNoteShare.created_at.desc())
        ).all()
    )
    shared_notes: list[AdultSharedMoodNote] = []
    share_ids: list[str] = []
    share_scopes: list[str] = []
    for share, checkin in rows:
        content = (
            checkin.private_note
            if share.share_scope == MoodNoteShareScope.PRIVATE_NOTE.value
            else share.student_summary
        )
        if content is None:
            continue
        share_ids.append(str(share.id))
        share_scopes.append(share.share_scope)
        shared_notes.append(
            AdultSharedMoodNote(
                id=share.id,
                mood_checkin_id=share.mood_checkin_id,
                shared_at=share.created_at,
                mood_created_at=checkin.created_at,
                share_scope=share.share_scope,
                content=content,
                relationship_type=share.relationship_type_snapshot,
                is_demo=share.is_demo,
            )
        )

    record_audit_event(
        db,
        actor=adult,
        actor_role=adult.role,
        action="mood_note_share_read",
        resource_type="shared_mood_note",
        resource_id=str(student_id),
        status_value="allowed",
        reason="student_consented_share_read",
        metadata_summary={
            "student_id": str(student_id),
            "adult_id": str(adult.id),
            "share_ids": share_ids,
            "shared_note_count": len(shared_notes),
            "share_scopes": sorted(set(share_scopes)),
            "relationship_type": relationship_type,
            "decision": "active_relationship_and_active_share_required",
        },
        is_demo=adult.is_demo,
    )
    return shared_notes
