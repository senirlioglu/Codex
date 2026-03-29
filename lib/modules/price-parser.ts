export function parseTryPriceFromText(text: string | null): number | null {
  if (!text) return null;

  const normalized = text.replace(/\u00a0/g, " ");
  const matches = normalized.match(/\b\d{1,3}(?:\.\d{3})*(?:,\d{2})\s?TL\b/gi);
  if (!matches?.length) return null;

  const raw = matches[matches.length - 1].replace(/\s?TL/i, "").trim();
  const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
