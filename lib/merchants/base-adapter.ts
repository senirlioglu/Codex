import * as cheerio from "cheerio";
import { MerchantAdapter } from "@/lib/merchants/types";
import { CouponVerificationResult, MerchantName, NormalizedProduct } from "@/lib/types/domain";
import { BotBlockedError, detectBotBlocking } from "@/lib/modules/errors";

export abstract class BaseAdapter implements MerchantAdapter {
  abstract name: MerchantName;
  abstract canHandle(url: string): boolean;

  async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
      }
    });
    if (res.status === 403 || res.status === 429) {
      throw new BotBlockedError(`${this.name} bot engeli: HTTP ${res.status}`);
    }
    if (!res.ok) throw new Error(`${this.name} sayfası çekilemedi: ${res.status}`);

    const html = await res.text();
    if (detectBotBlocking(html)) {
      throw new BotBlockedError(`${this.name} captcha/bot koruması tespit edildi`);
    }

    return html;
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
