import { BaseAdapter } from "@/lib/merchants/base-adapter";
import { merchantSelectors } from "@/lib/config/merchant-selectors";
import { CouponVerificationResult, NormalizedProduct } from "@/lib/types/domain";

export class IdefixAdapter extends BaseAdapter {
  name = "idefix" as const;

  canHandle(url: string): boolean {
    return url.includes("idefix.com");
  }

  async searchEquivalentProduct(reference: NormalizedProduct): Promise<NormalizedProduct | null> {
    const q = encodeURIComponent([reference.brand, reference.model, reference.title].filter(Boolean).join(" "));
    const searchUrl = `https://www.idefix.com/arama?q=${q}`;
    const html = await this.fetchHtml(searchUrl);
    const matched = html.match(/href=\"(https:\/\/www\.idefix\.com\/[^\"]+)\"/i);
    if (!matched) return null;
    return this.extractProduct(matched[1]);
  }

  async addToCart(page: import("playwright").Page, productUrl: string): Promise<boolean> {
    await page.goto(productUrl, { waitUntil: "domcontentloaded" });
    const sel = merchantSelectors.idefix.addToCart;
    if (!(await page.locator(sel).first().isVisible().catch(() => false))) return false;
    await page.locator(sel).first().click();
    return true;
  }

  async goToCart(page: import("playwright").Page): Promise<boolean> {
    const sel = merchantSelectors.idefix.cartLink;
    if (!(await page.locator(sel).first().isVisible().catch(() => false))) return false;
    await page.locator(sel).first().click();
    return true;
  }

  async applyCoupon(page: import("playwright").Page, code: string): Promise<CouponVerificationResult> {
    const input = page.locator(merchantSelectors.idefix.couponInput).first();
    if (!(await input.isVisible().catch(() => false))) {
      return { status: "coupon_field_missing", message: "Bu sitede kupon alanına ulaşılamadı" };
    }
    await input.fill(code);
    await page.locator(merchantSelectors.idefix.applyCouponButton).first().click();
    await page.waitForTimeout(1500);
    return { status: "unknown", message: "Kupon sonucu otomatik doğrulanamadı, kart durumu okunacak." };
  }

  async readCartState(page: import("playwright").Page): Promise<{ total: number | null; message?: string }> {
    const text = await page.textContent("body");
    const m = text?.match(/(\d+[\.,]\d{2})\s?TL/);
    const total = m ? Number(m[1].replace(".", "").replace(",", ".")) : null;
    return { total, message: total ? undefined : "Toplam tutar okunamadı" };
  }
}
