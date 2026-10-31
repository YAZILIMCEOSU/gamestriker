# Gerçek durum tablosu (kullanıcı istekleri, kaynak: striker-plan.md, striker-faz-plani-v2.md, PLAN_FAZLAR.md)

Kural: "Yapıldı" yalnızca ölçümle kanıtlanmış iş için yazılır. Kodda var ama ölçülmemişse "kısmi".

| # | İstek | Durum | Kanıt / eksik |
|---|---|---|---|
| 1 | Kara hedefleri gerçekçi (köprü, rafineri, radar, hava alanı, liman, depo, kule) | Kısmi | Modeller var; köprü denizde kalabiliyor (bridgeSpan geri dönüşü). Ölçülmedi |
| 2 | Adacıklar: yeterli kara ve gerçekçi yerleşim | Açık | Kullanıcı: "deniz ortasında köprü", "adacık çok yetersiz" |
| 3 | Askeri alan, yollar, destekli köprü (mantık) | Açık | Hiç yapılmadı |
| 4 | Dost ve düşman bölgeleri net | Açık | Hiç yapılmadı |
| 5 | Helikopter saldırısı (yaklaş-geç-sıyrıl) | Kısmi | v3.65 notu: saldırı koşusu kodu var; sahada gözlenmedi |
| 6 | Dron (TB2/TB3/Kızılelma benzeri, dost ve düşman) | Açık | R14 ⬜ |
| 7 | Korvet, destroyer, helikopter, uçaksavar | Kısmi | R15: korvet var; AA ve helikopter sınırlı |
| 8 | Her görev farklı (201 görev, ~10 şehir/ada konsepti) | Kısmi | Hedef imzası 53→144 (K2); ada yerleşimi hâlâ aynı, ölçülmedi |
| 9 | Deniz hedefleri ekranda okunur | Açık | Kullanıcı şikâyeti; işaret kuralı deniz hedeflerini ayırt etmiyor |
| 10 | Hedef sayısı azaltılsın | Açık | Kullanıcı şikâyeti; yoğunluk ayarı yok (Faz 4) |
| 11 | Hangar: çift motor, net puanlama, rakiplerle eşdeğer | Kısmi | Satın alma ve uçuşta SPECTRE doğrulandı (v390hangar.js). Hangar karşılaştırma ekranı yok |
| 12 | Uçuş pilotu: başıboş çift motorlu uçağın amacı net olsun | Açık | drone/kırlangıç kaynağı doğrulanmadı |
| 13 | Dost kanat adamı (KIRLANGIÇ) görünür, düşmana ateş eder | Kısmi | Kod var; amaç ve davranış gözlenmedi |
| 14 | Görüntü kalitesi (rakip seviyesi, referans video) | Kısmi | K5 ilk iterasyon: pozlama .84; gökyüzü ve sis açık |
| 15 | Ses kalitesi (rakip seviyesi) | Kısmi | Füze C, patlama B; kullanıcı onayı bekleniyor |

## Fazlar (sırayla, her faz ölçümle kapanır)
- **F1 — Kara ve deniz yerleşimi:** köprü denizde kalmasın (her köprünün iki ucu kara), adacık sayısı ve boyutu, kara hedeflerinin ulaşılabilir olması. Kanıt: görev başına köprü uç yüksekliği ölçümü.
- **F2 — Askeri alan ve yol:** her kara bölgesinde hedef grubu, kısa yol bağlantıları. Kanıt: ekran görüntüsü ve kara hedefi tablosu.
- **F3 — Dost/düşman bölgeleri:** harita üzerinde net bölge ayrımı ve HUD'da gösterim.
- **F4 — Düşman tipleri:** helikopter ve dron saldırı koşuları (R5, R6, R7), dost dron (R14).
- **F5 — Hedef okunurluğu ve yoğunluk:** deniz hedeflerinin ayrı işareti, hedef sayısı tablosu (Kolay/Normal/Yoğun).
- **F6 — Hangar ve puanlama:** karşılaştırma ekranı, puan açıklaması.
- **F7 — Dost kanat adamı:** amaç, davranış, ölçüm.
- **F8 — Görüntü ve ses son kalite:** K5 devamı, ses onayı.

## Uygulama kayıtları
- **Gizli havadaki düşmanlar (uçak gemisi grupları dahil):** Eskiden `y=-400` yeraltına gizleniyordu. Şimdi yerinde bekliyor, ateş etmiyor ve zamanı gelince saldırıyor. Ölçüm (`tests/dormant_check.js`), görev 0 başında: önce 6/6 yeraltında; sonra 0/6 yeraltında, 6 bekliyor. Yedek: `/tmp/index_pre_dormant.html`.
- **Köprü ayakları:** Ayaklar `y` 5'te bitiyordu, güverte 14'te başlıyordu (9 m boşluk). Ayaklar güverteye bağlandı (üst uç 14). Geometri hesabı yapıldı; görsel doğrulama henüz yok.
- **Köprü yerleşimi (`tests/bridge_sim.js`):** 201 görev × 3 köprü, denize düşen köprü: 0. Bu yalnızca yerleşim ölçütünü doğruluyor. Yol ve askeri alan henüz yok, F1 tamamlanmadı.
- **Adacık yerleşimi (F1):** Eski: ada 6–9, kümeler haritanın köşesinde (merkezden 5–7 km). Merkez 5 km içinde kara oranı ortalama %21, en düşük %0.2, 8 görevde neredeyse hiç kara yok. Yeni: ada 9–13, yarıçap büyütüldü, ana ada ≥6200 m, adacıklar ≥3300 m uzakta (küme merkezi 0.6 ölçekli). Merkez 5 km içinde kara oranı ortalama %18, en düşük %9.3, 0 görevde kara yok. Başlangıç ve uçak gemisi noktaları: eski 101–141 görevde karada, yeni 0–5 görevde. Ölçüm: `tests/center_land.js`, `tests/land_measure.js`, `tests/bridge_sim.js` (köprü denize düşen: 0). Açık: ortalama kara oranı eski değerin altında; daha fazla kara için ikinci bir küme gerekiyor (kullanıcı kararı).
- Yedekler: `/tmp/index_pre_islets.html`, `/tmp/index_pre_pushout.html`.

## Yayın ve gelir kararı (kullanıcı, son tur)
- Platform: **Android (Play Store)**.
- Sıra: **önce oynanış sorunları**, reklam sonra. Reklam eklenmeden önce F1 (yol, askeri alan, köprü), F3 (dost/düşman) ve F4 (düşman tipleri) kapanacak.
- Reklam modeli (henüz uygulanmadı): ödüllü reklam (AdMob), kullanıcı isterse izler; görev içinde reklam yok; görev aralarında sıklık sınırlı geçiş reklamı; "reklamları kaldır" satın alımı sonra; KVKK/GDPR onay ekranı.
- Mevcut durum: `window.StrikerAds` tanımsız. `showRewarded` çağrısı var, koşul sağlanmadığı için düğme görünmüyor. Entegrasyon noktası hazır, SDK yok.

## F1 devam (son tur)
- **Yollar ve askeri alanlar (kısmi):** Ana adadan her kara hedef sahasına yol şeridi (kara üstünde, 50 m aralıkla). Her hedef sahasına çit ve 2 barak. Kod: `buildRoadsAndBases`, `buildIslands` içinden çağrılıyor. Oyunda hata yok (`tests/dormant_check.js`). Görsel doğrulama henüz yapılmadı.
- **Dağdan geçen bekleyen uçak (hata, düzeltildi):** Bekleme yörüngesi arazi kontrolünü atlıyordu. Artık `y ≥ arazi + 80`. Yedek: `/tmp/index_pre_holdclamp.html`.
- **Açık:** Görev öncesi "başıboş" devriye (chaseAI, uzaklık > 2600) hâlâ amaçsız dolaşıyor; saldırı koşusuna çevrilecek. Titreme (hedef görüntüsü) kaynağı doğrulanmadı. Oyuncunun dağa çarpması: çarpışma kodu var (hasar + yükseklik düzeltmesi), ama davranış oyunda ölçülmedi.
- Tarayıcı ortamı yeniden kuruldu (Puppeteer + Chrome + libnss3). Yerel sunucu 8080 yeniden başlatıldı.
