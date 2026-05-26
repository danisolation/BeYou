import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import PrivacyPage from "@/app/privacy/page";
import { DemoBadge } from "@/components/demo-badge";
import { DemoBanner } from "@/components/demo-banner";
import { apiFetch } from "@/lib/api";
import { roleToRoute } from "@/lib/routes";

const push = vi.fn();
const searchParams = new URLSearchParams("next=/student");
const demoCapabilities = {
  demo_login_enabled: true,
  public_demo_entry_enabled: true,
  email_password_enabled: true,
  provider_login_enabled: false,
  provider_label: null,
  provider_mode: null,
  production_pilot: false,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

describe("Phase 2 frontend auth foundation", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("maps roles to backend dashboard routes exactly", () => {
    expect(roleToRoute).toEqual({
      student: "/student",
      teacher: "/teacher",
      parent: "/parent",
      admin: "/admin",
    });
  });

  it("apiFetch includes credentials and does not write browser token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("renders exact demo banner and badge copy", () => {
    render(
      <>
        <DemoBanner />
        <DemoBadge />
      </>,
    );

    expect(screen.getByText("Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("keeps login submit available so browser autofill can submit credentials", async () => {
    render(<LoginPage />);

    const submit = screen.getByRole("button", { name: "Đăng nhập" });
    expect(screen.getByText("Chào mừng đến với Peerlight AI")).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập để vào không gian hỗ trợ phù hợp với vai trò của bạn.")).toBeInTheDocument();
    expect(submit).toBeEnabled();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Mật khẩu")).toBeRequired();

    await userEvent.type(screen.getByLabelText("Email"), "student.demo@beyou.local");
    expect(submit).toBeEnabled();
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "BeYouDemo!2026");
    expect(submit).toBeEnabled();
  });

  it("renders public demo entry with one-step role options", () => {
    render(<HomePage />);

    expect(screen.getByText("Peerlight AI demo live")).toBeInTheDocument();
    expect(screen.getByText("Không gian hỗ trợ học sinh THPT trước khi căng thẳng leo thang.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vào vai Học sinh/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vào vai Giáo viên/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vào vai Phụ huynh/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vào vai Quản trị/ })).toBeInTheDocument();
    expect(screen.getByText(/Không nhập dữ liệu học sinh thật trong bản giới thiệu\./)).toBeInTheDocument();
  });

  it("fills demo credentials from role shortcuts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(demoCapabilities), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "Học sinh" }));

    expect(screen.getByLabelText("Email")).toHaveValue("student.demo@beyou.local");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("BeYouDemo!2026");
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });

  it("hides demo role shortcuts when production pilot capabilities disable public demo entry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ...demoCapabilities,
            demo_login_enabled: false,
            public_demo_entry_enabled: false,
            provider_login_enabled: false,
            production_pilot: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Demo công khai đang tắt cho production pilot. Hãy dùng tài khoản được cấp bởi quản trị viên."),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Nhà cung cấp đăng nhập ngoài chưa bật cho pilot.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Học sinh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giáo viên" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phụ huynh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quản trị" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });

  it("keeps privacy acknowledgement button disabled until checkbox is checked", async () => {
    render(<PrivacyPage />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Em đã đọc và hiểu ai có thể xem thông tin của em.",
    });
    const continueButton = screen.getByRole("button", { name: "Tiếp tục vào Peerlight AI" });

    expect(continueButton).toBeDisabled();
    await userEvent.click(checkbox);
    expect(continueButton).toBeEnabled();
  });
});
