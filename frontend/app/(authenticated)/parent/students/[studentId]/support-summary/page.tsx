"use client";

import {
  AdultSupportSummaryDetail,
} from "@/app/(authenticated)/teacher/students/[studentId]/support-summary/page";
import { getParentSupportSummary, type AdultSupportSummaryResponse } from "@/lib/adult-summary-api";

type PageProps = {
  params: { studentId: string } | Promise<{ studentId: string }>;
};

export default function ParentSupportSummaryPage({ params }: PageProps) {
  return (
    <AdultSupportSummaryDetail
      params={params}
      loadSummary={getParentSupportSummary as (studentId: string) => Promise<AdultSupportSummaryResponse>}
      sectionTitle="Tóm tắt hỗ trợ của con được phép xem"
    />
  );
}
