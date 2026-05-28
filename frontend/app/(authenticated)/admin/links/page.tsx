"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Plus, Search, UserCheck, UserX, ChevronDown } from "lucide-react";

import {
  CONFIRM_REVOKE_LINK_COPY,
  DestructiveConfirmDialog,
  KEEP_LINK_COPY,
  REVOKE_LINK_COPY,
} from "@/components/admin/destructive-confirm-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { EmptyState } from "@/components/empty-state";
import { AdminLink, AdminUser, createLink, listLinks, listUsers, revokeLink } from "@/lib/admin-api";

type StatusFilter = "all" | "active" | "revoked";

function StatusBadge({ status }: { status: "active" | "revoked" }) {
  const styles =
    status === "active"
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300";
  const label = status === "active" ? "Đang hoạt động" : "Đã thu hồi";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}

function RelationshipBadge({ type }: { type: "teacher" | "parent" }) {
  const styles =
    type === "teacher"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
      : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300";
  const label = type === "teacher" ? "Giáo viên" : "Phụ huynh";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
  );
}

export default function AdminLinksPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<AdminLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function refreshData() {
    const [loadedUsers, loadedLinks] = await Promise.all([listUsers(), listLinks()]);
    setUsers(loadedUsers);
    setLinks(loadedLinks);
  }

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  const filteredLinks = useMemo(() => {
    let result = links;
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.student_full_name.toLowerCase().includes(q) ||
          l.adult_full_name.toLowerCase().includes(q) ||
          l.student_email.toLowerCase().includes(q) ||
          l.adult_email.toLowerCase().includes(q),
      );
    }
    return result;
  }, [links, statusFilter, search]);

  const activeCount = links.filter((l) => l.status === "active").length;
  const revokedCount = links.filter((l) => l.status === "revoked").length;

  async function handleCreate(payload: Parameters<typeof createLink>[0]) {
    try {
      setError("");
      setNotice("");
      await createLink(payload);
      await refreshData();
      setNotice("Đã tạo liên kết hỗ trợ thành công.");
      setShowForm(false);
    } catch {
      setError("Chưa lưu được liên kết. Hãy kiểm tra lại thông tin và thử lại.");
    }
  }

  async function handleRevoke() {
    if (revokeTarget === null) return;
    try {
      setError("");
      setNotice("");
      setIsConfirming(true);
      await revokeLink(revokeTarget.id);
      await refreshData();
      setNotice(`Đã thu hồi liên kết của ${revokeTarget.adult_full_name}.`);
    } catch {
      setError("Chưa thu hồi được liên kết. Hãy thử lại.");
    } finally {
      setIsConfirming(false);
      setRevokeTarget(null);
    }
  }

  return (
    <section className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-on-background">Liên kết hỗ trợ</h1>
              <p className="text-xs text-on-background/60">
                {activeCount} hoạt động · {revokedCount} đã thu hồi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tạo liên kết</span>
          </button>
        </div>
      </header>

      {/* Create form — collapsible */}
      {showForm ? (
        <div className="rounded-2xl border border-primary/20 bg-white dark:bg-[#1a2940] p-5">
          <LinkForm users={users} onSubmit={handleCreate} />
        </div>
      ) : null}

      {/* Notices */}
      {notice ? (
        <p role="status" className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-xs font-medium text-green-700 dark:text-green-300">
          ✓ {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-background/40" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white pl-9 pr-3 text-sm text-on-background placeholder:text-on-background/40 dark:bg-[#1e2d40]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white px-3 text-sm text-on-background dark:bg-[#1e2d40] sm:w-auto"
        >
          <option value="all">Tất cả ({links.length})</option>
          <option value="active">Đang hoạt động ({activeCount})</option>
          <option value="revoked">Đã thu hồi ({revokedCount})</option>
        </select>
      </div>

      {/* Links list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-outline-variant/20 bg-white dark:bg-[#1a2940] p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-on-background/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-on-background/10" />
                    <div className="h-3 w-60 rounded bg-on-background/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <EmptyState
            heading={search || statusFilter !== "all" ? "Không tìm thấy kết quả" : "Chưa có liên kết nào"}
            body={search || statusFilter !== "all" ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." : "Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ."}
          />
        ) : (
          filteredLinks.map((link) => (
            <article
              key={link.id}
              className="card-lift rounded-2xl border border-outline-variant/20 bg-white p-4 transition-shadow hover:shadow-sm dark:bg-[#1a2940] sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <InitialAvatar name={link.student_full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-on-background truncate">{link.student_full_name}</h3>
                      <StatusBadge status={link.status} />
                    </div>
                    <p className="mt-1 text-xs text-on-background/60 truncate">
                      {link.student_email}
                      {link.student_school ? ` · ${link.student_school}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <RelationshipBadge type={link.relationship_type} />
                      <span className="text-xs text-on-background/70">
                        {link.adult_full_name} ({link.adult_email})
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-on-background/40">
                      {link.status === "revoked" && link.revoked_at
                        ? `Thu hồi: ${new Date(link.revoked_at).toLocaleDateString("vi-VN")}`
                        : `Tạo: ${new Date(link.created_at).toLocaleDateString("vi-VN")}`}
                    </p>
                  </div>
                </div>
                {link.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(link)}
                    className="btn-press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 sm:w-auto"
                  >
                    <UserX size={14} />
                    Thu hồi
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <DestructiveConfirmDialog
        open={revokeTarget !== null}
        message={REVOKE_LINK_COPY}
        cancelLabel={KEEP_LINK_COPY}
        confirmLabel={CONFIRM_REVOKE_LINK_COPY}
        supportingText="Sau khi thu hồi, giáo viên/phụ huynh này không còn được xem tóm tắt hỗ trợ mới qua liên kết này."
        isConfirming={isConfirming}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </section>
  );
}
