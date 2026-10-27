# QA_CHECKLIST.md — Striker doğrulama listesi

**Build:** `striker-dev/index.html` · v1.9 DEV · md5 `c3b4f1a220724391cbba378cb79fb37b` · 1.099.508 bayt
**Son çalıştırma:** 2026-09-30 · `python3 build.py` → **exit 0**, gömülü testler **14/14 PASS**, `--save` **16/16 senaryo**

## Nasıl kullanılır

```bash
python3 build.py                    # derle + node --check + 11 gömülü test + özet
python3 build.py --check            # derlemeden mevcut build'i doğrula
python3 striker-dev/server.py       # önizleme → http://localhost:8080
cd tools/diag && node run-diagnostics.mjs ../../striker-dev/index.html --balance   # denge dökümü
cd tools/diag && node run-diagnostics.mjs ../../striker-dev/index.html --save      # save/migrasyon
```

- **OTO** = bu ortamda otomatik doğrulandı (komut çıktısı var).
- **MANUEL** = tarayıcı/GPU/dokunma gerektirir; bu sandbox'ta **doğrulanamaz**, gerçek cihazda işaretlenmeli.
- Bir satırı "tamam" işaretlemeden önce hangi komutun/ekranın doğruladığını yaz.

## 1. Derleme ve başlatma

| # | Madde | Tür | Durum | Kanıt |
|---|---|---|---|---|
| 1.1 | `python3 build.py` exit 0 | OTO | ✅ | patch → `node --check` temiz → 11/11 → rozet `1.8 DEV` |
| 1.2 | Build deterministik (aynı md5) | OTO | ✅ | izole `/tmp` build ile repo build md5 aynı: `d1bec7c2…` |
| 1.3 | Bundle sözdizimi geçerli | OTO | ✅ | `node --check` (965.418 karakter modül) |
| 1.4 | Sunucu build'i doğru sunuyor | OTO | ✅ | `GET /` → 200, sunulan md5 == depodaki md5 |
| 1.5 | Tarayıcıda açılış, konsol hatasız | MANUEL | ⬜ | konsolda 0 error bekleniyor |
| 1.6 | WebGL2 yoksa anlaşılır mesaj | MANUEL | ⬜ | kodda `isWebGL2` + açıklama metni var |

## 2. Menü ve ekranlar

| # | Madde | Tür | Durum | Not |
|---|---|---|---|---|
| 2.1 | Ana üs (`base`) ekranı | MANUEL | ⬜ | |
| 2.2 | Görev seçimi (`missions`) — 48 görev, 4 bölüm, kilit zinciri | OTO+MANUEL | ◐ | görev verisi OTO doğrulandı; ekranda kilitlerin doğru göründüğü MANUEL |
| 2.3 | Hangar — 16 uçak, fiyat, satın alma | OTO+MANUEL | ◐ | 16 kart OTO; satın alma akışı MANUEL |
| 2.4 | Uçak önizleme (3D) | MANUEL | ⬜ | |
| 2.5 | Brifing ekranı | MANUEL | ⬜ | |
| 2.6 | Profil (callsign) | MANUEL | ⬜ | |
| 2.7 | Ayarlar (kalite/ses/dil/hassasiyet/ağır füze/kanat arkadaşı/kokpit) | MANUEL | ⬜ | 10 dil, 4 kalite OTO doğrulandı |
| 2.8 | Kontroller ekranı | MANUEL | ⬜ | |
| 2.9 | Tanılama paneli (14 test) | OTO | ✅ | aynı paket `tools/diag` ile dışarıdan da koşuyor |
| 2.10 | Dil değiştirme + kalıcılık | MANUEL | ⬜ | v1.5'te düzeltilmişti, regresyon kontrolü |

## 3. Uçuş ve savaş

| # | Madde | Tür | Durum | Kanıt / Not |
|---|---|---|---|---|
| 3.1 | Uçak kontrolü (pitch/yaw/gaz) | OTO+MANUEL | ◐ | sim `update()` OTO; his MANUEL |
| 3.2 | Katapult kalkışı | OTO | ✅ | `catT` alanı + `notify("catapult")` |
| 3.3 | Top ateşi + ısı/aşırı ısınma | OTO | ✅ | `gunHeat`, `overheated` |
| 3.4 | Kilit olmadan füze ateşlenmez, mermi harcanmaz | OTO | ✅ | test: `Lock required before launch` |
| 3.5 | Kilitlenme (ilerleme + hedef seçme) | OTO | ✅ | test: `Reacquire an overshot target` |
| 3.6 | Güdümlü füze → vuruş → imha | OTO | ✅ | test: `Lock, guided missile, impact` (v1.8'de düzeltildi) |
| 3.7 | Fişek → tehdit düşer | OTO | ✅ | test: `Countermeasures remove threats` |
| 3.8 | Bomba | OTO+MANUEL | ◐ | `dropBomb`, `bombs:4`; etki MANUEL |
| 3.9 | Düşman AI (10 tür, hava+deniz, denizaltı dalış döngüsü) | OTO+MANUEL | ◐ | HP/davranış OTO; his MANUEL |
| 3.10 | Kanat arkadaşı (ayarlardan) | OTO+MANUEL | ◐ | `updateWingman` var; katkısı MANUEL |
| 3.11 | Zemin/dağ çarpışması | OTO | ✅ | test: `Heading and swept collisions` + `terr()` |
| 3.12 | Uçaklar arası füze farklılığı | OTO | ✅ | test: `Per-aircraft missile loadouts` (16/16 farklı) |

## 4. Görev döngüsü

| # | Madde | Tür | Durum | Kanıt / Not |
|---|---|---|---|---|
| 4.1 | Görev başlatma | OTO+MANUEL | ◐ | `new Pa(dn[i], aircraft, prefs, upgrade)` |
| 4.2 | Tüm hedefler → extraction → sonuç | OTO | ✅ | test: `Extraction and stable result` |
| 4.3 | Süre aşımı → başarısız + kampanya kilidi | OTO | ✅ | test: `Timeout and campaign unlock` |
| 4.4 | Tam sorti döngüsü (kalkış→savaş→dönüş) | OTO | ✅ | test: `First sortie combat-to-return loop` (70.4 sn, 7/7) |
| 4.5 | Sonuç ekranı: skor / süre / kredi / 1–3 yıldız | OTO+MANUEL | ◐ | `result.{score,seconds,stars,reward}` |
| 4.6 | Ödülün profile işlenmesi | OTO+MANUEL | ◐ | `records[id]`, `credits` |
| 4.7 | **Ölüm → respawn** | — | ❌ **YOK** | `respawn` = 0 geçiş. Tasarım: ölüm = görev başarısız → **retry**. Brief bunu istiyor; eksik özellik olarak kayıtlı |
| 4.8 | Yeniden dene (retry) / sonraki görev | MANUEL | ⬜ | `onRetry`, `onNext` mevcut |

## 5. Kayıt ve ayarlar

| # | Madde | Tür | Durum | Not |
|---|---|---|---|---|
| 5.1 | Kaydet/yükle (`striker.profile.v3`) | OTO | ✅ | `--save`: boş depolama → geçerli varsayılan, gereksiz yazma yok |
| 5.2 | Bozuk kayıt → güvenli varsayılan **+ karantina** | OTO | ✅ | `--save`: ham veri `…quarantine` anahtarına yazılıyor, silinmiyor |
| 5.3 | **Sürüm migrasyonu (v2→v3)** | OTO | ✅ | `--save`: 16/16 senaryo — v2 profili kayıpsız taşınıyor, eski anahtar yedek olarak duruyor, ikinci açılışta tekrar taşımıyor |
| 5.4 | Ayarların kalıcılığı | MANUEL | ⬜ | quality/sound/sensitivity/language/assisted/cockpit/heavyMissiles/wingman/difficulty |
| 5.5 | localStorage kapalıyken uyarı | MANUEL | ⬜ | `ub()` `false` dönüyor; UI metni MANUEL |

## 6. Mobil

| # | Madde | Tür | Durum | Not |
|---|---|---|---|---|
| 6.1 | Sanal kol + gaz kaydırıcısı + silah butonları | MANUEL | ⬜ | `stick-knob`, `throttle-control` |
| 6.2 | Jiroskop (+ iOS izin akışı) | MANUEL | ⬜ | `deviceorientation` + `requestPermission` |
| 6.3 | Yatay (landscape) zorunluluğu | — | ❌ **YOK** | `orientation.lock` = 0 → B-9 |
| 6.4 | Safe-area / çentik uyumu | OTO+MANUEL | ◐ | CSS'te `env(safe-area-…)` var; görünüm MANUEL |
| 6.5 | Resize / yön değişimi | MANUEL | ⬜ | `resize` ×9, `visibilitychange` ×4 |
| 6.6 | Dokunmatikte 60 FPS / ısınma | MANUEL | ⬜ | **bu sandbox'ta ölçülemez** (GPU yok) |

## 7. Bilinen açıklar (bu listenin kapsamadığı)

| Kayıt | Durum |
|---|---|
| B-3 save migrasyonu yok | ✅ **v1.9'da kapatıldı** (migrasyon zinciri + karantina + 3 test) |
| B-4 harici Google Fonts + Cloudflare beacon | açık → P3 |
| B-9 landscape kilidi yok | açık → P9 |
| B-11 canlı yayın v0.9 | açık → yeniden deploy gerekli |
| B-12 mSet varsayılana çöküyordu | ✅ **v1.8'de kapatıldı** (+ regresyon testi eklendi) |
| B-1 tek füze imha etmiyordu | ✅ **v1.8'de kapatıldı** |
| B-2 eski patch'ler master'ı eziyordu | ✅ **v1.8'de kapatıldı** (archive/) |
