import { describe, expect, it, vi } from "vitest";

import { getAuthCapabilities, login } from "@/lib/auth";

describe("token storage regression", () => {
  it("does not write auth tokens to localStorage or sessionStorage", async () => {
    const storageSetItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "student-1",
          email: "student.demo@beyou.local",
          role: "student",
          status: "active",
          full_name: "Nguyễn An Demo",
          is_demo: true,
          privacy_acknowledgement_required: false,
          dashboard_route: "/student",
          notice_version: "2026-05-20",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await login("student.demo@beyou.local", "BeYouDemo!2026");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/login",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(storageSetItemSpy).not.toHaveBeenCalledWith(expect.stringMatching(/token|session/i), expect.anything());
    expect(storageSetItemSpy).not.toHaveBeenCalled();
  });

  it("reads auth capabilities through cookie fetch without browser token storage", async () => {
    const storageSetItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          demo_login_enabled: false,
          public_demo_entry_enabled: false,
          email_password_enabled: true,
          provider_login_enabled: false,
          provider_label: null,
          provider_mode: null,
          production_pilot: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getAuthCapabilities();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/capabilities",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(storageSetItemSpy).not.toHaveBeenCalledWith(expect.stringMatching(/token|session/i), expect.anything());
    expect(storageSetItemSpy).not.toHaveBeenCalled();
  });
});
