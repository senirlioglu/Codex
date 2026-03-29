export const couponCandidatesByMerchant: Record<string, Array<{ code: string; source: string; notes?: string }>> = {
  hepsiburada: [
    { code: "WELCOME10", source: "manual_config", notes: "Yeni kullanıcı kuponu olabilir" },
    { code: "SEPET5", source: "manual_config" }
  ],
  idefix: [
    { code: "IDEFIX10", source: "manual_config" },
    { code: "KITAP5", source: "manual_config" }
  ]
};
