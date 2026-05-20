import { apiFetch, ApiError } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  status: string;
  full_name: string;
  is_demo: boolean;
  privacy_acknowledgement_required: boolean;
  dashboard_route: string;
  notice_version: string;
};

export const INVALID_LOGIN_COPY = "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập.";
export const DISABLED_ACCOUNT_COPY =
  "Tài khoản này đang bị tạm khóa. Hãy liên hệ quản trị viên hoặc người phụ trách demo.";

export async function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me");
}

export async function acknowledgePrivacy(): Promise<void> {
  await apiFetch("/api/privacy/acknowledgements", { method: "POST" });
}

export function loginErrorCopy(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return DISABLED_ACCOUNT_COPY;
  }
  return INVALID_LOGIN_COPY;
}
