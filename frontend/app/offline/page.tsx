"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

export default function OfflinePage() {
  const handleRetry = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="mb-2 text-2xl font-bold text-on-background">Không có kết nối</h1>
        <p className="mb-6 text-on-background/70">
          Vui lòng kiểm tra kết nối mạng và thử lại.
        </p>
        <Link
          href="/"
          onClick={handleRetry}
          className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Thử lại
        </Link>
      </div>
    </div>
  );
}
