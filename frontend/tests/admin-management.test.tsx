import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLinksPage from "@/app/(authenticated)/admin/links/page";
import AdminUsersPage from "@/app/(authenticated)/admin/users/page";
import { DestructiveConfirmDialog, REVOKE_LINK_COPY } from "@/components/admin/destructive-confirm-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { UserForm } from "@/components/admin/user-form";
import { AdminLink, AdminUser } from "@/lib/admin-api";

const users: AdminUser[] = [
  {
    id: "student-1",
    email: "student.demo@beyou.local",
    role: "student",
    status: "active",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
    is_demo: true,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "teacher-1",
    email: "teacher.demo@beyou.local",
    role: "teacher",
    status: "active",
    full_name: "Cô Bình Demo",
    school: null,
    class_name: null,
    is_demo: true,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "parent-1",
    email: "parent.demo@beyou.local",
    role: "parent",
    status: "active",
    full_name: "Phụ huynh Chi Demo",
    school: null,
    class_name: null,
    is_demo: true,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "admin-1",
    email: "admin.demo@beyou.local",
    role: "admin",
    status: "active",
    full_name: "Quản trị Demo",
    school: null,
    class_name: null,
    is_demo: false,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
];

const links: AdminLink[] = [
  {
    id: "link-1",
    student_id: "student-1",
    student_full_name: "Nguyễn An Demo",
    student_email: "student.demo@beyou.local",
    student_school: "Trường THPT BeYou Demo",
    student_class_name: "10A1",
    adult_id: "teacher-1",
    adult_full_name: "Cô Bình Demo",
    adult_email: "teacher.demo@beyou.local",
    adult_role: "teacher",
    relationship_type: "teacher",
    status: "active",
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
    revoked_at: null,
    is_demo: true,
  },
];

function mockAdminFetch() {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    if (path === "/api/admin/users" && method === "GET") {
      return Promise.resolve(jsonResponse(users));
    }
    if (path === "/api/admin/links" && method === "GET") {
      return Promise.resolve(jsonResponse(links));
    }
    if (path === "/api/admin/users" && method === "POST") {
      return Promise.resolve(jsonResponse(users[0], 201));
    }
    if (path.startsWith("/api/admin/users/") && method === "PATCH") {
      return Promise.resolve(jsonResponse(users[0]));
    }
    if (path.startsWith("/api/admin/users/") && method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (path === "/api/admin/links" && method === "POST") {
      return Promise.resolve(jsonResponse(links[0], 201));
    }
    if (path.startsWith("/api/admin/links/") && method === "PATCH") {
      return Promise.resolve(jsonResponse({ ...links[0], status: "revoked" }));
    }
    return Promise.resolve(jsonResponse({ detail: "missing" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin management UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates student creation requires school and class", async () => {
    const onSubmit = vi.fn();
    render(<UserForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Họ tên"), "Học sinh mới");
    await userEvent.type(screen.getByLabelText("Email"), "new.student@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "Secret123!");
    await userEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(await screen.findByText("Tài khoản học sinh cần có trường và lớp.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders user management copy and hides demo physical delete for non-demo users", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const path = new URL(url).pathname;
        if (path === "/api/admin/users") {
          return Promise.resolve(jsonResponse([users[3]]));
        }
        return Promise.resolve(jsonResponse([]));
      }),
    );

    render(<AdminUsersPage />);

    expect(await screen.findByText("Quản lý tài khoản")).toBeInTheDocument();
    // Role selector is present with Vietnamese options
    expect(screen.getByRole("option", { name: "Học sinh" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Giáo viên" })).toBeInTheDocument();
    // Demo delete button not shown for non-demo user
    expect(screen.queryByText(/Xóa demo/)).not.toBeInTheDocument();
  });

  it("shows exact destructive confirmation strings", () => {
    render(
      <DestructiveConfirmDialog
        open
        message="Xóa tài khoản demo này? Chỉ dùng thao tác này cho dữ liệu demo, không dùng cho hồ sơ học sinh thật."
        cancelLabel="Giữ tài khoản demo"
        confirmLabel="Xóa tài khoản demo"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Xóa tài khoản demo này? Chỉ dùng thao tác này cho dữ liệu demo, không dùng cho hồ sơ học sinh thật.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giữ tài khoản demo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa tài khoản demo" })).toBeInTheDocument();
  });

  it("link form adult selector excludes student and admin roles", () => {
    render(<LinkForm users={users} onSubmit={vi.fn()} />);

    const adultSelect = screen.getByLabelText("Người lớn hỗ trợ");
    expect(within(adultSelect).queryByRole("option", { name: /Nguyễn An Demo/ })).not.toBeInTheDocument();
    expect(within(adultSelect).getByRole("option", { name: /Cô Bình Demo/ })).toBeInTheDocument();
    expect(within(adultSelect).getByRole("option", { name: /Phụ huynh Chi Demo/ })).toBeInTheDocument();
    expect(within(adultSelect).queryByRole("option", { name: /Quản trị Demo/ })).not.toBeInTheDocument();
  });

  it("renders link management copy and revoke confirmation", async () => {
    mockAdminFetch();
    render(<AdminLinksPage />);

    expect(await screen.findByText("Liên kết hỗ trợ")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: /Thu hồi/ }));

    expect(screen.getByText(REVOKE_LINK_COPY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giữ liên kết" })).toBeInTheDocument();
  });

  it("admin API client uses credentialed fetch for mutations through pages", async () => {
    const fetchMock = mockAdminFetch();
    render(<AdminLinksPage />);

    await screen.findByText("Liên kết hỗ trợ");
    // Open the create form (first button with that name)
    const createButtons = screen.getAllByRole("button", { name: /Tạo liên kết/ });
    await userEvent.click(createButtons[0]);
    await screen.findByRole("option", { name: /Nguyễn An Demo/ });
    await screen.findByRole("option", { name: /Cô Bình Demo/ });
    await userEvent.selectOptions(screen.getByLabelText("Học sinh"), "student-1");
    await userEvent.selectOptions(screen.getByLabelText("Người lớn hỗ trợ"), "teacher-1");
    // Submit form (the second/submit button)
    const submitButtons = screen.getAllByRole("button", { name: /Tạo liên kết/ });
    await userEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/links",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      ),
    );
  });
});
