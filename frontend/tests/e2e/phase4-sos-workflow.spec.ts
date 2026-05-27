import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "BeYouDemo!2026";
const demoUsers = {
  student: "student.demo@beyou.local",
  teacher: "teacher.demo@beyou.local",
  parent: "parent.demo@beyou.local",
};

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

async function acceptPrivacyIfNeeded(page: Page) {
  await page.waitForURL(/\/(privacy|student)/);
  if (page.url().includes("/privacy")) {
    await page.getByRole("checkbox", { name: "Em đã đọc và hiểu ai có thể xem thông tin của em." }).check();
    await page.getByRole("button", { name: "Tiếp tục vào BeYou" }).click();
  }
  await expect(page).toHaveURL(/\/student$/);
}

test.describe("phase4-sos-workflow", () => {
  test("student sends confirmed SOS and teacher completes support while parent views status", async ({ page }) => {
    const note = `SOS Playwright ${Date.now()}`;

    await loginAs(page, demoUsers.student);
    await acceptPrivacyIfNeeded(page);
    await expect(page.getByText("Gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.")).toBeVisible();
    await page.getByRole("button", { name: "Gửi SOS hỗ trợ" }).click();
    await expect(page.getByText("Xác nhận gửi tín hiệu hỗ trợ")).toBeVisible();
    await page.getByRole("radio", { name: "Em đang không an toàn ngay lúc này" }).check();
    await page.getByLabel("Điều em muốn người lớn biết lúc này (không bắt buộc)").fill(note);
    await page.getByRole("button", { name: "Xác nhận gửi SOS" }).click();
    await expect(page.getByText("Đã gửi").first()).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await loginAs(page, demoUsers.teacher);
    await expect(page).toHaveURL(/\/teacher$/);
    await expect(page.getByText("Thông báo hỗ trợ")).toBeVisible();
    await expect(page.getByText("Nguy cơ cao").first()).toBeVisible();
    await page.getByRole("link", { name: "Xem và cập nhật SOS" }).first().click();
    await expect(page.getByText("Cập nhật trạng thái SOS")).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
    await page.getByRole("button", { name: "Đánh dấu đã nhận" }).click();
    await expect(page.getByText("Đã nhận").first()).toBeVisible();
    await page.getByRole("button", { name: "Đang hỗ trợ" }).click();
    await expect(page.getByText("Đang hỗ trợ").first()).toBeVisible();
    await page.getByRole("button", { name: "Hoàn tất hỗ trợ" }).click();
    await expect(page.getByText("Đã hoàn tất").first()).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await loginAs(page, demoUsers.parent);
    await expect(page).toHaveURL(/\/parent$/);
    await expect(page.getByText("Trạng thái SOS của con").first()).toBeVisible();
    await page.getByRole("link", { name: "Xem trạng thái SOS" }).first().click();
    await expect(page.getByRole("heading", { name: "Trạng thái SOS" })).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
    await expect(
      page.getByText("Bạn đang xem trạng thái hỗ trợ và tóm tắt được phép xem, không phải câu trả lời riêng tư của học sinh."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Đánh dấu đã nhận" })).toHaveCount(0);
  });
});
