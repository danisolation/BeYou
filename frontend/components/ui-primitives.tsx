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
    <header className={cn("flex flex-col gap-6 rounded-3xl bg-secondary p-6 sm:p-8", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-label font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-2 text-display">{title}</h1>
        {description ? <p className="mt-3 text-body">{description}</p> : null}
      </div>
      {actions || children ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions ?? children}</div> : null}
    </header>
  );
}

export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn("rounded-3xl bg-white p-6 shadow-sm ring-1 ring-outline-variant", className)}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-heading">{title}</h2> : null}
            {description ? <p className="mt-2 text-body">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SurfaceCard({ children, className }: PrimitiveProps) {
  return <div className={cn("rounded-3xl bg-white p-6 shadow-sm ring-1 ring-outline-variant", className)}>{children}</div>;
}

export function EntryCard({ title, description, meta, badge, children, className }: EntryCardProps) {
  return (
    <article className={cn("rounded-3xl bg-white p-5 shadow-sm ring-1 ring-outline-variant", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {meta ? <div className="mb-2 text-label text-primary">{meta}</div> : null}
          <h3 className="text-heading">{title}</h3>
          {description ? <p className="mt-2 text-body">{description}</p> : null}
        </div>
        {badge}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

export function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  const toneClass: Record<StatusTone, string> = {
    safe: "border-[#BFE7D9] bg-secondary text-accent",
    neutral: "border-[#D7EFE8] bg-white text-slate-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    sos: "border-red-300 bg-red-600 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-label font-semibold",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ResponsiveTable({ children, className }: PrimitiveProps) {
  return <div className={cn("overflow-x-auto rounded-3xl ring-1 ring-outline-variant", className)}>{children}</div>;
}

export function LoadingState({ message = "Đang tải thông tin...", className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("rounded-3xl bg-white p-6 text-body shadow-sm ring-1 ring-outline-variant", className)}>
      {message}
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải thông tin",
  message = "Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn.",
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700", className)}>
      <h2 className="text-heading text-red-700">{title}</h2>
      <p className="mt-3 text-body text-red-700">{message}</p>
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
    <aside className={cn("rounded-3xl bg-secondary p-6 ring-1 ring-outline-variant", className)}>
      <p className="text-label font-semibold uppercase tracking-[0.18em] text-primary">Ranh giới quyền riêng tư</p>
      <h2 className="mt-2 text-heading">{title}</h2>
      <p className="mt-3 text-body">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {actions ? <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </aside>
  );
}
