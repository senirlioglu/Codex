import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { adapters, getAdapterByUrl } from "@/lib/merchants";
import { couponCandidatesByMerchant } from "@/lib/config/coupon-candidates";
import { computeMatchScore } from "@/lib/modules/matching";
import { formatResult } from "@/lib/modules/result-formatter";
import { rankRecommendations } from "@/lib/modules/recommendation";
import { normalizeProductUrl } from "@/lib/modules/url-intake";
import { extractProductFromUrl } from "@/lib/modules/extraction";
import { verifyCoupon } from "@/lib/modules/coupon-verification";
import { BotBlockedError } from "@/lib/modules/errors";

type CouponResultWithCandidate = Prisma.CouponTestResultGetPayload<{
  include: { couponCandidate: true };
}>;

type RankedComparisonRow = {
  productSnapshotId: string;
  merchant: string;
  title: string;
  basePrice: number;
  finalPrice: number;
  sellerName: string | null;
  matchScore: number;
};

export async function runAnalysis(inputUrl: string) {
  const intake = normalizeProductUrl(inputUrl);
  if (!intake.supported) throw new Error("Domain desteklenmiyor.");

  const sourceAdapter = getAdapterByUrl(intake.normalizedUrl);
  if (!sourceAdapter) throw new Error("Bu URL için adapter bulunamadı.");

  const analysis = await prisma.analysisRequest.create({
    data: {
      inputUrl: intake.normalizedUrl,
      sourceDomain: intake.domain,
      status: "running"
    }
  });

  try {
    const source = await extractProductFromUrl(intake.normalizedUrl, sourceAdapter);
    const sourceSnap = await prisma.productSnapshot.create({
      data: {
        analysisRequestId: analysis.id,
        merchant: source.merchant,
        productUrl: source.productUrl,
        title: source.title,
        brand: source.brand,
        model: source.model,
        variant: source.variant,
        imageUrl: source.imageUrl,
        sku: source.sku,
        mpn: source.mpn,
        extractedPrice: source.extractedPrice,
        shippingPrice: source.shippingPrice,
        currency: source.currency,
        availability: source.availability,
        sellerName: source.sellerName,
        matchScore: 100,
        isSourceProduct: true
      }
    });

    const comparisonSnapshots = [sourceSnap];
    const rawNotes: string[] = [];

    for (const adapter of adapters.filter((a) => a.name !== sourceAdapter.name)) {
      try {
        const matched = await adapter.searchEquivalentProduct(source);
        if (!matched) {
          rawNotes.push(`${adapter.name}: Aynı ürün bulunamadı`);
          continue;
        }
        const score = computeMatchScore(source, matched);
        const snap = await prisma.productSnapshot.create({
          data: {
            analysisRequestId: analysis.id,
            merchant: matched.merchant,
            productUrl: matched.productUrl,
            title: matched.title,
            brand: matched.brand,
            model: matched.model,
            variant: matched.variant,
            imageUrl: matched.imageUrl,
            sku: matched.sku,
            mpn: matched.mpn,
            extractedPrice: matched.extractedPrice,
            shippingPrice: matched.shippingPrice,
            currency: matched.currency,
            availability: matched.availability,
            sellerName: matched.sellerName,
            matchScore: score,
            isSourceProduct: false
          }
        });
        comparisonSnapshots.push(snap);
      } catch (error) {
        if (error instanceof BotBlockedError) {
          rawNotes.push(`${adapter.name}: Bot/captcha engeli nedeniyle bu merchant atlandı`);
        } else {
          rawNotes.push(`${adapter.name}: ${(error as Error).message}`);
        }
      }
    }

    const couponResults: CouponResultWithCandidate[] = [];
    for (const snap of comparisonSnapshots) {
      const candidates = couponCandidatesByMerchant[snap.merchant] ?? [];
      for (const c of candidates) {
        const coupon = await prisma.couponCandidate.upsert({
          where: { merchant_code: { merchant: snap.merchant, code: c.code } },
          update: { source: c.source, notes: c.notes ?? null, active: true },
          create: {
            merchant: snap.merchant,
            code: c.code,
            source: c.source,
            notes: c.notes ?? null,
            active: true
          }
        });

        const adapter = adapters.find((a) => a.name === snap.merchant);
        if (!adapter) continue;

        const result = await verifyCoupon(adapter, snap.productUrl, c.code, analysis.id);
        const saved = await prisma.couponTestResult.create({
          data: {
            analysisRequestId: analysis.id,
            productSnapshotId: snap.id,
            couponCandidateId: coupon.id,
            status: result.status,
            beforePrice: result.beforePrice,
            afterPrice: result.afterPrice,
            message: result.message,
            screenshotPath: result.screenshotPath
          },
          include: { couponCandidate: true }
        });
        couponResults.push(saved);
      }
    }

    const comparison: RankedComparisonRow[] = comparisonSnapshots.map((s) => {
      const applied = couponResults
        .filter((r) => r.productSnapshotId === s.id && r.status === "applied" && r.afterPrice)
        .sort((a, b) => Number(a.afterPrice) - Number(b.afterPrice))[0];
      const finalPrice = applied?.afterPrice ?? s.extractedPrice;

      return {
        productSnapshotId: s.id,
        merchant: s.merchant,
        title: s.title,
        basePrice: s.extractedPrice,
        finalPrice,
        sellerName: s.sellerName,
        matchScore: s.matchScore
      };
    });

    const ranked = rankRecommendations(comparison);
    const bestAppliedCouponResult = couponResults
      .filter((result) => result.status === "applied" && result.afterPrice !== null)
      .sort((a, b) => Number(a.afterPrice) - Number(b.afterPrice))[0];

    const formatted = formatResult({
      currency: source.currency,
      bestOverall: ranked.bestOverall,
      comparison,
      couponResults: couponResults.map((r) => ({
        id: r.id,
        code: r.couponCandidate.code,
        status: r.status,
        message: r.message,
        beforePrice: r.beforePrice,
        afterPrice: r.afterPrice
      })),
      rawNotes
    });

    await prisma.recommendation.create({
      data: {
        analysisRequestId: analysis.id,
        bestOverallProductSnapshotId: ranked.bestOverall.productSnapshotId,
        bestVerifiedCouponResultId: bestAppliedCouponResult?.id,
        summaryJson: formatted as unknown as object
      }
    });

    await prisma.analysisRequest.update({ where: { id: analysis.id }, data: { status: "completed" } });
    return analysis.id;
  } catch (error) {
    await prisma.analysisRequest.update({ where: { id: analysis.id }, data: { status: "failed" } });
    throw error;
  }
}

export async function getAnalysisResult(id: string) {
  const analysis = await prisma.analysisRequest.findUnique({
    where: { id },
    include: {
      recommendation: true
    }
  });

  if (!analysis) return null;
  return {
    id: analysis.id,
    status: analysis.status,
    result: analysis.recommendation?.summaryJson ?? null
  };
}
