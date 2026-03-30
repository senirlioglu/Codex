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
      console.error("[browser-launch-failed]", {
        merchant: this.name,
        url,
        error: error instanceof Error ? error.message : String(error)
      });
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
    console.info("[fetch-html-start]", { merchant: this.name, host, url });

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
        console.warn("[fetch-html-browser-unavailable]", { merchant: this.name, host, url });
        throw new BotBlockedError(
          `${this.name} browser agent açılamadı (Playwright browser eksik). Merchant atlandı.`
        );
      }
      if (detectBotBlocking(browserHtml)) {
        console.warn("[fetch-html-bot-detected-browser]", { merchant: this.name, host, url });
        throw new BotBlockedError(`${this.name} captcha/bot koruması tespit edildi`);
      }
      console.info("[fetch-html-success-browser]", { merchant: this.name, host, url });
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
      console.warn("[fetch-html-http-blocked]", { merchant: this.name, host, url, status: res.status });
      const browserHtml = await this.fetchHtmlWithBrowser(url).catch(() => null);
      if (!browserHtml || detectBotBlocking(browserHtml)) {
        console.warn("[fetch-html-browser-fallback-failed]", { merchant: this.name, host, url, status: res.status });
        throw new BotBlockedError(`${this.name} bot engeli: HTTP ${res.status}`);
      }
      console.info("[fetch-html-success-browser-fallback]", { merchant: this.name, host, url });
      return browserHtml;
    }
    if (!res.ok) throw new Error(`${this.name} sayfası çekilemedi: ${res.status}`);

    const html = await res.text();
    if (detectBotBlocking(html)) {
      console.warn("[fetch-html-bot-detected-http]", { merchant: this.name, host, url });
      const browserHtml = await this.fetchHtmlWithBrowser(url).catch(() => null);
      if (!browserHtml || detectBotBlocking(browserHtml)) {
        console.warn("[fetch-html-browser-fallback-failed-after-detect]", { merchant: this.name, host, url });
        throw new BotBlockedError(`${this.name} captcha/bot koruması tespit edildi`);
      }
      console.info("[fetch-html-success-browser-fallback-after-detect]", { merchant: this.name, host, url });
      return browserHtml;
    }

    console.info("[fetch-html-success-http]", { merchant: this.name, host, url });
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
