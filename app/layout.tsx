import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PricePilot AI | Akıllı Satın Alma Karar Motoru",
  description: "Ürün linkini analiz eder, fiyatları karşılaştırır, kuponları test eder ve en iyi satın alma kararını verir."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
