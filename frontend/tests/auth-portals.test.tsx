import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import PrivacyPage from "@/app/privacy/page";
import { apiFetch } from "@/lib/api";
import { roleToRoute } from "@/lib/routes";

// Mock IntersectionObserver for ScrollReveal component
vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

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


  it("keeps login submit available so browser autofill can submit credentials", async () => {
    render(<LoginPage />);

    const submit = screen.getByRole("button", { name: "Đăng nhập" });
    expect(screen.getByText("Chào mừng đến với Peerlight AI. Đăng nhập để tiếp tục.")).toBeInTheDocument();
    expect(submit).toBeEnabled();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Mật khẩu")).toBeRequired();

    await userEvent.type(screen.getByLabelText("Email"), "student.demo@beyou.local");
    expect(submit).toBeEnabled();
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "BeYouDemo!2026");
    expect(submit).toBeEnabled();
  });

  it("renders production landing page with CTA", () => {
    render(<HomePage />);

    expect(screen.getByText("Sẵn sàng bắt đầu?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Đăng nhập ngay/ })).toBeInTheDocument();
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

    await userEvent.click(await screen.findByRole("button", { name: "Học sinh" }));

    expect(screen.getByLabelText("Email")).toHaveValue("student.demo@beyou.local");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("BeYouDemo!2026");
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });

  it("keeps demo role shortcuts hidden until capabilities are known", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("capabilities unavailable")));

    render(<LoginPage />);

    expect(screen.getByText("Đang kiểm tra cấu hình hệ thống...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Học sinh" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText("Chưa xác minh được cấu hình. Hãy đăng nhập bằng email và mật khẩu được cấp."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Học sinh" })).not.toBeInTheDocument();
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
        screen.getByText("Tài khoản truy cập nhanh hiện không khả dụng. Hãy dùng tài khoản được cấp bởi quản trị viên."),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Đăng nhập bên ngoài chưa được kích hoạt.")).toBeInTheDocument();
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
