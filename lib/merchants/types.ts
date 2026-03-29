import { CouponVerificationResult, MerchantName, NormalizedProduct } from "@/lib/types/domain";

export interface MerchantAdapter {
  name: MerchantName;
  canHandle(url: string): boolean;
  fetchHtml(url: string): Promise<string>;
  extractProduct(url: string): Promise<NormalizedProduct>;
  searchEquivalentProduct(reference: NormalizedProduct): Promise<NormalizedProduct | null>;
  addToCart(page: import("playwright").Page, productUrl: string): Promise<boolean>;
  goToCart(page: import("playwright").Page): Promise<boolean>;
  applyCoupon(page: import("playwright").Page, code: string): Promise<CouponVerificationResult>;
  readCartState(page: import("playwright").Page): Promise<{ total: number | null; message?: string }>;
}
