"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Brain,
  NotebookPen,
  MessagesSquare,
  HeartHandshake,
  Bot,
  Trophy,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";

interface ProfileData {
  full_name?: string;
}

const heroStats = [
  {
    icon: "😊",
    value: "22.450+",
    label: "Học sinh tin tưởng",
    tone: "text-[#46ad9a]",
  },
  {
    icon: "💬",
    value: "1.250+",
    label: "Câu chuyện được chia sẻ",
    tone: "text-[#5b88dc]",
  },
  {
    icon: "👍",
    value: "85%",
    label: "Cảm thấy tốt hơn mỗi ngày",
    tone: "text-[#e8669c]",
  },
];

const quickActions = [
  {
    title: "Khám phá cảm xúc",
    description: "Nhận diện và hiểu rõ cảm xúc của bạn",
    image: "/images/Phương tiện truyền thông (8).jpg",
    cta: "Khám phá ngay",
    href: "/student/self-checks",
    icon: Brain,
  },
  {
    title: "Nhật ký cảm xúc",
    description: "Ghi lại cảm xúc mỗi ngày và nhìn lại bản thân",
    image: "/images/Phương tiện truyền thông (6).jpg",
    cta: "Viết nhật ký",
    href: "/student/mood-check-ins",
    icon: NotebookPen,
  },
  {
    title: "Tập xử lý tình huống",
    description: "Rèn luyện kỹ năng ứng phó với áp lực",
    image: "/images/Phương tiện truyền thông (7).jpg",
    cta: "Luyện tập ngay",
    href: "/student/scenarios",
    icon: MessagesSquare,
  },
  {
    title: "Người em tin",
    description: "Kết nối với người bạn tin tưởng để được hỗ trợ",
    image: "/images/Phương tiện truyền thông (12).jpg",
    cta: "Kết nối ngay",
    href: "/student/support-plan",
    icon: HeartHandshake,
  },
];

const moods = [
  { emoji: "😄", label: "Rất tốt" },
  { emoji: "🙂", label: "Tốt" },
  { emoji: "😐", label: "Bình thường" },
  { emoji: "😟", label: "Không vui" },
  { emoji: "😡", label: "Rất tệ" },
];

const chatSuggestions = [
  "Làm sao để vượt qua áp lực học tập?",
  "Tôi bị so sánh với bạn bè, phải làm sao?",
  "Làm sao để tự tin hơn?",
  "Tôi cảm thấy cô đơn, ai có thể giúp tôi?",
];

const todayPlan = [
  {
    title: "Gọi tên cảm xúc",
    description: "Dành 1 phút check-in để hiểu mình đang cần gì.",
    href: "/student/mood-check-ins",
    icon: NotebookPen,
  },
  {
    title: "Nếu đang áp lực",
    description: "Thử một bài khám phá cảm xúc ngắn, không phải chẩn đoán.",
    href: "/student/self-checks",
    icon: Brain,
  },
  {
    title: "Cần nói với ai đó",
    description: "Peerlight AI có thể lắng nghe và gợi ý bước an toàn tiếp theo.",
    href: "/student/chat",
    icon: Bot,
  },
];

export default function StudentDashboardPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<ProfileData>("/api/student/profile")
      .then((data) => {
        setName(data.full_name || "bạn");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  if (loading) return <DashboardSkeleton cards={4} />;
  if (error)
    return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="hero-gradient soft-card animate-fade-in relative overflow-hidden rounded-[20px] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl flex-1">
            <h1 className="text-2xl font-bold text-[#17204c] sm:text-3xl">
              {greeting}, {name}! 👋
            </h1>
            <p className="mt-2 text-sm text-[#33416b] sm:text-base">
              Bạn không đơn độc đâu! Peerlight AI luôn ở đây để lắng nghe, đồng
              hành và giúp bạn tỏa sáng.
            </p>
            <Link
              href="/student/chat"
              className="btn-press cta-gradient mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
            >
              Trò chuyện cùng AI <Bot size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="hidden md:block w-full md:w-[260px] shrink-0">
            <img
              src="/images/Phương tiện truyền thông (13).jpg"
              alt="Peerlight AI Robot đồng hành"
              className="w-full h-auto max-h-[140px] rounded-2xl object-cover shadow-sm bg-white/40 border border-white/60"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-accent-violet/30 blur-2xl"
        />

        {/* Stats bar */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur"
            >
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <div className="min-w-0">
                <strong className={`block text-base ${stat.tone}`}>
                  {stat.value}
                </strong>
                <small className="text-xs text-[#6d7394]">{stat.label}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Gợi ý hôm nay</p>
          <h2 className="mt-1 text-lg font-bold text-on-background">Bắt đầu nhẹ nhàng, không cần hoàn hảo</h2>
          <p className="mt-1 text-sm text-on-background/60">Chọn một bước nhỏ phù hợp với cảm giác hiện tại của bạn.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {todayPlan.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group rounded-2xl border border-outline-variant/30 bg-surface p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-[#20284b]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-on-background">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-on-background/60">{item.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">Bắt đầu <ArrowRight size={13} aria-hidden="true" /></span>
                </Link>
              );
            })}
          </div>
        </div>
        <aside className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <div className="flex items-center gap-2 text-sm font-bold text-on-background">
            <ShieldCheck size={17} className="text-primary" aria-hidden="true" />
            Điều bạn kiểm soát
          </div>
          <ul className="mt-4 space-y-3 text-sm text-on-background/65">
            <li>• Bạn có thể viết ngắn, bỏ qua hoặc quay lại sau.</li>
            <li>• Check-in không tự động tạo SOS.</li>
            <li>• Nếu thấy không an toàn, hãy dùng SOS hoặc tìm người lớn tin cậy gần bạn.</li>
          </ul>
        </aside>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <article
              key={action.title}
              className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-4 dark:bg-[#1a2244]"
            >
              <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
                <Icon size={18} className="text-primary" aria-hidden="true" />
                {action.title}
              </h3>
              <p className="mt-1 min-h-[36px] text-sm text-on-background/60">
                {action.description}
              </p>
              <div className="my-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#f7fbff] to-[#f9f0ff] dark:from-[#1f2a4d] dark:to-[#241f44] aspect-video relative flex items-center justify-center">
                <img
                  src={action.image}
                  alt={action.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <Link
                href={action.href}
                className="btn-press cta-gradient inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
              >
                {action.cta} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </section>

      {/* Mood + pressure + challenge */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Mood */}
        <article className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="text-base font-semibold text-on-background">
            Hôm nay bạn cảm thấy thế nào?
          </h3>
          <div className="mt-4 flex items-end justify-between gap-2">
            {moods.map((mood, index) => {
              const selected = selectedMood === index;
              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setSelectedMood(index)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1.5 py-1 text-xs transition-all ${
                    selected
                      ? "-translate-y-1 font-semibold text-primary"
                      : "text-on-background/60 hover:-translate-y-0.5"
                  }`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {mood.emoji}
                  </span>
                  {mood.label}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-on-background/50">
            {selectedMood === null
              ? "Chọn cảm xúc của bạn để Peerlight AI hiểu bạn hơn nhé!"
              : "Cảm ơn bạn đã chia sẻ. Ghi vào nhật ký để theo dõi xu hướng nhé."}
          </p>
          <Link
            href="/student/mood-check-ins"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary no-underline hover:underline"
          >
            Ghi vào nhật ký cảm xúc <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>

        {/* Pressure chart */}
        <article className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-on-background">
              Mức độ áp lực (tuần này)
            </h3>
            <span className="rounded-lg bg-primary px-2 py-1 text-[10px] font-semibold text-on-primary">
              Trung bình
            </span>
          </div>
          <div className="mt-4 h-28">
            <svg
              viewBox="0 0 360 130"
              preserveAspectRatio="none"
              className="h-full w-full"
              role="img"
              aria-label="Biểu đồ minh hoạ mức độ áp lực trong tuần"
            >
              <path d="M0 100H360" stroke="#dde3f5" strokeWidth="1" />
              <path
                d="M0,100 C35,105 46,92 72,88 S118,96 142,78 S169,26 194,60 S235,86 258,63 S302,42 360,75"
                fill="none"
                stroke="#7457e8"
                strokeWidth="4"
              />
              <g fill="#fff" stroke="#7457e8" strokeWidth="3">
                <circle cx="72" cy="88" r="5" />
                <circle cx="142" cy="78" r="5" />
                <circle cx="194" cy="60" r="5" />
                <circle cx="258" cy="63" r="5" />
                <circle cx="330" cy="66" r="5" />
              </g>
            </svg>
          </div>
          <p className="mt-2 text-xs text-on-background/50">
            Biểu đồ minh hoạ — ghi nhật ký mỗi ngày để theo dõi xu hướng thật
            của bạn.
          </p>
        </article>

        {/* Challenge */}
        <article className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="text-base font-semibold text-on-background">
            Thử thách hôm nay
          </h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#fff3d9] to-[#ffe0ef]">
              <Trophy className="text-[#e8a13a]" size={32} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <strong className="text-sm text-on-background">
                Thử thách 7 ngày
              </strong>
              <p className="text-xs text-on-background/55">
                Yêu thương bản thân · Ngày 2/7
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-outline-variant/30">
                <span className="block h-full w-[28%] rounded-full bg-gradient-to-r from-primary to-accent-blue" />
              </div>
            </div>
          </div>
          <Link
            href="/student/mood-check-ins"
            className="btn-press cta-gradient mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Tham gia ngay <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>

      {/* AI chat panel */}
      <section className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
        <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
          <span
            className="brand-gradient grid h-11 w-11 place-items-center rounded-xl text-xl"
            aria-hidden="true"
          >
            🤖
          </span>
          <div>
            <h3 className="text-base font-semibold text-on-background">
              Trò chuyện cùng Peerlight AI
            </h3>
            <p className="text-xs text-on-background/55">
              AI luôn sẵn sàng lắng nghe bạn 24/7
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="text-2xl" aria-hidden="true">
            🤖
          </span>
          <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-background/80 dark:bg-[#222a4d]">
            Xin chào! 👋 Mình là Peerlight AI. Bạn đang cảm thấy thế nào hôm
            nay?
          </p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {chatSuggestions.map((suggestion) => (
            <Link
              key={suggestion}
              href="/student/chat"
              className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2.5 text-left text-sm text-on-background/70 no-underline transition-colors hover:border-primary hover:text-primary dark:bg-[#1a2244]"
            >
              {suggestion}
            </Link>
          ))}
        </div>
        <Link
          href="/student/chat"
          className="btn-press cta-gradient mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
        >
          Mở cuộc trò chuyện <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      {/* Banner */}
      <section className="soft-card relative overflow-hidden rounded-[20px] p-6 text-center text-white min-h-[140px] flex flex-col justify-center items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/Phương tiện truyền thông (9).jpg"
            alt="Mỗi bước nhỏ"
            className="w-full h-full object-cover opacity-80 brightness-50 dark:opacity-60 dark:brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#7457e8]/30 via-[#1a2244]/55 to-[#0f1530]/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Sparkles
            size={24}
            className="text-[#85e9f1] animate-pulse"
            aria-hidden="true"
          />
          <strong className="text-sm sm:text-base font-bold drop-shadow-md tracking-wide text-white">
            Mỗi bước nhỏ hôm nay là một phiên bản tốt hơn của chính bạn ngày
            mai.
          </strong>
          <span className="text-xl drop-shadow-md" aria-hidden="true">
            🙌
          </span>
        </div>
      </section>
    </div>
  );
}
