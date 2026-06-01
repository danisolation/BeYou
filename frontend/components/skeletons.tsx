/**
 * Skeleton loading states — content-shaped placeholders for perceived speed.
 * Replace spinners with these to show the user what content will look like.
 */

type SkeletonProps = {
  className?: string;
};

/** Base skeleton element with shimmer animation */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Matches StitchCard layout: circle icon + title + description + button */
export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-outline-variant/20 p-6 dark:bg-outline-variant/30">
      {/* Circle icon */}
      <div className="h-12 w-12 animate-pulse rounded-full bg-outline-variant/30 dark:bg-outline-variant/40" />
      {/* Title */}
      <div className="h-5 w-3/5 animate-pulse rounded-lg bg-outline-variant/30 dark:bg-outline-variant/40" />
      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-lg bg-outline-variant/30 dark:bg-outline-variant/40" />
        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-outline-variant/30 dark:bg-outline-variant/40" />
      </div>
      {/* CTA button */}
      <div className="mt-2 h-10 w-28 animate-pulse rounded-xl bg-outline-variant/30 dark:bg-outline-variant/40" />
    </div>
  );
}

/** Multiple text lines with varying widths */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

/** Full page skeleton: heading + subtitle + grid of CardSkeletons */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-8" aria-hidden="true">
      {/* Header area */}
      <header className="space-y-3 rounded-2xl bg-outline-variant/10 p-6">
        <div className="h-7 w-2/5 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
        <div className="h-4 w-3/5 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
      </header>
      {/* Content cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/** Dashboard skeleton: greeting + grid of cards + banner */
export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-8" aria-hidden="true">
      {/* Welcome heading */}
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
        <div className="h-5 w-64 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Banner skeleton (Peerlight AI) */}
      <div className="flex items-center gap-4 rounded-2xl bg-outline-variant/10 p-6">
        <div className="h-8 w-8 animate-pulse rounded-full bg-outline-variant/20 dark:bg-outline-variant/30" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-xl bg-outline-variant/20 dark:bg-outline-variant/30" />
      </div>
    </div>
  );
}

/** Chat skeleton: message bubbles + input area */
export function ChatSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-6" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
        <div className="h-6 w-48 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
      </div>
      {/* Messages */}
      <div className="space-y-4">
        {/* Bot message */}
        <div className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-outline-variant/20 dark:bg-outline-variant/30" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-4/5 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
            <div className="h-4 w-3/5 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
          </div>
        </div>
        {/* User message */}
        <div className="flex justify-end">
          <div className="h-10 w-2/5 animate-pulse rounded-2xl bg-outline-variant/20 dark:bg-outline-variant/30" />
        </div>
        {/* Bot message */}
        <div className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-outline-variant/20 dark:bg-outline-variant/30" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
            <div className="h-4 w-2/3 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
          </div>
        </div>
      </div>
      {/* Input area */}
      <div className="mt-8 flex items-center gap-3">
        <div className="h-12 flex-1 animate-pulse rounded-2xl bg-outline-variant/20 dark:bg-outline-variant/30" />
        <div className="h-12 w-12 animate-pulse rounded-full bg-outline-variant/20 dark:bg-outline-variant/30" />
      </div>
    </div>
  );
}

/** Layout-level skeleton: matches new slim header + content area */
export function LayoutSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header skeleton matching new h-14 header */}
      <div className="border-b border-outline-variant/60 bg-white/80 backdrop-blur-lg dark:bg-[#0f1530]/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 animate-pulse rounded-lg bg-outline-variant/20 dark:bg-outline-variant/30" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-outline-variant/20 dark:bg-outline-variant/30" />
          </div>
        </div>
      </div>
      {/* Content area skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-hidden="true">
        <DashboardSkeleton cards={4} />
      </div>
      {/* Slow load hint */}
      <SlowLoadHint />
    </div>
  );
}

/** Shows "server waking up" message after 5 seconds of loading */
function SlowLoadHint() {
  if (typeof window === "undefined") return null;
  // Use CSS animation delay to show only after 5s
  return (
    <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_0.3s_ease_5s_both] rounded-xl bg-on-background/80 px-4 py-2.5 text-xs font-medium text-white opacity-0 shadow-lg dark:bg-white/90 dark:text-on-background">
      Server đang khởi động, vui lòng chờ...
    </p>
  );
}
