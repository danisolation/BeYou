"use client";

import Link from "next/link";
import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { DemoBanner } from "@/components/demo-banner";
import { ErrorState, LoadingState, PrivacyBoundaryCard, StatusBadge } from "@/components/ui-primitives";
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

const studentNav = [
  { href: "/student", label: "Bảng điều khiển", icon: BarChart3 },
  { href: "/student/chat", label: "Trò chuyện AI", icon: Bot },
  { href: "/student/self-checks", label: "Test tâm lý", icon: Brain },
  { href: "/student/mood-check-ins", label: "Check-in cảm xúc", icon: CalendarCheck },
  { href: "/student/scenarios", label: "Tình huống xử lý thực tế", icon: MessageCircle },
  { href: "/student/support-plan", label: "Người lớn tin tưởng", icon: Users },
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
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <LoadingState />
        </div>
      </main>
    );
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-accent focus:shadow-lg"
      >
        Bỏ qua điều hướng
      </a>
      {user.is_demo ? <DemoBanner /> : null}
      <header className="sticky top-0 z-30 border-b border-[#D7EFE8] bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-label font-semibold uppercase tracking-[0.2em] text-accent">Peerlight AI</p>
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
                    className="flex min-h-11 shrink-0 items-center rounded-2xl px-4 text-label font-semibold text-[#12332E] hover:bg-secondary"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-11 shrink-0 rounded-2xl border border-[#CFE8E1] px-4 text-label font-semibold hover:border-accent hover:bg-secondary"
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
                className="inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
              >
                Đi tới cổng phù hợp
              </Link>
            }
          />
        ) : (
          isStudentShell ? (
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              <aside
                className={`sticky top-28 hidden h-[calc(100dvh-8rem)] rounded-[2rem] border border-[#D7EFE8] bg-white/90 p-4 shadow-sm lg:flex lg:flex-col ${
                  studentMenuCollapsed ? "w-24" : "w-64"
                }`}
              >
                <button
                  type="button"
                  aria-label={studentMenuCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                  onClick={() => setStudentMenuCollapsed((current) => !current)}
                  className="mb-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#CFE8E1] text-accent hover:bg-secondary"
                >
                  <Menu aria-hidden="true" />
                </button>
                <nav className="space-y-2" aria-label="Điều hướng học sinh">
                  {studentNav.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold no-underline ${
                          active ? "bg-accent text-white" : "text-[#12332E] hover:bg-secondary"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon aria-hidden="true" size={20} />
                        {studentMenuCollapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-auto space-y-2 border-t border-[#D7EFE8] pt-4">
                  <Link
                    href="/student#peerlight-sos"
                    className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-red-700 no-underline hover:bg-red-50"
                  >
                    <ShieldAlert aria-hidden="true" size={20} />
                    {studentMenuCollapsed ? <span className="sr-only">SOS</span> : <span>SOS</span>}
                  </Link>
                  <Link
                    href="/student/notification-preferences"
                    className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-[#12332E] no-underline hover:bg-secondary"
                  >
                    <Settings aria-hidden="true" size={20} />
                    {studentMenuCollapsed ? <span className="sr-only">Cài đặt</span> : <span>Cài đặt</span>}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-[#12332E] hover:bg-secondary"
                  >
                    <LogOut aria-hidden="true" size={20} />
                    {studentMenuCollapsed ? <span className="sr-only">Đăng xuất</span> : <span>Đăng xuất</span>}
                  </button>
                </div>
              </aside>
              <nav
                className="flex gap-2 overflow-x-auto rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-[#D7EFE8] lg:hidden"
                aria-label="Điều hướng học sinh"
              >
                {studentNav.map((item) => {
                  const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex min-h-11 min-w-max items-center rounded-2xl px-4 text-label font-semibold no-underline ${
                        active ? "bg-accent text-white" : "hover:bg-secondary"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/student#peerlight-sos"
                  className="inline-flex min-h-11 min-w-max items-center rounded-2xl px-4 text-label font-semibold text-red-700 no-underline hover:bg-red-50"
                >
                  SOS
                </Link>
                <Link
                  href="/student/notification-preferences"
                  className="inline-flex min-h-11 min-w-max items-center rounded-2xl px-4 text-label font-semibold no-underline hover:bg-secondary"
                >
                  Cài đặt
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 min-w-max items-center rounded-2xl px-4 text-label font-semibold hover:bg-secondary"
                >
                  Đăng xuất
                </button>
              </nav>
              <div>{children}</div>
            </div>
          ) : (
            children
          )
        )}
      </main>
    </div>
  );
}
