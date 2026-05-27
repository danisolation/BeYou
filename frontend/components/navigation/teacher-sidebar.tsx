"use client";

import Link from "next/link";
import {
  Bot,
  Home,
  LogOut,
  Menu,
  ShieldAlert,
  Users,
} from "lucide-react";

export const teacherNav = [
  { href: "/teacher", label: "Bảng điều khiển", icon: Home },
  { href: "/teacher/students", label: "Học sinh", icon: Users },
  { href: "/teacher/sos-alerts", label: "Cảnh báo SOS", icon: ShieldAlert },
  { href: "/teacher/chat", label: "Peerlight AI", icon: Bot },
];

interface TeacherSidebarProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function TeacherSidebar({ pathname, collapsed, onToggleCollapse, onLogout }: TeacherSidebarProps) {
  return (
    <aside
      className={`sticky top-28 hidden h-[calc(100dvh-8rem)] rounded-[2rem] border border-outline-variant bg-surface-container-low p-4 shadow-sm dark:bg-[#1a2940] lg:flex lg:flex-col ${
        collapsed ? "w-24" : "w-64"
      }`}
    >
      <button
        type="button"
        aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        onClick={onToggleCollapse}
        className="mb-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-outline-variant text-primary hover:bg-secondary"
      >
        <Menu aria-hidden="true" />
      </button>
      <nav className="space-y-2" aria-label="Điều hướng giáo viên">
        {teacherNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/teacher" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold no-underline ${
                active ? "bg-primary text-on-primary" : "text-on-background hover:bg-secondary"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={20} />
              {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t border-outline-variant pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-on-background hover:bg-secondary"
        >
          <LogOut aria-hidden="true" size={20} />
          {collapsed ? <span className="sr-only">Đăng xuất</span> : <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
