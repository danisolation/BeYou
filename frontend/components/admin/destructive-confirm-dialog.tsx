import { useId } from "react";

export const DISABLE_ACCOUNT_COPY =
  "Tạm khóa tài khoản này? Người dùng sẽ không thể đăng nhập cho đến khi được mở lại.";
export const KEEP_ACCOUNT_COPY = "Giữ tài khoản";
export const CONFIRM_DISABLE_ACCOUNT_COPY = "Tạm khóa tài khoản";
export const DELETE_DEMO_ACCOUNT_COPY =
  "Xóa tài khoản demo này? Chỉ dùng thao tác này cho dữ liệu demo, không dùng cho hồ sơ học sinh thật.";
export const KEEP_DEMO_ACCOUNT_COPY = "Giữ tài khoản demo";
export const CONFIRM_DELETE_DEMO_ACCOUNT_COPY = "Xóa tài khoản demo";
export const ROLE_CHANGE_COPY = "Đổi vai trò tài khoản này? Quyền truy cập sẽ thay đổi ngay sau khi lưu.";
export const CANCEL_ROLE_CHANGE_COPY = "Hủy đổi vai trò";
export const CONFIRM_ROLE_CHANGE_COPY = "Lưu vai trò mới";
export const REVOKE_LINK_COPY =
  "Thu hồi liên kết này? Người lớn sẽ không còn thấy thông tin hỗ trợ của học sinh này.";
export const KEEP_LINK_COPY = "Giữ liên kết";
export const CONFIRM_REVOKE_LINK_COPY = "Thu hồi liên kết";
export const ARCHIVE_CONTENT_COPY =
  "Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ.";
export const DELETE_DRAFT_CONTENT_COPY =
  "Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành.";
export const KEEP_CONTENT_COPY = "Giữ nội dung";
export const CONFIRM_ARCHIVE_CONTENT_COPY = "Lưu trữ nội dung";
export const CONFIRM_DELETE_DRAFT_CONTENT_COPY = "Xóa bản nháp";

type DestructiveConfirmDialogProps = {
  open: boolean;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  supportingText?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DestructiveConfirmDialog({
  open,
  message,
  cancelLabel,
  confirmLabel,
  supportingText,
  isConfirming = false,
  onCancel,
  onConfirm,
}: DestructiveConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <section
        className="max-w-md rounded-2xl bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="text-sm font-semibold">Xác nhận thao tác</h2>
        <div id={descriptionId} className="mt-3 space-y-3 text-sm">
          <p>{message}</p>
          {supportingText ? <p className="text-xs">{supportingText}</p> : null}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="min-h-11 rounded-xl border border-outline-variant/30 px-4 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="min-h-11 rounded-xl bg-destructive px-4 font-semibold text-white disabled:opacity-60"
          >
            {isConfirming ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
