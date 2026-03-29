import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { getAnalysisResult } from "@/lib/modules/analyze";

type AnalysisResultPayload = {
  bestOverall: { title: string; merchant: string; finalPrice: number };
  currency: string;
  explanation: string;
  comparison: Array<{
    productSnapshotId: string;
    merchant: string;
    title: string;
    basePrice: number;
    finalPrice: number;
    sellerName?: string | null;
    matchScore: number;
  }>;
  couponResults: Array<{
    id: string;
    code: string;
    status: string;
    message: string;
    beforePrice?: number | null;
    afterPrice?: number | null;
  }>;
  rawNotes: string[];
};

function isAnalysisResultPayload(value: unknown): value is AnalysisResultPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<AnalysisResultPayload>;
  return Boolean(payload.bestOverall && payload.currency && payload.explanation);
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnalysisResult(id);
  if (!data) return notFound();

  if (data.status !== "completed") {
    return (
      <div className="card space-y-3">
        <h2 className="text-2xl font-bold">Analiz devam ediyor...</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          <li>Ürün bilgisi çıkarılıyor</li>
          <li>Alternatif siteler aranıyor</li>
          <li>Fiyatlar toplanıyor</li>
          <li>Kuponlar test ediliyor</li>
          <li>Sonuç hazırlanıyor</li>
        </ul>
      </div>
    );
  }

  if (!isAnalysisResultPayload(data.result)) {
    return (
      <div className="card space-y-2">
        <h2 className="text-2xl font-bold">Sonuç henüz hazır değil</h2>
        <p className="text-sm text-slate-700">
          Analiz tamamlandı olarak işaretlense de sonuç özeti bulunamadı. Lütfen analizi tekrar başlatın.
        </p>
      </div>
    );
  }
  const result = data.result;

  return (
    <div className="space-y-6">
      <section className="card border-brand-100 bg-brand-50">
        <p className="text-xs uppercase tracking-widest text-brand-700">Önerilen Seçenek</p>
        <h1 className="mt-2 text-2xl font-bold">{result.bestOverall.title}</h1>
        <p className="mt-2 text-sm text-slate-700">
          {result.bestOverall.merchant} · Final fiyat: {result.bestOverall.finalPrice} {result.currency}
        </p>
        <p className="mt-1 text-sm text-slate-700">Neden: {result.explanation}</p>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Fiyat Karşılaştırma</h2>
        <div className="space-y-3">
          {result.comparison.map((item: any) => (
            <div key={item.productSnapshotId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-semibold">{item.merchant}</p>
              <p>{item.title}</p>
              <p>Liste fiyatı: {item.basePrice} {result.currency}</p>
              <p>Final fiyat: {item.finalPrice} {result.currency}</p>
              <p>Satıcı: {item.sellerName ?? "Bilinmiyor"}</p>
              <p>Eşleşme skoru: {item.matchScore}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Kupon Sonuçları</h2>
        <div className="space-y-3">
          {result.couponResults.map((coupon: any) => (
            <div key={coupon.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold">{coupon.code}</p>
                <StatusBadge status={coupon.status} />
              </div>
              <p>{coupon.message}</p>
              <p>
                {coupon.beforePrice} → {coupon.afterPrice} {result.currency}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Teknik Notlar</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {result.rawNotes.map((note: string) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
