"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import {
  getMoodCheckInHistory,
  getMoodNoteShareOptions,
  moodLabelFallbacks,
  revokeAllMoodCheckInShares,
  revokeMoodCheckInShare,
  shareMoodCheckInNote,
  type ContextTagOption,
  type MoodCheckIn,
  type MoodNoteActiveShare,
  type MoodNoteShareLinkedAdultOption,
  type MoodNoteShareScope,
} from "@/lib/mood-checkin-api";

const contextFallbacks: Record<string, string> = {
  school: "Trường/lớp",
  family: "Gia đình",
  friends: "Bạn bè",
  body: "Cơ thể/sức khỏe",
  sleep: "Giấc ngủ",
  future: "Tương lai",
  other: "Khác",
};

export default function StudentMoodCheckInHistoryPage() {
  const [items, setItems] = useState<MoodCheckIn[]>([]);
  const [availableAdults, setAvailableAdults] = useState<MoodNoteShareLinkedAdultOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMoodCheckInHistory(), getMoodNoteShareOptions()])
      .then(([historyPayload, shareOptions]) => {
        setItems(historyPayload.items);
        setAvailableAdults(shareOptions.available_adults);
      })
      .catch(() => setErrorMessage("Chưa tải được lịch sử check-in. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  const contextOptions = useMemo<ContextTagOption[]>(
    () => Object.entries(contextFallbacks).map(([key, label]) => ({ key, label })),
    [],
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (errorMessage) {
    return <EmptyState heading="Chưa mở được lịch sử check-in" body={errorMessage} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        heading="Chưa có check-in nào để chia sẻ"
        body="Khi em có check-in cảm xúc, em có thể tự chọn chia sẻ ghi chú riêng tư hoặc phần tóm tắt em tự viết với người lớn tin tưởng. Không bắt buộc phải chia sẻ."
      />
    );
  }

  function updateItemShares(
    checkinId: string,
    activeShares: MoodNoteActiveShare[],
    shareable?: boolean,
    canSharePrivateNote?: boolean,
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === checkinId
          ? {
              ...item,
              active_shares: activeShares,
              shareable: shareable ?? item.shareable,
              can_share_private_note: canSharePrivateNote ?? item.can_share_private_note,
            }
          : item,
      ),
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-[#1a2244] border border-outline-variant/30 p-5">
        <h1 className="text-lg font-semibold text-on-background">Lịch sử check-in cảm xúc</h1>
        <p className="mt-4 text-sm">
          Đây là lịch sử riêng của em. Nếu muốn, em có thể chọn đúng check-in, đúng người lớn tin tưởng
          và đúng phần nội dung để chia sẻ; các nội dung khác vẫn riêng tư.
        </p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <MoodHistoryItem
            key={item.id}
            item={item}
            contextOptions={contextOptions}
            availableAdults={availableAdults}
            onSharesChanged={updateItemShares}
          />
        ))}
      </div>
    </section>
  );
}

function MoodHistoryItem({
  item,
  contextOptions,
  availableAdults,
  onSharesChanged,
}: {
  item: MoodCheckIn;
  contextOptions: ContextTagOption[];
  availableAdults: MoodNoteShareLinkedAdultOption[];
  onSharesChanged: (
    checkinId: string,
    activeShares: MoodNoteActiveShare[],
    shareable?: boolean,
    canSharePrivateNote?: boolean,
  ) => void;
}) {
  const contextLabels = item.context_tags.map(
    (tag) => contextOptions.find((option) => option.key === tag)?.label ?? tag,
  );
  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{item.trend_label}</h2>
      </div>
      <p className="mt-2 text-xs">Gửi lúc: {new Date(item.created_at).toLocaleString("vi-VN")}</p>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <p><strong>Cảm xúc:</strong> {moodLabelFallbacks[item.mood_label]}</p>
        <p><strong>Năng lượng:</strong> {item.energy_level}/5</p>
        <p><strong>Căng thẳng:</strong> {item.stress_level}/5</p>
      </div>
      {contextLabels.length > 0 ? (
        <p className="mt-3 text-sm">
          <strong>Ngữ cảnh:</strong> {contextLabels.join(", ")}
        </p>
      ) : null}
      <p className="mt-3 text-sm">{item.supportive_message}</p>
      {item.private_note ? (
        <div className="mt-4 rounded-2xl bg-primary/5 p-4">
          <p className="text-xs font-semibold">Ghi chú riêng tư của em</p>
          <p className="mt-2 text-sm">{item.private_note}</p>
        </div>
      ) : null}
      {item.shareable ? (
        <MoodShareControls
          item={item}
          availableAdults={availableAdults}
          onSharesChanged={onSharesChanged}
        />
      ) : null}
    </article>
  );
}

function relationshipLabel(value: string) {
  if (value === "teacher") {
    return "teacher";
  }
  if (value === "parent") {
    return "parent";
  }
  return value;
}

function shareScopePreview(scope: MoodNoteShareScope) {
  return scope === "private_note" ? "private note" : "phần tóm tắt em tự viết";
}

function MoodShareControls({
  item,
  availableAdults,
  onSharesChanged,
}: {
  item: MoodCheckIn;
  availableAdults: MoodNoteShareLinkedAdultOption[];
  onSharesChanged: (
    checkinId: string,
    activeShares: MoodNoteActiveShare[],
    shareable?: boolean,
    canSharePrivateNote?: boolean,
  ) => void;
}) {
  const canSharePrivateNote = item.can_share_private_note ?? Boolean(item.private_note);
  const defaultScope: MoodNoteShareScope = canSharePrivateNote ? "private_note" : "student_summary";
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedAdultIds, setSelectedAdultIds] = useState<string[]>([]);
  const [shareScope, setShareScope] = useState<MoodNoteShareScope>(defaultScope);
  const [studentSummary, setStudentSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previewHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    setShareScope(defaultScope);
  }, [defaultScope]);

  useEffect(() => {
    if (isPreviewOpen) {
      previewHeadingRef.current?.focus();
    }
  }, [isPreviewOpen]);

  const selectedAdults = availableAdults.filter((adult) => selectedAdultIds.includes(adult.id));

  function toggleAdult(adultId: string) {
    setSelectedAdultIds((currentIds) =>
      currentIds.includes(adultId)
        ? currentIds.filter((id) => id !== adultId)
        : [...currentIds, adultId],
    );
  }

  function openPreview() {
    setErrorMessage(null);
    if (selectedAdultIds.length === 0) {
      setErrorMessage("Hãy chọn ít nhất một người lớn tin tưởng trước khi xem trước.");
      return;
    }
    if (shareScope === "student_summary" && studentSummary.trim().length === 0) {
      setErrorMessage("Em cần tự viết phần tóm tắt trước khi chia sẻ.");
      return;
    }
    setIsPreviewOpen(true);
  }

  async function confirmShare() {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await shareMoodCheckInNote(item.id, {
        adult_ids: selectedAdultIds,
        share_scope: shareScope,
        student_summary: shareScope === "student_summary" ? studentSummary.trim() : null,
      });
      onSharesChanged(
        item.id,
        response.active_shares,
        response.shareable,
        response.can_share_private_note,
      );
      setSuccessMessage(response.message);
      setIsDraftOpen(false);
      setIsPreviewOpen(false);
    } catch {
      setErrorMessage("Chưa cập nhật được quyền chia sẻ. Hãy thử lại hoặc quay lại sau.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white dark:bg-[#1a2244] p-4">
      <ActiveShareList
        item={item}
        onSharesChanged={onSharesChanged}
        onSuccess={setSuccessMessage}
        onError={setErrorMessage}
      />

      {successMessage ? (
        <p className="mt-3 text-xs text-primary" aria-live="polite">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-3 text-xs text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isDraftOpen && !isPreviewOpen ? (
        <div className="mt-4">
          <button
            type="button"
            className="min-h-11 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white"
            onClick={() => {
              setIsDraftOpen(true);
              setSuccessMessage(null);
            }}
          >
            Chia sẻ ghi chú
          </button>
          <p className="mt-2 text-xs">Chỉ những người lớn em chọn mới xem được ghi chú này.</p>
        </div>
      ) : null}

      {isDraftOpen && !isPreviewOpen ? (
        <div className="mt-4 space-y-4">
          {!canSharePrivateNote ? (
            <p className="text-xs">
              Check-in này không có ghi chú riêng tư; em vẫn có thể tự viết tóm tắt nếu muốn chia sẻ.
            </p>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold">Nội dung muốn chia sẻ</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name={`share-scope-${item.id}`}
                value="private_note"
                checked={shareScope === "private_note"}
                disabled={!canSharePrivateNote}
                onChange={() => setShareScope("private_note")}
              />
              Chia sẻ ghi chú riêng tư
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name={`share-scope-${item.id}`}
                value="student_summary"
                checked={shareScope === "student_summary"}
                onChange={() => setShareScope("student_summary")}
              />
              Chia sẻ phần tóm tắt em tự viết
            </label>
          </fieldset>

          {shareScope === "student_summary" ? (
            <label className="block text-sm">
              <span className="text-xs font-semibold">Tóm tắt em muốn chia sẻ thay cho ghi chú đầy đủ</span>
              <textarea
                aria-label="Tóm tắt em muốn chia sẻ thay cho ghi chú đầy đủ"
                className="mt-2 min-h-28 w-full rounded-2xl border border-outline-variant/20 p-3 text-sm"
                value={studentSummary}
                onChange={(event) => setStudentSummary(event.target.value)}
              />
              <span className="mt-2 block text-xs">
                Em tự viết phần này. Peerlight AI không tự tạo diễn giải hay chẩn đoán.
              </span>
            </label>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold">Người lớn tin cậy</legend>
            {availableAdults.length === 0 ? (
              <p className="text-xs">Chưa có người lớn đang liên kết để chọn.</p>
            ) : (
              availableAdults.map((adult) => (
                <label key={adult.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAdultIds.includes(adult.id)}
                    onChange={() => toggleAdult(adult.id)}
                  />
                  {adult.full_name} - {relationshipLabel(adult.relationship_type)}
                </label>
              ))
            )}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-full border border-outline-variant/20 bg-white dark:bg-[#1e2d40] dark:text-white px-5 py-2 text-xs font-semibold"
              onClick={() => {
                setIsDraftOpen(false);
                setErrorMessage(null);
              }}
            >
              Giữ riêng tư
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white"
              onClick={openPreview}
            >
              Xem trước trước khi chia sẻ
            </button>
          </div>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <SharePreviewPanel
          headingRef={previewHeadingRef}
          selectedAdultNames={selectedAdults.map((adult) => adult.full_name)}
          shareScope={shareScope}
          isSaving={isSaving}
          onEdit={() => setIsPreviewOpen(false)}
          onConfirm={confirmShare}
        />
      ) : null}
    </div>
  );
}

function SharePreviewPanel({
  headingRef,
  selectedAdultNames,
  shareScope,
  isSaving,
  onEdit,
  onConfirm,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  selectedAdultNames: string[];
  shareScope: MoodNoteShareScope;
  isSaving: boolean;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-primary/5 p-4">
      <h3 ref={headingRef} tabIndex={-1} className="text-sm font-semibold">
        Xem trước trước khi chia sẻ
      </h3>
      <div className="mt-3 space-y-2 text-sm">
        <p>Em sắp chia sẻ ghi chú này với: {selectedAdultNames.join(", ")}.</p>
        <p>Nội dung được chia sẻ: {shareScopePreview(shareScope)}.</p>
        <p>Vẫn riêng tư: các check-in khác, ghi chú khác, điểm số chi tiết và những gì em không chọn chia sẻ.</p>
        <p>Em có thể thu hồi quyền xem trong lịch sử check-in bất cứ lúc nào.</p>
        <p>Việc chia sẻ này không gửi thông báo ngoài ứng dụng, không tạo SOS và không tạo điểm rủi ro.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-full border border-outline-variant/20 bg-white dark:bg-[#1e2d40] dark:text-white px-5 py-2 text-xs font-semibold"
          onClick={onEdit}
        >
          Sửa lựa chọn
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white"
          onClick={onConfirm}
          disabled={isSaving}
        >
          {isSaving ? "Đang lưu quyền chia sẻ..." : "Xác nhận chia sẻ"}
        </button>
      </div>
    </div>
  );
}

function ActiveShareList({
  item,
  onSharesChanged,
  onSuccess,
  onError,
}: {
  item: MoodCheckIn;
  onSharesChanged: (
    checkinId: string,
    activeShares: MoodNoteActiveShare[],
    shareable?: boolean,
    canSharePrivateNote?: boolean,
  ) => void;
  onSuccess: (message: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const [revokeTarget, setRevokeTarget] = useState<MoodNoteActiveShare | "all" | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  async function confirmRevoke() {
    setIsRevoking(true);
    onError(null);
    try {
      const response =
        revokeTarget === "all"
          ? await revokeAllMoodCheckInShares(item.id)
          : revokeTarget
            ? await revokeMoodCheckInShare(item.id, revokeTarget.adult_id)
            : null;
      if (response) {
        onSharesChanged(item.id, response.active_shares);
        onSuccess(response.message);
      }
      setRevokeTarget(null);
    } catch {
      onError("Chưa cập nhật được quyền chia sẻ. Hãy thử lại hoặc quay lại sau.");
    } finally {
      setIsRevoking(false);
    }
  }

  if (item.active_shares.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {item.active_shares.map((share) => (
          <div key={share.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-primary/5 p-3">
            <div>
              <p className="text-sm">{share.adult_full_name}</p>
              <p className="text-xs">{relationshipLabel(share.relationship_type)}</p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs text-white">Đang được chia sẻ</span>
            <button
              type="button"
              className="min-h-11 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700"
              onClick={() => setRevokeTarget(share)}
            >
              Thu hồi quyền xem
            </button>
          </div>
        ))}
      </div>
      {item.active_shares.length > 1 ? (
        <button
          type="button"
          className="min-h-11 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700"
          onClick={() => setRevokeTarget("all")}
        >
          Thu hồi tất cả
        </button>
      ) : null}
      {revokeTarget ? (
        <RevokeShareConfirmation
          targetNames={
            revokeTarget === "all"
              ? item.active_shares.map((share) => share.adult_full_name)
              : [revokeTarget.adult_full_name]
          }
          isRevoking={isRevoking}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={confirmRevoke}
        />
      ) : null}
    </div>
  );
}

function RevokeShareConfirmation({
  targetNames,
  isRevoking,
  onCancel,
  onConfirm,
}: {
  targetNames: string[];
  isRevoking: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mt-4 rounded-2xl border border-red-200 bg-white dark:bg-[#1a2244] p-4">
      <h3 ref={headingRef} tabIndex={-1} className="text-sm font-semibold">
        Thu hồi quyền xem
      </h3>
      <p className="mt-2 text-sm">Áp dụng với: {targetNames.join(", ")}.</p>
      <p className="mt-2 text-sm">
        Thu hồi quyền xem: Người lớn này sẽ không còn xem được nội dung đã chia sẻ. Lịch sử kiểm tra chỉ lưu thông tin thao tác, không lưu nội dung ghi chú.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-full border border-outline-variant/20 bg-white dark:bg-[#1e2d40] dark:text-white px-5 py-2 text-xs font-semibold"
          onClick={onCancel}
        >
          Giữ nguyên quyền xem
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white"
          onClick={onConfirm}
          disabled={isRevoking}
        >
          {isRevoking ? "Đang thu hồi quyền xem..." : "Xác nhận thu hồi quyền xem"}
        </button>
      </div>
    </div>
  );
}
