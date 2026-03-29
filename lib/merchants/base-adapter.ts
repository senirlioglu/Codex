import * as cheerio from "cheerio";
import { MerchantAdapter } from "@/lib/merchants/types";
import { CouponVerificationResult, MerchantName, NormalizedProduct } from "@/lib/types/domain";

export abstract class BaseAdapter implements MerchantAdapter {
  abstract name: MerchantName;
  abstract canHandle(url: string): boolean;

  async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 PricePilotBot/1.0" } });
    if (!res.ok) throw new Error(`${this.name} sayfası çekilemedi: ${res.status}`);
    return res.text();
  }

  async extractProduct(url: string): Promise<NormalizedProduct> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    if (!title) throw new Error("Ürün parse edilemedi.");

    const priceText = $("meta[property='product:price:amount']").attr("content") || "";
    const normalizedPrice = Number(priceText.replace(/[^\d,.]/g, "").replace(",", "."));
    if (!normalizedPrice) throw new Error("Fiyat parse edilemedi.");

    return {
      merchant: this.name,
      productUrl: url,
      title,
      extractedPrice: normalizedPrice,
      currency: "TRY"
    };
  }

  abstract searchEquivalentProduct(reference: NormalizedProduct): Promise<NormalizedProduct | null>;
  abstract addToCart(page: import("playwright").Page, productUrl: string): Promise<boolean>;
  abstract goToCart(page: import("playwright").Page): Promise<boolean>;
  abstract applyCoupon(page: import("playwright").Page, code: string): Promise<CouponVerificationResult>;
  abstract readCartState(page: import("playwright").Page): Promise<{ total: number | null; message?: string }>;
}
