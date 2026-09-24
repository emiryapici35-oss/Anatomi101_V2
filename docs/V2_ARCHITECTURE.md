# Anatomi 101 V2 mimarisi

Bu belge çalışan V2 uygulamasını anlatır. Önceki 2D/3D model denemeleri ürün akışından kaldırılmıştır; ana çalışma yüzeyi quiz merkezi ve terim kartıdır.

## Çalışan dosya yapısı

```text
app/
  components/
    AnatomyExplorer.tsx      # üst arama, tema, ana yerleşim ve günlük soru
    Sidebar.tsx              # sistem > bölge/grup > yapı accordion menüsü
    QuizCenter.tsx           # klasik quiz, 60 saniye modu ve analiz
    DetailCard.tsx           # terim, etimoloji ve tıbbi Latince okunuş
    DailyChallengeModal.tsx  # günlük üç seçenekli yerel soru
    ProfileMenu.tsx          # seri, çerçeve ve oturum görünümü
    AuthCard.tsx             # giriş, kayıt ve şifre yenileme
  data/
    anatomy.ts               # 206 kemik ve katalog birleştirme/denetim katmanı
    expanded-anatomy.ts      # ayrıntılı sistem terimleri
    quiz-visuals.ts          # doğrulanmış, kaynaklı görsel eşlemeleri
    etymology.ts             # güvenli kök sözlüğü ve parçalayıcı
    latin-pronunciation.ts   # kural tabanlı fonetik dönüşüm
  lib/
    anatomy-search.ts        # Türkçe/Latince yaklaşık arama
    quiz.ts                  # dengeli soru ve 5 benzersiz seçenek üretimi
    daily.ts                 # yerel gün ve seri hesabı
    supabase/auth.ts         # Supabase Auth REST istemcisi
  (auth)/                    # login, register, forgot-password rotaları
  about/                     # katalog kapsamı ve kaynak şeffaflığı
  privacy/                   # veri saklama açıklaması
supabase/schema.sql          # RLS, profil, günlük soru ve ödül şeması
scripts/audit-catalog.mjs    # yayın sırasında katalog + quiz bütünlük testi
```

## Veri akışı

`anatomy.ts`, çekirdek kemik verisi ile `expanded-anatomy.ts` içeriğini birleştirir. Aynı sistemde aynı kanonik Latince ada sahip kayıtlar tek öğrenme birimine indirilir. `validateAnatomyCatalog()` şu hatalarda uygulama derlemesini durdurur:

- boş kimlik, Latince/Türkçe ad, grup veya not;
- yinelenen kimlik ya da kanonik Latince terim;
- geçersiz koordinat;
- yetişkin iskeletinin 206 kayıt üretmemesi.

`scripts/audit-catalog.mjs` buna ek olarak her sistemden klasik ve hızlı quiz üretir; her sorunun doğru cevabı içeren beş benzersiz seçeneği olduğunu denetler. Bu test veri bütünlüğünü kanıtlar, tıbbi uygunluk belgesi değildir.

## Quiz ve yerel ilerleme

Klasik mod 5, 10 veya 20 soru üretir. Sorular gruplar arasında dengelenir ve mümkün olduğunda aynı anatomik gruptan güçlü çeldiriciler seçilir. Görsel yalnızca güvenle temsil edilebilen büyük yapılarda gösterilir; görsel yüklenmezse soru metinle çalışmaya devam eder.

Hız modu 60 saniyelik süreyi `performance.now()` tabanlı monotonic sayaçla yönetir. Sonuçlar, konu grubu doğrulukları ve en iyi hız sonucu en fazla 50 deneme olacak şekilde tarayıcıda saklanır.

Misafir ilerlemesi `localStorage` içindedir. Hesap açmak şu sürümde yerel quiz geçmişini cihazlar arasında otomatik eşitlemez; arayüz ve gizlilik sayfası bunu açıkça belirtir.

## Kimlik ve günlük seri

Supabase etkinleştirildiğinde istemci yalnızca public/anon anahtarı kullanır. `schema.sql` yeni Auth kullanıcısı için profil oluşturur. RLS her kullanıcının yalnızca kendi profilini, denemelerini ve ödüllerini okumasına izin verir.

Sunucu tabanlı günlük seri akışında kullanılmak üzere `submit_daily_answer` SECURITY DEFINER fonksiyonu bulunur. İstemci doğrudan seri alanlarını değiştiremez; profil koruma tetikleyicisi seri alanlarını ve kilitli çerçeveleri korur. Gün hesabı profil saat dilimiyle yapılır.

Not: çalışan arayüzde günlük soru yerel-önceliklidir. Sunucu tabanlı seri kullanılacak yayında günlük soruların `daily_challenges` tablosuna güvenilir bir zamanlanmış görevle önceden yazılması ve istemcinin RPC akışına bağlanması gerekir.

## Tıbbi terminoloji yayın kapısı

Güncel resmî referans IFAA/FIPAT Terminologia Anatomica Humana (TAH) portalıdır. `scripts/audit_fipat.py` arşiv TA2 PDF kimlikleri için geriye dönük bir yardımcıdır ve TAH kapsam onayı sayılmaz.

“Eksiksiz tıp fakültesi kataloğu” ifadesi ancak şu üç çıktı varsa kullanılmalıdır:

1. Her kayıtta güncel TAH birim kimliği ve kaynak URI'si.
2. TAH dışı öğretim/klinik terimler için açık kapsam kararı ve eşanlam politikası.
3. Türkçe karşılıklar, hiyerarşi, telaffuz ve quiz çeldiricileri için anatomi uzmanı editör onayı.

## Yayın

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm run start
```

İlk komut lint, katalog/quiz denetimi ve production build çalıştırır. Supabase ortam değişkenleri ve e-posta/redirect ayarları gerçek yayın alan adında ayrıca uçtan uca test edilmelidir.
