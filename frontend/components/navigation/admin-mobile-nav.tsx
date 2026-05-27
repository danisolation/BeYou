"use client";

import Link from "next/link";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { adminNav } from "./admin-sidebar";

interface AdminMobileNavProps {
  pathname: string;
  onLogout: () => void;
}

export function AdminMobileNav({ pathname, onLogout }: AdminMobileNavProps) {
  const [showMore, setShowMore] = useState(false);

  // Show first 4 items in bottom bar, rest in "More" menu
  const visibleItems = adminNav.slice(0, 4);
  const overflowItems = adminNav.slice(4);

  return (
    <>
      {/* More menu overlay */}
      {showMore ? (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowMore(false)} role="dialog" aria-label="Menu mở rộng">
          <div className="absolute inset-0 bg-on-background/20" aria-hidden="true" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-card border-t border-outline-variant bg-surface p-4 pb-[env(safe-area-inset-bottom)] dark:bg-[#1a2940]"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="grid grid-cols-3 gap-3" aria-label="Thêm điều hướng">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 rounded-2xl p-3 no-underline ${
                      active ? "text-primary" : "text-on-background/60"
                    }`}
                  >
                    <Icon aria-hidden="true" size={20} />
                    <span className="text-label-sm">{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => { setShowMore(false); onLogout(); }}
                className="flex flex-col items-center gap-1 rounded-2xl p-3 text-on-background/60"
              >
                <LogOut aria-hidden="true" size={20} />
                <span className="text-label-sm">Đăng xuất</span>
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-outline-variant bg-surface px-margin-mobile py-2 pb-[env(safe-area-inset-bottom)] dark:bg-[#1a2940] lg:hidden"
        aria-label="Điều hướng quản trị"
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 no-underline ${
                active ? "text-primary" : "text-on-background/60"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={20} />
              <span className="text-label-sm">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex flex-col items-center gap-0.5 text-on-background/60"
          aria-label="Thêm"
        >
          <MoreHorizontal aria-hidden="true" size={20} />
          <span className="text-label-sm">Thêm</span>
        </button>
      </nav>
    </>
  );
}
