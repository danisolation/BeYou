type EmptyStateProps = {
  heading?: string;
  body?: string;
};

export function EmptyState({
  heading = "Chưa có dữ liệu để hiển thị",
  body = "Khi tài khoản hoặc liên kết được tạo, Peerlight AI sẽ hiển thị thông tin phù hợp với vai trò của bạn tại đây.",
}: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-[#D7EFE8] bg-white p-5 text-center shadow-sm sm:p-6">
      <h2 className="text-heading">{heading}</h2>
      <p className="mt-3 text-body">{body}</p>
    </section>
  );
}
