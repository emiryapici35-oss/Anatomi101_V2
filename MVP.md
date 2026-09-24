5. Teknik Gereksinimler (MVP Kapsamı)
Frontend Odaklı Mimari: MVP aşamasında arka uç (backend) sunucusuna ihtiyaç yoktur. Uygulama React, Vue veya Vanilla JS kullanılarak istemci tarafında (client-side) çalışabilir.

Veri Yapısı: Sistem, organ ve Latince isim eşleşmeleri başlangıçta statik bir JSON dosyası içinde tutulacaktır (Hızlı geliştirme ve kolay güncelleme için).

Görsel Teknoloji: 2D modeller SVG formatında olmalıdır. SVG'lerin içindeki her bir organa veya kemiğe özel id'ler (örn: <path id="os-frontale">) atanarak, sol menüye tıklandığında CSS/JS ile kolayca glow efekti verilebilir.

Responsive (Duyarlı) Tasarım: Masaüstü (3 kolonlu) kullanım önceliklidir, ancak tablet ekranlarına da uyumlu (sağ panelin aşağı veya pop-up olarak kaydığı) bir yapıda olmalıdır.

6. Kapsam Dışı Bırakılanlar (V2 veya Sonrası İçin)
MVP'nin hızlıca test edilip yayına alınabilmesi için aşağıdaki özellikler ilk sürüme dahil edilmemiştir:

3D döndürülebilir anatomik modeller.

Kullanıcı giriş/kayıt sistemi.

Latince kelimelerin sesli telaffuz (text-to-speech) özelliği.

Öğrenmeyi test eden quiz/sınav modülleri.