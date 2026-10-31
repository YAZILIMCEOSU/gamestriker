# PROJECT_AUDIT.md — PHASE 0 / PROJE ADLİ ANALİZİ (v2 — gerçek kod üzerinde)

| Alan | Değer |
|---|---|
| Depo | `YAZILIMCEOSU/gamestriker` |
| Dal | `arena/01a0d830-gamestriker` |
| Taban | `451d918` (Initial commit) + `2716d9a` ("Add files via upload" → `striker-yedek-v1.7.zip`) |
| Analiz tarihi | 2026-09-30 (v2) · **P0+P1+P2 uygulandı: 2026-09-30** |
| **MASTER BUILD** | **`striker-dev/index.html` — "UÇUŞ SÜRÜMÜ 1.9 DEV"**, 1.099.508 bayt, md5 `c3b4f1a220724391cbba378cb79fb37b` |
| Gömülü test durumu | **14/14 PASS** + `--save` **16/16 senaryo** (P1+P2'de 3 hata kapatıldı, 4 test eklendi) |
| Build reproducibility | **DOĞRULANDI** — `patch_v11.py` çıktısı izole build ile md5 olarak birebir aynı |

> **Önceki sürüm notu:** Bu dosyanın ilk sürümü "depoda kod yok" diyordu; o tespit o an için
> doğruydu (depoda yalnızca 14 baytlık `README.md` vardı). Kullanıcı `striker-yedek-v1.7.zip`'i
> GitHub'a yükledi, depo `origin/main`'den merge edildi ve bu sürüm **gerçek kod üzerinde** yeniden
> yazıldı. Eski sürümdeki "kaynak yok" iddiası artık geçersiz.

---

## 0. YÖNETİCİ ÖZETİ

Proje **minify edilmiş tek dosyalık bir React + Three.js bundle'ı** ve onu üreten **Python
string-replacement yama hattı**. Bu, alışılmadık ama **çalışan ve doğrulanabilir** bir mimari:

1. **Kaynak gerçek:** `inner.html` (v0.9, dokunulmamış Arena build'i) + `patch_v9.py` + 5 veri
   dosyası → `striker-dev/index.html` (v1.7 DEV). Hattı izole bir dizinde çalıştırdım: üretilen
   dosyanın md5'i depodaki master ile **birebir aynı** (`11f4e00d…`). Yani build **reprodüsibl**.
2. **Oyun gerçek ve büyük:** 16 uçak, 48 görev (4 bölüm × 12), 10 düşman tipi, 10 dil, 4 kalite
   profili, sanal joystick + jiroskop, sentezlenmiş ses motoru, localStorage profili.
3. **Kendi test paketi var:** bundle içinde 10 simülasyon testi gömülü (`$w()`). Onu Node + jsdom
   altında çalıştırdım: **v0.9 → 10/10 PASS, v1.7 → 9/10 PASS.** Başarısız test gerçek bir denge
   regresyonu ve kök nedeni sayısal olarak bulundu.
4. **En büyük yapısal risk:** insan tarafından okunabilir kaynak **yok**. "Kaynak" = minify bundle +
   metin değiştirme yamaları. Brief'in Phase 3'ündeki gerçek mimariye geçiş, bu yüzden bir
   refactor değil **kaynak yeniden inşası** işidir (bkz. RISK R-1).

---

## 1. DOSYA ENVANTERİ (27 giriş, 6.223.337 bayt açılmış hâl)

| Dosya | Bayt | md5 (ilk 8) | Rol | Durum |
|---|---|---|---|---|
| `striker-dev/index.html` | 1.096.810 | `11f4e00d` | **v1.7 DEV — MASTER** | ✅ KORU |
| `inner.html` | 1.026.933 | `fa165af8` | v0.9 dokunulmamız temel (build girdisi) | ✅ KORU |
| `striker-dev/original.html` | 1.026.933 | `fa165af8` | `inner.html` ile **birebir aynı** | ⚠️ KOPYA |
| `new.html` | 2.816.205 | `c6646b33` | **Başka uygulama:** "Tanıtım Videosu Stüdyosu" | ⚠️ YABANCI |
| `page.html` | 14.710 | `593023eb` | Arena sarmalayıcı sayfası (PostHog/OG) | ⚠️ OYUN DEĞİL |
| `app.html` | 14.710 | `593023eb` | `page.html` ile **birebir aynı** | ⚠️ KOPYA |
| `striker-dev/patch_v9.py` | 24.436 | — | **GÜNCEL BUILD SCRIPT** | ✅ KORU |
| `striker-dev/patch_v3…v8.py` | 3.629–21.487 | — | Eski sürüm build script'leri | 🔴 **TEHLİKE (B-2)** |
| `striker-dev/audio5.js` | 11.187 | — | Güncel ses motoru (build girdisi) | ✅ KORU |
| `striker-dev/audio4.js` | 11.213 | — | Sadece `patch_v4/v5` kullanıyor | ⚠️ ESKİMİŞ |
| `striker-dev/audio2.js` | 7.493 | — | Sadece `patch_v3` kullanıyor | ⚠️ ESKİMİŞ |
| `audio_class.js` | 2.150 | — | Değiştirilecek eski ses bloğu (build girdisi) | ✅ KORU |
| `fw_dict.txt` | 8.385 | — | 130 i18n anahtarı (build girdisi; `assert len==130`) | ✅ KORU |
| `striker-dev/i18n_data.py` | 44.095 | — | 9 dil çeviri verisi (build girdisi) | ✅ KORU |
| `striker-dev/i18n_ar.py` | 9.215 | — | Arapça verisi (build girdisi) | ✅ KORU |
| `striker-dev/server.py` | 555 | — | Dev sunucu (`0.0.0.0:8080`, `no-store`) | ✅ KORU |
| `striker-dev/favicon.svg` | 231 | — | `./favicon.svg` olarak referanslı, HTTP 200 doğrulandı | ✅ KORU |
| `striker-gelistirme-plani.md` | 16.481 | — | v1.0→v1.7 geliştirme günlüğü | ✅ BELGE |
| `striker-inceleme.md` | 6.518 | — | Önceki inceleme raporu | ✅ BELGE |
| `striker-yedek-v1.7.zip` | 2.507.083 | — | Bu içeriğin arşivi (açıldı) | ⚠️ git'te 2,5 MB |
| `.gitignore` | 48 | — | `.cache/ node_modules/ __pycache__/ .venv/ *.pyc` | ✅ VAR |

**Not:** Oyunda `package.json` / `tsconfig.json` **yok** — proje bir npm projesi değil, statik HTML +
Python araç zinciri. (`tools/diag/package.json` bu denetimde doğrulama aracı olarak eklendi.)

---

## 2. ARCHITECTURE

### 2.1 Doğrulanmış mevcut mimari

```
inner.html (v0.9 minify bundle, 1.026.933 B)   ← dokunulmamış temel
        │
        │  python3 striker-dev/patch_v9.py      (86 adet assert'li string replacement çağrısı)
        │  girdiler: audio_class.js, striker-dev/audio5.js, fw_dict.txt,
        │            striker-dev/i18n_data.py, striker-dev/i18n_ar.py
        ▼
striker-dev/index.html (v1.7 DEV, 1.096.810 B)  ← MASTER
        ├── inline <style>  121.311 B   (12 @media sorgusu, 11 @keyframes)
        └── inline <script type="module">  965.092 B  (React + Three.js + oyun, minify)
```

- **Tek dosya, sıfır asset:** `.png/.jpg/.webp/.glb/.gltf/.mp3/.wav` referansı **0** — her şey
  prosedürel (geometri, doku, ses). Bu bir zayıflık değil, bilinçli tasarım: 0 kurulum, küçük paket.
- **Simülasyon çekirdeği:** `Pa` sınıfı, 21 metot (çalışma zamanında döküldü):
  `terr, target, alive, navPosition, targetBearing, targetDistance, incoming, healthPercent,
  notify, setAssist, cycleTarget, spawn, event, fireMissile, dropBomb, deployFlare, damageEnemy,
  finish, update, updateWingman, updateEnemies, updateProjectiles`
  → `terr()` analitik ada yüksekliği (zemin çarpışması), `update*` ailesi sistem döngüsü.
- **UI katmanı:** React (`useState` ×27, `useEffect` ×20, `createRoot`), 185 `className` kullanımı,
  ekranlar: `base, hangar, missions, briefing, profile, settings, controls, about` + `paused`,
  `loading`, `error`, `webgl` durumları.
- **Veri-güdümlülük:** uçaklar veri kartı (`no` dizisi), görevler prosedürel üreteç (`dn = rb.map(…)`).
  Motor içinde uçak-spesifik hardcode mantık **yok** — bu, Brief'in Phase 4 hedefiyle zaten uyumlu.

### 2.2 Build hattının doğrulanması (bu turun en kritik kanıtı)

```
$ cd /tmp/buildtest            # izole kopya, repoya dokunulmadı
$ python3 striker-dev/patch_v9.py
ALL V5 PATCHES APPLIED, size: 1088218        # karakter (UTF-8 bayt: 1.096.810)
script extracted: 965092
$ md5sum striker-dev/index.html
11f4e00de22df86c264baca347ff7a89   ← depodaki master ile BİREBİR AYNI
```

**Sonuç:** kaynak-doğruluk zinciri `inner.html + patch_v9.py`'dur. Bundan sonra her değişiklik ya
yeni bir `patch_v10.py` olarak ya da (önerilen) gerçek kaynak ağacına geçişle yapılmalı.

### 2.3 Hedef mimari (Phase 3 planı — gerçek modüllere eşlenmiş)

| Hedef klasör | Bugünkü karşılığı (minify bundle içinde) | Geçiş notu |
|---|---|---|
| `src/game/engine` | `Pa.update/updateProjectiles/finish` + React oyun döngüsü | En kritik çekirdek, ilk taşınacak |
| `src/game/aircraft` | `no` veri dizisi + prosedürel gövde üreticisi | Veri zaten ayrık, geometri kodu gömülü |
| `src/game/weapons` | `fireMissile/dropBomb/deployFlare`, `mSet` tablosu | `mSet` 4 parametreli; Phase 9'da genişleyecek |
| `src/game/ai` | `updateEnemies`, `updateWingman` | Durum makinesi yok (bkz. AI) |
| `src/game/missions` | `dn` üreteci + `rb/ob/lb` dizileri | Prosedürel; objective sistemi yok |
| `src/game/world` | `terr()` + deniz/gökyüzü/ada üretimi | Biome kavramı yok |
| `src/game/audio` | `zw` sınıfı ← `audio5.js` | Zaten ayrı dosya, en kolay taşınan modül |
| `src/game/camera` | `cameraMode` (`chase`/`cockpit`), `fov`, `shake` | Sinematik sequencer yok |
| `src/game/effects` | `Points` ×36, partikül spawn'ları | Havuzlama kısmi |
| `src/data/*` | `no`, `mSet`, `dn`, `Fw` (i18n), `fw_dict.txt` | Zaten yarı ayrık |
| `src/state/profile` | `Ey()` (varsayılan), `cb()` (yükle), `ub()` (kaydet) | Migrasyon yok (B-3) |
| `src/systems/save` | `localStorage["idea-game.striker.v2"]` | Sürümlü ama migrasyonsuz |
| `src/systems/performance` | kalite profilleri + `pixelRatio`/`shadowMap` ayarı | Adaptif FPS izleme yok |
| `src/systems/ads` | **yok** | Phase 28'de sıfırdan |

**Bağımlılık kuralı (ihlal edilmeyecek):** `data/` hiçbir şey import etmez → `game/*` yalnızca
`data/ state/ systems/` → `ui/*` state üzerinden konuşur → `systems/` oyun mantığından habersiz.

---

## 3. GAMEPLAY

### Doğrulanmış içerik (çalışma zamanında döküldü)

**16 uçak** — tam tablo:

| id | kod | hız | çeviklik | gövde | füze | fiyat |
|---|---|---|---|---|---|---|
| striker | SF-16 | 260 | 1.45 | 100 | 10 | 0 |
| spectre | SF-22 | 240 | 1.10 | 140 | 14 | 1400 |
| tempest | XA-40 | 310 | 1.80 | 85 | 8 | 2600 |
| falchion | SF-16C | 285 | 1.35 | 95 | 12 | 1200 |
| ravager | XA-44 | 255 | 1.00 | 160 | 16 | 3200 |
| vanguard | VG-2 | 250 | 1.50 | 110 | 11 | 600 |
| ghost | GH-3 | 295 | 1.60 | 90 | 10 | 900 |
| talon | TL-9 | 270 | 1.45 | 100 | 12 | 700 |
| bastion | BS-1 | 230 | 1.05 | 150 | 14 | 1500 |
| horizon | HZ-7 | 275 | 1.20 | 115 | 14 | 1800 |
| cyclone | CY-5 | 300 | 1.70 | 88 | 9 | 1400 |
| marauder | MR-8 | 265 | 1.15 | 130 | 15 | 2000 |
| sentinel | SN-4 | 235 | 1.25 | 125 | 12 | 1600 |
| phantom | PH-0 | 320 | 1.85 | 80 | 8 | 2800 |
| archer | AR-6 | 245 | 1.40 | 105 | 11 | 1100 |
| kraken | KR-11 | 225 | 0.95 | 170 | 16 | 3600 |

**48 görev** = 4 bölüm × 12; 6 tür × 8 görev: `strike, intercept, defense, radar, carrier, boss`.
Ödül 420→3.005 kredi; süre limiti 480→660 sn; `par` 240+n·50 sn; `sunset` bayrağı görev başına.

**10 düşman tipi ve HP:**

| tip | HP | | tip | HP |
|---|---|---|---|---|
| corvette | 160 | | interceptor | 160 |
| destroyer | 256 | | attacker | 160 |
| radar | 208 | | heavy | 224 |
| sub | 352 | | bomber | 224 |
| carrier | 608 | | drone | 160 |

**Silahlar (4 sistem):** top (`gunHeat`/`overheated` ısı modeli), güdümlü füze (uçak başına `mSet`
= `[hız, ömür, hasar, dolum]`, örn. striker `[450, 8, 110, 0.8]`), bomba (`bombs: 4`),
fişek (`flares: 6`). Ayarlarda **Ağır Füze Modu** (hasar ×1.7, hız ×0.85, ömür ×1.35, dolum ×1.25).

**Diğer doğrulanmış mekanikler:** katapult kalkışı (`catT`, gemi güvertesinden başlangıç),
AI kanat arkadaşı (`updateWingman`, 3.4 sn'de bir güdümlü füze, 1500 m menzil), combo skoru
(+40/kat), rubber-band (can <%35 → düşman atış aralığı ×1.4), hedef kilidi (`lock` 0→1 ilerleme,
`cycleTarget`), `deployFlare` ile tehdit düşürme, extraction + sonuç ekranı (1–3 yıldız).

**Eksik gameplay:** objective sistemi yok (hepsi "tüm hedefleri yok et"), görev tipleri arasında
mekanik fark sadece hedef kompozisyonu, boss faz makinesi yok, kara hedefi yok (hepsi deniz/hava).

---

## 4. GRAPHICS

| Konu | Doğrulanmış durum |
|---|---|
| Tonemap | `ACESFilmicToneMapping` (3 referans), `toneMapping` ×59 |
| Post-process | `EffectComposer` (2), `RenderPass` (4), `UnrealBloomPass` (3), bloom ×50 |
| Işık | `SpotLight` ×44, `PointLight` ×34, `DirectionalLight` ×19, `HemisphereLight` ×10, `AmbientLight` ×3 |
| Gölge | `shadowMap` ×70 (kaliteye göre 1024→2048) |
| Çevre | `envMap` ×155, `PMREMGenerator` **0** |
| Materyal | `MeshStandardMaterial` ×14, `MeshPhysicalMaterial` ×5, `ShaderMaterial` ×16, `onBeforeCompile` ×3 |
| Geometri | `BufferGeometry` ×15, `InstancedMesh` ×19, `Points` ×36 (partikül), `Sprite` ×7 |
| Optimizasyon | `frustumCulled` ×12, `pixelRatio` ×13, **`LOD` ×1 (fiilen yok)** |
| Sis/gökyüzü | `fog` ×123, `Fog` ×19, `sky` ×21, `cloud` ×8, `sunset` ×5 |
| Su | standart malzeme + envMap — **`Gerstner` 0**, `Water` 0 |
| Texture/asset | 0 (tamamen prosedürel) |

**Eksik:** LOD sistemi, Gerstner dalga/şeffaflık, gerçek bulut hacmi, biome çeşitliliği.

## 5. AUDIO

- Tamamen **sentezlenmiş** WebAudio (`audio5.js`, 11.187 B): motor (sawtooth'suz noise-roar + sub-sin),
  `DynamicsCompressor` limiter (1), convolver reverb (1), üretken müzik döngüsü (offline render).
- Olay sesleri: `lock, warning, launch, explosion, splash, hit, flare, gun, click, surf, launch(wingman)`.
- Ses dosyası yok (`.mp3/.wav` = 0) → telif riski yok, paket boyutu küçük.
- **Doğrulanamayan:** sesin kulağa nasıl geldiği (bu ortamda ses çıkışı yok) — kullanıcı testine bağlı.
- **Risk:** iOS'ta `AudioContext` kullanıcı etkileşimi olmadan başlamaz; mevcut akışta ilk dokunuşta
  `resume` çağrısı var mı doğrulanmadı (bkz. KNOWN BUGS B-9).

## 6. AI

| Var | Yok |
|---|---|
| `updateEnemies` — tür bazlı davranış (hava/deniz), `fireIn` zamanlayıcısı | Durum makinesi (`aiState`, `behavior`, `evade`, `stalk` → **0 geçiş**) |
| `updateWingman` — dost kanat arkadaşı (1500 m, 3.4 sn) | Zorluk kademeleri: sadece `normal`/`hard` (Brief: ROOKIE→BOSS 5 kademe) |
| Rubber-band (can <%35 → atış aralığı ×1.4) | Boss fazları, özel saldırı desenleri |
| `sub` davranışı: 26 sn döngü, ~12 sn yüzey / ~14 sn dalış (dalarken dokunulmaz) | Formasyon uçuşu, wingman komutları (ATTACK/DEFEND/FOLLOW) |
| Önleme jetleri oyuncuyu konum+irtifada takip (geliştirme günlüğü v1.3) | Enerji/irtifa yönetimi, savunma kırması (defensive break), füze kaçınması |

## 7. UI

- **Ekranlar:** `base` (ana üs/menü), `hangar`, `missions`, `briefing`, `profile`, `settings`,
  `controls`, `about` + `paused`, `loading`, `error`, `webgl` durum ekranları.
- **HUD (JS `className` olarak doğrulandı):** `compass-heading`, `compass-ticks`, `lock-keyhole`,
  `lock-progress`, `radar-map/-sweep/-dish/-coord/-block`, `stick-cross`, `stick-knob`,
  `throttle-control`, `target-caption`, `target-status`, `warning`, `missile-ready`, `flare`,
  `score`, `toast`, `diagnostics-panel`.
  **Not (doğrulandı):** bu sınıflardan `lock-keyhole` CSS'te **stil tanımsız** — yani kilit
  nişangâhının "keyhole" katmanı render ediliyor ama görsel karşılığı yok (Phase 10'da hedef
  kutusu/kilit halkası işi bunun üzerine kurulacak). Diğerleri CSS'te mevcut.
- **Erişilebilirlik:** 22 `aria-label`, `prefers-reduced-motion` desteği, diyaloglarda odak tuzağı,
  11 `@keyframes` animasyonu, "kamera hareketini azalt" ayarı.
- **Responsive:** 12 `@media` sorgusu (`max-width:600/900/1190`, `min-width:48/64rem`,
  `min-width:1600`, `pointer:coarse`, `hover:hover`, `max-height:470/600`, `prefers-reduced-motion`)
  + **`env(safe-area-…)` kullanımı VAR**.
- **Gömülü tanılama paneli:** 10 testi kullanıcı da çalıştırabiliyor ("kontrol başarılı; GPU
  performans testi değildir" dürüst mikro metni).
- **Eksik:** liderlik tablosu, günlük/haftalık görev, başarım ekranı, sezon arayüzü, uçak karşılaştırma.

## 8. PROGRESSION

- **Doğrulanmış şema:** `{version:2, callsign:"VIPER", aircraft, credits:600, owned:["striker"],
  upgrades:{}, records:{}, preferences:{…}}`
- `upgrades` uçak başına **0–3 seviye** (`Math.min(3,…)` ile kırpılıyor) — füze hasarına `+upgrade*10`
  (ağır modda `+upgrade*14`), kanat arkadaşı hasarına `+upgrade*6` etkisi var → **her upgrade oynanışı etkiliyor** (Brief'in "anlamsız ilerleme olmasın" şartı karşılanmış).
- `records` görev başına `{score, seconds, stars(1-3)}` → "Uçuş Kaydı".
- Kilit zinciri: `Rl(s,e)` → görev `s`, önceki görevin kaydına bağlı; `x_()` toplam yıldız.
- **Yok:** XP/seviye, rütbe, günlük/haftalık görev, başarım, sezon, liderlik tablosu, skin, mastery.

## 9. PERFORMANCE

| Konu | Durum |
|---|---|
| Kalite profilleri | `low / medium / high / ultra` (4) — doğrulandı |
| Varsayılan | masaüstü `high`, `window.innerWidth < 768` → `medium` |
| Gölge haritası | 1024 → 2048 (kaliteye göre) |
| Paket | **tek dosya 1.096.810 bayt** (CSS 121 KB + JS 965 KB), **kod bölme yok** |
| Harici istekler | Google Fonts (2 preconnect + CSS) + **Cloudflare Insights beacon** |
| Havuzlama | `Points`/mermi/partikül için kısmi; `dispose(` ×109 |
| Ölçülemeyen | **Gerçek cihaz FPS/ısı ölçümü bu sandbox'ta yapılamaz** (GPU yok) |

**En büyük performans riski:** 965 KB'lık tek modülün **ayrıştırma/derleme** maliyeti düşük uç
cihazlarda ilk açılışı uzatır (Brotli indirmeyi küçültür, parse maliyetini küçültmez).

## 10. MOBILE

- **Var:** `touchstart` ×4, `touchmove` ×3, `touchend` ×3, `touchcancel`, sanal kol
  (`stick-knob`/`stick-cross`), dikey gaz (`throttle-control`), sağ silah butonları
  (`missile/flare/missile-ready`), jiroskop (`deviceorientation` ×2 + iOS `requestPermission` ×2),
  `requestFullscreen`/`exitFullscreen`, `visibilitychange` ×4, `resize` ×9, `env(safe-area-…)`.
- **Yok:** **`orientation.lock` = 0** → zorunlu yatay (landscape) kilidi yok; `Gamepad` = 0;
  dokunmatik UI ölçekleme/tablet yerleşimi sınırlı; PWA manifest + service worker yok.
- **Doğrulanamayan:** gerçek cihazda dokunma gecikmesi ve jiroskop hissi.

## 11. SAVE SYSTEM

```js
by = "idea-game.striker.v2"                       // anahtar (değişken: by)
function Ey(){ return {version:2, callsign:"VIPER", aircraft:"striker", credits:600,
  owned:["striker"], upgrades:{}, records:{}, preferences:{quality, sound, sensitivity,
  reducedMotion, language, assisted, cockpit, heavyMissiles, wingman, difficulty}} }
function cb(){ … const e=JSON.parse(localStorage.getItem(by)||"null");
               if(!e || e.version!==2) return s;   // ← MIGRASYON YOK, SIFIRLANIYOR
               … }                                 // owned/upgrades/records/preferences doğrulanıp kırpılıyor
function ub(s){ try{ localStorage.setItem(by, JSON.stringify(s)); return true } catch { return false } }
```

**İyi:** sürüm alanı var, okuma sırasında tip/aralık doğrulaması yapılıyor (bozuk veri enjekte
edilemez), yazma hatası yakalanıp `false` dönüyor.
**Kötü (B-3):** `version!==2` durumunda **migrasyon değil sıfırlama** var. Şema v3'e çıktığı an tüm
oyuncu profilleri silinir. Dışa/içe aktarma ve IndexedDB yedeği yok.

---

## 12. KNOWN BUGS

| # | Hata | Önem | Kanıt |
|---|---|---|---|
| ~~**B-1**~~ | **KAPATILDI (v1.8):** gömülü test `Lock, guided missile, impact` v1.7'de FAIL idi (5/5 tekrar, deterministik). Kök neden: v1.2'de eklenen düşman HP `×1.6` çarpanı, füze hasarı güncellenmeden uygulanmıştı → hafif hedef 160 hp, füze 110 hasar, tek füze imha etmiyordu; 1. görevde 18 vuruş gerekiyor, kapasite 10 füzeydi. **Çözüm:** `×1.6` çarpanı geri alındı (görev süresi zaten hedef sayısı 7–13 ve koridor derinliğinden geliyor). Ölçüm sonrası: gereken atış 18→**11**, asistli sorti süresi 57.4→**70.4 sn** (kısalmadı), 11/11 PASS. | ✅ **KAPALI** | `build.py` + `--balance` |
| ~~**B-2**~~ | **KAPATILDI (v1.8):** `patch_v3…v9` + `audio2.js`/`audio4.js` → `striker-dev/archive/` (açıklamalı README ile). Tek giriş noktası artık kökteki `python3 build.py` → `patch_v10.py`. | ✅ **KAPALI** | `striker-dev/archive/README.md` |
| ~~**B-3**~~ | **KAPATILDI (v1.9):** sürümlü save + migrasyon zinciri. Yeni anahtar `striker.profile.v3`, eski anahtarlar (`idea-game.striker.v2/v1`) okuma sırasında otomatik bulunup taşınıyor (**migrate-on-read**), eski anahtar **silinmiyor** (doğal yedek). Bozuk/bilinmeyen sürüm `striker.profile.v3.quarantine`'a yazılıyor — veri asla atılmıyor. 3 gömülü test + `--save` 16 senaryo. | ✅ **KAPALI** | `tools/diag --save` |
| ~~**B-13**~~ | **KAPATILDI (v1.10):** kullanıcı bildirimi *"dağın içinde hedef gösteriyor"*. Kök neden: v6 hedef-doğuş döngüsü `for(let q=1;q<8&&this.terr(d,p)>4;q++)` — **eşik sabit `terr>4`, oysa kara hedefleri y=8 (gemi) / y=26 (radar) duruyor** ve döngü **en fazla 7 tur**. Kaçamayan hedef arazinin içinde doğuyordu. Ölçüm (`tools/diag --terrain`, 464 hedef / 48 görev): **16 hedef zeminin altında, en kötü −232 m**, 46/48 görev etkilenmiş. **Çözüm:** koşul hedefin kendi irtifasına bağlandı (`terr <= g-6`), arama 96 tura çıkarıldı, son çare olarak hedef gömülmek yerine zeminin 50 m üstüne kaldırılıyor. Hava hedeflerinin davranışı **aynen** bırakıldı (denge değişmesin). Sonuç: **0/464 gömülü**, en kötü açıklık **+8 m**, yerleşim medyanı \|x\| 1410 m → 1410 m (yığılma yok). Yan etki: 1. görev asistli sorti 70,4 → 32,8 sn (gömülü destroyer artık açık suda) → **X4 par kalibrasyonu** açıldı. | ✅ **KAPALI** | `tools/diag --terrain` A/B (v1.9 exit 1 → v1.10 exit 0) |
| **B-4** | Harici bağımlılıklar: Google Fonts + **Cloudflare Insights beacon**. Çevrimdışı oynanışı bozar, Play Store gizlilik beyanı gerektirir, mağaza incelemesinde üçüncü taraf izleme sorusu doğurur. | ORTA | `<link>`/`<script src>` taraması |
| **B-5** | 965 KB tek modül, kod bölme yok → düşük uç cihazda açılış yavaş. | ORTA | bundle ölçümü |
| **B-6** | Depo hijyeni: `new.html` (2,8 MB, başka uygulama), `page.html`/`app.html` (Arena sarmalayıcı, birebir kopya), `original.html` (`inner.html` kopyası) → 6,2 MB'ın ~3,9 MB'ı oyun değil. | ORTA | md5 tablosu |
| **B-7** | `audio2.js`/`audio4.js` eskimiş; `patch_v3/v4/v5` de öyle. | DÜŞÜK | script girdi taraması |
| **B-8** | `striker-yedek-v1.7.zip` (2,5 MB) git'te; içerik zaten açıldı. | DÜŞÜK | `git ls-tree` |
| **B-9** | `orientation.lock` yok → mobilde portrait oynanabilir; iOS `AudioContext` resume akışı doğrulanmadı. | ORTA | grep: `orientation.lock` = 0 |
| **B-12** | **v1.7'nin ana özelliği fiilen çalışmıyordu:** `Pa` kurucusunda `mSet` tablosu `[n.id]` ile aranıyordu ama `n` bir **string** (uçak id'si; uygulama `new Pa(dn[d], s.aircraft, …)` çağırıyor). `"striker".id === undefined` → **16 uçağın tamamı varsayılan `[450,8,110,.8]` tablosuna düşüyordu.** Yani v1.7'de "16 uçağa özgün füze tablosu" özelliği hiçbir uçakta etkili değildi. **Çözüm (v1.8):** anahtar `typeof n=="string"?n:n.id` yapıldı + gömülü regresyon testi `Per-aircraft missile loadouts` eklendi. Ölçüm: farklı tablo **1/16 → 16/16**. | ✅ **KAPALI** | `--balance` öncesi/sonrası |
| **B-11** | **Canlı site 8 sürüm geride:** `01a0c419…arena.site` adresinde yayınlanan build **v0.9** (`inner.html`). Kanıt: URL'den çekilen Türkçe metinler ("DENİZ HAVA OPERASYONLARI", "Gökyüzüne hükmet", "UÇUŞA BAŞLA") `inner.html` içinde 1'er kez bulunuyor, `page.html` (Arena sarmalayıcı, `iframe-container` + `embed=true`) içinde **0** kez. Yani site, sarmalayıcı iframe'inin içinde **v0.9** oyununu gösteriyor; v1.7'deki 13 yeni uçak, 24 yeni görev, 8 yeni dil, kanat arkadaşı ve katapult kalkışı yayında **yok**. | **YÜKSEK** | grep sayımı (aşağıda) |
| **B-10** | **Okunabilir kaynak yok.** Tüm geliştirme minify bundle üzerinde string replacement ile yapılıyor; bir yamanın `count!=n` olması build'i kırar ve hata mesajı yalnızca ilk 80–90 karakteri gösterir. | **YÜKSEK (yapısal)** | `patch_v9.py` `rep()` fonksiyonu |

**Doğrulanamayanlar (dürüst kayıt):** gerçek cihaz FPS/ısınma, sesin duyusal kalitesi, dokunmatik
gecikme, WebGL2'siz cihaz davranışı, `new.html` stüdyosunun durumu. Bunlar bu sandbox'ta test
edilemez (GPU/ses/dokunma yok).

---

## 13. MISSING FEATURES (Brief fazlarına göre)

| Brief fazı | Mevcut | Eksik |
|---|---|---|
| 4 — AircraftData | 12 alan: `id, code, name, role, description, speed, agility, hull, missiles, color, accent, price` | `class, tier, acceleration, radarRange, radarSignature, flareCapacity, weaponSlots, boostCapacity, turnRate, rollRate, pitchRate, specialAbility` |
| 5 — 20+ uçak | 16 uçak, özgün istatistik | +4 uçak; **gövdeler yeniden kullanılıyor** (geliştirme günlüğü v1.1 notu: falchion→striker, ravager→spectre) → özgün siluet eksik |
| 6 — 3D uçak kalitesi | prosedürel gövde, çok materyal | LOD yok, kontrol yüzeyi geometrisi yok, iniş takımı/pylon detayı yok |
| 7 — Animasyon | afterburner/efekt | aileron/elevator/rudder/air-brake/iniş takımı/silah geri tepmesi **yok** |
| 8 — Uçuş modeli | arcade model, `assisted`, stall/zemin cezası (`terr`), katapult | enerji yönetimi, yüksek hız dönüş limiti, alçak irtifa hissi |
| 9 — Silahlar | 4 sistem (top/füze/bomba/fişek) | 6 silah sınıfı (SR/MR/LR IR+radar, roket, enerji) ve 8 parametreli silah verisi |
| 10 — Lock-on | `lock` 0→1, `lock-keyhole`, `lock-progress`, radar, `warning`, `target-status` | 5 durum (DETECTED→LOST), hedef sağlık çubuğu, mesafe göstergesi, radar kontakt listesi |
| 11 — Füze | güdüm, `life`, `deployFlare` tehdit düşürme, hedef yeniden kazanma | hedef tahmini (lead), yakınlık tapası, IR/radar ayrımı, duman izi katmanları |
| 12 — AI | `updateEnemies`, rubber-band, 2 zorluk | 5 kademe, 10 davranış durumu, defensive break, füze kaçınması, enerji/irtifa yönetimi |
| 13 — Wingman | `updateWingman` (tek tip) | 3 wingman tipi, komutlar (ATTACK/DEFEND/FOLLOW), skor katkısı |
| 14 — Boss | `boss` görev türü, `carrier` 608 HP | çok fazlı boss, özel saldırı, görsel hasar durumları |
| 15 — Kara hedefleri | `radar` (kıyı radarı) var | SAM, tank, AA gun, üs, komuta merkezi, yakıt deposu |
| 16 — Dünya | okyanus + adalar + `sunset` | OCEAN/DESERT/MOUNTAINS/CANYON/CITY/NIGHT/STORM biome'ları |
| 17 — Hava durumu | `rain` ×4 (metin), `cloud` ×8 | `storm` **0**, `lightning` **0**, rüzgâr/türbülans, görüş azalması |
| 18 — Sinematik | `chase`/`cockpit`, `fov` ×17, `shake` ×12 | COMBAT modu, dinamik FOV eğrisi, boss giriş/kaçış kamerası, görev intro |
| 19 — Partikül | `Points` ×36, duman/flash | tam havuzlama, debris, kıvılcım, şok dalgası, yağmur/şimşek |
| 20 — Ses | sentezlenmiş motor + 11 olay sesi | throttle'a bağlı katman derinliği, boss uyarı, kritik vuruş, 3D konumlandırma |
| 21 — Hangar | hangar ekranı, satın alma, upgrade 0–3 | 3D döndürme/zoom önizleme, skin, silah loadout ekranı, karşılaştırma |
| 22 — Progression | kredi, owned, upgrades, records, yıldız | XP/rütbe, günlük/haftalık, başarım, sezon, mastery |
| 23 — Görev | 6 tür, 48 görev, kilit zinciri | objective sistemi, survival/escort/protect/time-attack, dinamik dalga |
| 24 — Game feel | `shake`, `notify`, `toast`, `warning`, ses | vuruş/kritik vuruş geri bildirimi, skor popup'ı, killstreak sunumu |
| 25 — Mobil | sanal kol, gaz, butonlar, jiroskop | landscape kilidi, tablet yerleşimi, dokunma ölçekleme |
| 26 — Performans | 4 profil, mobil varsayılan | FPS izleme + adaptif kalite, LOD, partikül bütçesi, kod bölme |
| 27 — Save | sürümlü anahtar, doğrulamalı okuma | **migrasyon zinciri**, dışa/içe aktarma, IndexedDB |
| 28 — Monetization | — | `AdManager` soyutlaması (hiç yok) |
| 29 — Store | PWA yok | manifest + service worker, TWA/Capacitor, offline, hata ekranı |
| 30 — QA | 10 gömülü test (9/10) | CI, cihaz matrisi, konsol hatası taraması |

---

## 14. PRIORITY ROADMAP

Sıra iki ilkeye göre: **(a) çalışan oyunu asla kırma, (b) en yüksek oyuncu etkisi önce.**

| Öncelik | İş | Neden önce | Kabul kriteri |
|---|---|---|---|
| **P0** | `tools/diag` ile doğrulama hattını sabitle (✅ bu fazda eklendi) + B-2'yi nötrleştir (eski patch'leri `archive/` altına taşı veya salt-okunur işaretle) | Her sonraki adımın "bozmadım" kanıtı buna bağlı | `npm run diag` → 10/10 |
| **P1** | **B-1'i düzelt:** füze hasarı ↔ düşman HP dengesini eşle (ya hasar ↑ ya hp ↓ ya da test beklentisi "2 füze" olarak güncellensin — hangisi isteniyorsa) + `patch_v10.py` olarak yaz | Tek gerçek oyun-mantığı hatası; yeni oyuncunun ilk 30 saniyesini etkiliyor | `tools/diag` 10/10 + önizlemede ilk hedef tek füzeyle düşüyor |
| **P2** | **B-3:** `skyforge/striker-profile-v3` + migrasyon zinciri + dışa/içe aktarma | Bir şema değişikliği tüm profilleri siler; içerik eklemeden önce şart | v2 profili v3'e kayıpsız göçüyor (test) |
| **P3** | B-4 + B-5: harici font/beacon'ı yerelleştir veya çıkar; PWA manifest + service worker | Çevrimdışı oynanış ve mağaza hazırlığının ön koşulu | uçak modunda oyun açılıyor |
| **P4** | Phase 4/5: AircraftData şemasını genişlet (18+ alan) + 4 yeni uçak + özgün gövde geometrisi | İçerik derinliği; veri katmanı zaten ayrık olduğu için düşük risk | 20 uçak, her biri farklı siluet/davranış |
| **P5** | Phase 9/10/11: silah sınıfları + 5 durumlu lock-on + IR/radar füze ayrımı | Savaş döngüsünün kalitesi | "kilit kırıldı → flare → kaçtım" hissi |
| **P6** | Phase 12/14: AI kademeleri + boss fazları | Rakip hissi | 5 kademe davranış farkı gözle görülür |
| **P7** | Phase 16/17/18/19: biome + hava durumu + kamera + VFX | Algılanan kalite sıçraması | 8 biome ayırt edilebilir |
| **P8** | Phase 21/22/23: hangar 3D önizleme, progression derinliği, objective'lı görevler | Meta oyun / retention | günlük + haftalık + başarım |
| **P9** | Phase 25/26/28/29: landscape kilidi, adaptif kalite, AdManager, TWA | Yayın hazırlığı | gerçek cihazda ölçüm + mağaza paketi |
| **P10** | Phase 3'ün tam mimari geçişi (`src/…` ağacı) | En riskli iş, en sona — çalışan oyunu korumak için | modül modül, her adımda 10/10 test |

> **Phase 3 hakkında teknik gerçek:** tam mimari geçişi **P10'da** duruyor çünkü kaynak minify.
> Önce P1–P9'u yama hattıyla (güvenli, doğrulanabilir) yürütmek, bu arada modülleri teker teker
> okunabilir kaynağa çıkarmak en düşük riskli yoldur. "Her şeyi bir anda taşı" yaklaşımı bu projede
> çalışan oyunu kaybetme riski taşır.

---

## 15. RISK KAYDI

| # | Risk | Etki | Azaltma |
|---|---|---|---|
| **R-1** | **Okunabilir kaynak yok** — geliştirme minify bundle üzerinde string replacement | En yüksek: her yama kırılgan, hata ayıklama kör | `rep()` zaten `count!=n` assert'iyle güvenli; her fazı `patch_vN.py` + `tools/diag` ile doğrula; modülleri kademeli olarak kaynağa çıkar |
| **R-2** | Eski patch script'leri master'ı ezer (B-2) | Yüksek: sessiz veri kaybı | Arşivle + `README` uyarısı + tek giriş noktası (`build.py`) |
| **R-3** | Save migrasyonsuz (B-3) | Yüksek: oyuncu kaybı | P2'de migrasyon zinciri + test |
| **R-4** | Mobil 60 FPS doğrulanamıyor (burada GPU yok) | Yüksek: yayın riski | Gerçek cihazda ölçüm; bütçeli partikül + LOD + adaptif çözünürlük |
| **R-5** | 965 KB parse maliyeti | Orta | Kod bölme, menüyü önce çiz, Three.js'i lazy import |
| **R-6** | Harici font/beacon (B-4) | Orta: çevrimdışı + gizlilik | Yerelleştir/kaldır |
| **R-7** | Kapsam aşımı (30 faz) | Orta | Bu yol haritası + "asla 20 değişiklik birden değil" |

---

## 16. KANIT GÜNLÜĞÜ

| # | Komut / işlem | Sonuç |
|---|---|---|
| 1 | `git fetch origin` → `git ls-remote origin` | `main` = `2716d9a` ("Add files via upload"), önceden `451d918` |
| 2 | `git merge origin/main --allow-unrelated-histories` | zip depoya alındı (iki commit'in ortak atası yok — orphan) |
| 3 | `unzip -l striker-yedek-v1.7.zip` | 27 giriş, 6.223.337 bayt |
| 4 | `md5sum` (6 HTML) | `page.html == app.html`, `inner.html == striker-dev/original.html` |
| 5 | `<title>` + sürüm rozeti taraması | `index.html` → "UÇUŞ SÜRÜMÜ **1.7 DEV**"; `inner.html` → **0.9**; `new.html` → "**Tanıtım Videosu Stüdyosu**" |
| 6 | `node --check` (çıkarılan modüller) | v1.7 ve v0.9 **sözdizimi temiz** |
| 7 | jsdom + WebAudio stub ile `import` | modül 47 ms'de yüklendi, 16 uçak / 48 görev okundu |
| 8 | **`$w()` — v1.7** | **9/10 PASS**, FAIL: `Lock, guided missile, impact` (5/5 tekrar, deterministik) |
| 9 | **`$w()` — v0.9** | **10/10 PASS** → regresyon kanıtı |
| 10 | `--probe` (v1.7) | hedef hp=160, füze hasarı=110, vuruş 201. kare, 160→50, kills=0 |
| 11 | `--probe` (v0.9) | hedef hp=100, vuruş 92. kare, 100→0, **kills=1, score=250** |
| 12 | `Pa.prototype` dökümü | 21 metot listelendi |
| 13 | Uçak/düşman/görev tabloları | 16 uçak, 10 düşman tipi + HP, 48 görev (4×12, 6 tür) |
| 14 | **`patch_v9.py` izole çalıştırma** | `size: 1088218`, md5 `11f4e00d…` → **master ile birebir aynı** |
| 15 | `patch_v*.py` I/O taraması | 7 script'in hepsi `inner.html` → `striker-dev/index.html` (zincirleme değil, her biri sıfırdan) |
| 16 | `python3 striker-dev/server.py` | `0.0.0.0:8080` dinliyor; `GET /` → **HTTP 200**, 1.096.810 bayt, md5 master ile aynı; `favicon.svg` → 200 |
| 17 | CSS/HTML taraması | CSS 121.311 B, 12 `@media`, 11 `@keyframes`, `env(safe-area-…)` var, 22 `aria-label` |
| 18 | Asset/URL taraması | 0 image/model/ses dosyası; harici: Google Fonts + Cloudflare beacon |
| 19 | `grep orientation.lock` | **0** → landscape kilidi yok |
| 20 | `cb()`/`ub()` kaynak okuması | `version!==2 → return default` (migrasyon yok) |
| 21 | `grep -c "DENİZ HAVA OPERASYONLARI\|Gökyüzüne hükmet\|UÇUŞA BAŞLA"` | `inner.html` → 1/1/1 ; `page.html` → 0/0/0 → **canlı site v0.9** |
| 22 | `grep -oE "iframe[^>]{0,120}\|embed=true" page.html` | `iframe-container`, `embed=true` → Arena sarmalayıcı doğrulandı |
| 23 | `grep -cE '^\s*rep[n]?\(' striker-dev/patch_v9.py` | 88 satır başı çağrı (90 geçiş − 4 tanım = 86 yama) |

---

## 17. PHASE 0'DA YAPILAN DEĞİŞİKLİKLER (kod değil, yalnızca 2 şey)

1. `PROJECT_AUDIT.md` — bu dosya.
2. `tools/diag/` — projenin **kendi** gömülü test paketini çalıştıran doğrulama aracı
   (`run-diagnostics.mjs`, `package.json`, `README.md`). Oyun koduna **dokunulmadı**; bundle'dan
   üretilen geçici kopya `tools/diag/.build/` altında (gitignore'a eklendi).

Oyun dosyalarının **hiçbiri değiştirilmedi**: `striker-dev/index.html` md5 `11f4e00d…`,
`inner.html` md5 `fa165af8…` — ikisi de zip'ten çıktığı hâliyle duruyor.

**Bir sonraki adım onayına kadar bekliyorum.** Önerilen ilk iş: **P1 / B-1** (füze-hasar ↔
düşman-HP dengesi) — tek gerçek oyun hatası, `patch_v10.py` + `tools/diag` ile doğrulanabilir.

---

## 18. FAZ GÜNLÜĞÜ

### P0 + P1 — 2026-09-30 (uygulandı, doğrulandı)

**Yapılanlar**

| # | İş | Dosya | Doğrulama |
|---|---|---|---|
| 1 | Doğrulama aracı **sıfır bağımlılıkla** yeniden yazıldı (jsdom kaldırıldı → `npm install` gerekmiyor), `--probe` ve `--balance` modları eklendi | `tools/diag/run-diagnostics.mjs` | v1.7 → 9/10 (exit 1), v0.9 → 10/10 (exit 0) |
| 2 | Eskimiş build script'leri arşivlendi (**B-2**) | `striker-dev/archive/` (9 dosya + README) | `ls striker-dev/` → sadece `patch_v10.py` aktif |
| 3 | **B-12 düzeltildi:** `mSet` arama anahtarı `[n.id]` → `[typeof n=="string"?n:n.id]` | `patch_v10.py` | farklı füze tablosu **1/16 → 16/16** |
| 4 | **B-1 düzeltildi:** düşman HP `×1.6` çarpanı geri alındı | `patch_v10.py` | gereken atış 18 → **11**; test `Lock, guided missile, impact` PASS |
| 5 | Gömülü **regresyon testi** eklendi: `Per-aircraft missile loadouts` (16 farklı tablo şartı) | `patch_v10.py` | test paketi 10 → **11** test, 11/11 PASS |
| 6 | Rozet `1.7 DEV` → `1.8 DEV` | `patch_v10.py` | `grep "UÇUŞ SÜRÜMÜ"` → `1.8 DEV` |
| 7 | Tek komutla derle+doğrula hattı | `build.py` | `python3 build.py` → **exit 0** |
| 8 | QA listesi | `QA_CHECKLIST.md` | OTO/MANUEL/❌ ayrımıyla |

**Ölçülen önce/sonra (hepsi `tools/diag` çıktısı)**

| Metrik | v1.7 DEV | v1.8 DEV |
|---|---|---|
| Gömülü test | 9/10 (exit 1) | **11/11 (exit 0)** |
| Farklı füze tablosu | 1/16 | **16/16** |
| Hafif hedef HP | 160 | **100** |
| 1. görevde gereken vuruş | 18 | **11** |
| Asistli sorti süresi | 57.4 sn | **70.4 sn** (kısalmadı) |
| Build boyutu | 1.096.810 B | 1.097.136 B (+326 B) |
| md5 | `11f4e00d…` | `d1bec7c2…` |

**Değişmeyenler (regresyon yok):** 16 uçak · 48 görev · 10 dil · 4 kalite profili · save anahtarı
`idea-game.striker.v2` (şema değişmedi → mevcut profiller korunur) · katapult · kanat arkadaşı ·
ağır füze modu · ses motoru (`audio5.js`).

**Sıradaki:** P2 — save v3 + migrasyon zinciri (B-3).

### P2 — 2026-09-30 (uygulandı, doğrulandı)

**Amaç:** B-3 — şema değiştiğinde oyuncu profilinin silinmesini engellemek.

| # | İş | Doğrulama |
|---|---|---|
| 1 | Sürümlü anahtar: `striker.profile.v3` + `__bl` (eski anahtarlar) + `__bq` (karantina) | `--save`: anahtarlar raporlanıyor |
| 2 | Migrasyon zinciri `__mig()` — 1→2→3 adımlı, **saf fonksiyon**, `migrations` yolu kaydediliyor | gömülü test `Save migration preserves the pilot` |
| 3 | `__raw()` — ham string → `{profile, quarantine}`; bozuk/bilinmeyen veri **karantinaya** | gömülü testler: `Corrupt save is quarantined` · `Unknown schema version is not merged` |
| 4 | `__ld()` — migrate-on-read: v3 anahtarı yoksa eskileri dene, taşı, yeni anahtara yaz; eski anahtarı **silme** | `--save`: 16/16 senaryo (idempotent dahil) |
| 5 | `Ey()` varsayılanı v3 zarfına alındı (`createdAt/updatedAt/migrations`) | bu eksikliği **test yakaladı** (ilk denemede 13/14) |
| 6 | `ub()` yazarken `version:3` + `updatedAt` damgalıyor | `--save` |
| 7 | `tools/diag`'a `--save` modu + sürümden bağımsız sembol tespiti | v1.8 ve v1.9 build'lerinde çalışıyor |
| 8 | `build.py` artık en güncel `patch_vN.py`'yi otomatik seçiyor; `patch_v10.py` arşive taşındı | `build.py` → `patch_v11.py` |

**Kanıt (v1.9 DEV, md5 `c3b4f1a2…`):** `build.py` exit 0 · `node --check` temiz (967.790 kr) ·
gömülü testler **14/14** · `--save` **16/16** · sunucu `GET /` → 200, sunulan md5 == depodaki md5,
rozet `1.9 DEV`.

**Kurtarma yolu (destek için):** bir oyuncunun verisi bozulursa `localStorage["striker.profile.v3.quarantine"]`
içinde ham kayıt durur; ayrıca eski `idea-game.striker.v2` anahtarı da silinmediği için ikinci yedektir.

**Sıradaki:** P3 — harici bağımlılıklar (B-4) + PWA/offline.

---

### P2.5 — 2026-10-31 (uygulandı, doğrulandı) · v1.10 DEV · plan dışı kullanıcı hatası

**Tetikleyici:** kullanıcı bildirimi *"dağın içinde hedef gösteriyor"*. Roadmap'te yoktu;
P2 ile P3 arasına alındı çünkü oyuncunun her görevde gördüğü görsel bir kusurdu.

| # | İş | Doğrulama |
|---|---|---|
| 1 | `tools/diag`'a **`--terrain`** modu eklendi (kalıcı regresyon testi). `terr()` `Pa.prototype` üzerinde olduğu için `sim.terr(x,z)` doğrudan çağrılıyor — **arazi yüksekliği koddan okunuyor, sabit yazılmıyor** | 464 hedef / 48 görev taranıyor |
| 2 | **A) Gömülü hedef** ölçümü: `terr(x,z) > y + 1` | v1.9: **16/464**, en kötü **−232 m** |
| 3 | **B) Gövdesi araziye giren** ölçümü; `h > SEA` korumasıyla gemi yanlış pozitifi elendi | ilk sürüm 200 yanlış pozitif üretiyordu → gerçek değer **0** |
| 4 | **C) Görüş hattı** ölçümü; ışının ilk %5 / son %15'i yoksayılıyor (yoksa A kusuru C'yi şişiriyordu) | C **bilgi amaçlı**, çıkış kodunu etkilemez |
| 5 | **Yerleşim dağılımı** ölçümü (|x| min/medyan/ort/%90/maks + merkeze yığılma) | düzeltmenin hedefleri koridora çekmediğini kanıtlıyor |
| 6 | `patch_v12.py`: kara hedefi yerleşimi `terr <= g-6` + 96 tur arama + gömülmeye karşı zemin üstüne kaldırma | `--terrain` **16 → 0**, exit **1 → 0** |
| 7 | Hava hedeflerinin kaçış döngüsü **aynen** korundu | sorti dengesi hava hedeflerinde değişmedi |
| 8 | Rozet 10 dilin hepsinde `1.10 DEV` (eskiden de/es/fr/it/pt/ru/id "1.3 DEV", ar "1.4 DEV") | `build.py` → `rozet : ['1.10 DEV']` (tek değer) |

**A/B kanıtı** (aynı araç, iki build — eski build `docs/index.html` olarak duruyordu):

| Ölçüt | v1.9 | v1.10 |
|---|---|---|
| Gömülü hedef | 16/464 | **0/464** |
| En kötü açıklık | −232 m | **+8 m** |
| Yerleşim medyan \|x\| | 1410 m | 1410 m |
| `--terrain` exit | 1 | **0** |
| Gömülü testler | 14/14 | **14/14** |
| `--save` | 16/16 | **16/16** |
| Asistli sorti (1. görev) | 70,4 sn / 2190 | 32,8 sn / 2590 |

**Kanıt (v1.10 DEV, md5 `4dd0ea19b75273195dc84e3d30566ef5`, 1.099.683 bayt):** `build.py`
exit 0 · `node --check` temiz (967.965 kr) · gömülü testler **14/14** · `--terrain` **0 gömülü**
· `--balance` BAŞARILI 7/7 · `--save` **16/16** · sunucu `GET /` → 200, sunulan md5 ==
depodaki md5, rozet `UÇUŞ SÜRÜMÜ 1.10 DEV`.

**Açık kalan (dürüst kayıt):**
- **Bölüm C: 198/464 hedef görev başlangıcında bir tepenin arkasında.** Bu bir hata değil —
  radarın dağ arkasındaki hedefi göstermesi gerçekçi. Ama oyuncu "dağın içinde hedef"
  hissini buradan da alabilir; P7'de (kamera/VFX) işaretçiye *occlusion* görsel ipucu
  (soluk/kesikli çerçeve) eklenebilir.
- **X4 açıldı:** 48 görevin `par = 240 + n*50` formülü gerçek sorti süreleriyle uyumsuz.
- **GPU/ses/dokunma doğrulanamadı** — sandbox'ta yok. Görsel olarak "hedef artık dağın
  içinde değil" teyidi gerçek cihazda yapılmalı (`QA_CHECKLIST.md` MANUEL maddeleri).

**Sıradaki:** P3 — harici bağımlılıklar (B-4) + PWA/offline + kod bölme (B-5).
