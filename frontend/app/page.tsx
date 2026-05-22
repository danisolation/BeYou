"use client";

import Link from "next/link";

import { DemoRoleEntry } from "@/components/demo-role-entry";

const boundaries = [
  "Học sinh sở hữu dữ liệu nhạy cảm của mình.",
  "Người lớn chỉ thấy tóm tắt hỗ trợ trong phạm vi liên kết.",
  "BeYou không thay thế chuyên gia tư vấn, bác sĩ hoặc dịch vụ khẩn cấp.",
];

export default function HomePage() {
  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-[#D7EFE8] backdrop-blur sm:p-8 lg:p-10">
            <p className="text-label font-semibold uppercase tracking-[0.22em] text-accent">BeYou demo live</p>
            <h1 className="mt-3 max-w-3xl text-display">Không gian hỗ trợ học sinh THPT trước khi căng thẳng leo thang.</h1>
            <p className="mt-4 max-w-3xl text-body">
              BeYou giúp học sinh tự nhìn lại cảm xúc, luyện tình huống học đường, trò chuyện với bot hỗ trợ, chuẩn bị kế hoạch người lớn tin cậy và gửi SOS trong app khi cần.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-[#238C78]"
              >
                Đăng nhập thủ công
              </Link>
              <a
                href="#demo-roles"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#CFE8E1] bg-white px-5 font-semibold hover:border-accent hover:bg-secondary"
              >
                Chọn vai trò demo
              </a>
            </div>
          </div>

          <section id="demo-roles" className="rounded-[2rem] bg-secondary p-5 shadow-sm ring-1 ring-[#D7EFE8] sm:p-6 lg:p-8">
            <p className="text-label font-semibold text-[#27665B]">Vào demo trong một bước</p>
            <h2 className="mt-2 text-heading">Chọn vai trò để BeYou tự đăng nhập bằng dữ liệu seed.</h2>
            <p className="mt-3 text-body">
              Các tài khoản này chỉ là hồ sơ demo. Không nhập dữ liệu học sinh thật trong bản giới thiệu.
            </p>
            <div className="mt-5">
              <DemoRoleEntry />
            </div>
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {boundaries.map((item) => (
            <article key={item} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#D7EFE8] sm:p-6">
              <p className="text-label font-semibold text-accent">Ranh giới an toàn</p>
              <p className="mt-2 text-body">{item}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#D7EFE8] sm:p-6">
          <h2 className="text-heading">Luồng demo đề xuất</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              "Học sinh: privacy, mood, support plan, chat, SOS.",
              "Giáo viên: tóm tắt hỗ trợ và cập nhật SOS.",
              "Phụ huynh: tóm tắt/read-only trong phạm vi liên kết.",
              "Quản trị: nội dung, báo cáo tổng hợp, operations metadata-only.",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl bg-secondary p-4 text-body">
                <span className="block text-label font-semibold text-accent">Vai {index + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
