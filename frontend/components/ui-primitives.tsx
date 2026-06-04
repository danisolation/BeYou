import type { ButtonHTMLAttributes, ReactNode } from "react";

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
    <header className={cn("flex flex-col gap-5 border-b border-outline-variant/60 pb-6 sm:pb-7", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-2 text-display tracking-tight">{title}</h1>
        {description ? <p className="mt-2.5 text-sm text-on-background/75">{description}</p> : null}
      </div>
      {actions || children ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions ?? children}</div> : null}
    </header>
  );
}

export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn("rounded-2xl bg-white p-6 soft-card ring-1 ring-outline-variant/50 dark:bg-[#1a2244]", className)}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2> : null}
            {description ? <p className="mt-1.5 text-sm text-on-background/75">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SurfaceCard({ children, className }: PrimitiveProps) {
  return <div className={cn("rounded-2xl bg-white dark:bg-[#1a2244] p-5 soft-card elevated border border-outline-variant/40", className)}>{children}</div>;
}

export function EntryCard({ title, description, meta, badge, children, className }: EntryCardProps) {
  return (
    <article className={cn("rounded-2xl bg-white dark:bg-[#1a2244] p-5 soft-card elevated border border-outline-variant/40", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {meta ? <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-primary/80">{meta}</div> : null}
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {description ? <p className="mt-1.5 text-sm text-on-background/75">{description}</p> : null}
        </div>
        {badge}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

export function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  const toneClass: Record<StatusTone, string> = {
    safe: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/20 dark:text-emerald-300",
    neutral: "border-outline-variant/60 bg-outline-variant/15 text-on-background/75",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-700/40 dark:bg-red-900/25 dark:text-red-300",
    sos: "border-red-400 bg-red-600 text-white shadow-[0_2px_8px_rgba(220,38,38,0.25)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 tracking-tight",
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
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-5 text-sm text-on-background/75 soft-card ring-1 ring-outline-variant/50 dark:bg-[#1a2244]",
        className,
      )}
    >
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
      <span>{message}</span>
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
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-700/40 dark:bg-red-950/30 dark:text-red-200",
        className,
      )}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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
    <aside className={cn("rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 dark:border-primary/20 dark:bg-primary/10", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Ranh giới quyền riêng tư</p>
      <h2 className="mt-2 text-[15px] font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-on-background/75">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {actions ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </aside>
  );
}

/* === Real-app primitives: Button + Kbd + Divider === */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[0_1px_2px_rgba(20,26,64,0.08),0_4px_12px_rgba(116,87,232,0.25)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white text-on-background border border-outline-variant/70 hover:bg-primary/5 dark:bg-[#1a2244] dark:hover:bg-primary/10",
  ghost:
    "bg-transparent text-on-background/80 hover:bg-primary/10 hover:text-on-background dark:hover:bg-primary/15",
  danger:
    "bg-red-600 text-white shadow-[0_1px_2px_rgba(20,26,64,0.08),0_4px_12px_rgba(220,38,38,0.25)] hover:bg-red-700 active:bg-red-800",
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-[15px] rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariantClass[variant],
        buttonSizeClass[size],
        block ? "w-full" : "",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children, className }: PrimitiveProps) {
  return <kbd className={cn("kbd", className)}>{children}</kbd>;
}

export function Divider({ className }: PrimitiveProps) {
  return <div role="separator" aria-orientation="horizontal" className={cn("divider my-4", className)} />;
}