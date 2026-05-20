import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import PrivacyPage from "@/app/privacy/page";
import { DemoBadge } from "@/components/demo-badge";
import { DemoBanner } from "@/components/demo-banner";
import { apiFetch } from "@/lib/api";
import { roleToRoute } from "@/lib/routes";

const push = vi.fn();
const searchParams = new URLSearchParams("next=/student");

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

  it("keeps login submit disabled until email and password are present", async () => {
    render(<LoginPage />);

    const submit = screen.getByRole("button", { name: "Đăng nhập" });
    expect(screen.getByText("Chào mừng đến với BeYou")).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập để vào không gian hỗ trợ phù hợp với vai trò của bạn.")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Email"), "student.demo@beyou.local");
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "BeYouDemo!2026");
    expect(submit).toBeEnabled();
  });

  it("keeps privacy acknowledgement button disabled until checkbox is checked", async () => {
    render(<PrivacyPage />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Em đã đọc và hiểu ai có thể xem thông tin của em.",
    });
    const continueButton = screen.getByRole("button", { name: "Tiếp tục vào BeYou" });

    expect(continueButton).toBeDisabled();
    await userEvent.click(checkbox);
    expect(continueButton).toBeEnabled();
  });
});
