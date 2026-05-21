"use client";

import {
  AdultSummaryDetail,
} from "@/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page";
import { getParentSelfCheckSummaries, type AdultSelfCheckSummaryResponse } from "@/lib/adult-summary-api";

type PageProps = {
  params: { studentId: string } | Promise<{ studentId: string }>;
};

export default function ParentSummaryPage({ params }: PageProps) {
  return (
    <AdultSummaryDetail
      params={params}
      loadSummary={getParentSelfCheckSummaries as (studentId: string) => Promise<AdultSelfCheckSummaryResponse>}
      sectionTitle="Tóm tắt hỗ trợ của con"
    />
  );
}
