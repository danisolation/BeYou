"use client";

import Link from "next/link";

import { DemoRoleEntry } from "@/components/demo-role-entry";

const boundaries = [
  "Học sinh sở hữu dữ liệu nhạy cảm của mình.",
  "Người lớn chỉ thấy tóm tắt hỗ trợ trong phạm vi liên kết.",
  "Peerlight AI không thay thế chuyên gia tư vấn, bác sĩ hoặc dịch vụ khẩn cấp.",
];

export default function HomePage() {
  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between rounded-[1.75rem] bg-white/85 px-5 py-4 shadow-sm ring-1 ring-[#D7EFE8] backdrop-blur">
          <Link href="/" className="text-heading font-bold text-accent no-underline">
            Peerlight AI
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white no-underline hover:bg-[#238C78]"
          >
            Bắt đầu
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-[#D7EFE8] backdrop-blur sm:p-8 lg:p-10">
            <p className="text-label font-semibold uppercase tracking-[0.22em] text-accent">Peerlight AI demo live</p>
            <h1 className="mt-3 max-w-3xl text-display">Không gian hỗ trợ học sinh THPT trước khi căng thẳng leo thang.</h1>
            <p className="mt-4 max-w-3xl text-body">
              Peerlight AI giúp học sinh tự nhìn lại cảm xúc, luyện tình huống thực tế, trò chuyện với AI hỗ trợ, chuẩn bị người lớn tin tưởng và gửi SOS trong app khi cần.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-6 font-semibold text-white no-underline hover:bg-[#238C78]"
            >
              Bắt đầu
            </Link>
          </div>

          <section id="demo-roles" className="rounded-[2rem] bg-secondary p-5 shadow-sm ring-1 ring-[#D7EFE8] sm:p-6 lg:p-8">
            <p className="text-label font-semibold text-[#27665B]">Vào demo trong một bước</p>
            <h2 className="mt-2 text-heading">Chọn vai trò để Peerlight AI tự đăng nhập bằng dữ liệu seed.</h2>
            <p className="mt-3 text-body">
              Các tài khoản này chỉ là hồ sơ demo. Không nhập dữ liệu học sinh thật trong bản giới thiệu.
            </p>
            <div className="mt-5">
              <DemoRoleEntry />
            </div>
          </section>
        </section>

        <section id="about" className="grid gap-4 md:grid-cols-3">
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
              "Học sinh: quyền riêng tư, check-in cảm xúc, người lớn tin tưởng, AI, SOS.",
              "Giáo viên: danh sách tín hiệu SOS và hỗ trợ đúng phạm vi.",
              "Phụ huynh: xem hỗ trợ trong phạm vi được liên kết.",
              "Quản trị: nội dung, báo cáo tổng hợp, vận hành metadata-only.",
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
