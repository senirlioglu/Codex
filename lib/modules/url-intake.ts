import { z } from "zod";
import { supportedMerchantDomains } from "@/lib/config/merchant-hosts";

export const urlInputSchema = z.object({
  inputUrl: z.string().url("Geçerli bir URL giriniz.")
});

export function isSupportedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return supportedMerchantDomains.some((domain) => isMerchantHost(host, domain));
}

export function isMerchantHost(hostname: string, merchantDomain: string): boolean {
  const host = hostname.toLowerCase();
  const domain = merchantDomain.toLowerCase();
  return host === domain || host === `www.${domain}`;
}

export function normalizeProductUrl(raw: string) {
  const url = new URL(raw.trim());
  url.hash = "";

  const utmKeys = [...url.searchParams.keys()].filter((key) => key.toLowerCase().startsWith("utm_"));
  for (const key of utmKeys) {
    url.searchParams.delete(key);
  }

  const domain = url.hostname.toLowerCase();
  const supported = isSupportedHost(domain);

  return {
    normalizedUrl: url.toString(),
    domain,
    supported
  };
}
