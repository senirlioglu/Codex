export type MerchantName = "hepsiburada" | "idefix" | "generic";

export type CouponStatus =
  | "applied"
  | "rejected"
  | "login_required"
  | "coupon_field_missing"
  | "cart_failed"
  | "unknown";

export interface NormalizedProduct {
  merchant: MerchantName;
  productUrl: string;
  title: string;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  imageUrl?: string | null;
  sku?: string | null;
  mpn?: string | null;
  extractedPrice: number;
  shippingPrice?: number | null;
  currency: string;
  availability?: string | null;
  sellerName?: string | null;
}

export interface CouponVerificationResult {
  status: CouponStatus;
  beforePrice?: number | null;
  afterPrice?: number | null;
  message: string;
  screenshotPath?: string | null;
}
