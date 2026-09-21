import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/support",
  "/search",
  "/products/mobile-invitation",
  "/products/favor",
  "/products/mobile-invitation/64b000000000000000000001",
  "/login",
  "/signup",
  "/find-id",
  "/find-password",
  "/change-password?t=route-smoke",
  "/payment-result",
  "/preview/sample",
  "/preview/sample/blossom",
  "/preview/sample-public-key",
] as const;

const PROTECTED_ROUTES = [
  "/my-orders",
  "/my-orders/order-smoke",
  "/my-orders/order-smoke/mobile-invitation",
  "/my-orders/order-smoke/mobile-invitation/preview",
  "/my-profile",
  "/payment",
  "/payment/success?orderId=order-smoke",
  "/admin",
  "/admin/dashboard",
  "/admin/orders",
  "/admin/products",
  "/admin/products/new",
  "/admin/premium-features",
  "/admin/premium-features/new",
  "/admin/premium-features/feature-smoke/products",
  "/admin/reviews",
  "/admin/settings",
  "/admin/users",
] as const;

test.describe("라우트 그룹 스모크", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`공개 라우트 ${path}가 서버 오류 없이 응답한다`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status(), path).toBeLessThan(500);
      if (path !== "/login") {
        await expect(page).not.toHaveURL(/\/login$/);
      }
    });
  }

  for (const path of PROTECTED_ROUTES) {
    test(`보호 라우트 ${path}가 미인증 사용자를 로그인으로 보낸다`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
