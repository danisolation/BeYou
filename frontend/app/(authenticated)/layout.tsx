"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { ErrorState, PrivacyBoundaryCard, StatusBadge } from "@/components/ui-primitives";
import { LayoutSkeleton } from "@/components/skeletons";
import { StudentSidebar } from "@/components/navigation/student-sidebar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { LayoutShell } from "@/components/layout-shell";
import { apiFetch } from "@/lib/api";
import { AuthUser, getCurrentUser } from "@/lib/auth";

const roleLabels: Record<AuthUser["role"], string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  admin: "Quản trị",
};

const roleBoundaryCopy: Record<AuthUser["role"], string> = {
  student: "Không gian riêng tư của em; chỉ chia sẻ theo xác nhận và quyền phù hợp.",
  teacher: "Hỗ trợ học sinh theo liên kết được phép, tập trung SOS và không giám sát dữ liệu riêng tư thô.",
  parent: "Đồng hành ở chế độ đọc tóm tắt được phép xem, không mở nội dung riêng tư thô của con.",
  admin: "Chỉ vận hành metadata an toàn; không mở dữ liệu riêng tư thô, xuất dữ liệu, hoặc bảng xếp hạng nguy cơ.",
};

const roleNav: Array<{ role: AuthUser["role"]; href: string; label: string }> = [
  { role: "student", href: "/student", label: "Học sinh" },
  { role: "teacher", href: "/teacher", label: "Giáo viên" },
  { role: "parent", href: "/parent", label: "Phụ huynh" },
  { role: "admin", href: "/admin", label: "Quản trị" },
];

function expectedRoleFromPath(pathname: string): AuthUser["role"] | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "student" || segment === "teacher" || segment === "parent" || segment === "admin") {
    return segment;
  }
  return null;
}

function studentPathRequiresPrivacy(pathname: string): boolean {
  return pathname === "/student" || pathname.startsWith("/student/");
}

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const expectedRole = useMemo(() => expectedRoleFromPath(pathname), [pathname]);
  const [studentMenuCollapsed, setStudentMenuCollapsed] = useState(false);

  useEffect(() => {
    let isActive = true;
    getCurrentUser()
      .then((currentUser) => {
        if (!isActive) {
          return;
        }
        setUser(currentUser);
        setLoadFailed(false);
        if (
          currentUser.role === "student" &&
          currentUser.privacy_acknowledgement_required &&
          studentPathRequiresPrivacy(pathname)
        ) {
          router.push(`/privacy?next=${encodeURIComponent(pathname)}`);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setLoadFailed(true);
        router.push("/login");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (isLoading) {
    return <LayoutSkeleton />;
  }

  if (loadFailed || user === null) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <ErrorState title="Chưa đăng nhập." message="Hãy đăng nhập lại để vào cổng phù hợp với vai trò của bạn." />
        </div>
      </main>
    );
  }

  const wrongRole = expectedRole !== null && user.role !== expectedRole;
  const privacyRedirectRequired =
    user.role === "student" && user.privacy_acknowledgement_required && studentPathRequiresPrivacy(pathname);
  const navigationItems = roleNav.filter((item) => item.role === user.role);
  const isStudentShell = user.role === "student" && !wrongRole && !privacyRedirectRequired;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-accent focus:shadow-lg dark:focus:bg-[#1a2940]"
      >
        Bỏ qua điều hướng
      </a>
      <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 px-4 py-3 shadow-sm backdrop-blur dark:bg-[#1a2940]/95 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-label font-semibold uppercase tracking-[0.2em] text-primary">Peerlight AI</p>
            <p className="truncate text-body font-semibold">{user.full_name}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <StatusBadge tone="safe">{roleLabels[user.role]}</StatusBadge>
              <p className="max-w-2xl text-label">{roleBoundaryCopy[user.role]}</p>
            </div>
          </div>
          {!isStudentShell ? (
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Điều hướng vai trò">
              <div className="flex min-w-max gap-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.role}
                    href={item.href}
                    className="flex min-h-11 shrink-0 items-center rounded-2xl px-4 text-label font-semibold text-on-background hover:bg-secondary"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-11 shrink-0 rounded-2xl border border-outline-variant px-4 text-label font-semibold hover:border-primary hover:bg-secondary"
                >
                  Đăng xuất
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {privacyRedirectRequired ? (
          <PrivacyBoundaryCard
            title="Cần xác nhận quyền riêng tư trước khi vào cổng học sinh."
            description="Peerlight AI đang chuyển em tới trang giải thích ai có thể xem thông tin của em. Nội dung học sinh sẽ chỉ mở sau khi em xác nhận đã hiểu."
          />
        ) : wrongRole ? (
          <PrivacyBoundaryCard
            title="Không thể mở cổng này với vai trò hiện tại."
            description="Peerlight AI chỉ hiển thị dữ liệu trong phạm vi vai trò và liên kết được phân quyền. Hãy quay về đúng cổng của bạn để tiếp tục hỗ trợ an toàn."
            actions={
              <Link
                href={user.dashboard_route}
                className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 font-semibold text-on-primary"
              >
                Đi tới cổng phù hợp
              </Link>
            }
          />
        ) : (
          isStudentShell ? (
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              <StudentSidebar
                pathname={pathname}
                collapsed={studentMenuCollapsed}
                onToggleCollapse={() => setStudentMenuCollapsed((current) => !current)}
                onLogout={handleLogout}
              />
              <MobileBottomNav pathname={pathname} onLogout={handleLogout} />
              <LayoutShell>{children}</LayoutShell>
            </div>
          ) : (
            children
          )
        )}
      </main>
    </div>
  );
}
