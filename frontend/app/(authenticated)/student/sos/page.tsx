"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  ShieldAlert,
  Clock,
  UserCheck,
  AlertTriangle,
  Send,
  Activity,
  Sparkles,
} from "lucide-react";

import {
  createStudentSosAlert,
  listStudentSosAlerts,
  SosAlert,
} from "@/lib/sos-api";
import {
  getStudentSupportPlan,
  SupportPlanSelectedAdult,
} from "@/lib/support-plan-api";

type SosState = "initial" | "loading" | "activated" | "error";

export default function StudentSosPage() {
  const [state, setState] = useState<SosState>("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [severity, setSeverity] = useState<"support" | "urgent">("urgent");
  const [note, setNote] = useState("");

  // Loaded states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SosAlert | null>(null);
  const [selectedAdults, setSelectedAdults] = useState<
    SupportPlanSelectedAdult[]
  >([]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load active alerts
        const alerts = await listStudentSosAlerts();
        const active = alerts.find(
          (alert) => alert.current_status !== "completed",
        );
        if (active) {
          setActiveAlert(active);
          setState("activated");
        }

        // Load targeted support plan to see selected adults
        const planRes = await getStudentSupportPlan();
        if (planRes?.plan?.selected_adults) {
          setSelectedAdults(planRes.plan.selected_adults);
        }
      } catch (err) {
        console.error("Error loading SOS data:", err);
      }
    }

    void loadInitialData();
  }, []);

  async function handleActivateSos() {
    setState("loading");
    setErrorMessage(null);
    try {
      const newAlert = await createStudentSosAlert({
        severity: severity,
        source: "student_dashboard",
        note: note.trim() || null,
      });
      setActiveAlert(newAlert);
      setState("activated");
    } catch {
      setErrorMessage(
        "Chưa gửi được SOS. Hãy thử lại hoặc nói trực tiếp với người lớn gần em.",
      );
      setState("error");
    }
  }

  // Helper to map status to beautiful step classes
  const getStepClass = (
    status: string,
    targetStatus: string,
    index: number,
    currentActiveIndex: number,
  ) => {
    if (status === targetStatus)
      return "bg-primary text-white border-primary ring-4 ring-primary/20 scale-110";
    if (index < currentActiveIndex)
      return "bg-emerald-500 text-white border-emerald-500";
    return "bg-outline-variant/10 text-on-background/40 border-outline-variant/30";
  };

  const statusWorkflow = ["sent", "received", "supporting", "completed"];
  const currentStatusIndex = activeAlert
    ? statusWorkflow.indexOf(activeAlert.current_status)
    : 0;

  // State 2: Activated & Tracking View
  if (state === "activated" && activeAlert) {
    return (
      <section className="mx-auto max-w-xl space-y-6 py-6 animate-fade-in">
        {/* Reassuring Banner */}
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-accent-violet/[0.04] p-6 text-center shadow-sm dark:bg-[#1a2244]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7457e8] to-[#9178ff] shadow-md shadow-primary/20">
            <CheckCircle size={32} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-primary dark:text-[#a084ff]">
            SOS đã được gửi
          </h1>
          <p className="mt-2 text-sm text-on-background/80">
            Người em tin đã được báo rồi. Họ sẽ liên hệ với em sớm nhất có thể.
          </p>
          <p className="mt-1 text-xs text-on-background/60">
            Em không cần làm gì thêm. Hãy ở nơi an toàn và chờ người lớn liên
            hệ.
          </p>
        </div>

        {/* Real-time Status Stepper */}
        <div className="rounded-3xl border border-outline-variant/35 bg-white p-6 shadow-sm dark:bg-[#1a2244]">
          <h2 className="text-sm font-semibold text-on-background flex items-center gap-2">
            <Activity className="text-primary" size={18} />
            Trạng thái tín hiệu
          </h2>

          <div className="mt-6 relative flex justify-between items-center px-4">
            {/* Background line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-outline-variant/20 -translate-y-1/2 z-0" />
            {/* Active background line */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(currentStatusIndex / (statusWorkflow.length - 1)) * 100}%`,
              }}
            />

            {[
              { id: "sent", label: "Đã gửi", icon: Send },
              { id: "received", label: "Đã nhận", icon: Clock },
              { id: "supporting", label: "Đang hỗ trợ", icon: UserCheck },
              { id: "completed", label: "Xong", icon: CheckCircle },
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeAlert.current_status === step.id;
              const isPassed = idx < currentStatusIndex;
              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 bg-white dark:bg-[#0f1530] ${getStepClass(activeAlert.current_status, step.id, idx, currentStatusIndex)}`}
                  >
                    <StepIcon size={18} />
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold ${isActive ? "text-primary dark:text-[#a084ff]" : isPassed ? "text-emerald-500" : "text-on-background/40"}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed action timeline of events */}
        <div className="rounded-3xl border border-outline-variant/35 bg-white p-6 shadow-sm dark:bg-[#1a2244]">
          <h2 className="text-sm font-semibold text-on-background flex items-center gap-2">
            <Sparkles className="text-primary" size={18} aria-hidden="true" />
            Nhật ký hỗ trợ từ thầy cô & phụ huynh
          </h2>

          <div className="mt-4 space-y-4">
            {activeAlert.status_events.length === 0 ? (
              <div className="rounded-2xl bg-outline-variant/5 p-4 text-center">
                <p className="text-sm text-on-background/60">
                  Tín hiệu đang chờ phản hồi từ người lớn.
                </p>
                <p className="mt-1 text-xs text-on-background/40">
                  Em hãy ở phòng học, giữ liên lạc hoặc tới văn phòng Đoàn
                  đội/phòng Y tế nhé.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/20 ml-2.5 pl-5 space-y-4">
                {activeAlert.status_events.map((event) => {
                  let roleName = "Đồng hành";
                  if (event.actor_role === "teacher") roleName = "Giáo viên";
                  if (event.actor_role === "parent") roleName = "Phụ huynh";
                  if (event.actor_role === "student") roleName = "Em";

                  let statusText = "Gửi tín hiệu SOS";
                  if (event.new_status === "received")
                    statusText = "Đã nhận tin";
                  if (event.new_status === "supporting")
                    statusText = "Bắt đầu hỗ trợ";
                  if (event.new_status === "completed")
                    statusText = "Hoàn thành hỗ trợ";

                  return (
                    <article key={event.id} className="relative group">
                      <div className="absolute -left-[27px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-white dark:ring-[#1a2244]" />
                      <div className="rounded-2xl border border-outline-variant/30 bg-primary/[0.02] p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-primary dark:text-[#a084ff]">
                            {roleName} · {statusText}
                          </span>
                          <span className="text-[10px] text-on-background/40">
                            {new Date(event.created_at).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        {event.note && (
                          <p className="mt-2 text-sm text-on-background/80 bg-white/50 p-2.5 rounded-xl dark:bg-black/10">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recipients list */}
        <div className="rounded-3xl border border-outline-variant/35 bg-white p-5 shadow-sm dark:bg-[#1a2244]">
          <h2 className="text-sm font-semibold text-on-background">
            Tín hiệu đang liên hệ trực tiếp tới:
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedAdults.length === 0 ? (
              <span className="rounded-2xl bg-outline-variant/10 px-4 py-2 text-xs font-semibold text-on-background/70">
                Tất cả Giáo viên & Phụ huynh được liên kết
              </span>
            ) : (
              selectedAdults.map((adult) => (
                <div
                  key={adult.id}
                  className="flex items-center gap-1.5 rounded-2xl bg-primary/5 border border-primary/10 px-4.5 py-2 text-xs font-semibold"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>
                    {adult.full_name} (
                    {adult.relationship_type === "teacher"
                      ? "Giáo viên"
                      : "Phụ huynh"}
                    )
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Immediate helper hotlines */}
        <div className="rounded-3xl border border-outline-variant/35 bg-white p-5 shadow-sm dark:bg-[#1a2244]">
          <h2 className="text-sm font-semibold text-on-background">
            Đường dây nóng khẩn cấp bên ngoài:
          </h2>
          <ul className="mt-3 space-y-1.5 text-xs text-on-background/70">
            <li>
              📞 <strong>Tổng đài Quốc gia Bảo vệ Trẻ em:</strong>{" "}
              <span className="text-primary font-bold">111</span> (Miễn phí)
            </li>
            <li>
              🚑 <strong>Cấp cứu y tế:</strong>{" "}
              <span className="text-primary font-bold">115</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Link
            href="/student"
            className="flex-1 inline-flex min-h-12 items-center justify-center rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2244] font-semibold text-on-background hover:bg-outline-variant/10 transition-all no-underline"
          >
            Quay về trang chính
          </Link>
          <button
            type="button"
            onClick={async () => {
              setIsPageLoading(true);
              try {
                const alerts = await listStudentSosAlerts();
                const active = alerts.find(
                  (alert) => alert.current_status !== "completed",
                );
                if (active) {
                  setActiveAlert(active);
                } else {
                  setActiveAlert(null);
                  setState("initial");
                }
              } catch (err) {
                console.error("Refresh failed:", err);
              } finally {
                setIsPageLoading(false);
              }
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-white hover:bg-primary/95 shadow-sm transition-all"
          >
            Cập nhật tiến trình
          </button>
        </div>
      </section>
    );
  }

  // State 1: Initial confirmation & creation view
  return (
    <section className="mx-auto max-w-lg space-y-6 py-6 animate-fade-in">
      <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
          <ShieldAlert
            size={32}
            className="text-error animate-bounce"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-4 text-lg font-bold text-on-background">
          Hỗ trợ khẩn cấp
        </h1>
        <p className="mt-2 text-sm text-on-background/70">
          Nếu em đang gặp nguy hiểm hoặc cần giúp đỡ ngay lập tức, hãy nhấn nút
          bên dưới.
        </p>
      </div>

      {/* NEW: Severity Selector (Highly useful feature upgrade!) */}
      <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-on-background">
          Mức độ hỗ trợ em đang cần:
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSeverity("urgent")}
            className={`flex flex-col p-4 text-left rounded-2xl border-2 transition-all ${
              severity === "urgent"
                ? "border-error bg-error/[0.02]"
                : "border-outline-variant/30 hover:border-outline-variant/60"
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-sm text-error">
              <AlertTriangle size={16} /> Nguy cấp
            </span>
            <span className="mt-1 text-[11px] text-on-background/60 leading-tight">
              Em đang không an toàn hoặc gặp nguy hiểm nghiêm trọng lúc này.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSeverity("support")}
            className={`flex flex-col p-4 text-left rounded-2xl border-2 transition-all ${
              severity === "support"
                ? "border-primary bg-primary/[0.02]"
                : "border-outline-variant/30 hover:border-outline-variant/60"
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-sm text-primary dark:text-[#a084ff]">
              <Clock size={16} /> Cần kết nối sớm
            </span>
            <span className="mt-1 text-[11px] text-on-background/60 leading-tight">
              Em an toàn nhưng cần người em tin liên hệ chia sẻ trong thời gian
              sớm nhất.
            </span>
          </button>
        </div>
      </div>

      {/* NEW: Optional message text area (Highly useful feature upgrade!) */}
      <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-on-background">
          Ghi chú thêm (Không bắt buộc)
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="Ví dụ: Em đang ở phòng y tế; em cần chia sẻ một chút; thầy cuộc gọi cho em..."
          className="w-full min-h-24 rounded-2xl border border-outline-variant/40 bg-transparent p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black/5"
        />
        <div className="flex justify-between text-[11px] text-on-background/40">
          <span>Lưu ý: Không cần giải thích nếu chưa sẵn sàng</span>
          <span>{note.length}/500 ký tự</span>
        </div>
      </div>

      {/* List who will be notified */}
      <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-on-background">
          Khi em nhấn gửi SOS:
        </h2>
        <ul className="mt-3.5 space-y-2 text-xs text-on-background/70">
          <li>• Người em tin sẽ được thông báo ngay lập tức</li>
          <li>• Họ sẽ nhận được tín hiệu rằng em cần hỗ trợ khẩn cấp</li>
          <li>• Em không cần giải thích gì thêm nếu chưa sẵn sàng</li>
          <li>• Thông tin cá nhân của em được bảo mật</li>
        </ul>
        {selectedAdults.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-outline-variant/20">
            <p className="text-[11px] font-semibold text-on-background/50">
              Tín hiệu sẽ được gửi tới danh sách đã chọn:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedAdults.map((adult) => (
                <span
                  key={adult.id}
                  className="inline-flex items-center gap-1 rounded-xl bg-outline-variant/15 px-3 py-1 text-[10px] font-bold text-on-background/70"
                >
                  🧑‍🤝‍🧑 {adult.full_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-2xl bg-error-container p-4 text-sm text-error"
        >
          {errorMessage}
        </p>
      )}

      <div className="space-y-4 text-center">
        <button
          type="button"
          onClick={() => void handleActivateSos()}
          disabled={state === "loading"}
          className="min-h-14 w-full rounded-2xl bg-error px-6 text-lg font-bold text-on-error shadow-md hover:bg-error/90 disabled:opacity-60 transition-all active:scale-[0.98]"
        >
          {state === "loading" ? "Đang gửi..." : "Đúng, em cần giúp ngay"}
        </button>
        <Link
          href="/student"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary no-underline hover:underline"
        >
          ← Quay lại
        </Link>
      </div>
    </section>
  );
}
