import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "BeYouDemo!2026";
const demoUsers = {
  student: "student.demo@beyou.local",
  teacher: "teacher.demo@beyou.local",
  parent: "parent.demo@beyou.local",
  admin: "admin.demo@beyou.local",
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

test.describe("phase3-wellbeing-content", () => {
  test("demo student completes Sức khỏe cảm xúc self-check and reviews private detail", async ({ page }) => {
    await loginAs(page, demoUsers.student);
    await acceptPrivacyIfNeeded(page);

    await page.goto("/student/self-checks");
    await expect(page.getByText("Tự kiểm tra cảm xúc")).toBeVisible();
    await expect(page.getByText("Sức khỏe cảm xúc")).toBeVisible();
    await page.locator("article").filter({ hasText: "Sức khỏe cảm xúc" }).getByRole("link", { name: "Bắt đầu tự kiểm tra" }).click();

    while (await page.getByRole("button", { name: "Gửi câu trả lời" }).count() === 0) {
      await page.locator('input[type="radio"]').first().check();
      await page.getByRole("button", { name: "Tiếp tục" }).click();
    }
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole("button", { name: "Gửi câu trả lời" }).click();
    await expect(page).toHaveURL(/\/student\/self-checks\/results\//);
    await expect(page.getByText("Điểm tham khảo")).toBeVisible();
    await expect(page.getByText(/Em đang|Có một vài|Em không cần|Điều em đang/)).toBeVisible();

    await page.goto("/student/self-checks/history");
    await expect(page.getByText("Lịch sử tự kiểm tra")).toBeVisible();
    await page.getByRole("link", { name: "Xem chi tiết" }).first().click();
    await expect(page.getByText("Câu trả lời của em")).toBeVisible();
    await expect(page.getByText("Nội dung này là bản ghi tại thời điểm em hoàn thành bài tự kiểm tra.")).toBeVisible();
  });

  test("demo student completes scenario flow and sees supportive feedback", async ({ page }) => {
    await loginAs(page, demoUsers.student);
    await acceptPrivacyIfNeeded(page);

    await page.goto("/student/scenarios");
    await expect(page.getByText("Tình huống luyện tập")).toBeVisible();
    await page.getByRole("link", { name: "Xem tình huống" }).first().click();
    await page.getByRole("button", { name: "Chọn cách phản hồi này" }).first().click();

    await expect(page.getByText("Gợi ý sau lựa chọn của em")).toBeVisible();
    await expect(page.getByText("Cách phản hồi nên thử")).toBeVisible();
    await expect(page.getByText("Điều em có thể rút ra")).toBeVisible();
    await expect(page.getByText("Kỹ năng liên quan")).toBeVisible();

    await page.goto("/student/scenarios/history");
    await expect(page.getByText("Lịch sử tình huống")).toBeVisible();
  });

  test("teacher and parent see summary-only self-check pages without selected raw answer text", async ({ page }) => {
    await loginAs(page, demoUsers.teacher);
    await expect(page).toHaveURL(/\/teacher$/);
    await page.getByRole("link", { name: "Xem tóm tắt hỗ trợ" }).first().click();
    await expect(page.getByText("Tóm tắt được phép xem")).toBeVisible();
    await expect(page.getByText("BeYou không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc.")).toBeVisible();
    await expect(page.getByText(/RAW ANSWER|score_breakdown|answer_text/i)).not.toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await loginAs(page, demoUsers.parent);
    await expect(page).toHaveURL(/\/parent$/);
    await page.getByRole("link", { name: "Xem tóm tắt hỗ trợ" }).first().click();
    await expect(page.getByText("Tóm tắt được phép xem")).toBeVisible();
    await expect(page.getByText(/RAW ANSWER|score_breakdown|answer_text/i)).not.toBeVisible();
  });

  test("admin creates publishes and archives Phase 3 content", async ({ page }) => {
    const suffix = Date.now();
    await loginAs(page, demoUsers.admin);
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole("link", { name: /Nội dung tự kiểm tra và tình huống/ }).click();
    await expect(page).toHaveURL(/\/admin\/content$/);
    await expect(page.getByText("Quản lý bài tự kiểm tra")).toBeVisible();
    await expect(page.getByText("Quản lý tình huống")).toBeVisible();

    await page.getByRole("button", { name: "Tạo tình huống" }).click();
    await page.getByLabel("Tiêu đề tình huống").fill(`Tình huống Playwright ${suffix}`);
    await page.getByLabel("Mô tả tình huống").fill("Bạn rủ em làm điều em chưa sẵn sàng.");
    await page.getByLabel("Kỹ năng liên quan").fill("Từ chối an toàn");
    await page.getByLabel("Lựa chọn phản hồi").fill("Em nói không và tìm người hỗ trợ.");
    await page.getByLabel("Tín hiệu constructive/risky").selectOption("constructive");
    await page.getByLabel("Phản hồi cho lựa chọn").fill("Lựa chọn này có điểm tích cực vì em giữ ranh giới.");
    await page.getByLabel("Cách phản hồi nên thử").fill("Em có thể nói rõ ranh giới và rời khỏi nơi không an toàn.");
    await page.getByLabel("Điều em có thể rút ra").fill("Em được phép chọn cách phản hồi an toàn hơn.");
    await page.getByRole("button", { name: "Lưu bản nháp tình huống" }).click();
    await expect(page.getByText(`Tình huống Playwright ${suffix}`)).toBeVisible();
    await page.getByRole("button", { name: "Xuất bản" }).last().click();
    await page.getByRole("button", { name: "Lưu trữ" }).last().click();
    await expect(page.getByText("Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ.")).toBeVisible();
    await page.getByRole("button", { name: "Lưu trữ nội dung" }).click();
  });
});
