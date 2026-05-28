"use client";

import Link from "next/link";
import { MoreHorizontal, Settings, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { studentNav } from "./student-sidebar";

interface MobileBottomNavProps {
  pathname: string;
  onLogout: () => void;
}

export function MobileBottomNav({ pathname, onLogout }: MobileBottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  // Show first 4 items + SOS + More
  const visibleItems = studentNav.slice(0, 4);

  return (
    <>
      {/* More menu overlay */}
      {showMore ? (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowMore(false)} role="dialog" aria-label="Menu mở rộng">
          <div className="absolute inset-0 bg-on-background/20" aria-hidden="true" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-card border-t border-outline-variant bg-white dark:bg-[#1a2940] p-4 pb-[env(safe-area-inset-bottom)] dark:bg-[#1a2940]"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="grid grid-cols-3 gap-3" aria-label="Thêm điều hướng">
              {studentNav.slice(4).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
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
                    <span className="text-xs-sm">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/student/notification-preferences"
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center gap-1 rounded-2xl p-3 text-on-background/60 no-underline"
              >
                <Settings aria-hidden="true" size={20} />
                <span className="text-xs-sm">Cài đặt</span>
              </Link>
              <button
                type="button"
                onClick={() => { setShowMore(false); onLogout(); }}
                className="flex flex-col items-center gap-1 rounded-2xl p-3 text-on-background/60"
              >
                <Settings aria-hidden="true" size={20} />
                <span className="text-xs-sm">Đăng xuất</span>
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-outline-variant/50 bg-white/95 px-2 py-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:bg-[#0d1c2e]/95 lg:hidden"
        aria-label="Điều hướng học sinh"
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 no-underline ${
                active ? "text-primary" : "text-on-background/60"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={20} />
              <span className="truncate text-xs-sm">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/student#peerlight-sos"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-red-700 no-underline"
        >
          <ShieldAlert aria-hidden="true" size={20} />
          <span className="truncate text-xs-sm">SOS</span>
        </Link>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-on-background/60"
          aria-label="Thêm"
        >
          <MoreHorizontal aria-hidden="true" size={20} />
          <span className="truncate text-xs-sm">Thêm</span>
        </button>
      </nav>
    </>
  );
}
