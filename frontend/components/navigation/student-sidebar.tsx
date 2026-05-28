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

export const studentNav = [
  { href: "/student", label: "Bảng điều khiển", icon: BarChart3 },
  { href: "/student/chat", label: "Peerlight AI", icon: Bot },
  { href: "/student/self-checks", label: "Test tâm lý", icon: Brain },
  { href: "/student/mood-check-ins", label: "Check-in cảm xúc", icon: CalendarCheck },
  { href: "/student/scenarios", label: "Tình huống xử lý thực tế", icon: MessageCircle },
  { href: "/student/support-plan", label: "Người lớn tin tưởng", icon: Users },
];

interface StudentSidebarProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function StudentSidebar({ pathname, collapsed, onToggleCollapse, onLogout }: StudentSidebarProps) {
  return (
    <aside
      className={`fixed left-3 top-[4.25rem] z-30 hidden h-[calc(100dvh-5rem)] overflow-y-auto transition-all duration-200 rounded-2xl border border-outline-variant/50 bg-white p-3 shadow-sm dark:bg-[#1a2940] md:flex md:flex-col ${
        collapsed ? "w-20" : "w-56"
      }`}
    >
      <button
        type="button"
        aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        onClick={onToggleCollapse}
        className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-background/60 hover:bg-outline-variant/20 hover:text-primary"
      >
        <Menu aria-hidden="true" size={18} />
      </button>
      <nav className="space-y-1" aria-label="Điều hướng học sinh">
        {studentNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline transition-colors ${
                active ? "bg-primary/10 text-primary font-semibold" : "text-on-background/70 hover:bg-outline-variant/15 hover:text-on-background"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={18} />
              {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-outline-variant/40 pt-3">
        <Link
          href="/student/sos"
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 no-underline hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <ShieldAlert aria-hidden="true" size={18} />
          {collapsed ? <span className="sr-only">SOS</span> : <span>SOS</span>}
        </Link>
        <Link
          href="/student/notification-preferences"
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-on-background/70 no-underline hover:bg-outline-variant/15 hover:text-on-background"
        >
          <Settings aria-hidden="true" size={18} />
          {collapsed ? <span className="sr-only">Cài đặt</span> : <span>Cài đặt</span>}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-on-background/70 hover:bg-outline-variant/15 hover:text-on-background"
        >
          <LogOut aria-hidden="true" size={18} />
          {collapsed ? <span className="sr-only">Đăng xuất</span> : <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
