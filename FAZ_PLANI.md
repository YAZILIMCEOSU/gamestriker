# STRIKER — FAZ PLANI VE KABUL KRİTERLERİ

> **Bu dosya tek doğruluk kaynağıdır.** Bir faz "bitti" sayılması için üç şey gerekir:
> (1) kod değişikliği `patch_vN.py` içinde yorumlu bir blok olarak durur,
> (2) bir **doğrulama komutu** sayısal kanıt üretir, (3) bu dosyadaki durum sütunu güncellenir.
> Simüle/placeholder iş "bitti" diye işaretlenmez.

**Master:** `striker-dev/index.html` · **v1.10 DEV** · md5 `4dd0ea19b75273195dc84e3d30566ef5` · 1.099.683 bayt
**Build:** `python3 build.py` (en yüksek N'li `striker-dev/patch_vN.py`'yi otomatik seçer)
**Önizleme:** `python3 striker-dev/server.py` → `http://localhost:8080`

---

## 0. DOĞRULAMA PROTOKOLÜ (her fazda, sırayla)

| # | Komut | Ne kanıtlar | Beklenen |
|---|---|---|---|
| 1 | `python3 build.py` | derleme + sözdizimi + gömülü testler | exit 0, **14/14** |
| 2 | `node tools/diag/run-diagnostics.mjs --terrain` | arazi bütünlüğü | exit 0, **0 gömülü** |
| 3 | `node tools/diag/run-diagnostics.mjs --balance` | füze ekonomisi + sorti | exit 0, BAŞARILI |
| 4 | `node tools/diag/run-diagnostics.mjs --save` | save/migrasyon/karantina | exit 0, **16/16** |
| 5 | `python3 striker-dev/server.py` + `curl` | sunulan bayt == depo baytı | md5 birebir |
| 6 | Tarayıcıda MANUEL tur | GPU/ses/dokunma | `QA_CHECKLIST.md` |

**Bu ortamda DOĞRULANAMAYANLAR** (her faz raporunda açıkça yazılmalı): gerçek FPS, GPU
render kalitesi, WebAudio çıkışı, dokunmatik girdi, `orientation.lock`, iOS `AudioContext`
resume. Sandbox'ta GPU/ses/dokunma yok. Bunlar yalnızca gerçek cihazda kapanır.

---

## 1. FAZ DURUM TABLOSU

> **Faz numaralandırması `PROJECT_AUDIT.md` §14 ile birebir aynıdır** (P0–P10). Tek istisna
> **P2.5**: kullanıcının bildirdiği plan dışı hata (B-13), P2 ile P3 arasına girdi.

| Faz | Kapsam | Hata | Durum | Kanıt |
|-----|--------|------|-------|-------|
| **P0** | Adli analiz, `PROJECT_AUDIT.md`, doğrulama hattı | B-2 | ✅ BİTTİ | `PROJECT_AUDIT.md` §0–16 |
| **P1** | Füze hasarı ↔ düşman HP dengesi | B-1 | ✅ BİTTİ | `--balance` 1/16 → 16/16 |
| **P2** | Sürümlü save + migrasyon + karantina | B-3 | ✅ BİTTİ | `--save` 16/16 |
| **P2.5** | **Arazi bütünlüğü + rozet tutarlılığı** *(plan dışı)* | **B-13, B-11(kısmi)** | ✅ **BİTTİ (bu tur)** | `--terrain` 16 → **0** |
| **P3** | Harici bağımlılıklar + PWA/offline | B-4, B-5 | ⏳ **SIRADAKİ** | build'de harici URL = 0 |
| **P4** | AircraftData şeması (18+ alan) + 4 yeni uçak | — | ⏳ BEKLİYOR | 20 uçak, farklı siluet |
| **P5** | Silah sınıfları + 5 durumlu lock-on + IR/radar ayrımı | — | ⏳ BEKLİYOR | "kilit kırıldı → flare" |
| **P6** | AI kademeleri + boss fazları | — | ⏳ BEKLİYOR | 5 kademe farkı |
| **P7** | Biome + hava durumu + kamera + VFX | — | ⏳ BEKLİYOR | 8 biome ayırt edilebilir |
| **P8** | Hangar 3D + progression derinliği + objective'ler | — | ⏳ BEKLİYOR | günlük/haftalık/başarım |
| **P9** | Mobil: orientation lock, adaptif kalite, AdManager, TWA | B-9 | ⏳ BEKLİYOR (gerçek cihaz) | cihaz ölçümü + mağaza paketi |
| **P10** | Tam mimari geçiş (`src/…` ağacı) | B-10 | ⏳ EN SON (en riskli) | modül modül, her adımda test |
| **X1** | Depo hijyeni (3,9 MB yabancı dosya) | B-6, B-7, B-8 | ⏳ FIRSAT İŞİ | izlenen bayt ↓, md5 A/B |
| **X2** | Yayın: GitHub Pages + arena.site | B-11 | ⏳ **KULLANICI İZNİ GEREK** | canlı URL md5 |
| **X3** | Respawn mekaniği | — | ⏳ BEKLİYOR | gömülü test |
| **X4** | Par/yıldız kalibrasyonu | — | ⏳ **P2.5'te BULUNDU** | `--balance` sorti/par oranı |

> `Xn` = roadmap dışı, bağımsız işler (herhangi bir fazın arasında yapılabilir).

---

## 2. P2.5 — ARAZİ BÜTÜNLÜĞÜ (plan dışı, bu tur uygulandı — v1.10 DEV)

### Kullanıcı bildirimi
> "dağın içinde hedef gösteriyor"

### Kök neden (kod kanıtı)
`patch_v11.py`'in v6 bloğu hedef doğuşunda araziden kaçmaya çalışıyordu:

```js
let d = u===0 ? 0 : (u%2?-1:1)*(360+u*210);
for (let q=1; q<8 && this.terr(d,p) > 4; q++) d += (q%2?1:-1)*(260+q*190);
const g = f ? 190+u*28 : c==="radar" ? 26 : 8;      // irtifa
```

İki kusur:
1. **Eşik sabit (`terr > 4`), irtifa ise 8/26 m.** Kara hedefi y=8'de duruyor; arazinin
   240 m olduğu bir noktada `terr=240 > 4` koşulu *döngü bittikten sonra* sağlanamıyorsa
   hedef **232 m toprağın altında** doğuyordu.
2. **Döngü en fazla 7 tur.** Kaçamazsa hedef dağın içinde kalıyordu — sessizce.

### Ölçüm (öncesi) — `tools/diag --terrain`
```
incelenen hedef  : 464 hedef / 48 görev
GÖMÜLÜ           : 16/464   (en kötü: görev 0 destroyer, açıklık −232 m)
etkilenen görev  : 46/48
```
Arazi zirvesi koddan okundu: **686 m @ (200, −6000)**.

### Çözüm (`patch_v12.py`, son blok)
```js
let d=u===0?0:(u%2?-1:1)*(360+u*210), g=f?190+u*28:c==="radar"?26:8;
if (f) { /* HAVA hedefi: v6 davranışı AYNEN — denge değişmesin */ }
else {
  const __x0=d;
  let __ok = this.terr(__x0,p) <= g-6;                       // koşul artık İRTİFAYA bağlı
  for (let q=1; q<=96 && !__ok; q++)
    __ok = this.terr(d = __x0+(q%2?1:-1)*(140+q*95), p) <= g-6;
  __ok || (g = this.terr(d,p)+50);                           // son çare: zeminin ÜSTÜNE kaldır
}
```
- Gemi (y=8) → `terr ≤ 2` yani **deniz**; radar (y=26) → `terr ≤ 20` yani alçak tepe.
- 96 tur, iki yöne genişleyerek. Harita ~9,3 km; 6 dağ blogu en fazla |x| ≤ 6,6 km →
  geçerli nokta **her zaman** bulunur.
- Bulunamazsa hedef gömülmek yerine zeminin 50 m üstüne kaldırılır (en büyük gövde
  yarıçapı carrier 90 m → 50 m açıklık kesisme eşiğinin üstünde).

### Ölçüm (sonrası) — A/B, her iki build'de aynı araç
| Ölçüt | v1.9 (eski) | v1.10 (yeni) |
|---|---|---|
| Gömülü hedef | **16/464** | **0/464** ✅ |
| Gövdesi araziye giren | 0/464 | 0/464 |
| En kötü açıklık | **−232 m** | **+8 m** ✅ |
| Yerleşim medyan \|x\| | 1410 m | 1410 m (değişmedi) |
| Yerleşim ort. \|x\| | 1371 m | 1278 m |
| Merkez hattına yığılma | 48/464 | 48/464 (yalnız u=0, tasarım gereği) |
| `--terrain` exit | 1 | **0** |
| Gömülü test paketi | 14/14 | **14/14** |
| `--save` | 16/16 | **16/16** |

**Hedefler merkeze yığılmadı** — medyan |x| birebir aynı. Yani düzeltme, hedefleri
koridora çekip oyunu bozmadı.

### Yan etki (dürüst kayıt) — X4'ü açtı
`--balance` asistli sorti: **70,4 sn / skor 2190 → 32,8 sn / skor 2590** (ikisi de
BAŞARILI 7/7, limit 480 sn, par 240 sn). Sebep: 1. görevdeki gömülü destroyer artık
açık suda, hemen angaje ediliyor. Görev zaten kolaydı ama artık belirgin şekilde kolay.
→ **X4: par/yıldız kalibrasyonu** (48 görevin par değerleri gerçek sorti sürelerine
göre yeniden ölçeklenmeli).

### Aynı turda kapanan: rozet tutarlılığı (B-11 kısmi)
Eskiden `build` rozeti yalnız EN/TR'de override ediliyordu; **de/es/fr/it/pt/ru/id
"1.3 DEV", ar "1.4 DEV"** gösteriyordu. Artık 10 dilin hepsi `1.10 DEV`.
Kanıt: `build.py` çıktısı `rozet : ['1.10 DEV']` — tek değer, önceden çokluydu.

### Yeni doğrulama modu
`node tools/diag/run-diagnostics.mjs --terrain` — kalıcı regresyon testi. Üç bölüm:
(A) gömülü hedef, (B) gövdesi araziye giren, (C) görüş hattı kapalı. A+B çıkış kodunu
belirler. C **bilgi amaçlıdır**: radarın dağ arkasındaki hedefi göstermesi gerçekçi
uçuş simülasyonu davranışıdır, hata değildir.

> **Bölüm C ölçüm notu:** ilk sürümde C, hedefin hemen yakınındaki örnekleri de
> sayıyordu; bu yüzden A kusuru C'yi şişiriyordu (214 → aslında çoğu gömülmeden
> kaynaklı). Işının ilk %5'i ve son %15'i artık yoksayılıyor, yalnızca **orta bölüm**
> "araya dağ girdi" sayılıyor. Ayrıca gemi `terr=0` iken "kesişiyor" saymak yanlış
> pozitifti → `h > SEA` koruması eklendi (B bölümü 200 → gerçek 0).

---

## 3. P3 — HARİCİ BAĞIMLILIKLAR + PWA/OFFLINE (B-4, B-5) · ⏳ SIRADAKİ

**Sorun:** build'de hâlâ `fonts.googleapis.com` ×2, `fonts.gstatic.com` preconnect ve
`static.cloudflareinsights.com/beacon.min.js` ×1 var. Çevrimdışı oynanış bozulur, Play
Store gizlilik beyanı gerekir, mağaza incelemesinde üçüncü taraf izleme sorusu doğar.

**Adımlar (küçük, ayrı doğrulanır):**
1. `@fontsource/*` ile fontları yerelleştir → `@font-face` + `unicode-range` inline.
   *(npm erişimi henüz DOĞRULANMADI — önceki deneme kesildi; ilk iş bu.)*
2. Cloudflare beacon'ı **sil** (izleme; oyun mantığıyla bağı yok).
3. `manifest.webmanifest` + `sw.js` (cache-first, sürüm damgalı).
4. `server.py` `no-store` başlığını yalnızca `.html`'e özelleştir (asset'ler cache'lenebilsin).
5. `--offline` doğrulama modu: build'de harici URL sayısı **0** olmalı.

**Kabul:** `grep -c 'googleapis\|gstatic\|cloudflareinsights' striker-dev/index.html` → **0**.

---

## 4. DİĞER FAZLAR (özet kabul kriterleri)

**P9 — Mobil (B-9):** `orientation.lock('landscape')` + iOS `AudioContext.resume()` ilk
dokunuşta. *Kabul: gerçek cihazda portrait'te uyarı ekranı, ses ilk dokunuşta açılıyor.*
Bu sandbox'ta doğrulanamaz.

**X1 — Depo hijyeni (B-6/7/8):** `new.html` (2,8 MB, başka uygulama), `page.html`/
`app.html` (birebir kopya), `original.html` (`inner.html` kopyası), `striker-yedek-v1.7.zip`
(2,5 MB). *Kabul: izlenen bayt ↓, oyun davranışı değişmez (md5 A/B).*

**P10 — Okunabilir kaynak (B-10, yapısal):** tüm geliştirme minify bundle üzerinde string
replacement ile yapılıyor; bir yamanın `count != n` olması build'i kırıyor. *Kabul: en az
oyun mantığı modüllerinin okunabilir kaynaktan derlenmesi.* En yüksek emek, en yüksek
kalıcı değer.

**X2 — Yayın (B-11):** `docs/` GitHub Pages kaynağı olarak hazır. **Pages ayarı kullanıcıda**
(`gh api` token'ı 403 veriyor). Hedef: `https://yazilimceosu.github.io/gamestriker/`.
*Kabul: canlı URL'nin md5'i depo md5'iyle eşleşir.* **Not: `docs/` şu an v1.9 — P3
sonrası v1.10 ile yenilenmeli.**

**X3 — Respawn:** şu an ölüm = başarısız + retry (`respawn` durumu 0 geçişli).
*Kabul: gömülü test "respawn preserves mission state".*

**X4 — Par/yıldız kalibrasyonu (P2.5'te bulundu):** 48 görevin `par = 240 + n*50`
formülü gerçek sorti süreleriyle uyumsuz (1. görev 32,8 sn). *Kabul: `--balance` tüm
görevler için sorti/par oranı makul bantta.*

---

## 5. AÇIK HATA KAYDI

| ID | Özet | Önem | Durum |
|----|------|------|-------|
| B-1 | Düşman HP ×1,6 çarpanı | — | ✅ KAPALI (v1.8) |
| B-2 | Füze tablosu ayrışmıyordu | — | ✅ KAPALI (v1.8) |
| B-3 | Sema değişince profil siliniyordu | — | ✅ KAPALI (v1.9) |
| **B-13** | **Hedefler araziye gömülüyordu (16/464, −232 m)** | **YÜKSEK** | ✅ **KAPALI (v1.10)** |
| B-4 | Harici font + Cloudflare beacon | ORTA | ⏳ P3 |
| B-5 | 965 KB tek modül, kod bölme yok | ORTA | ⏳ P3 |
| B-6 | Depoda ~3,9 MB oyun olmayan dosya | ORTA | ⏳ X1 |
| B-7 | Eskimiş `audio2/4.js`, `patch_v3/4/5` | DÜŞÜK | ⏳ X1 |
| B-8 | 2,5 MB zip git'te | DÜŞÜK | ⏳ X1 |
| B-9 | `orientation.lock` yok, iOS audio doğrulanmadı | ORTA | ⏳ P9 |
| B-10 | Okunabilir kaynak yok (yapısal) | YÜKSEK | ⏳ P10 |
| B-11 | Canlı site 8+ sürüm geride | YÜKSEK | ⏳ X2 (rozet kısmı ✅ v1.10) |
| B-12 | v1.7 ana özelliği çalışmıyordu | — | ✅ KAPALI (v1.8) |

---

## 6. DEĞİŞMEZ KURALLAR (brief'ten)

- Sıfırdan yeniden yazma **yok**; mimari korunur; çalışan özellik silinmez.
- Korunacak 16 sistem: BattleEngine, World, ParticleSystem, GameAudio, AircraftController,
  EnemyAI, MissileSystem, TargetingSystem, Profile, Hangar, HUD, MissionSelect, Results,
  SeasonPass, Leaderboard, Settings.
- "20 değişikliği birden yapma" — küçük, doğrulanmış fazlar.
- Uçak mantığı veri-güdümlü (`AircraftData`); motor içinde uçağa özel hardcode **yasak**.
- Sahte reklam **yok**; yalnızca temiz `AdManager` soyutlaması, gameplay'den ayrı.
- Placeholder/simüle özellik "tamamlandı" diye sunulmaz; tarayıcı ≠ native Unity.
