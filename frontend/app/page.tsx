"use client";

import Link from "next/link";
import { Leaf, Shield, Brain, Heart, Lock, Eye, MessageCircle, BookHeart, AlertTriangle, ChevronRight } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";

const coreValues = [
  {
    icon: Lock,
    title: "Sự riêng tư tuyệt đối",
    description: "Dữ liệu được mã hóa, không ai ngoài bạn có thể đọc nhật ký hay lịch sử trò chuyện.",
  },
  {
    icon: Brain,
    title: "Hỗ trợ từ chuyên gia",
    description: "Nội dung và kịch bản được xây dựng bởi chuyên gia tâm lý học đường Việt Nam.",
  },
  {
    icon: Heart,
    title: "Luyện tập kỹ năng sống",
    description: "Thực hành xử lý tình huống thực tế, rèn luyện cách quản lý cảm xúc hàng ngày.",
  },
];

const privacyFeatures = [
  "Mã hóa đầu cuối cho dữ liệu nhạy cảm",
  "Tùy chọn ẩn danh hoàn toàn",
  "Tuân thủ quy định bảo vệ dữ liệu trẻ em",
  "Không chia sẻ dữ liệu với bên thứ ba",
];

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-background">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-white/90 backdrop-blur-lg dark:bg-[#0f1530]/90">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold font-bold text-primary no-underline">
            <Leaf className="h-5 w-5" aria-hidden="true" />
            Peerlight AI
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#mission" className="text-sm text-on-background/70 no-underline hover:text-primary">Sứ mệnh</a>
            <a href="#features" className="text-sm text-on-background/70 no-underline hover:text-primary">Tính năng</a>
            <a href="#support" className="text-sm text-on-background/70 no-underline hover:text-primary">Hỗ trợ</a>
          </div>
          <Link
            href="/login"
            className="btn-press inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 font-semibold text-on-primary no-underline transition-colors hover:bg-primary-container"
          >
            Bắt đầu
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 py-16 lg:px-16 lg:py-24">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-tertiary/5 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs-md font-semibold text-primary">
              <Leaf className="h-4 w-4" /> Không gian an toàn cho học sinh
            </span>
            <h1 className="mt-6 text-3xl font-bold font-bold-stitch leading-tight text-on-background sm:text-4xl">
              Peerlight AI — Nơi em có thể dừng lại, thở sâu và được lắng nghe
            </h1>
            <p className="mt-4 max-w-xl text-base text-on-background/70">
              Dành cho học sinh THPT muốn hiểu cảm xúc của mình, tập cách xử lý những tình huống khó,
              và tìm đến người lớn em tin khi cần.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                href="/login"
                className="btn-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-button bg-primary px-6 font-semibold text-on-primary no-underline transition-colors hover:bg-primary-container sm:w-auto"
              >
                Bắt đầu ngay <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href="#mission"
                className="btn-press inline-flex min-h-[44px] w-full items-center justify-center rounded-button border border-outline-variant px-6 font-semibold text-on-background no-underline transition-colors hover:bg-outline-variant/10 dark:hover:bg-[#1a2244] sm:w-auto"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          {/* Hero image placeholder */}
          <div className="hidden lg:block">
            <div className="animate-scale-in delay-200 aspect-square rounded-hero bg-gradient-to-br from-primary/10 via-surface-container to-primary/5 ring-1 ring-outline-variant/20" />
          </div>
        </div>
      </section>

      {/* Safe Harbor Philosophy */}
      <section id="mission" className="bg-white dark:bg-[#1e2d40] px-5 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl text-on-background">
            Peerlight AI là nơi an toàn để em được lắng nghe, được tôn trọng và học cách tự chăm sóc mình.
          </h2>
        </div>
      </section>

      {/* Core Values */}
      <section className="px-5 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl text-on-background">Giá trị cốt lõi</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value, index) => (
              <ScrollReveal key={value.title} delay={index * 100}>
                <div className="card-lift rounded-2xl bg-white dark:bg-[#1e2d40] p-6 ring-1 ring-outline-variant/20 transition-shadow hover:shadow-md">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
                    <value.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg text-on-background">{value.title}</h3>
                  <p className="mt-2 text-sm text-on-background/70">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Tools Bento Grid */}
      <section id="features" className="bg-white dark:bg-[#1e2d40] px-5 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl text-on-background">Công cụ thông minh</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-12">
            {/* Large card: AI assistant */}
            <ScrollReveal className="sm:col-span-2 md:col-span-8">
              <div className="card-lift rounded-2xl bg-primary/10 p-6 sm:p-8">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/20 p-3 text-primary">
                  <MessageCircle className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg text-on-background">Trợ lý AI thấu cảm</h3>
                <p className="mt-2 max-w-lg text-sm text-on-background/70">
                  Trò chuyện với AI biết lắng nghe, không phán xét, và gợi ý bước tiếp theo khi em cần.
                </p>
              </div>
            </ScrollReveal>

            {/* Small card: Emotion diary */}
            <ScrollReveal className="sm:col-span-1 md:col-span-4" delay={100}>
              <div className="card-lift rounded-2xl bg-white dark:bg-[#1a2244] p-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
                  <BookHeart className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg text-on-background">Nhật ký cảm xúc</h3>
                <p className="mt-2 text-sm text-on-background/70">
                  Ghi lại và theo dõi cảm xúc hàng ngày một cách riêng tư.
                </p>
              </div>
            </ScrollReveal>

            {/* Small card: SOS */}
            <ScrollReveal className="sm:col-span-1 md:col-span-4" delay={200}>
              <div className="card-lift rounded-2xl bg-error-container p-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-error/10 p-3 text-error">
                  <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg text-on-background">Hỗ trợ SOS</h3>
                <p className="mt-2 text-sm text-on-background/70">
                  Gửi tín hiệu khẩn cấp đến người lớn tin tưởng chỉ trong một bước.
                </p>
              </div>
            </ScrollReveal>

            {/* Wide card: Privacy */}
            <ScrollReveal className="sm:col-span-2 md:col-span-8" delay={300}>
              <div className="card-lift rounded-2xl bg-white p-6 sm:p-8 dark:bg-[#1a2244]">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
                  <Shield className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg text-on-background">Riêng tư của em luôn được tôn trọng</h3>
                <p className="mt-2 max-w-lg text-sm text-on-background/70">
                  Dữ liệu của bạn thuộc về bạn. Không ai có thể đọc nhật ký hay trò chuyện mà không có sự đồng ý.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section id="support" className="px-5 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="card-lift rounded-2xl bg-white/80 p-8 shadow-lg ring-1 ring-outline-variant/20 backdrop-blur lg:p-12">
            <div className="flex items-center gap-3">
              <Eye className="h-7 w-7 text-primary" aria-hidden="true" />
              <h2 className="text-2xl text-on-background">Quyền riêng tư & Tin tưởng</h2>
            </div>
            <ul className="mt-6 space-y-3">
              {privacyFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-base text-on-background/80">
                  <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ScrollReveal>
        <section className="bg-primary px-5 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl text-on-primary">Bắt đầu từ một bước nhỏ, khi em sẵn sàng</h2>
          <p className="mt-4 text-base text-on-primary/80">
            Chỉ cần vài bước đơn giản, bạn đã có một không gian an toàn để chia sẻ và được hỗ trợ.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="btn-press inline-flex min-h-[44px] w-full items-center justify-center rounded-button bg-white px-6 font-semibold text-primary no-underline transition-colors hover:bg-outline-variant/10 dark:hover:bg-[#1a2244] sm:w-auto"
            >
              Bắt đầu ngay
            </Link>
            <a
              href="#mission"
              className="btn-press inline-flex min-h-[44px] w-full items-center justify-center rounded-button border border-on-primary/30 px-6 font-semibold text-on-primary no-underline transition-colors hover:bg-on-primary/10 sm:w-auto"
            >
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* CTA — Bắt đầu ngay */}
      <section className="bg-white dark:bg-[#1e2d40] px-5 py-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="card-lift rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center ring-1 ring-primary/20 sm:p-8">
            <h2 className="text-lg font-bold text-on-background">Sẵn sàng bắt đầu?</h2>
            <p className="mt-2 text-sm text-on-background/70">
              Đăng nhập để vào không gian riêng của em trên Peerlight AI.
            </p>
            <Link
              href="/login"
              className="btn-press mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-primary/90"
            >
              Đăng nhập ngay
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 bg-white dark:bg-[#0f1530] px-5 py-12 lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold font-bold text-primary no-underline">
              <Leaf className="h-5 w-5" aria-hidden="true" />
              Peerlight AI
            </Link>
            <p className="mt-3 text-sm text-on-background/60">
              Nơi em có thể dừng lại, thở sâu và được lắng nghe. Đồng hành cùng học sinh THPT và gia đình trên hành trình chăm sóc sức khỏe tinh thần.
            </p>
          </div>
          <div>
            <h4 className="text-xs-md font-semibold text-on-background">Về chúng tôi</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-background/60">
              <li><a href="#mission" className="no-underline hover:text-primary">Sứ mệnh</a></li>
              <li><a href="#features" className="no-underline hover:text-primary">Tính năng</a></li>
              <li><a href="#support" className="no-underline hover:text-primary">Hỗ trợ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs-md font-semibold text-on-background">Pháp lý</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-background/60">
              <li>Chính sách bảo mật</li>
              <li>Điều khoản sử dụng</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-outline-variant/20 pt-6 text-center text-xs text-on-background/50">
          © 2024 Peerlight AI. Mọi quyền được bảo lưu.
        </div>
      </footer>
    </main>
  );
}
