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
  await expect(page.getByText("Chào mừng đến với BeYou")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test.describe("Phase 2 auth, role dashboards, and admin flows", () => {
  test("student demo login reaches privacy gate and dashboard with linked adults", async ({ page }) => {
    await loginAs(page, demoUsers.student);
    await page.waitForURL(/\/(privacy|student)/);

    if (page.url().includes("/privacy")) {
      await expect(page.getByText("Ai có thể xem thông tin của em?")).toBeVisible();
      await page.getByRole("checkbox", { name: "Em đã đọc và hiểu ai có thể xem thông tin của em." }).check();
      await page.getByRole("button", { name: "Tiếp tục vào BeYou" }).click();
    }

    await expect(page).toHaveURL(/\/student$/);
    await expect(page.getByText("Bảng điều khiển của em")).toBeVisible();
    await expect(page.getByText("Trường THPT BeYou Demo")).toBeVisible();
    await expect(page.getByText(/10A1/)).toBeVisible();
    await expect(page.getByText("Cô Bình Demo")).toBeVisible();
    await expect(page.getByText("Phụ huynh Chi Demo")).toBeVisible();
    await expect(page.getByText("Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.")).toBeVisible();
    await expect(page.getByText("Demo").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ai có thể xem thông tin của em?" })).toBeVisible();
  });

  test("teacher, parent, and admin demo users reach correct portals", async ({ page }) => {
    await loginAs(page, demoUsers.teacher);
    await expect(page).toHaveURL(/\/teacher$/);
    await expect(page.getByText("Cổng giáo viên")).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await loginAs(page, demoUsers.parent);
    await expect(page).toHaveURL(/\/parent$/);
    await expect(page.getByText("Cổng phụ huynh")).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await loginAs(page, demoUsers.admin);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Cổng quản trị")).toBeVisible();
    await expect(page.getByRole("link", { name: /Quản lý tài khoản/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Liên kết học sinh và người lớn hỗ trợ/ })).toBeVisible();
  });

  test("admin can create, update, disable, delete demo user, and manage links", async ({ page }) => {
    const suffix = Date.now();
    const userEmail = `playwright.user.${suffix}@beyou.local`;
    const studentEmail = `playwright.student.${suffix}@beyou.local`;
    const teacherEmail = `playwright.teacher.${suffix}@beyou.local`;

    await loginAs(page, demoUsers.admin);
    await page.getByRole("link", { name: /Quản lý tài khoản/ }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByText("Quản lý tài khoản")).toBeVisible();
    const createUserForm = page.locator("form").filter({ hasText: "Tạo tài khoản" });

    await createUserForm.getByLabel("Họ tên").fill("Người dùng Playwright");
    await createUserForm.getByLabel("Email").fill(userEmail);
    await createUserForm.getByLabel("Mật khẩu").fill(DEMO_PASSWORD);
    await createUserForm.getByLabel("Vai trò").selectOption("parent");
    await createUserForm.getByLabel("Demo").check();
    await createUserForm.getByRole("button", { name: "Tạo tài khoản" }).click();
    await expect(page.getByText(userEmail)).toBeVisible();

    const userRow = page.locator("article").filter({ hasText: userEmail });
    await userRow.getByLabel("Vai trò").selectOption("teacher");
    await userRow.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đổi vai trò tài khoản này? Quyền truy cập sẽ thay đổi ngay sau khi lưu.")).toBeVisible();
    await page.getByRole("button", { name: "Lưu vai trò mới" }).click();
    await userRow.getByRole("button", { name: "Tạm khóa tài khoản" }).click();
    await expect(page.getByText("Tạm khóa tài khoản này? Người dùng sẽ không thể đăng nhập cho đến khi được mở lại.")).toBeVisible();
    await page.getByRole("button", { name: "Tạm khóa tài khoản" }).last().click();
    await userRow.getByRole("button", { name: "Xóa tài khoản demo" }).click();
    await expect(page.getByText("Xóa tài khoản demo này? Chỉ dùng thao tác này cho dữ liệu demo, không dùng cho hồ sơ học sinh thật.")).toBeVisible();
    await page.getByRole("button", { name: "Xóa tài khoản demo" }).last().click();
    await expect(page.getByText(userEmail)).not.toBeVisible();

    await createUserForm.getByLabel("Họ tên").fill("Học sinh Link Playwright");
    await createUserForm.getByLabel("Email").fill(studentEmail);
    await createUserForm.getByLabel("Mật khẩu").fill(DEMO_PASSWORD);
    await createUserForm.getByLabel("Vai trò").selectOption("student");
    await createUserForm.getByLabel("Trường").fill("Trường THPT BeYou Demo");
    await createUserForm.getByLabel("Lớp").fill("10A1");
    await createUserForm.getByLabel("Demo").check();
    await createUserForm.getByRole("button", { name: "Tạo tài khoản" }).click();
    await expect(page.getByText(studentEmail)).toBeVisible();

    await createUserForm.getByLabel("Họ tên").fill("Giáo viên Link Playwright");
    await createUserForm.getByLabel("Email").fill(teacherEmail);
    await createUserForm.getByLabel("Mật khẩu").fill(DEMO_PASSWORD);
    await createUserForm.getByLabel("Vai trò").selectOption("teacher");
    await createUserForm.getByLabel("Trường").fill("");
    await createUserForm.getByLabel("Lớp").fill("");
    await createUserForm.getByRole("button", { name: "Tạo tài khoản" }).click();
    await expect(page.getByText(teacherEmail)).toBeVisible();

    await page.goto("/admin/links");
    await expect(page.getByText("Liên kết học sinh và người lớn hỗ trợ")).toBeVisible();
    await page.getByLabel("Học sinh").selectOption({ label: "Học sinh Link Playwright" });
    await page.getByLabel("Người lớn hỗ trợ").selectOption({ label: "Giáo viên Link Playwright" });
    await page.getByLabel("Loại liên kết").selectOption("teacher");
    await page.getByRole("button", { name: "Tạo liên kết" }).click();
    await expect(page.getByRole("heading", { name: "Học sinh Link Playwright" })).toBeVisible();
    await page.locator("article").filter({ hasText: "Học sinh Link Playwright" }).getByRole("button", { name: "Thu hồi liên kết" }).click();
    await expect(page.getByText("Thu hồi liên kết này? Người lớn sẽ không còn thấy thông tin hỗ trợ của học sinh này.")).toBeVisible();
    await page.getByRole("button", { name: "Thu hồi liên kết" }).last().click();
  });
});
