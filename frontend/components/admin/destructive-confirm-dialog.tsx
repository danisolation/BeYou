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

type DestructiveConfirmDialogProps = {
  open: boolean;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DestructiveConfirmDialog({
  open,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: DestructiveConfirmDialogProps) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <section className="max-w-md rounded-3xl bg-white p-6 shadow-lg" role="dialog" aria-modal="true">
        <h2 className="text-heading">Xác nhận thao tác</h2>
        <p className="mt-3 text-body">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-2xl bg-destructive px-4 font-semibold text-white">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
