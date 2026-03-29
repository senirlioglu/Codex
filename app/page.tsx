"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputUrl: url })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analiz başlatılamadı.");
      router.push(`/analysis/${data.analysisId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="card bg-gradient-to-r from-brand-900 to-brand-700 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-100">PricePilot AI</p>
        <h1 className="mt-2 text-3xl font-bold">Linkten Karara: En Akıllı Satın Alma Rotası</h1>
        <p className="mt-2 max-w-3xl text-brand-50">
          Ürünü farklı sitelerde karşılaştırır, kuponları dener, en iyi satın alma seçeneğini bulur.
        </p>
      </header>

      <section className="card space-y-4">
        <label className="block text-sm font-medium text-slate-700">Ürün Linki</label>
        <input
          type="url"
          placeholder="https://www.hepsiburada.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-brand-500 focus:ring"
        />
        <button
          disabled={loading || !url}
          onClick={run}
          className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analiz Yapılıyor..." : "Analiz Et"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {["Doğrulanmış Kupon", "Gerçek Final Fiyat", "Neden Bu Site?"].map((item) => (
          <div key={item} className="card text-sm font-medium text-slate-700">
            {item}
          </div>
        ))}
      </section>
    </div>
  );
}
