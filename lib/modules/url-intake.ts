import { z } from "zod";

const supportedDomains = ["hepsiburada.com", "idefix.com"];

export const urlInputSchema = z.object({
  inputUrl: z.string().url("Geçerli bir URL giriniz.")
});

export function normalizeProductUrl(raw: string) {
  const url = new URL(raw.trim());
  url.hash = "";
  url.searchParams.forEach((_, key) => {
    if (key.startsWith("utm_")) url.searchParams.delete(key);
  });
  const domain = url.hostname.replace(/^www\./, "");
  const supported = supportedDomains.some((d) => domain.endsWith(d));

  return {
    normalizedUrl: url.toString(),
    domain,
    supported
  };
}
