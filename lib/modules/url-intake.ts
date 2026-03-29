import { z } from "zod";

const supportedDomains = ["hepsiburada.com", "idefix.com"] as const;

export const urlInputSchema = z.object({
  inputUrl: z.string().url("Geçerli bir URL giriniz.")
});

export function isSupportedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return supportedDomains.some((domain) => host === domain || host === `www.${domain}`);
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
