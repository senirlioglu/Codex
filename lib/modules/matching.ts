import { NormalizedProduct } from "@/lib/types/domain";

function tokenSet(text: string) {
  return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean));
}

export function computeMatchScore(reference: NormalizedProduct, candidate: NormalizedProduct): number {
  let score = 0;
  if (reference.brand && candidate.brand && reference.brand.toLowerCase() === candidate.brand.toLowerCase()) score += 30;
  if (reference.model && candidate.model && reference.model.toLowerCase() === candidate.model.toLowerCase()) score += 30;

  const a = tokenSet(reference.title);
  const b = tokenSet(candidate.title);
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size || 1;
  score += Math.round((inter / union) * 30);

  const priceDiffRatio = Math.abs(reference.extractedPrice - candidate.extractedPrice) / Math.max(reference.extractedPrice, 1);
  if (priceDiffRatio < 0.15) score += 10;

  return Math.min(100, score);
}
