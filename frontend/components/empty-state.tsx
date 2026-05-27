import type { ReactNode } from "react";

type EmptyStateProps = {
  heading?: string;
  body?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({
  heading = "Chưa có dữ liệu để hiển thị",
  body = "Khi tài khoản hoặc liên kết được tạo, Peerlight AI sẽ hiển thị thông tin phù hợp với vai trò của bạn tại đây.",
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={[
        "rounded-3xl border border-[#D7EFE8] bg-white p-6 text-center shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-heading">{heading}</h2>
      <p className="mt-3 text-body">{body}</p>
      {children ? <div className="mt-4 text-body">{children}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
