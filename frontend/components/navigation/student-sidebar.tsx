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
  { href: "/student/chat", label: "Trò chuyện AI", icon: Bot },
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
      className={`sticky top-28 hidden h-[calc(100dvh-8rem)] rounded-[2rem] border border-outline-variant bg-surface-container-low p-4 shadow-sm lg:flex lg:flex-col ${
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
      <nav className="space-y-2" aria-label="Điều hướng học sinh">
        {studentNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
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
        <Link
          href="/student#peerlight-sos"
          className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-red-700 no-underline hover:bg-red-50"
        >
          <ShieldAlert aria-hidden="true" size={20} />
          {collapsed ? <span className="sr-only">SOS</span> : <span>SOS</span>}
        </Link>
        <Link
          href="/student/notification-preferences"
          className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-on-background no-underline hover:bg-secondary"
        >
          <Settings aria-hidden="true" size={20} />
          {collapsed ? <span className="sr-only">Cài đặt</span> : <span>Cài đặt</span>}
        </Link>
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
