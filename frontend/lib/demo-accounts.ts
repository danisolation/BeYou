export const DEMO_PASSWORD = "BeYouDemo!2026";

export type DemoRole = "student" | "teacher" | "parent" | "admin";

export const demoAccounts: Array<{
  role: DemoRole;
  label: string;
  email: string;
  route: string;
  summary: string;
}> = [
  {
    role: "admin",
    label: "Quản trị",
    email: "admin.demo@beyou.local",
    route: "/admin",
    summary: "Quản lý nội dung, tài khoản, báo cáo tổng hợp và vận hành metadata-only.",
  },
];
