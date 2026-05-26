import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DemoGuideCard } from "@/components/demo-guide-card";
import {
  ErrorState,
  LoadingState,
  ResponsiveTable,
  StatusBadge,
} from "@/components/ui-primitives";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Phase 34 UI primitives", () => {
  it("announces loading and error states accessibly", () => {
    render(
      <>
        <LoadingState />
        <ErrorState />
      </>,
    );

    // UIC-04: role="status" and role="alert" are the required accessible announcement contract.
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải thông tin...");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn.",
    );
  });

  it("keeps SOS and danger badge tones visually distinct from neutral status", () => {
    render(
      <>
        <StatusBadge tone="sos">SOS</StatusBadge>
        <StatusBadge tone="danger">Nguy cơ cao</StatusBadge>
        <StatusBadge tone="neutral">Thông tin</StatusBadge>
      </>,
    );

    expect(screen.getByText("SOS").className).toMatch(/red/);
    expect(screen.getByText("Nguy cơ cao").className).toMatch(/red/);
    expect(screen.getByText("Thông tin").className).not.toMatch(/red/);
  });

  it("wraps native tables without replacing table semantics", () => {
    const { container } = render(
      <ResponsiveTable>
        <table>
          <tbody>
            <tr>
              <td>Nhịp hỗ trợ</td>
            </tr>
          </tbody>
        </table>
      </ResponsiveTable>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("overflow-x-auto");
  });

  it("keeps primitives presentation-only and free of role-specific data imports", () => {
    const primitiveSource = source("components/ui-primitives.tsx");

    expect(primitiveSource).not.toContain("@/app/");
    expect(primitiveSource).not.toContain("@/lib/api");
    expect(primitiveSource).not.toContain("@/lib/auth");
    expect(primitiveSource).not.toContain("@/lib/sos-api");
  });

  it("keeps demo guide card copy and action hrefs stable", () => {
    render(
      <DemoGuideCard
        title="Đi theo luồng học sinh"
        body="Xem các bước hỗ trợ theo vai trò."
        steps={["Mở quyền riêng tư", "Thử check-in", "Xem SOS"]}
        actions={[{ href: "/student", label: "Mở cổng học sinh", primary: true }]}
      />,
    );

    expect(screen.getByText("Gợi ý demo")).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    const action = screen.getByRole("link", { name: "Mở cổng học sinh" });
    expect(action).toHaveAttribute("href", "/student");
    expect(action).toHaveClass("min-h-11");
  });
});
