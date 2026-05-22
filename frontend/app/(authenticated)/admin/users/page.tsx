"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CONFIRM_DELETE_DEMO_ACCOUNT_COPY,
  CONFIRM_DISABLE_ACCOUNT_COPY,
  CONFIRM_ROLE_CHANGE_COPY,
  DELETE_DEMO_ACCOUNT_COPY,
  DestructiveConfirmDialog,
  DISABLE_ACCOUNT_COPY,
  KEEP_ACCOUNT_COPY,
  KEEP_DEMO_ACCOUNT_COPY,
  ROLE_CHANGE_COPY,
  CANCEL_ROLE_CHANGE_COPY,
} from "@/components/admin/destructive-confirm-dialog";
import { UserForm } from "@/components/admin/user-form";
import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { AdminUser, createUser, deleteUser, listUsers, updateUser } from "@/lib/admin-api";

type ConfirmationState =
  | { type: "disable"; user: AdminUser }
  | { type: "delete-demo"; user: AdminUser }
  | { type: "role"; user: AdminUser; role: AdminUser["role"] }
  | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AdminUser["role"]>>({});
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshUsers() {
    const loadedUsers = await listUsers();
    setUsers(loadedUsers);
    setSelectedRoles(Object.fromEntries(loadedUsers.map((user) => [user.id, user.role])));
  }

  useEffect(() => {
    refreshUsers().finally(() => setIsLoading(false));
  }, []);

  const dialogProps = useMemo(() => {
    if (confirmation?.type === "disable") {
      return {
        message: DISABLE_ACCOUNT_COPY,
        cancelLabel: KEEP_ACCOUNT_COPY,
        confirmLabel: CONFIRM_DISABLE_ACCOUNT_COPY,
      };
    }
    if (confirmation?.type === "delete-demo") {
      return {
        message: DELETE_DEMO_ACCOUNT_COPY,
        cancelLabel: KEEP_DEMO_ACCOUNT_COPY,
        confirmLabel: CONFIRM_DELETE_DEMO_ACCOUNT_COPY,
      };
    }
    return {
      message: ROLE_CHANGE_COPY,
      cancelLabel: CANCEL_ROLE_CHANGE_COPY,
      confirmLabel: CONFIRM_ROLE_CHANGE_COPY,
    };
  }, [confirmation]);

  async function handleConfirm() {
    try {
      setError("");
      if (confirmation?.type === "disable") {
        await updateUser(confirmation.user.id, { status: "disabled" });
      }
      if (confirmation?.type === "delete-demo") {
        await deleteUser(confirmation.user.id);
      }
      if (confirmation?.type === "role") {
        await updateUser(confirmation.user.id, { role: confirmation.role });
      }
      setConfirmation(null);
      await refreshUsers();
    } catch {
      setError("Chưa lưu được thay đổi tài khoản. Hãy thử lại.");
    }
  }

  async function handleCreate(payload: Parameters<typeof createUser>[0]) {
    try {
      setError("");
      await createUser(payload);
      await refreshUsers();
    } catch {
      setError("Chưa tạo được tài khoản. Hãy kiểm tra lại thông tin và thử lại.");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-display">Quản lý tài khoản</h1>
        <p className="mt-3 text-body">Tạo tài khoản, cập nhật vai trò và xử lý trạng thái tài khoản an toàn.</p>
      </div>
      <UserForm onSubmit={handleCreate} />
      {error ? <p className="rounded-2xl border border-warning/40 bg-white px-4 py-3 text-label">{error}</p> : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-heading">Danh sách tài khoản</h2>
        {isLoading ? <p className="mt-4">Đang tải thông tin...</p> : null}
        {!isLoading && users.length === 0 ? <EmptyState /> : null}
        <div className="mt-5 space-y-4">
          {users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-[#D7EFE8] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{user.full_name}</h3>
                    {user.is_demo ? <DemoBadge /> : null}
                  </div>
                  <p className="break-all text-label">{user.email}</p>
                  <p className="text-label">Trường/lớp: {[user.school, user.class_name].filter(Boolean).join(" / ") || "Không áp dụng"}</p>
                  <p className="text-label">Trạng thái tài khoản: {user.status}</p>
                  <p className="text-label">Cập nhật lần cuối: {new Date(user.updated_at).toLocaleString("vi-VN")}</p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:items-end lg:justify-end">
                  <label className="space-y-1 text-label font-semibold">
                    Vai trò
                    <select
                      value={selectedRoles[user.id] ?? user.role}
                      onChange={(event) =>
                        setSelectedRoles((current) => ({
                          ...current,
                          [user.id]: event.target.value as AdminUser["role"],
                        }))
                      }
                      className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3 lg:w-44"
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="parent">parent</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmation({ type: "role", user, role: selectedRoles[user.id] ?? user.role })}
                    className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white hover:bg-[#238C78]"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmation({ type: "disable", user })}
                    className="min-h-11 rounded-2xl border border-warning px-4 hover:bg-[#FFF8E8]"
                  >
                    Tạm khóa tài khoản
                  </button>
                  {user.is_demo ? (
                    <button
                      type="button"
                      onClick={() => setConfirmation({ type: "delete-demo", user })}
                      className="min-h-11 rounded-2xl bg-destructive px-4 font-semibold text-white hover:bg-red-700 sm:col-span-2 lg:col-span-1"
                    >
                      Xóa tài khoản demo
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DestructiveConfirmDialog
        open={confirmation !== null}
        message={dialogProps.message}
        cancelLabel={dialogProps.cancelLabel}
        confirmLabel={dialogProps.confirmLabel}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
