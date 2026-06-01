"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { parentNav } from "./parent-sidebar";

interface ParentMobileNavProps {
  pathname: string;
  onLogout: () => void;
}

export function ParentMobileNav({ pathname, onLogout }: ParentMobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-outline-variant bg-white dark:bg-[#1a2244] px-5 py-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Điều hướng phụ huynh"
    >
      {parentNav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/parent" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 touch-target no-underline ${
              active ? "text-primary" : "text-on-background/60"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={20} />
            <span className="text-xs-sm">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onLogout}
        className="flex flex-col items-center justify-center gap-0.5 touch-target text-on-background/60"
        aria-label="Đăng xuất"
      >
        <LogOut aria-hidden="true" size={20} />
        <span className="text-xs-sm">Thoát</span>
      </button>
    </nav>
  );
}
