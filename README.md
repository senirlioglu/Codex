# PricePilot AI

**Slogan:** Linkten Karara: En Akıllı Satın Alma Rotası.

PricePilot AI, ürün linkinden başlayarak desteklenen pazaryerlerinde eşdeğer ürünü arayan, fiyat ve kupon doğrulaması yapan AI destekli satın alma karar motoru MVP'sidir.

## Marka Kimliği
- **Ad:** PricePilot AI
- **Slogan:** Linkten Karara
- **Renkler:** Brand cyan/mavi skala (`brand.500 #10b3e8`, `brand.900 #053656`)
- **Tipografi:** Next.js varsayılan modern sans
- **Dil:** Dürüst, teknik, karar odaklı

## Ana Özellikler (MVP)
1. Ürün URL intake + domain doğrulama
2. Kaynak üründen normalize ürün çıkarımı
3. Hepsiburada / idefix eş ürün arama ve eşleşme skoru
4. Fiyat istihbaratı ve karşılaştırma
5. Merchant bazlı kupon adayları
6. Playwright ile sepette kupon doğrulama
7. Recommendation engine + sonuç formatlayıcı

## Mimari
- `lib/modules/url-intake.ts`: URL normalize + destek kontrolü
- `lib/modules/extraction.ts`: Ürün bilgisi çıkarımı (LD+JSON)
- `lib/merchants/*`: Merchant adapter altyapısı
- `lib/modules/matching.ts`: Eşleşme skorlama
- `lib/modules/coupon-verification.ts`: Playwright kupon testi
- `lib/modules/recommendation.ts`: Sıralama motoru
- `lib/modules/result-formatter.ts`: UI-ready JSON
- `app/api/analyze/*`: API route handlers

## Kurulum
```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

> Not: Prisma SQLite bağlantısı `SQLITE_DATABASE_URL` değişkenini kullanır (örn. `file:./dev.db`).

## Akış
1. `/` sayfasına ürün linki girilir.
2. `POST /api/analyze` analizi çalıştırır.
3. Ürün extraction + diğer merchant araması.
4. Kupon discovery config'ten adaylar alınır.
5. Playwright ile kupon testi çalışır.
6. Recommendation üretilir, DB'ye yazılır.
7. `/analysis/:id` sonuç ekranı gösterilir.

## Hata Yönetimi
- Domain desteklenmiyor
- Ürün parse edilemedi
- Eş ürün bulunamadı
- Sepet/kupon alanı hataları
- Bot/rate-limit gibi durumlar `rawNotes` içinde kullanıcıya şeffaf gösterilir.

## MVP vs Sonraki Faz
### MVP
- Senkron analiz
- Hepsiburada + idefix adapter
- Config tabanlı kupon adayları
- Tek endpoint akışı

### Sonraki Faz
- Queue tabanlı async job (BullMQ)
- Daha zengin anti-bot ve retry stratejisi
- Harici kupon discovery kaynakları
- Gelişmiş satıcı güven skoru
- Kullanıcı geçmişi ve fiyat alarmı
