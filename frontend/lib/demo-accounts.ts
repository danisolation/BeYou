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
    role: "student",
    label: "Học sinh",
    email: "student.demo@beyou.local",
    route: "/student",
    summary: "Trải nghiệm check-in, tự kiểm tra, chatbot, kế hoạch hỗ trợ và SOS.",
  },
  {
    role: "teacher",
    label: "Giáo viên",
    email: "teacher.demo@beyou.local",
    route: "/teacher",
    summary: "Xem học sinh được liên kết, tóm tắt hỗ trợ và xử lý SOS.",
  },
  {
    role: "parent",
    label: "Phụ huynh",
    email: "parent.demo@beyou.local",
    route: "/parent",
    summary: "Theo dõi tóm tắt hỗ trợ và trạng thái SOS trong phạm vi được phép.",
  },
  {
    role: "admin",
    label: "Quản trị",
    email: "admin.demo@beyou.local",
    route: "/admin",
    summary: "Quản lý nội dung, tài khoản, báo cáo tổng hợp và vận hành metadata-only.",
  },
];
