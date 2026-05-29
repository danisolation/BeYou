import type { ReactNode } from "react";

type EmptyStateProps = {
  heading?: string;
  body?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({
  heading = "Chưa có gì ở đây",
  body = "Khi có nội dung mới, em sẽ thấy ngay tại đây.",
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-base font-semibold text-on-background">{heading}</h2>
      <p className="mt-2 text-sm text-on-background/60">{body}</p>
      {children ? <div className="mt-3 text-sm text-on-background/60">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  );
}
