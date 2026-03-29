import type { Page } from "playwright";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class BrowserAgent {
  constructor(private readonly page: Page) {}

  async warmup() {
    await this.page.mouse.move(randomBetween(50, 200), randomBetween(40, 180));
    await this.page.waitForTimeout(randomBetween(180, 420));
    await this.page.mouse.wheel(0, randomBetween(200, 600));
    await this.page.waitForTimeout(randomBetween(160, 360));
  }

  async humanGoto(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await this.warmup();
  }

  async humanClick(selector: string) {
    const locator = this.page.locator(selector).first();
    await locator.hover({ timeout: 5000 }).catch(() => undefined);
    await this.page.waitForTimeout(randomBetween(120, 320));
    await locator.click({ timeout: 10000 });
    await this.page.waitForTimeout(randomBetween(200, 500));
  }

  async humanType(selector: string, text: string) {
    const locator = this.page.locator(selector).first();
    await locator.click({ timeout: 10000 });
    await locator.fill("");
    for (const ch of text) {
      await locator.type(ch, { delay: randomBetween(35, 120) });
    }
    await this.page.waitForTimeout(randomBetween(130, 260));
  }
}
