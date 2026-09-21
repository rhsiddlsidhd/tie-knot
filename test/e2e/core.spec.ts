import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("admin-e2e@example.com");
  await page.getByLabel("비밀번호").fill("Admin-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("user-e2e@example.com");
  await page.getByLabel("비밀번호").fill("User-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function fillProductUntilThumbnail(
  page: Page,
  title: string,
  options: { category?: string; subCategory: string },
) {
  await page.getByLabel("상품명", { exact: true }).fill(title);
  await page
    .getByLabel("상품 설명", { exact: true })
    .fill("E2E에서 검증하는 충분히 긴 상품 설명입니다.");

  if (options.category) {
    await selectOption(page, "category", options.category);
  }
  await selectOption(page, "subCategory", options.subCategory);
  await page.getByRole("button", { name: "다음: 가격 정보" }).click();
  await page.getByLabel("기본 가격", { exact: true }).fill("10000");
  await page.getByRole("button", { name: "다음: 노출 설정" }).click();
  await page.getByRole("button", { name: "다음: 썸네일 이미지" }).click();

  await page.locator("#thumbnail-input").click();
  await expect(page.locator('input[name="thumbnail"]')).not.toHaveValue("");
}

async function selectOption(page: Page, triggerId: string, option: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: option }).click();
}

test("로그인 페이지의 실제 브라우저 계약", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /로그인/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
});

test("비인증 관리자는 상품 등록 화면을 볼 수 없다", async ({ page }) => {
  await page.goto("/admin/products/new");
  await expect(page).toHaveURL(/\/login/);
});

test("사용자 메뉴에서 프로필과 주문으로 이동해도 화면이 viewport를 벗어나지 않는다", async ({
  page,
}) => {
  await loginAsUser(page);

  for (const target of [
    { menuName: "프로필", path: /\/my-profile$/, heading: "프로필 관리" },
    { menuName: "주문 정보", path: /\/my-orders$/, heading: "주문 목록" },
  ]) {
    await page.goto("/");
    await page.getByRole("button", { name: "사용자 메뉴" }).click();
    await page.getByRole("menuitem", { name: target.menuName }).click();
    await expect(page).toHaveURL(target.path);
    await expect(
      page.getByRole("heading", { name: target.heading }),
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  }
});

test("ADMIN은 상세 이미지 없이 invitation 상품을 실제 DB에 등록한다", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillProductUntilThumbnail(page, "E2E 초대장", {
    subCategory: "청첩장",
  });
  await page.getByRole("button", { name: "다음: 미리보기 이미지" }).click();
  await page.getByRole("button", { name: "다음: 상세 이미지" }).click();
  await page.getByRole("button", { name: "다음: 구매 수량" }).click();

  await page.getByRole("button", { name: "상품 등록" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E 초대장")).toBeVisible();
});

test("물리 상품은 상세 이미지 없이 등록이 차단된다", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillProductUntilThumbnail(page, "E2E 캔들", {
    category: "답례품",
    subCategory: "캔들",
  });

  await page.getByRole("button", { name: "다음: 상세 이미지" }).click();
  await page.getByRole("button", { name: "다음: 구매 수량" }).click();
  await expect(
    page.getByText("상세 이미지를 1장 이상 등록해주세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products\/new/);
});

test("ADMIN은 상세 이미지를 포함한 물리 상품을 실제 DB에 등록한다", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillProductUntilThumbnail(page, "E2E 캔들 이미지", {
    category: "답례품",
    subCategory: "캔들",
  });
  await page.getByRole("button", { name: "다음: 상세 이미지" }).click();

  await page.locator("#images-upload").click();
  await expect(page.getByRole("img", { name: /^Preview / })).toBeVisible();
  await expect(page.locator('input[name="images"]')).toHaveCount(1);
  await page.getByRole("button", { name: "다음: 구매 수량" }).click();
  await page.getByRole("button", { name: "상품 등록" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E 캔들 이미지")).toBeVisible();
});

test("기존 상세 이미지와 thumbnail을 유지한 채 상품명을 수정한다", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products");
  const row = page.getByRole("row").filter({ hasText: "E2E 기존 이미지 상품" });
  await row.getByRole("button").first().click();
  const dialog = page.getByRole("dialog", { name: "상품 수정" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("상품명", { exact: true })
    .fill("E2E 기존 이미지 유지 완료");
  await expect(dialog.locator('input[name="images"]')).toHaveValue(
    "https://res.cloudinary.com/e2e/image/upload/existing-detail.png",
  );
  await expect(dialog.locator('input[name="thumbnail"]')).toHaveValue(
    "https://res.cloudinary.com/e2e/image/upload/existing-thumbnail.png",
  );
  await dialog.getByRole("button", { name: "상품 수정" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("E2E 기존 이미지 유지 완료")).toBeVisible();
});

test("mock PG 리디렉션으로 복귀해 실제 주문의 결제를 완료한다", async ({
  page,
}) => {
  const navigatedPaths: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame())
      navigatedPaths.push(new URL(frame.url()).pathname);
  });

  await loginAsUser(page);
  await page.evaluate(() => {
    sessionStorage.setItem(
      "order-storage",
      JSON.stringify({
        state: {
          order: {
            productId: "64b000000000000000000001",
            category: "mobile-invitation",
            title: "E2E 결제 상품",
            thumbnail:
              "https://res.cloudinary.com/e2e/image/upload/checkout.png",
            originalPrice: 12000,
            discountedPrice: 12000,
            discountAmount: 0,
            optionsTotalPrice: 0,
            finalPrice: 12000,
            quantity: 1,
            selectedFeatures: [],
          },
        },
        version: 1,
      }),
    );
  });
  await page.goto("/payment");

  await page.getByLabel("이름").fill("테스트 구매자");
  await page.locator('input[name="buyerPhone"]').fill("010-1234-5678");
  await page.getByLabel("이메일").fill("buyer-e2e@example.com");
  await page.getByLabel(/구매조건 확인 및 결제 진행에 동의/).click();
  await page.keyboard.press("End");
  const paymentButton = page.getByRole("button", { name: "결제하기" });
  await expect(paymentButton).toBeVisible();
  await paymentButton.click();

  await expect(page).toHaveURL(/\/payment\/success\?orderId=ORDER-/, {
    timeout: 30_000,
  });
  expect(navigatedPaths).toContain("/payment-result");
  await expect(
    page.getByRole("heading", { name: "결제가 완료되었습니다!" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "주문 내역 확인" }).click();
  await expect(page.getByText("E2E 결제 상품")).toBeVisible();
});
