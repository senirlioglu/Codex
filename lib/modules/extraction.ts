import * as cheerio from "cheerio";
import { NormalizedProduct } from "@/lib/types/domain";
import type { MerchantAdapter } from "@/lib/merchants/types";

function parseLdJson(html: string) {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of scripts) {
    try {
      const json = JSON.parse(raw);
      if (json["@type"] === "Product") return json;
      if (Array.isArray(json)) {
        const found = json.find((j) => j?.["@type"] === "Product");
        if (found) return found;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function extractProductFromUrl(url: string, adapter: MerchantAdapter): Promise<NormalizedProduct> {
  const html = await adapter.fetchHtml(url);
  const ld = parseLdJson(html);

  if (!ld?.name || !ld?.offers?.price) {
    throw new Error("Ürün parse edilemedi.");
  }

  return {
    merchant: adapter.name,
    productUrl: url,
    title: ld.name,
    brand: typeof ld.brand === "object" ? ld.brand?.name : ld.brand,
    model: ld.model ?? null,
    variant: ld.color ?? null,
    imageUrl: Array.isArray(ld.image) ? ld.image[0] : ld.image,
    sku: ld.sku ?? null,
    mpn: ld.mpn ?? null,
    extractedPrice: Number(ld.offers.price),
    shippingPrice: null,
    currency: ld.offers.priceCurrency ?? "TRY",
    availability: ld.offers.availability ?? null,
    sellerName: ld.offers.seller?.name ?? null
  };
}
