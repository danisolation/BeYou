"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search, UserPlus, ChevronDown, ChevronUp, ShieldAlert, Trash2 } from "lucide-react";

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
import { EmptyState } from "@/components/empty-state";
import { AdminUser, createUser, deleteUser, listUsers, updateUser } from "@/lib/admin-api";

type ConfirmationState =
  | { type: "disable"; user: AdminUser }
  | { type: "enable"; user: AdminUser }
  | { type: "delete-demo"; user: AdminUser }
  | { type: "role"; user: AdminUser; role: AdminUser["role"] }
  | null;

type RoleFilter = "all" | "student" | "teacher" | "parent" | "admin";
type StatusFilter = "all" | "active" | "disabled";

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const styles: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    teacher: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    parent: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  const labels: Record<string, string> = {
    student: "Học sinh",
    teacher: "Giáo viên",
    parent: "Phụ huynh",
    admin: "Quản trị",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[role] ?? ""}`}>
      {labels[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      }`}
    >
      {isActive ? "Hoạt động" : "Đã khóa"}
    </span>
  );
}

function InitialAvatar({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    teacher: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    parent: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors[role] ?? "bg-gray-100 text-gray-700"}`}>
      {initials}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-white dark:bg-[#1e2d40] p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-on-background/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-on-background/10" />
          <div className="h-3 w-48 rounded bg-on-background/10" />
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AdminUser["role"]>>({});
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);

  async function refreshUsers() {
    const loadedUsers = await listUsers();
    setUsers(loadedUsers);
    setSelectedRoles(Object.fromEntries(loadedUsers.map((user) => [user.id, user.role])));
  }

  useEffect(() => {
    refreshUsers().finally(() => setIsLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          user.full_name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.school ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const studentCount = users.filter((u) => u.role === "student").length;
    const teacherCount = users.filter((u) => u.role === "teacher").length;
    const parentCount = users.filter((u) => u.role === "parent").length;
    const activeCount = users.filter((u) => u.status === "active").length;
    return { studentCount, teacherCount, parentCount, activeCount, total: users.length };
  }, [users]);

  const dialogProps = useMemo(() => {
    if (confirmation?.type === "disable") {
      return {
        message: DISABLE_ACCOUNT_COPY,
        cancelLabel: KEEP_ACCOUNT_COPY,
        confirmLabel: CONFIRM_DISABLE_ACCOUNT_COPY,
        supportingText: "Thao tác này chỉ đổi trạng thái đăng nhập; dữ liệu riêng tư của học sinh không được mở thêm.",
      };
    }
    if (confirmation?.type === "enable") {
      return {
        message: "Kích hoạt lại tài khoản này? Người dùng sẽ có thể đăng nhập bình thường.",
        cancelLabel: "Giữ trạng thái khóa",
        confirmLabel: "Kích hoạt tài khoản",
        supportingText: "Hãy chắc chắn rằng bạn muốn cấp quyền truy cập cho tài khoản này.",
      };
    }
    if (confirmation?.type === "delete-demo") {
      return {
        message: DELETE_DEMO_ACCOUNT_COPY,
        cancelLabel: KEEP_DEMO_ACCOUNT_COPY,
        confirmLabel: CONFIRM_DELETE_DEMO_ACCOUNT_COPY,
        supportingText: "Chỉ tài khoản demo mới có nút xóa vật lý trong giao diện này.",
      };
    }
    return {
      message: ROLE_CHANGE_COPY,
      cancelLabel: CANCEL_ROLE_CHANGE_COPY,
      confirmLabel: CONFIRM_ROLE_CHANGE_COPY,
      supportingText: "Vai trò quyết định cổng được phép truy cập; hãy giữ đúng ranh giới hỗ trợ, không giám sát.",
    };
  }, [confirmation]);

  async function handleConfirm() {
    if (confirmation === null) return;
    const confirmed = confirmation;
    try {
      setError("");
      setNotice("");
      setIsConfirming(true);
      let successMessage = "";
      if (confirmed.type === "disable") {
        await updateUser(confirmed.user.id, { status: "disabled" });
        successMessage = `Đã tạm khóa tài khoản ${confirmed.user.full_name}.`;
      }
      if (confirmed.type === "enable") {
        await updateUser(confirmed.user.id, { status: "active" });
        successMessage = `Đã kích hoạt tài khoản ${confirmed.user.full_name}.`;
      }
      if (confirmed.type === "delete-demo") {
        await deleteUser(confirmed.user.id);
        successMessage = `Đã xóa tài khoản demo ${confirmed.user.full_name}.`;
      }
      if (confirmed.type === "role") {
        await updateUser(confirmed.user.id, { role: confirmed.role });
        successMessage = `Đã lưu vai trò mới cho ${confirmed.user.full_name}.`;
      }
      await refreshUsers();
      setNotice(successMessage);
    } catch {
      setError("Chưa lưu được thay đổi tài khoản. Hãy thử lại.");
    } finally {
      setIsConfirming(false);
      setConfirmation(null);
    }
  }

  async function handleCreate(payload: Parameters<typeof createUser>[0]) {
    try {
      setError("");
      setNotice("");
      await createUser(payload);
      await refreshUsers();
      setNotice(`Đã tạo tài khoản ${payload.full_name}.`);
      setShowForm(false);
    } catch {
      setError("Chưa tạo được tài khoản. Hãy kiểm tra lại thông tin và thử lại.");
    }
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {/* Header */}
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-on-background">Quản lý tài khoản</h1>
              {!isLoading && (
                <p className="text-xs text-on-background/60">
                  {stats.total} tài khoản · {stats.activeCount} hoạt động · {stats.studentCount} HS · {stats.teacherCount} GV · {stats.parentCount} PH
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <UserPlus size={16} />
            Tạo tài khoản
            {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </header>

      {/* Collapsible Create Form */}
      {showForm && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <UserForm onSubmit={handleCreate} />
        </div>
      )}

      {/* Notices */}
      {notice ? <p role="status" className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-on-background">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-on-background">{error}</p> : null}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-background/40" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, trường..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] pl-9 pr-3 text-sm text-on-background placeholder:text-on-background/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white px-3 text-sm text-on-background dark:bg-[#1e2d40] sm:w-auto"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học sinh ({stats.studentCount})</option>
          <option value="teacher">Giáo viên ({stats.teacherCount})</option>
          <option value="parent">Phụ huynh ({stats.parentCount})</option>
          <option value="admin">Quản trị</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white px-3 text-sm text-on-background dark:bg-[#1e2d40] sm:w-auto"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động ({stats.activeCount})</option>
          <option value="disabled">Đã khóa ({stats.total - stats.activeCount})</option>
        </select>
        {(search || roleFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
            className="min-h-11 rounded-xl border border-outline-variant/30 bg-white px-3 text-xs font-medium text-on-background/70 hover:bg-primary/5 dark:bg-[#1e2d40] sm:w-auto"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* User List */}
      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 sm:p-6">
        <h2 className="text-xs font-medium text-on-background/70 uppercase tracking-wide">
          Danh sách tài khoản
          {!isLoading && ` (${filteredUsers.length})`}
        </h2>

        {isLoading && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="mt-4">
            {users.length === 0 ? <EmptyState /> : (
              <p className="text-center text-sm text-on-background/50 py-8">
                Không tìm thấy tài khoản phù hợp.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {filteredUsers.map((user) => (
            <article
              key={user.id}
              className="card-lift rounded-2xl border border-outline-variant/20 bg-white p-4 transition-colors hover:border-outline-variant/40 dark:bg-[#1e2d40]"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <InitialAvatar name={user.full_name} role={user.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-on-background">{user.full_name}</h3>
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                    {user.is_demo && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-on-background/60">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-on-background/60 break-all">{user.email}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-on-background/50">
                    {user.school && <span>🏫 {user.school}{user.class_name ? ` / ${user.class_name}` : ""}</span>}
                    <span>Cập nhật: {new Date(user.updated_at).toLocaleDateString("vi-VN")}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <select
                        value={selectedRoles[user.id] ?? user.role}
                        onChange={(e) =>
                          setSelectedRoles((cur) => ({ ...cur, [user.id]: e.target.value as AdminUser["role"] }))
                        }
                        className="min-h-11 w-full rounded-lg border border-outline-variant/30 bg-white px-3 text-xs text-on-background dark:bg-[#1a2244] sm:w-auto"
                      >
                        <option value="student">Học sinh</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="parent">Phụ huynh</option>
                        <option value="admin">Quản trị</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setConfirmation({ type: "role", user, role: selectedRoles[user.id] ?? user.role })}
                        className="btn-press min-h-11 w-full rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/80 sm:w-auto"
                      >
                        Lưu
                      </button>
                    </div>
                    {user.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => setConfirmation({ type: "disable", user })}
                        className="btn-press flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 px-3 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/20 sm:w-auto"
                      >
                        <ShieldAlert size={13} />
                        Tạm khóa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmation({ type: "enable", user })}
                        className="btn-press flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-green-300 px-3 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20 sm:w-auto"
                      >
                        <ShieldAlert size={13} />
                        Kích hoạt
                      </button>
                    )}
                    {user.is_demo && (
                      <button
                        type="button"
                        onClick={() => setConfirmation({ type: "delete-demo", user })}
                        className="btn-press flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
                      >
                        <Trash2 size={13} />
                        Xóa demo
                      </button>
                    )}
                  </div>
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
        supportingText={dialogProps.supportingText}
        isConfirming={isConfirming}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
