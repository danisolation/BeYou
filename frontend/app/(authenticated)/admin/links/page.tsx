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
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState("");
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
      setNotice("");
      await createLink(payload);
      await refreshData();
      setNotice("Đã tạo liên kết hỗ trợ. Người lớn chỉ thấy phần tóm tắt được phép xem.");
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
      setNotice("");
      setIsConfirming(true);
      await revokeLink(revokeTarget.id);
      await refreshData();
      setNotice("Đã thu hồi liên kết. Người lớn này không còn thấy thông tin hỗ trợ mới của học sinh trong Peerlight AI.");
    } catch {
      setError("Chưa thu hồi được liên kết. Hãy thử lại.");
    } finally {
      setIsConfirming(false);
      setRevokeTarget(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Liên kết học sinh và người lớn hỗ trợ</h1>
        <p className="mt-3 text-sm">
          Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ.
        </p>
        <p className="mt-2 text-xs">
          Liên kết không mở dữ liệu riêng tư thô; người lớn chỉ xem tóm tắt hỗ trợ và trạng thái được phép.
        </p>
      </div>
      <LinkForm users={users} onSubmit={handleCreate} />
      {notice ? <p role="status" className="rounded-2xl border border-accent/30 bg-primary/5 px-4 py-3 text-xs">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-warning/40 bg-white px-4 py-3 text-xs">{error}</p> : null}

      <section className="rounded-2xl bg-white dark:bg-[#1a2940] p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold">Danh sách liên kết</h2>
        {isLoading ? <p className="mt-4">Đang tải thông tin...</p> : null}
        {!isLoading && links.length === 0 ? (
          <EmptyState
            heading="Chưa có liên kết nào"
            body="Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ."
          />
        ) : null}
        <div className="mt-5 space-y-4">
          {links.map((link) => (
            <article key={link.id} className="rounded-2xl border border-outline-variant/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{link.student_full_name}</h3>
                    {link.is_demo ? <DemoBadge /> : null}
                  </div>
                  <p className="break-all text-xs">Học sinh: {link.student_email}</p>
                  <p className="break-all text-xs">Người lớn hỗ trợ: {link.adult_full_name} ({link.adult_email})</p>
                  <p className="text-xs">Loại liên kết: {link.relationship_type}</p>
                  <p className="text-xs">Trường/lớp: {[link.student_school, link.student_class_name].filter(Boolean).join(" / ") || "Chưa cập nhật"}</p>
                  <p className="text-xs">Trạng thái: {link.status}</p>
                  <p className="text-xs">Cập nhật: {new Date(link.updated_at).toLocaleString("vi-VN")}</p>
                </div>
                {link.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(link)}
                    className="min-h-11 w-full rounded-2xl bg-destructive px-4 font-semibold text-white hover:bg-red-700 sm:w-auto"
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
        supportingText="Sau khi thu hồi, giáo viên/phụ huynh này không còn được xem tóm tắt hỗ trợ mới qua liên kết này."
        isConfirming={isConfirming}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </section>
  );
}
