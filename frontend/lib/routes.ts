export type UserRole = "student" | "teacher" | "parent" | "admin";

export const roleToRoute: Record<UserRole, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
};
