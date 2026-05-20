"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { RoleStudentList } from "@/app/(authenticated)/teacher/page";

type LinkedStudent = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  relationship_type: string;
  link_status: string;
  is_demo: boolean;
};

export default function ParentDashboardPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<LinkedStudent[]>("/api/parent/students")
      .then(setStudents)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  return (
    <RoleStudentList
      title="Cổng phụ huynh"
      subtitle="Xem học sinh được liên kết và thông tin hỗ trợ được phép hiển thị."
      students={students}
      emptyBody="Khi quản trị viên tạo liên kết, thông tin hỗ trợ được phép xem sẽ hiển thị tại đây."
    />
  );
}
