# Rakip analizi ve 8 kalite fazı

Kaynaklar (önceki incelemeden, doğrudan sayfa metinleri):
- Jet Fighter: Sky Combat 3D (Play): https://play.google.com/store/apps/details?id=com.tenzen.skyfightermodernwarplane&hl=en
- Sky Warriors: Airplane Games (Play): https://play.google.com/store/apps/details?id=com.wildlifestudios.jet.airplane.games.sky.warriors&hl=en
- Ace Fighter: Modern Air Combat (Play): https://play.google.com/store/apps/details?id=com.ParsisGames.AirCombatEn
- Air Force Jet Fighter Combat (Play): https://play.google.com/store/apps/details?id=com.gamesgear.AirForce.Jet.Combat
- Armed Air Forces (App Store): https://apps.apple.com/us/app/armed-air-forces-jet-fighter/id1538640580
- Ace Combat 8 incelemesi (Forbes): https://www.forbes.com/sites/games/2026/09/25/ace-combat-8-review-a-more-visceral-take-on-strangereal-flight-combat/
- Tanıtım fragmanı stüdyosu (kullanıcı linki, metin): https://01a0e2e4-565e-784a-b211-a5159d898b11.arena.site/

## Rakiplerden çıkan ilkeler (kopyalanmaz, ölçüt olarak kullanılır)
1. **Ses tek dosya gibi çalmaz.** Armed Air Forces yorumu: silah sesi üst üste binen tek dosya gibi duyuluyor. Hedef: katmanlı ve kısa, tekrarlar yumuşak.
2. **Fırlatma kısa olmalı.** Armed Air Forces yorumu: füze bay açma+fırlatma yaklaşık 1 sn. Bizde fırlatma sesi 1.2 sn, tonsuz.
3. **Hedefe yön her zaman belli.** Jet Fighter yorumu: hedef bulamamak, nişan almada hassasiyet sorunu. Hedef: kenar okları + mesafe.
4. **Ses ve geri bildirim katmanı.** Ace Combat 8 (Forbes): sonik patlama, titreşim, kamera sarsıntısı; ses "daha büyük" hissettiriyor.
5. **Bölge ve operasyon çeşitliliği.** Fragman sayfası: 4 bölge, 24 operasyon, her biri farklı. Sky Warriors: birden çok harita ve mod. Bizde 192 görev var ama hepsi aynı şablondan; bölge çeşitliliği eksik.
6. **Mağaza ve uçak farkı açık.** Fragman: her uçağın hız, çeviklik, füze ve zırh değerleri net yazılı.
7. **Zorluk ayarı.** Air Force Jet Fighter Combat ve Ace Fighter: yoğunluk ve kazanç dengesi ayrı yönetiliyor. Bizde yoğunluk seçeneği yok.
8. **Mobil kontroller.** Yorumlarda sık geçen şikâyet: hassasiyet ayarı. Bizde dokunmatik hassasiyeti ölçülmedi.

## 8 kalite fazı (her faz: değişiklik → headless kanıt → commit → onay)
- **K1 — Hedef okunurluğu:** Ekran kenarı okları, uzak hedef mesafesi, hedef listesi. Kanıt: işaret sayısı ve ekran görüntüsü.
- **K2 — Görev çeşitliliği:** 4 bölge (İlk Işık, Kuzey Cephesi, Sessiz Fırtına, Son Ufuk benzeri), her bölgede farklı hedef dizilimi ve brifing. Kanıt: 192 görevin hedef imzası tekilliği.
- **K3 — Ses katmanları:** Füze (C), patlama (B tasarımı), silah sesleri üst üste binmesin. Kanıt: spektral ölçüm + kulak onayı.
- **K4 — Uçuş hissi:** Kamera sarsıntısı, hız göstergesi, sonik hissi için hafif titreşim. Kanıt: kamera sapma ölçümü.
- **K5 — Grafik sıcaklığı:** Gün batımı paleti, yansımalar, kontrast. Kanıt: 22+ sn sonra ekran görüntüsü, referans istatistiği.
- **K6 — Mağaza ve uçak farkı:** Uçak kartında hız, çeviklik, füze, zırh; tek motor/çift motor görünür. Kanıt: hangar ekran görüntüsü.
- **K7 — Zorluk ayarı:** Kolay / Normal / Yoğun, hedef sayısı tablosu. Kanıt: tablo.
- **K8 — Mobil ve tablet son kontrol:** Dokunmatik hassasiyet, yatay mod, ses aç/kapa. Kanıt: 390×844 ve 820×1180 ölçümleri.

Bu bir plan. Her faz ayrı yapılacak, ölçülmeden tamamlandı denmeyecek.
