import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { MerchantAdapter } from "@/lib/merchants/types";
import { CouponVerificationResult, MerchantName, NormalizedProduct } from "@/lib/types/domain";
import { BotBlockedError, detectBotBlocking } from "@/lib/modules/errors";
import { BrowserAgent } from "@/lib/modules/browser-agent";
import { shouldUseBrowserAgent } from "@/lib/config/agent-config";

function isMissingPlaywrightExecutableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("executable doesn't exist") || message.includes("playwright install");
}

function isMissingPlaywrightSystemDependencyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("error while loading shared libraries") || message.includes("libglib-2.0.so.0");
}

export abstract class BaseAdapter implements MerchantAdapter {
  abstract name: MerchantName;
  abstract canHandle(url: string): boolean;

  private async fetchHtmlWithBrowser(url: string): Promise<string> {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      if (isMissingPlaywrightExecutableError(error)) {
        throw new Error(
          "Playwright browser binary bulunamadı. Deploy ortamında `npx playwright install chromium` çalıştırın."
        );
      }
      if (isMissingPlaywrightSystemDependencyError(error)) {
        throw new Error(
          "Playwright browser bağımlılıkları eksik (örn: libglib). Deploy image içinde Playwright system deps kurulu olmalı."
        );
      }
      throw error;
    }

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      locale: "tr-TR"
    });
    const page = await context.newPage();
    const agent = new BrowserAgent(page);

    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      await agent.humanGoto(url);
      return await page.content();
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }

  async fetchHtml(url: string): Promise<string> {
    const host = new URL(url).hostname;
    if (shouldUseBrowserAgent(host)) {
      const browserHtml = await this.fetchHtmlWithBrowser(url).catch((error) => {
        if (
          error instanceof Error &&
          (isMissingPlaywrightExecutableError(error) || isMissingPlaywrightSystemDependencyError(error))
        ) {
          return null;
        }
        throw error;
      });
      if (!browserHtml) {
        throw new BotBlockedError(
          `${this.name} browser agent açılamadı (Playwright browser eksik). Merchant atlandı.`
        );
      }
      if (detectBotBlocking(browserHtml)) {
        throw new BotBlockedError(`${this.name} captcha/bot koruması tespit edildi`);
      }
      return browserHtml;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
      }
    });
    if (res.status === 403 || res.status === 429) {
      const browserHtml = await this.fetchHtmlWithBrowser(url).catch(() => null);
      if (!browserHtml || detectBotBlocking(browserHtml)) {
        throw new BotBlockedError(`${this.name} bot engeli: HTTP ${res.status}`);
      }
      return browserHtml;
    }
    if (!res.ok) throw new Error(`${this.name} sayfası çekilemedi: ${res.status}`);

    const html = await res.text();
    if (detectBotBlocking(html)) {
      const browserHtml = await this.fetchHtmlWithBrowser(url).catch(() => null);
      if (!browserHtml || detectBotBlocking(browserHtml)) {
        throw new BotBlockedError(`${this.name} captcha/bot koruması tespit edildi`);
      }
      return browserHtml;
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
