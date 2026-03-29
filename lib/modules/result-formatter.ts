export function formatResult(payload: {
  currency: string;
  bestOverall: any;
  comparison: any[];
  couponResults: any[];
  rawNotes: string[];
}) {
  return {
    ...payload,
    explanation:
      "Final fiyat, kupon doğrulama sonucu ve eşleşme güveni birlikte değerlendirilerek bu öneri üretildi.",
    verifiedVsEstimated: {
      verified: payload.couponResults.filter((r) => r.status === "applied" || r.status === "rejected").length,
      estimated: payload.couponResults.filter((r) => r.status === "unknown").length
    }
  };
}
