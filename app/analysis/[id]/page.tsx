import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

async function getData(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/analyze/${id}`, {
    cache: "no-store"
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
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
