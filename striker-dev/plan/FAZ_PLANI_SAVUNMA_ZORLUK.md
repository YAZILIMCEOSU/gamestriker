# Savunma, Zorluk ve Mimari Fazları

Her faz: sayfa hatası yok, ekran görüntüsü veya ölçüm kanıtı, ayrı commit.

## Faz A — Mimari ve yerleşim (KISMEN TAMAM)
- Köprülerdeki uçaksavar (aa) parçaları kaldırıldı. Köprülerin dağ tepesi yedek aramaları kapatıldı.
- Hedef yerleşiminde 230 m içinde çakışma varsa, aynı arazi koşulunu koruyan konuma kaydırılıyor.
- Ölçüm: 1. görevde 8 hedef, çakışan çift 0, köprü 0, hata yok.
- Açık: Köprü etrafında yol ve kentsel doku yok. Kent / askeri / sivil bölge tipleri henüz yok.

## Faz B — Adacık ve kent dokusu
- Her ada için bölge tipi: sivil kent, askeri üs, sanayi, kırsal. Yol ağı ve bina yoğunluğu bu tipe göre.
- Köprülerin iki ucunda yol bağlantısı.

## Faz C — Hedef savunması (oyunu zevkli yapan çekirdek)
- Yerdeki ve denizdeki hedefler (SAM, uçaksavar, korvet, muhrip) oyuncu yakınken karşılık verir.
- Havadaki düşman uçakları oyuncuya saldırır: takip, manevra (yan dönüş, dalış) ve ateş.
- Önce yakın mesafe, sonra menzil kuralları.

## Faz D — Zorluk seviyeleri (kolay / orta / zor)
- Mevcut `preferences.difficulty` ve `di` (0–4) altyapısı var, UI'da 3 seviye olarak sunulacak.
- Her seviye için: düşman ateş sıklığı, takviye hızı, manevra kabiliyeti, hedef sayısı.

## Faz E — 205 görevin mantığı
- Her görev için tek cümlelik amaç ve kural (ör. "köprüyü koru", "konvoyu durdur", "denizaltıyı bul").
- Mevcut konsept dosyası: `plan/KONSEPTLER_192.md` ile birleştirilecek.

## Faz F — Grafik kalitesi (1.7 / 1.8 referansı)
- Referans dosya gerekli: v1.7 dosyası yüklenmemiş. 1.8 dosyası elimizde.
- Hedef ve arazi görselleri, yakın kamera, gölge ve partikül kalitesi.
