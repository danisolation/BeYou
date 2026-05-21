import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "BeYouDemo!2026";
const ADMIN_EMAIL = "admin.demo@beyou.local";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("phase6-admin-aggregate-reports", () => {
  test("admin views privacy-limited aggregate reports without raw exports or drilldowns", async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole("link", { name: /Báo cáo tổng hợp riêng tư/ }).click();
    await expect(page).toHaveURL(/\/admin\/reports$/);
    await expect(page.getByRole("heading", { name: "Báo cáo tổng hợp riêng tư" })).toBeVisible();
    await expect(page.getByText(/Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư/)).toBeVisible();

    await page.getByLabel("Phạm vi dữ liệu").selectOption("demo");
    await expect(page.getByText("Dữ liệu demo").first()).toBeVisible();
    await expect(page.getByText("Đã ẩn để bảo vệ riêng tư (<3)").first()).toBeVisible();
    await expect(page.getByText("Không có xuất dữ liệu thô, không có danh sách học sinh theo nguy cơ.")).toBeVisible();
    await expect(page.getByText(/RAW_|answer_text|message_content|transcript|student.demo@beyou.local/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Xuất báo cáo|Tải xuống|Export/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Chi tiết học sinh|xếp hạng|nguy cơ cao nhất/i })).toHaveCount(0);
  });
});
