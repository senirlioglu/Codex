import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { MerchantAdapter } from "@/lib/merchants/types";

export async function verifyCoupon(
  adapter: MerchantAdapter,
  productUrl: string,
  code: string,
  runId: string
): Promise<{ status: string; beforePrice?: number | null; afterPrice?: number | null; message: string; screenshotPath?: string | null }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const added = await adapter.addToCart(page, productUrl);
    if (!added) return { status: "cart_failed", message: "Ürün sepete eklenemedi" };

    const cartOpened = await adapter.goToCart(page);
    if (!cartOpened) return { status: "cart_failed", message: "Sepet sayfasına geçilemedi" };

    const before = await adapter.readCartState(page);
    const applyResult = await adapter.applyCoupon(page, code);

    const after = await adapter.readCartState(page);
    let status = applyResult.status;
    if (status === "unknown" && before.total && after.total) {
      if (after.total < before.total) status = "applied";
      if (after.total >= before.total) status = "rejected";
    }

    const dir = path.join(process.cwd(), "public", "playwright-screenshots");
    await fs.mkdir(dir, { recursive: true });
    const screenshotPath = `/playwright-screenshots/${runId}-${adapter.name}-${code}.png`;
    await page.screenshot({ path: path.join(process.cwd(), "public", screenshotPath), fullPage: true });

    return {
      status,
      beforePrice: before.total,
      afterPrice: after.total,
      message: applyResult.message || after.message || "Kupon test sonucu alındı",
      screenshotPath
    };
  } catch (error) {
    return { status: "unknown", message: `Kupon test hatası: ${(error as Error).message}` };
  } finally {
    await page.close();
    await browser.close();
  }
}
