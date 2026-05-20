"use client";

import { useEffect, useState } from "react";

import {
  CONFIRM_REVOKE_LINK_COPY,
  DestructiveConfirmDialog,
  KEEP_LINK_COPY,
  REVOKE_LINK_COPY,
} from "@/components/admin/destructive-confirm-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { AdminLink, AdminUser, createLink, listLinks, listUsers, revokeLink } from "@/lib/admin-api";

export default function AdminLinksPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<AdminLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshData() {
    const [loadedUsers, loadedLinks] = await Promise.all([listUsers(), listLinks()]);
    setUsers(loadedUsers);
    setLinks(loadedLinks);
  }

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(payload: Parameters<typeof createLink>[0]) {
    try {
      setError("");
      await createLink(payload);
      await refreshData();
    } catch {
      setError("Chưa lưu được liên kết. Hãy kiểm tra lại thông tin và thử lại.");
    }
  }

  async function handleRevoke() {
    if (revokeTarget === null) {
      return;
    }
    try {
      setError("");
      await revokeLink(revokeTarget.id);
      setRevokeTarget(null);
      await refreshData();
    } catch {
      setError("Chưa thu hồi được liên kết. Hãy thử lại.");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-display">Liên kết học sinh và người lớn hỗ trợ</h1>
        <p className="mt-3 text-body">
          Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ.
        </p>
      </div>
      <LinkForm users={users} onSubmit={handleCreate} />
      {error ? <p className="rounded-2xl border border-warning/40 bg-white px-4 py-3 text-label">{error}</p> : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-heading">Danh sách liên kết</h2>
        {isLoading ? <p className="mt-4">Đang tải thông tin...</p> : null}
        {!isLoading && links.length === 0 ? (
          <EmptyState
            heading="Chưa có liên kết nào"
            body="Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ."
          />
        ) : null}
        <div className="mt-5 space-y-4">
          {links.map((link) => (
            <article key={link.id} className="rounded-2xl border border-[#D7EFE8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{link.student_full_name}</h3>
                    {link.is_demo ? <DemoBadge /> : null}
                  </div>
                  <p className="text-label">Học sinh: {link.student_email}</p>
                  <p className="text-label">Người lớn hỗ trợ: {link.adult_full_name} ({link.adult_email})</p>
                  <p className="text-label">Loại liên kết: {link.relationship_type}</p>
                  <p className="text-label">Trường/lớp: {[link.student_school, link.student_class_name].filter(Boolean).join(" / ") || "Chưa cập nhật"}</p>
                  <p className="text-label">Trạng thái: {link.status}</p>
                  <p className="text-label">Cập nhật: {new Date(link.updated_at).toLocaleString("vi-VN")}</p>
                </div>
                {link.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(link)}
                    className="min-h-11 rounded-2xl bg-destructive px-4 font-semibold text-white"
                  >
                    Thu hồi liên kết
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <DestructiveConfirmDialog
        open={revokeTarget !== null}
        message={REVOKE_LINK_COPY}
        cancelLabel={KEEP_LINK_COPY}
        confirmLabel={CONFIRM_REVOKE_LINK_COPY}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </section>
  );
}
