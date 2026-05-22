"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { DemoBanner } from "@/components/demo-banner";
import { apiFetch } from "@/lib/api";
import { AuthUser, getCurrentUser } from "@/lib/auth";

const roleLabels: Record<AuthUser["role"], string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  admin: "Quản trị",
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
    return <main className="min-h-screen bg-background px-4 py-10">Đang tải thông tin...</main>;
  }

  if (loadFailed || user === null) {
    return <main className="min-h-screen bg-background px-4 py-10">Chưa đăng nhập.</main>;
  }

  const wrongRole = expectedRole !== null && user.role !== expectedRole;
  const privacyRedirectRequired =
    user.role === "student" && user.privacy_acknowledgement_required && studentPathRequiresPrivacy(pathname);
  const navigationItems = roleNav.filter((item) => item.role === user.role);

  return (
    <div className="min-h-screen bg-background">
      {user.is_demo ? <DemoBanner /> : null}
      <header className="border-b border-[#D7EFE8] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-label font-semibold text-accent">BeYou</p>
            <p className="text-body font-semibold">{user.full_name}</p>
            <p className="text-label">{roleLabels[user.role]}</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Điều hướng vai trò">
            {navigationItems.map((item) => (
              <Link
                key={item.role}
                href={item.href}
                className="flex min-h-11 items-center rounded-2xl px-4 text-label font-semibold text-[#12332E]"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 text-label font-semibold"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {privacyRedirectRequired ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-heading">Cần xác nhận quyền riêng tư trước khi vào cổng học sinh.</h1>
            <p className="mt-3 text-body">
              BeYou đang chuyển em tới trang giải thích ai có thể xem thông tin của em. Nội dung học sinh sẽ chỉ mở
              sau khi em xác nhận đã hiểu.
            </p>
          </section>
        ) : wrongRole ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-heading">Không thể mở cổng này với vai trò hiện tại.</h1>
            <p className="mt-3 text-body">
              BeYou chỉ hiển thị dữ liệu trong phạm vi vai trò và liên kết được phân quyền. Hãy quay về đúng cổng của
              bạn để tiếp tục hỗ trợ an toàn.
            </p>
            <Link
              href={user.dashboard_route}
              className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
            >
              Đi tới cổng phù hợp
            </Link>
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
