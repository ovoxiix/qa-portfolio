import { BrowserContext, expect, Page, test } from "@playwright/test";
import { BASE_URL, CART_URL } from "./config";

let context: BrowserContext;
let page: Page;

test.describe
  .serial("글로벌 이커머스 플랫폼의 장바구니 핵심 기능 Test Automation", () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(BASE_URL);
    await page.locator(".icp-nav-link-inner").hover();

    const koreanLabel = page.locator("span.nav-text", {
      hasText: "한국어 - KO",
    });
    const count = await koreanLabel.count();

    if (count === 1) {
      await koreanLabel.first().click();
    }
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("CART_001 - 상품 검색 후 장바구니에 추가", async () => {
    await page.locator("#twotabsearchtextbox").fill("베개");
    await page.locator("#nav-search-submit-button").click();
    await page.waitForTimeout(3000);

    const addToCartButton = page
      .locator('button[name="submit.addToCart"]')
      .first();
    await addToCartButton.click();

    await expect(page.locator("#nav-cart-count")).toHaveText("1");
  });

  test("CART_002 - 장바구니 수량 증가", async () => {
    const cartCountLocator = page.locator("#nav-cart-count");
    const plusButton = page.getByLabel("1개씩 수량 증가").first();
    let targetButton;

    if (await plusButton.isVisible().catch(() => false)) {
      targetButton = plusButton;
    } else {
      targetButton = page.locator('button[name="submit.addToCart"]').first();
    }

    const clickCount = 2;
    for (let i = 0; i < clickCount; i++) {
      const prevCartCount = await cartCountLocator.innerText();
      await targetButton.click();
    }

    await expect(cartCountLocator).toHaveText("3");
  });

  test("CART_003 - 수량 변경 시 소계 반영 확인", async () => {
    await page.goto(CART_URL);

    const firstCartItem = page.locator(".sc-list-item").first();
    const plusButton = firstCartItem.locator(
      'button[aria-label="수량을 하나씩 늘리세요."]'
    );

    const unitPriceText = await firstCartItem
      .locator(".a-price .a-offscreen")
      .first()
      .textContent();
    const unitPrice = parseFloat(unitPriceText?.replace(/[^\d.]/g, "") || "0");

    const subtotalLocator = page
      .locator("span.a-size-medium.a-color-base.sc-price.sc-white-space-nowrap")
      .first();

    const initialSubtotalStr = await subtotalLocator.textContent();
    const initialSubtotal = parseFloat(
      initialSubtotalStr?.replace(/[^\d.]/g, "") || "0"
    );

    const clickCount = 2;
    for (let i = 0; i < clickCount; i++) {
      const prevSubtotal = await subtotalLocator.textContent();
      await plusButton.click();
      await expect(subtotalLocator).not.toHaveText(prevSubtotal ?? "");
    }

    const updatedSubtotalStr = await subtotalLocator.textContent();
    const updatedSubtotal = parseFloat(
      updatedSubtotalStr?.replace(/[^\d.]/g, "") || "0"
    );

    const expectedSubtotal = initialSubtotal + unitPrice * clickCount;
    expect(updatedSubtotal).toBeCloseTo(expectedSubtotal, 1);
  });

  test("CART_005 - 장바구니에서 상품 삭제", async () => {
    const firstCartItem = page.locator(".sc-list-item").first();
    const deleteButton = firstCartItem.locator(".sc-action-delete");

    await deleteButton.click();

    const deleteMessage = page
      .locator(".sc-list-item-removed-msg-text-delete")
      .first();
    await expect(deleteMessage).toHaveText(/장바구니에서 제거됨/);
  });
});
