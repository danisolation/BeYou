"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, LogOut, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { adminNav } from "./admin-sidebar";

interface AdminMobileNavProps {
  pathname: string;
  onLogout: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SectionId = "overview" | "content" | "accounts";

const sectionDefinitions: Array<{ id: SectionId; label: string; hrefs: string[] }> = [
  {
    id: "overview",
    label: "Tổng quan & giám sát",
    hrefs: ["/admin", "/admin/operations", "/admin/reports", "/admin/chatbot", "/admin/mood-checkins"],
  },
  {
    id: "content",
    label: "Nội dung & chính sách",
    hrefs: ["/admin/content", "/admin/privacy-policy"],
  },
  {
    id: "accounts",
    label: "Tài khoản & liên kết",
    hrefs: ["/admin/users", "/admin/links"],
  },
];

export function AdminMobileNav({ pathname, onLogout, open, onOpenChange }: AdminMobileNavProps) {
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    overview: true,
    content: true,
    accounts: true,
  });

  const navSections = useMemo(() => {
    const itemsByHref = new Map(adminNav.map((item) => [item.href, item]));
    return sectionDefinitions
      .map((section) => ({
        ...section,
        items: section.hrefs.map((href) => itemsByHref.get(href)).filter(Boolean),
      }))
      .filter((section) => section.items.length > 0);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  function isActive(href: string) {
    return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
  }

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Đóng menu quản trị"
        onClick={() => onOpenChange(false)}
        className={`absolute inset-0 bg-on-background/45 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Điều hướng quản trị"
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-1rem))] max-w-full flex-col border-r border-outline-variant/30 bg-white shadow-2xl transition-transform dark:bg-[#0d1c2e] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Quản trị</p>
            <h2 className="text-base font-semibold text-on-background">Điều hướng nhanh</h2>
          </div>
          <button
            type="button"
            aria-label="Đóng menu quản trị"
            onClick={() => onOpenChange(false)}
            className="btn-press touch-target inline-flex items-center justify-center rounded-2xl text-on-background/60 hover:bg-outline-variant/15 hover:text-on-background"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-3" aria-label="Điều hướng quản trị">
            {navSections.map((section) => (
              <section key={section.id} className="rounded-2xl border border-outline-variant/20 bg-background/70 p-2 dark:bg-[#1a2940]">
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections((current) => ({
                      ...current,
                      [section.id]: !current[section.id],
                    }))
                  }
                  className="btn-press flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-on-background"
                >
                  <span>{section.label}</span>
                  {openSections[section.id] ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                </button>
                {openSections[section.id] ? (
                  <div className="mt-2 space-y-1">
                    {section.items.map((item) => {
                      if (!item) {
                        return null;
                      }
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => onOpenChange(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium no-underline transition-colors ${
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-on-background/70 hover:bg-outline-variant/15 hover:text-on-background"
                          }`}
                        >
                          <Icon aria-hidden="true" size={18} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            ))}
          </nav>
        </div>

        <div className="border-t border-outline-variant/20 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onLogout();
            }}
            className="btn-press flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            <LogOut aria-hidden="true" size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </div>
  );
}
