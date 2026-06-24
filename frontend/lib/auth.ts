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

export type AuthCapabilities = {
  demo_login_enabled: boolean;
  public_demo_entry_enabled: boolean;
  email_password_enabled: boolean;
  provider_login_enabled: boolean;
  provider_label: string | null;
  provider_mode: string | null;
  production_pilot: boolean;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "teacher" | "parent";
  school?: string;
  class_name?: string;
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

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me");
}

export async function getAuthCapabilities(): Promise<AuthCapabilities> {
  return apiFetch<AuthCapabilities>("/api/auth/capabilities");
}

export function googleLoginStartUrl(nextPath = "/"): string {
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const path = `/api/auth/google/start?next=${encodeURIComponent(safeNext)}`;
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return path;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  return `${baseUrl}${path}`;
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

export function registerErrorCopy(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.";
    if (error.status === 400) {
      const detail = (error.detail as { detail?: string })?.detail ?? "";
      if (detail) return detail;
    }
  }
  return "Đăng ký thất bại. Vui lòng thử lại sau.";
}
