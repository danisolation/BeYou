type EmptyStateProps = {
  heading?: string;
  body?: string;
};

export function EmptyState({
  heading = "Chưa có dữ liệu để hiển thị",
  body = "Khi tài khoản hoặc liên kết được tạo, BeYou sẽ hiển thị thông tin phù hợp với vai trò của bạn tại đây.",
}: EmptyStateProps) {
  return (
    <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
      <h2 className="text-heading">{heading}</h2>
      <p className="mt-3 text-body">{body}</p>
    </section>
  );
}
