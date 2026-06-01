import type { ReactNode } from "react";

type PrimitiveProps = {
  children?: ReactNode;
  className?: string;
};

type PageHeaderProps = PrimitiveProps & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

type SectionProps = PrimitiveProps & {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

type EntryCardProps = PrimitiveProps & {
  title: string;
  description?: string;
  meta?: ReactNode;
  badge?: ReactNode;
};

type StatusTone = "safe" | "neutral" | "warning" | "danger" | "sos";

type StatusBadgeProps = PrimitiveProps & {
  tone?: StatusTone;
};

type LoadingStateProps = {
  message?: string;
  className?: string;
};

type ErrorStateProps = {
  title?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
};

type PrivacyBoundaryCardProps = PrimitiveProps & {
  title: string;
  description: string;
  actions?: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({ eyebrow, title, description, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-6 rounded-[20px] bg-primary/5 p-6 sm:p-8", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-2 text-display">{title}</h1>
        {description ? <p className="mt-3 text-sm">{description}</p> : null}
      </div>
      {actions || children ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions ?? children}</div> : null}
    </header>
  );
}

export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn("rounded-[20px] bg-white p-6 soft-card ring-1 ring-outline-variant/60 dark:bg-[#1a2244]", className)}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-sm font-semibold">{title}</h2> : null}
            {description ? <p className="mt-2 text-sm">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SurfaceCard({ children, className }: PrimitiveProps) {
  return <div className={cn("rounded-[20px] bg-white dark:bg-[#1a2244] p-5 soft-card border border-outline-variant/30", className)}>{children}</div>;
}

export function EntryCard({ title, description, meta, badge, children, className }: EntryCardProps) {
  return (
    <article className={cn("rounded-[20px] bg-white dark:bg-[#1a2244] p-5 soft-card border border-outline-variant/30", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {meta ? <div className="mb-2 text-xs text-primary">{meta}</div> : null}
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="mt-2 text-sm">{description}</p> : null}
        </div>
        {badge}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

export function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  const toneClass: Record<StatusTone, string> = {
    safe: "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
    neutral: "border-outline-variant/40 bg-outline-variant/10 text-on-background/70",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-400",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-400",
    sos: "border-red-300 bg-red-600 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ResponsiveTable({ children, className }: PrimitiveProps) {
  return <div className={cn("overflow-x-auto rounded-2xl ring-1 ring-outline-variant", className)}>{children}</div>;
}

export function LoadingState({ message = "Đang tải thông tin...", className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn("rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-outline-variant", className)}>
      {message}
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải thông tin",
  message = "Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn.",
  className,
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" aria-live="assertive" className={cn("rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700", className)}>
      <h2 className="text-sm font-semibold text-red-700">{title}</h2>
      <p className="mt-3 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export function PrivacyBoundaryCard({
  title,
  description,
  actions,
  children,
  className,
}: PrivacyBoundaryCardProps) {
  return (
    <aside className={cn("rounded-2xl bg-primary/5 dark:bg-primary/10 p-5 border border-primary/10", className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ranh giới quyền riêng tư</p>
      <h2 className="mt-2 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-on-background/70">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {actions ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </aside>
  );
}
