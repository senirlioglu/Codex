interface Candidate {
  productSnapshotId: string;
  merchant: string;
  title: string;
  basePrice: number;
  finalPrice: number;
  matchScore: number;
  sellerName?: string | null;
}

export function rankRecommendations(candidates: Candidate[]) {
  const sorted = [...candidates].sort((a, b) => {
    const scoreA = a.finalPrice * 0.7 - a.matchScore * 2;
    const scoreB = b.finalPrice * 0.7 - b.matchScore * 2;
    return scoreA - scoreB;
  });

  return {
    bestOverall: sorted[0],
    cheapestBasePrice: [...candidates].sort((a, b) => a.basePrice - b.basePrice)[0],
    bestWithoutCoupon: [...candidates].sort((a, b) => a.basePrice - b.basePrice)[0]
  };
}
