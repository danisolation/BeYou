import { apiFetch } from "@/lib/api";

export type AdminUser = {
  id: string;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  status: "active" | "disabled" | "deleted";
  full_name: string;
  school: string | null;
  class_name: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminUserCreate = {
  email: string;
  password: string;
  role: AdminUser["role"];
  full_name: string;
  school?: string | null;
  class_name?: string | null;
  status: AdminUser["status"];
  is_demo: boolean;
};

export type AdminUserUpdate = Partial<Pick<AdminUser, "email" | "role" | "full_name" | "school" | "class_name" | "status">>;

export type AdminLink = {
  id: string;
  student_id: string;
  student_full_name: string;
  student_email: string;
  student_school: string | null;
  student_class_name: string | null;
  adult_id: string;
  adult_full_name: string;
  adult_email: string;
  adult_role: "teacher" | "parent";
  relationship_type: "teacher" | "parent";
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  is_demo: boolean;
};

export type AdminLinkCreate = {
  student_id: string;
  adult_id: string;
  relationship_type: "teacher" | "parent";
};

export function listUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/api/admin/users");
}

export function createUser(payload: AdminUserCreate): Promise<AdminUser> {
  return apiFetch<AdminUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: string, payload: AdminUserUpdate): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId: string): Promise<AdminUser | null> {
  return apiFetch<AdminUser | null>(`/api/admin/users/${userId}`, { method: "DELETE" });
}

export function listLinks(): Promise<AdminLink[]> {
  return apiFetch<AdminLink[]>("/api/admin/links");
}

export function createLink(payload: AdminLinkCreate): Promise<AdminLink> {
  return apiFetch<AdminLink>("/api/admin/links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revokeLink(linkId: string): Promise<AdminLink> {
  return apiFetch<AdminLink>(`/api/admin/links/${linkId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "revoked" }),
  });
}
