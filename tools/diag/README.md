# tools/diag — Striker gömülü tanılama koşucusu

Oyunun bundle'ının içinde geliştiricinin yazdığı simülasyon testleri gömülü (`$w()` fonksiyonu;
arayüzde "Tanılama" paneli olarak da görünüyor). Bu araç o fonksiyonu **hiç değiştirmeden** Node
altında çalıştırır.

**Sıfır bağımlılık** — `npm install` gerekmez, sadece Node. (`package.json` yalnızca `npm run`
kısayolları için duruyor.)

## Kullanım

```bash
# güncel master build — 14 gömülü test
node run-diagnostics.mjs ../../striker-dev/index.html

# dokunulmamış temel build (v0.9) — regresyon A/B karşılaştırması
node run-diagnostics.mjs ../../inner.html

# başarısız bir testin kök nedenini sayısal dök
node run-diagnostics.mjs ../../striker-dev/index.html --probe

# füze ekonomisi + düşman HP dökümü (denge değişikliklerinde önce/sonra)
node run-diagnostics.mjs ../../striker-dev/index.html --balance

# save/migrasyon senaryoları (v1.9+) — gerçek v2 profili taşınıyor mu?
node run-diagnostics.mjs ../../striker-dev/index.html --save

# arazi bütünlüğü (v1.10+) — hedef dağın içine gömülmüş mü?
node run-diagnostics.mjs ../../striker-dev/index.html --terrain

# hepsi birden (4 mod, sırayla)
npm run verify
```

Çıkış kodu: hepsi geçti → `0`, en az bir test başarısız → `1`, araç hatası → `2`.
Kök dizindeki **`python3 build.py`** bu aracı zaten otomatik çağırıyor.

## Ne yapıyor / ne yapmıyor

Yapılan tek müdahaleler **geçici kopyada** (`tools/diag/.build/bundle.mjs`, gitignore'da):

1. `<script type="module">` gövdesi HTML'den çıkarılır.
2. Son satırdaki `createRoot(...).render(...)` bootstrap'ı kaldırılır — testler saf simülasyon
   mantığı (`Pa` sınıfı) olduğu için DOM/WebGL/Audio gerekmez (minimal stub'lar yeter).
3. Minify tanımlayıcılar (`$w`, `dn`, `no`, `Ey`, `by`, `Pa`) desenden **otomatik** bulunur ve
   `export` edilir. Adlar her build'de değişebileceği için sabit yazılmaz; bulunamazsa araç
   açık hata verip `2` döner.

Bu araç **tarayıcı render'ını, GPU performansını veya sesi test etmez.** Onlar için:
`python3 striker-dev/server.py` → `http://localhost:8080`.

## Test paketi (v1.10 DEV, 14 test)

| Test | Ne doğrular |
|---|---|
| 48 mission configurations | 48 görev, benzersiz id, hedef sayısı tutarlı |
| Aircraft stats and upgrades | uçak kartları + upgrade 0–3 kırpması |
| Heading and swept collisions | süpürme çarpışma, mermi tünellemez |
| Lock required before launch | kilitsiz atış mermi harcamaz |
| Lock, guided missile, impact | kilit → füze → vuruş → imha |
| Countermeasures remove threats | fişek düşman füzesini düşürür |
| Reacquire an overshot target | kaçırılan hedef 20 sn'de yeniden kilitlenir |
| Extraction and stable result | tüm hedefler → dönüş → tek sonuç |
| Timeout and campaign unlock | süre aşımı → başarısız + kilit durumu |
| First sortie combat-to-return loop | asistli pilot ilk sortiyi tamamlar |
| **Per-aircraft missile loadouts** | **16 uçağın füze tabloları ayrışıyor** (v1.8'de eklendi — B-12 bekçisi) |
| **Save migration preserves the pilot** | **v2 profili v3'e kayıpsız taşınıyor** (v1.9'da eklendi — B-3 bekçisi) |
| **Corrupt save is quarantined, not lost** | bozuk kayıt karantinaya alınıyor, silinmiyor |
| **Unknown schema version is not merged** | bilinmeyen sürüm canlı profile sızmıyor |

## Ölçülen geçmiş

| Build | Sonuç |
|---|---|
| `inner.html` (v0.9) | 10/10 PASS |
| v1.7 DEV | **9/10** — `Lock, guided missile, impact` FAIL; ayrıca 16 uçağın füze tablosu tek varsayılana çökmüştü |
| v1.8 DEV | 11/11 PASS |
| v1.9 DEV | **14/14 PASS** + `--save` 16/16 senaryo · `--terrain` **16/464 hedef gömülü (−232 m)** → exit 1 |
| **v1.10 DEV (güncel)** | **14/14 PASS** + `--save` 16/16 + `--terrain` **0/464 gömülü** → exit 0 |

## `--terrain` — arazi bütünlüğü (v1.10'da eklendi, B-13 bekçisi)

Kullanıcı bildirimi *"dağın içinde hedef gösteriyor"* için yazıldı. `terr()` fonksiyonu
`Pa.prototype` üzerinde olduğu için araç **arazi yüksekliğini koddan okur** — sabit sayı
yazılmaz, denge/arazi değişince araç yalan söylemez.

48 görevin **464 hedefi** taranır ve üç ayrı kusur ölçülür:

| Bölüm | Ölçüt | Çıkış koduna etkisi |
|---|---|---|
| **A) Gömülü** | hedef merkezi zeminin altında (`terr > y + 1`) | ✅ belirler |
| **B) Kesişen** | gövde yarıçapı **karaya** giriyor (`h > 1` korumasıyla — denizdeki gemi yanlış pozitif sayılmaz) | ✅ belirler |
| **C) Görüş hattı** | oyuncudan hedefe ışın yürütülür; arada dağ var mı? | ❌ yalnız bilgi |

**C neden çıkış kodunu etkilemez:** radarın dağ arkasındaki hedefi göstermesi gerçekçi uçuş
simülasyonu davranışıdır, hata değildir. Işının ilk %5'i ve son %15'i yoksayılır — aksi hâlde
A kusuru (hedefin kendisi gömülü) C'yi şişiriyordu.

Ayrıca **yerleşim dağılımı** raporlanır (|x| min/medyan/ort/%90/maks + merkeze yığılma):
bir yerleşim düzeltmesinin hedefleri koridora çekip oyunu bozmadığını kanıtlamak için.

**A/B ölçümü (aynı araç, iki build):**

| Ölçüt | v1.9 | v1.10 |
|---|---|---|
| Gömülü hedef | 16/464 | **0/464** |
| En kötü açıklık | −232 m | **+8 m** |
| Yerleşim medyan \|x\| | 1410 m | 1410 m |
| Görüş hattı kapalı | 214/464 | 198/464 |
| exit | 1 | **0** |

> **Ölçüm dürüstlüğü notu:** bu modun ilk sürümü iki yanlış pozitif üretiyordu — (1) denizdeki
> gemiyi (`terr=0`, y=8) "araziye kesişiyor" sayıyordu (200 sahte bulgu), (2) hedefin hemen
> yakınındaki ışın örneklerini "araya dağ girdi" sayıyordu. İkisi de düzeltildi; gerçek değer
> B için **0**, C için 198.
