import { BaseAdapter } from "@/lib/merchants/base-adapter";
import { merchantSelectors } from "@/lib/config/merchant-selectors";
import { CouponVerificationResult, NormalizedProduct } from "@/lib/types/domain";
import { parseTryPriceFromText } from "@/lib/modules/price-parser";
import { isMerchantHost } from "@/lib/modules/url-intake";
import { merchantHosts } from "@/lib/config/merchant-hosts";

export class HepsiburadaAdapter extends BaseAdapter {
  name = "hepsiburada" as const;

  canHandle(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return isMerchantHost(host, merchantHosts.hepsiburada);
    } catch {
      return false;
    }
  }

  async searchEquivalentProduct(reference: NormalizedProduct): Promise<NormalizedProduct | null> {
    const q = encodeURIComponent([reference.brand, reference.model, reference.title].filter(Boolean).join(" "));
    const searchUrl = `https://www.hepsiburada.com/ara?q=${q}`;
    const html = await this.fetchHtml(searchUrl);
    const matched = html.match(/href=\"(\/[^\"]*-p-[^\"]+)\"/i);
    if (!matched) return null;
    const productUrl = `https://www.hepsiburada.com${matched[1]}`;
    return this.extractProduct(productUrl);
  }

  async addToCart(page: import("playwright").Page, productUrl: string): Promise<boolean> {
    await page.goto(productUrl, { waitUntil: "domcontentloaded" });
    const sel = merchantSelectors.hepsiburada.addToCart;
    if (!(await page.locator(sel).first().isVisible().catch(() => false))) return false;
    await page.locator(sel).first().click();
    return true;
  }

  async goToCart(page: import("playwright").Page): Promise<boolean> {
    const sel = merchantSelectors.hepsiburada.cartLink;
    if (!(await page.locator(sel).first().isVisible().catch(() => false))) return false;
    await page.locator(sel).first().click();
    return true;
  }

  async applyCoupon(page: import("playwright").Page, code: string): Promise<CouponVerificationResult> {
    const input = page.locator(merchantSelectors.hepsiburada.couponInput).first();
    if (!(await input.isVisible().catch(() => false))) {
      return { status: "coupon_field_missing", message: "Bu sitede kupon alanına ulaşılamadı" };
    }

    await input.fill(code);
    await page.locator(merchantSelectors.hepsiburada.applyCouponButton).first().click();
    await page.waitForTimeout(1500);
    return { status: "unknown", message: "Kupon sonucu otomatik doğrulanamadı, kart durumu okunacak." };
  }

  async readCartState(page: import("playwright").Page): Promise<{ total: number | null; message?: string }> {
    const text = await page.textContent("body");
    const total = parseTryPriceFromText(text);
    return { total, message: total ? undefined : "Toplam tutar okunamadı" };
  }
}
