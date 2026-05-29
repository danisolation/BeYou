"use client";

import Link from "next/link";
import { BarChart3, Bot, Heart, LayoutGrid, LogOut, Settings, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { studentNav } from "./student-sidebar";

interface MobileBottomNavProps {
  pathname: string;
  onLogout: () => void;
}

const mainTabs = [
  { href: "/student", label: "Trang chủ", icon: BarChart3 },
  { href: "/student/chat", label: "Trò chuyện", icon: Bot },
  { href: "/student/mood-check-ins", label: "Cảm xúc", icon: Heart },
];

export function MobileBottomNav({ pathname, onLogout }: MobileBottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== "/student" && pathname.startsWith(`${href}/`));
  }

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMore(false)} role="dialog" aria-modal="true" aria-label="Menu mở rộng">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-[#1a2940]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-5">
              <h3 className="text-sm font-semibold text-on-background">Thêm</h3>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-on-background/5 text-on-background/60"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="grid grid-cols-4 gap-2 px-4" aria-label="Thêm điều hướng">
              {studentNav.slice(2).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 no-underline transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-on-background/70 hover:bg-on-background/5"
                    }`}
                  >
                    <Icon aria-hidden="true" size={22} />
                    <span className="text-center text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/student/notification-preferences"
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-on-background/70 no-underline hover:bg-on-background/5"
              >
                <Settings aria-hidden="true" size={22} />
                <span className="text-center text-[11px] font-medium leading-tight">Cài đặt</span>
              </Link>
              <button
                type="button"
                onClick={() => { setShowMore(false); onLogout(); }}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-on-background/70 hover:bg-on-background/5"
              >
                <LogOut aria-hidden="true" size={22} />
                <span className="text-center text-[11px] font-medium leading-tight">Đăng xuất</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant/20 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgb(0,0,0,0.06)] dark:bg-[#0d1c2e] dark:shadow-[0_-2px_12px_rgb(0,0,0,0.3)] md:hidden"
        aria-label="Điều hướng học sinh"
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-1">
          {/* Left tabs */}
          {mainTabs.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 no-underline transition-all ${
                  active ? "text-primary" : "text-on-background/50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <div className={`rounded-full px-3 py-1 transition-colors ${active ? "bg-primary/12" : ""}`}>
                  <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Center SOS button — prominent */}
          <Link
            href="/student/sos"
            className="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 no-underline"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-md shadow-red-600/30">
              <ShieldAlert className="text-white" size={22} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold leading-none text-red-600">SOS</span>
          </Link>

          {/* Right tab */}
          {mainTabs.slice(2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 no-underline transition-all ${
                  active ? "text-primary" : "text-on-background/50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <div className={`rounded-full px-3 py-1 transition-colors ${active ? "bg-primary/12" : ""}`}>
                  <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 transition-all ${
              showMore ? "text-primary" : "text-on-background/50"
            }`}
            aria-label="Thêm"
          >
            <div className={`rounded-full px-3 py-1 transition-colors ${showMore ? "bg-primary/12" : ""}`}>
              <LayoutGrid aria-hidden="true" size={22} strokeWidth={showMore ? 2.5 : 1.8} />
            </div>
            <span className={`text-[10px] leading-none ${showMore ? "font-bold" : "font-medium"}`}>Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
