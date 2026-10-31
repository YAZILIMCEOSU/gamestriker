# STRIKER — ANA PLAN (tek kaynak)

Bu dosya tüm plan dosyalarındaki AÇIK maddeleri tek sırada toplar. Kaynaklar:
- `../PLAN_GERCEK_DURUM.md` (ölçülmüş gerçek durum, madde 1–15, F1–F8)
- `../PLAN_FAZLAR.md` (ses, replay, mağaza, müzik, yoğunluk)
- `../RAKIP_ANALIZI.md` (K1–K8 kalite fazları)
- `FAZ_PLANI_HEDEF.md` (hedef düzeltme, faz 1–7)
- `FAZ_PLANI_SAVUNMA_ZORLUK.md` (A–F)
- `KONSEPTLER_192.md` (192 görev konsepti)

Kural: Bir madde "Yapıldı" olmak için ölçümle kanıtlanmalı. Her faz: değişiklik → ölçüm veya ekran görüntüsü → hata yok → commit → kullanıcı onayı.

## Sıra (kullanıcı önceliği)

### P1 — Adacıkta kitlenme (oynanabilirlik engeli)
- Sorun: Kara olan, deniz olmayan adacıklarda oyuncu kitleniyor.
- Kaynak: kullanıcı bildirimi; PLAN_GERCEK_DURUM madde 2.
- Yapılacak: Kitlenme senaryosunu yeniden üret (adacık merkezine doğru uçuş), kök nedeni bul (arazi çarpışması, yükseklik kilidi, otomatik pilot). Her adacıkta en az bir deniz çıkışı veya yükselerek geçiş.
- Kanıt: Adacık ölçümü ve kaçış testi.

### P2 — Büyük askeri kara hedefleri
- Sorun: Kara hedefleri küçük; büyük askeri tesis yok.
- Kaynak: kullanıcı isteği; madde 1 (kısmi), madde 3 (askeri alan — açık).
- Yapılacak: Askeri üs (hangar, radar, SAM bataryası, komuta), havaalanı, petrol tesisi. Her biri 200–400 m ölçeğinde.

### P3 — Ormanlık alanlar ve askeri kamplar
- Sorun: Orman ve kamp yok.
- Yapılacak: Adalarda ağaç kümeleri (kara yoğunluğuna bağlı), kamp (çadır, araç, çit).
- Kaynak: kullanıcı isteği; F1 (yollar ve askeri alanlar, kısmi).

### P4 — Adacık ve kent dokusu (Faz B)
- Her ada için tip: sivil kent, askeri üs, sanayi, kırsal. Yol ağı, bina yoğunluğu.
- Köprülerin iki ucunda yol bağlantısı. Köprü denizde kalmasın.
- Kaynak: `FAZ_PLANI_SAVUNMA_ZORLUK.md` Faz B; madde 1 (köprü denize düşüyor).

### P5 — Hedef savunması (Faz C, oyunun çekirdeği)
- Yer ve deniz hedefleri (SAM, uçaksavar, korvet, muhrip) oyuncu yakınken karşılık verir. Köprüde uçaksavar yok (P0'da kaldırıldı).
- Hava düşmanları oyuncuyu takip eder, manevra yapar (yan dönüş, dalış).
- Başıboş devriye (chaseAI, uzaklık > 2600) saldırı koşusuna çevrilir (PLAN_GERCEK_DURUM F1 açık maddesi).
- Helikopter saldırısı yaklaş–geç–sıyrıl sahada gözlenmeli (madde 5).
- Kaynak: Faz C; madde 5, 6, 7.
- Yapıldı (ilk adım): Bombardıman ve ağır hava hedefleri takip moduna alındı (commit 464a3ab).

### P6 — Dost ve düşman bölgeleri, hedef netliği
- Dost/düşman bölge ayrımı (madde 4). Deniz hedefleri ekranda okunur (madde 9). Hedef sayısı azaltılır (madde 10, Faz 4/5).
- Hedef sayacı tutarlılığı: kart, HUD ve sonuç aynı sayıyı göstersin (FAZ_PLANI_HEDEF Faz 6).
- HUD çakışması: ROUTE, mesafe etiketi, ACQUIRING (FAZ_PLANI_HEDEF Faz 7).

### P7 — Zorluk: Kolay / Normal / Yoğun (K7, Faz D)
- Mevcut 5 kademe korunacak (kullanıcı kararı). Her kademe: ateş sıklığı, takviye hızı, manevra, hedef sayısı tablosu.

### P8 — 205 görevin mantığı (Faz E, K2)
- Her görev: tek cümlelik amaç + kural. 192 konsept (`KONSEPTLER_192.md`) bağlanacak.
- Tohumla (seed) hedef dizilimi, tür başına farklı brifing (10 dil). Hedef imza tekilliği ölçümü.
- Kaynak: PLAN_FAZLAR 2d (K2 açık işler a,b,c).

### P9 — Grafik kalitesi (K5, Faz F; referans 1.8)
- Gökyüzü ve sis rengi, gün batımı sıcaklığı, bloom eşiği, yakın kamera, gölge, partikül.
- Hedef görselleri: askeri tesis, orman, kamp, şehir. Kullanıcı referansı: arena.site, 1.8 kalitesi.
- Kaynak: madde 14, K5, Faz F. Açık: titreme (hedef görüntüsü) kaynağı doğrulanmadı.

### P10 — Ses onayları (madde 15)
- Füze ateşleme sesi (C seçildi, sert çıktı — C gömüldü), patlama sesi (B), bomba sesi. Kullanıcı kulak onayı bekliyor.
- Kaynak: PLAN_FAZLAR tablo; K3.

### P11 — Hangar, mağaza ve puanlama (F6, K6)
- Uçak karşılaştırma ekranı (hız, çeviklik, füze, zırh), puanlama formülü açıklaması.
- Çift motorlu model: uçuşta görünürlük ekran görüntüsüyle kanıtlanacak (PLAN_FAZLAR Faz 2).
- Hangar mobil/tablet/PC uyumu: 390×844, 768×1024, 1366×768, 1920×1080 ölçüldü, temiz. Kullanıcı cihaz bilgisi bekleniyor.
- Dost kırlangıç kanat adamı: görünür ve düşmana ateş eder (madde 13).
- Başıboş çift motorlu uçağın amacı net olsun (madde 12).

### P12 — Replay ve video kaydı (PLAN_FAZLAR 2b)
- Oyun içi gerçek oynanış doğrulaması açık. Video kaydı yeni yazılacak.

### P13 — Mobil ve tablet son kontrol (K8, F8)
- Dokunmatik hassasiyet, yatay mod, ses aç/kapa (oyun içi doğrulanmadı).
- Kanıt: 390×844 ve 820×1180 ölçümleri.

### P14 — Reklamlı sürüm (en son)
- Oyun kalitesi tamamlanmadan başlanmayacak. Android ücretsiz + reklamlı paket.

## Durum özeti (bu plana göre)
- Yapıldı (ölçümle): Hangar faz 1–2, mobil hangar düzeni, 8 hedef sınırı (düzeltildi), deniz hedef sayısı (3,6 → 4,6), köprüden uçaksavar kaldırıldı, bombardıman takibi, dağa çarpma (kod, ölçülmedi).
- Kısmi: Adacık yerleşimi (kara oranı düşük), yollar ve askeri alanlar, görev çeşitliliği, grafik ilk iterasyon, helikopter saldırısı.
- Açık: P1 kitlenme, P2–P4 kara hedefleri ve kent, P5 savunma, P6 netlik, P7 zorluk, P8 görev mantığı, P9 grafik, P10 ses onayı, P11 hangar/puan, P12 replay, P13 mobil, P14 reklam.

## YENİ YÖN (kullanıcı kararı, 2026-10-27)
- Referans: 1.7 (git 6539541) ve 1.8 (git 55f71af). İyi olanlar adapte edilecek, kötü olanlar (v3.18 hava/sis, v3.62 arazi ileri bakış) test ile doğrulanıp geri alınacak.
- Ana hedef: tablet ve mobil kalitesi, sonra APK paketi.
- Test araçları: tests/smoke_flight.js (uçuşa giriş, sayfa hatası), tests/islet_sim.js (sabit adımlı uçuş simülasyonu, __sim).
- Ölçüm (güncel v3, idx 1, 60 sim sn, asist açık, girdi yok): 1500 adım, arazi üzerinde %72, en uzak ada mesafesi 8436 m, hedefe doğru uçtu, kilitlenme gözlenmedi. Tuzak henüz tekrar üretilmedi.
- 1.8 tarafı: `window.__sim` oluşmadı. Görev başlatma akışı test scriptinde düzeltilmeli.
- APK: sandbox'ta Android SDK ve Gradle yok (Java 11). Derleme için kullanıcı kararı gerekiyor.

## YARIMADA + KÖRFEZ (Kotor tarzı) - Adım 1 (test görevi id 1)
- Karar (kullanıcı): yarımada + körfez, önce tek test görevi.
- Yapıldı: COAST_IDS={1}; coastTerr() tek yükseklik alanı (yarımada elipsi, dik kıyı duvarları, dar körfez); terr() bu görev için coastTerr kullanıyor; buildCoastMesh() aynı alandan kara mesh'i üretiyor. Blob ada ve yol/üs kurulumu bu görevde atlanır.
- Ölçüm (tests/coast_check.js, idx 1): sayfa hatası yok; merkez kara 1102 m; körfez orta noktası -14 m (deniz); açık deniz -12 m; kara oranı %33. Gemi ve denizaltılar denizde (tests/coast_ents.js).
- Eksik: bu görevde kara hedefi yok (rafineri, radar, hava alanı, SAM). Askeri alanlar ve kıyı kasabaları henüz yok. Sahnede deniz üstünde duran bloklar görüldü, kaynağı doğrulanmadı.
- Sıradaki: kara hedeflerini kıyı ve tepe mantığıyla yerleştirmek; körfez içi adacıkları ekleyip askeri/sivil işlev vermek; ada kilitlenme testini bu haritada tekrarlamak.
