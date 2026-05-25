import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import AdminReportsPage from "@/app/(authenticated)/admin/reports/page";
import { getAdminAggregateReport } from "@/lib/admin-reports-api";

const sampleReport = {
  generated_at: "2026-05-21T00:00:00Z",
  demo_scope: "all",
  suppression_threshold: 3,
  privacy_notes: [
    "Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư. Trang này không hiển thị câu trả lời test tâm lý, tin nhắn chatbot, ghi chú SOS hay danh sách học sinh theo nguy cơ.",
    "Các nhóm nhạy cảm có ít hơn 3 bản ghi sẽ được ẩn để tránh nhận diện gián tiếp.",
    "Dùng báo cáo để cải thiện hỗ trợ chung, không dùng để xếp hạng hoặc giám sát từng học sinh.",
  ],
  user_counts: {
    total: 8,
    by_role: [
      { key: "student", label: "Học sinh", count: 5 },
      { key: "teacher", label: "Giáo viên", count: 1 },
    ],
    by_status: [{ key: "active", label: "Đang hoạt động", count: 8 }],
    by_demo_status: [
      { key: "demo", label: "Dữ liệu demo", count: 1 },
      { key: "real", label: "Dữ liệu thật", count: 7 },
    ],
  },
  linked_students: {
    linked_students: 2,
    total_active_links: 2,
    by_relationship: [{ key: "teacher", label: "Giáo viên hỗ trợ", count: 1 }],
  },
  self_check_usage: {
    total_completed: { key: "self_check_completed", label: "Lượt test tâm lý", count: 5, suppressed: false },
    by_test: [
      { key: "Sức khỏe cảm xúc", label: "Sức khỏe cảm xúc", count: 3, suppressed: false },
      { key: "Áp lực bạn bè", label: "Áp lực bạn bè", count: null, suppressed: true },
    ],
    risk_distribution: [
      { key: "Can chu y", label: "Can chu y", count: 4, suppressed: false },
      { key: "Can ho tro som", label: "Can ho tro som", count: null, suppressed: true },
    ],
  },
  sos_counts: {
    total_alerts: { key: "sos_alerts", label: "Tín hiệu SOS", count: 4, suppressed: false },
    by_status: [
      { key: "sent", label: "Đã gửi", count: 3, suppressed: false },
      { key: "supporting", label: "Đang hỗ trợ", count: null, suppressed: true },
    ],
    by_severity: [{ key: "urgent", label: "Không an toàn ngay lúc này", count: 4, suppressed: false }],
    by_source: [{ key: "student_dashboard", label: "Từ bảng điều khiển học sinh", count: 4, suppressed: false }],
  },
  scenario_usage: {
    total_completed: { key: "scenario_attempts", label: "Lượt luyện tình huống", count: 4, suppressed: false },
    popular_scenarios: [
      { key: "Rủ rê sau giờ học", label: "Rủ rê sau giờ học", count: 3, suppressed: false },
      { key: "Áp lực điểm số", label: "Áp lực điểm số", count: null, suppressed: true },
    ],
  },
  chatbot_safety: {
    high_risk_signals: {
      key: "high_risk_signals",
      label: "Tín hiệu chatbot cần ưu tiên an toàn",
      count: null,
      suppressed: true,
    },
    sos_suggested_signals: {
      key: "sos_suggested_signals",
      label: "Tín hiệu chatbot gợi ý SOS/người lớn tin tưởng",
      count: null,
      suppressed: true,
    },
    by_stage: [{ key: "input", label: "Tín hiệu từ chia sẻ của học sinh", count: null, suppressed: true }],
  },
};

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const parsed = new URL(url);
    const key = `${parsed.pathname}${parsed.search}`;
    const body = responses[key] ?? responses[parsed.pathname];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: body === undefined ? 404 : 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 6 admin aggregate reports UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses cookie-authenticated aggregate report helper with demo scope and no token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({ "/api/admin/reports/aggregate?demo_scope=demo": { ...sampleReport, demo_scope: "demo" } });

    await getAdminAggregateReport("demo");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/reports/aggregate?demo_scope=demo",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("adds privacy report card to the admin dashboard", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "admin-1" }],
      "/api/admin/links": [],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByRole("link", { name: /Báo cáo tổng hợp riêng tư/ })).toHaveAttribute(
      "href",
      "/admin/reports",
    );
    expect(screen.getByText("Xem xu hướng tổng hợp đã ẩn nhóm nhỏ, không xuất dữ liệu thô hoặc danh sách nguy cơ.")).toBeInTheDocument();
  });

  it("renders aggregate counts, suppression, privacy notes, and no raw export or drilldown", async () => {
    mockFetch({ "/api/admin/reports/aggregate?demo_scope=all": sampleReport });

    render(<AdminReportsPage />);

    expect(await screen.findByText("Báo cáo tổng hợp riêng tư")).toBeInTheDocument();
    expect(screen.getByText(/Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư/)).toBeInTheDocument();
    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
    expect(screen.getByText("Sức khỏe cảm xúc")).toBeInTheDocument();
    expect(screen.getAllByText("Đã ẩn để bảo vệ riêng tư (<3)").length).toBeGreaterThan(0);
    expect(screen.getByText("Không có xuất dữ liệu thô, không có danh sách học sinh theo nguy cơ.")).toBeInTheDocument();
    expect(screen.queryByText(/RAW_|email|answer_text|transcript|message_content/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xuất|Tải xuống|Export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chi tiết học sinh|xếp hạng/i })).not.toBeInTheDocument();
  });

  it("reloads report when admin switches demo scope", async () => {
    const fetchMock = mockFetch({
      "/api/admin/reports/aggregate?demo_scope=all": sampleReport,
      "/api/admin/reports/aggregate?demo_scope=demo": { ...sampleReport, demo_scope: "demo" },
    });

    render(<AdminReportsPage />);
    await screen.findByText("Báo cáo tổng hợp riêng tư");

    await userEvent.selectOptions(screen.getByLabelText("Phạm vi dữ liệu"), "demo");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/reports/aggregate?demo_scope=demo",
        expect.objectContaining({ credentials: "include" }),
      ),
    );
  });
});
