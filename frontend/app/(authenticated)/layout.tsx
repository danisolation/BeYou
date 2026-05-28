"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";

import { ErrorState, PrivacyBoundaryCard, StatusBadge } from "@/components/ui-primitives";
import { LayoutSkeleton } from "@/components/skeletons";
import { StudentSidebar } from "@/components/navigation/student-sidebar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { TeacherSidebar } from "@/components/navigation/teacher-sidebar";
import { TeacherMobileNav } from "@/components/navigation/teacher-mobile-nav";
import { ParentSidebar } from "@/components/navigation/parent-sidebar";
import { ParentMobileNav } from "@/components/navigation/parent-mobile-nav";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { AdminMobileNav } from "@/components/navigation/admin-mobile-nav";
import { LayoutShell } from "@/components/layout-shell";
import { apiFetch } from "@/lib/api";
import { AuthUser, getCurrentUser } from "@/lib/auth";

const roleLabels: Record<AuthUser["role"], string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  admin: "Quản trị",
};

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
  const [teacherMenuCollapsed, setTeacherMenuCollapsed] = useState(false);
  const [parentMenuCollapsed, setParentMenuCollapsed] = useState(false);
  const [adminMenuCollapsed, setAdminMenuCollapsed] = useState(false);

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
  const isStudentShell = user.role === "student" && !wrongRole && !privacyRedirectRequired;
  const isTeacherShell = user.role === "teacher" && !wrongRole;
  const isParentShell = user.role === "parent" && !wrongRole;
  const isAdminShell = user.role === "admin" && !wrongRole;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-primary focus:shadow-lg dark:focus:bg-[#1a2940]"
      >
        Bỏ qua điều hướng
      </a>

      {/* Slim header — one row */}
      <header role="banner" className="sticky top-0 z-30 border-b border-outline-variant/60 bg-white/80 backdrop-blur-lg dark:bg-[#0d1c2e]/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user.dashboard_route} className="flex items-center gap-2 no-underline">
            <span className="text-lg font-bold tracking-tight text-primary">Peerlight AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-on-background/70 sm:block">{user.full_name}</span>
            <StatusBadge tone="safe">{roleLabels[user.role]}</StatusBadge>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-on-background/60 transition-colors hover:bg-outline-variant/20 hover:text-on-background"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" role="main" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
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
            <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
              <StudentSidebar
                pathname={pathname}
                collapsed={studentMenuCollapsed}
                onToggleCollapse={() => setStudentMenuCollapsed((current) => !current)}
                onLogout={handleLogout}
              />
              <MobileBottomNav pathname={pathname} onLogout={handleLogout} />
              <LayoutShell>{children}</LayoutShell>
            </div>
          ) : isTeacherShell ? (
            <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
              <TeacherSidebar
                pathname={pathname}
                collapsed={teacherMenuCollapsed}
                onToggleCollapse={() => setTeacherMenuCollapsed((current) => !current)}
                onLogout={handleLogout}
              />
              <TeacherMobileNav pathname={pathname} onLogout={handleLogout} />
              <LayoutShell>{children}</LayoutShell>
            </div>
          ) : isParentShell ? (
            <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
              <ParentSidebar
                pathname={pathname}
                collapsed={parentMenuCollapsed}
                onToggleCollapse={() => setParentMenuCollapsed((current) => !current)}
                onLogout={handleLogout}
              />
              <ParentMobileNav pathname={pathname} onLogout={handleLogout} />
              <LayoutShell>{children}</LayoutShell>
            </div>
          ) : isAdminShell ? (
            <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
              <AdminSidebar
                pathname={pathname}
                collapsed={adminMenuCollapsed}
                onToggleCollapse={() => setAdminMenuCollapsed((current) => !current)}
                onLogout={handleLogout}
              />
              <AdminMobileNav pathname={pathname} onLogout={handleLogout} />
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
