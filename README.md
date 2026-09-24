# Anatomi 101 V2

Tıp ve sağlık bilimleri öğrencileri için Türkçe–Latince anatomi terimleri, klasik quiz, 60 saniyelik hız turu, günlük soru, seri ve profil çerçeveleri sunan Next.js uygulaması.

## Yerelde çalıştırma

Gereksinimler: Node.js 20.9 veya üzeri ve npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Tarayıcıdan `http://localhost:3000` adresini açın. Supabase değişkenleri boş bırakılırsa atlas ve quizler misafir modunda çalışır; hesap sayfaları bunun yapılandırılmadığını açıkça belirtir.

## Hesap sistemini açma

1. Bir Supabase projesi oluşturun.
2. `supabase/schema.sql` dosyasını Supabase SQL Editor içinde bir kez çalıştırın.
3. `.env.local` dosyasına Project URL ve anon/public anahtarını ekleyin.
4. Supabase Authentication > URL Configuration içinde yayın adresini Site URL olarak, `/forgot-password` dönüş adresini de izin verilen redirect listesine ekleyin.
5. E-posta doğrulaması kullanılıyorsa Supabase e-posta sağlayıcısını ve şablonlarını yayın öncesinde test edin.

İstemciye yalnızca `anon` anahtarı konur; `service_role` anahtarı hiçbir zaman `NEXT_PUBLIC_*` değişkenine yazılmaz.

## Yayın öncesi kontrol

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

`npm run check` sırasıyla ESLint, katalog yapısal denetimi ve production build çalıştırır. Katalog denetimi benzersiz kimlikleri ve Latince terimleri, zorunlu alanları, koordinatları, quiz için kategori yeterliliğini ve yetişkin iskeletindeki 206 kemik kuralını doğrular.

Production çalıştırma:

```bash
npm run build
npm run start
```

Vercel kullanılıyorsa `.env.local` içindeki üç değişkeni proje ortam değişkenlerine ekleyin ve `NEXT_PUBLIC_SITE_URL` değerini gerçek HTTPS alan adına çevirin.

## Katalog ve tıbbi içerik

- Ana veri: `app/data/anatomy.ts`
- Genişletilmiş terimler: `app/data/expanded-anatomy.ts`
- Yapısal denetim: `scripts/audit-catalog.mjs`
- Ontoloji ve eski TA2 karşılaştırma yardımcıları: `scripts/build_atlas.py`, `scripts/audit_fipat.py`

Latince terminoloji için güncel temel referans IFAA/FIPAT Terminologia Anatomica Humana (TAH) portalıdır. `audit_fipat.py` yalnızca eski TA2 PDF kimlikleriyle geriye dönük karşılaştırma yapar; güncel TAH uygunluk belgesi değildir. Otomatik denetimler veri bütünlüğünü ölçer, terminolojik doğruluk veya tıp fakültesi müfredatında mutlak eksiksizlik iddiası yerine geçmez. Her katalog sürümü, güncel TAH birim kimlikleriyle eşleştirilmiş bir kaynak tablosu ve anatomi uzmanı editör onayıyla yayınlanmalıdır.

## Veri ve gizlilik

Misafir modunda tema, quiz geçmişi, günlük seri ve profil çerçevesi tarayıcının `localStorage` alanında tutulur. Hesap açılması bu yerel quiz geçmişini şu an otomatik olarak başka cihaza taşımaz. Harici quiz görselleri Wikimedia Commons kaynaklıdır ve her görselin kaynak bağlantısı arayüzde gösterilir. Uygulama eğitim amaçlıdır; tanı veya tedavi aracı değildir.
