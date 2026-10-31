# v3.78 — Gömülü Test Paketi Bulguları (8 FAIL'in ayrıştırılması)

**Tarih:** 2026-10-31 · **Build:** v3.78 DEV · md5 `54ea9941175f73d09336cbfc63910c2b` · 1.654.880 B
**Araç:** `node tools/diag/run-diagnostics.mjs <build> --audit` (bu tur eklendi)
**Soru:** Oyunun kendi test paketi 6/14 veriyor. Bu 8 FAIL gerçek oyun hatası mı, bayat test mi?

**Yöntem:** `$w()` fonksiyonuna dokunulmadı. Her başarısız iddianın (a) kaynak koddaki guard'ı
okundu, (b) gerçek değeri ölçüldü, (c) doğru ön koşullarla yeniden koşuldu.

---

## 1. Sonuç tablosu

| # | Test | Kaynaktan okunan gerçek kural | Ölçülen | Karar |
|---|---|---|---|---|
| 1 | `193 mission configurations` | `n(dn.length===193 && unique===193)` | `dn.length=205`, benzersiz id=205, **tekrar yok**, id 0–204 | **BAYAT TEST** (193 sabit) |
| 2 | `Lock, guided missile, impact` | `c(u,90)` sonra `lock===1` | kilit **197. karede** (3,3 sn) oluşuyor; 90. karede `lock=0` | **BAYAT TEST** (süre varsayımı) |
| 3 | `Countermeasures remove threats` | `deployFlare(){this.phase!=="combat"‖flares<=0‖flareTimer>0‖(…)}` | görev 0 **`takeoff`** fazında başlıyor → fişek 6→6, tehdit active kaldı | **BAYAT TEST** (faz varsayımı) |
| 4 | `Extraction and stable result` | dönüş koşulu: `phase==="combat" && alive.length===0 && (this.ext ‖ time>=140 ‖ kind==="escort")` | test `time>=140` kapısını ve tek seferlik `reinforce` olayını bilmiyor | **BAYAT TEST** |
| 5 | `Timeout and campaign unlock` | `function Rl(s,e){return s<3‖s===4‖s===11‖!!e[s-1]}` | `Rl(1,{})` → `1<3` → **true**; test `!Rl(1,{})` bekliyor | **BAYAT TEST** (ilk 3 görev artık hep açık) |
| 6 | `First sortie combat-to-return loop` | asistli pilot 10.800 karede bitirmeli | 11 kill, sonra **`reason=destroyed`** | **AÇIK — tek gerçek şüpheli** |
| 7 | `Wingman engages nearby hostiles` | `updateWingman(){if(!prefs.wingman‖this.unl<3‖this.phase!=="combat")return;…}` | test 5. parametreyi geçmiyor → `unl=0` → erken çıkış | **BAYAT TEST** |
| 8 | `Heavy missile mode increases damage` | `heavyMissiles && this.unl>=6` + kilit gerekli | `unl=0` → normal tablo; ayrıca 90. karede kilit yok | **BAYAT TEST** |

**Özet: 8 FAIL'in 7'si kesin olarak bayat test beklentisi. 1'i açık.**

---

## 2. Kanıt: aynı iddialar doğru ön koşullarla

`--audit` bölüm 10, v3.78'in üç gerçek kuralını uygulayarak yeniden koşuyor:

```
phase : takeoff → combat → return → landing      (testler combat'tan başlıyordu)
unl   : Object.keys(save.records).length          (wingman ≥3, ağır füze ≥6)
ctor  : constructor(e,n,a,o=0,q5)                 (4. = upgrade SAYI, 5. = {upA,upV,unl})
```

```
PASS  görev kimlikleri benzersiz ve >0
PASS  kilit 30 sn içinde oluşuyor
PASS  fişek tehdidi düşürüyor (combat fazında)
FAIL  tüm hedefler düşünce phase=return        -> phase=combat
FAIL  dönüş görevi başarıyla bitiriyor          -> reason=destroyed
PASS  asistli sorti limit içinde bitiyor
FAIL  sorti başarılı                            -> reason=destroyed kills=11
PASS  kanat arkadaşı ateş ediyor (unl=10, combat)
PASS  ağır füze hasarı normalden yüksek ve >150
SONUÇ: 6/9
```

Wingman ve ağır füze doğru ön koşullarla **geçti** → bu ikisinin oyun hatası olmadığı kanıtlandı.

---

## 3. Kalan 3 FAIL'in kök nedeni (aynı zincir)

Ara ölçüm dökümü:

```
[ara durum]       kind=strike phase=combat time=200 alive=0 entities=9  friendly=1
[update sonrası]  phase=combat alive=1 entities=10
[canlı kalanlar]  heavy(hp260)
```

Tüm düşmanlar ölünce bir sonraki karede `heavy(hp260)` doğuyor. Kaynakta iki ayrı doğurma yolu var:

1. **Tek seferlik anti-rush takviyesi** (kasıtlı tasarım):
   ```js
   if(!this.ext && M!=="race" && M!=="chain" && M!=="waves" && M!=="escort"
      && this.alive.length===0 && this.time<140 && !this.result){
     this.ext=1; /* 2 interceptor + 1 heavy */ this.notify("reinforce",4)
   }
   ```
   `time<140` içinde tüm hedefler biterse 3 takviye gelir; `ext=1` olunca dönüş izni açılır.

2. **Zamanlanmış sürpriz olayları** (`this.sched` → `fireSurprise(k,idx)`):
   `ambush` (2 interceptor) · `swarm` (6 drone) · `heavy` (1 heavy, `260*diM`) · `supply`.
   Ölçülen `heavy(hp260)` buradan geldi — prob `time`'ı 200'e atlayınca zamanlanmış olay tetiklendi.

**Yani #4'ün kalan FAIL'i prob hatası** (yapay zaman sıçraması), oyun hatası değil.

`get alive(){return this.entities.filter(e=>e.hp>0 && !e.friendly)}` — dost carrier
(`id:901, hp:1e9, friendly:!0`) **doğru şekilde dışlanıyor**. İlk şüphe (carrier yüzünden
görevin hiç bitmemesi) **yanlıştı**, kaynak okunarak elendi.

---

## 4. Tek açık madde: asistli sorti `destroyed` oluyor

Gerçek zaman akışıyla (yapay sıçrama yok) görev 0, limit 676 sn:

```
kills 11 · reason=destroyed · skor/süre ölçüldü
```

Görev 0 içeriği: `corvette, sub, sub, destroyer, corvette, refinery, sam, radar`
(8 hedef, **0 hava hedefi**) + dost carrier + sürpriz olaylar + takviye.

Olasılıklar (henüz ayrılmadı):
- (a) v3.78'de görev 0 gerçekten zorlaştı (8 hedef + takviye + sürpriz, 0 hava hedefi),
- (b) probdaki pilot çok aptal (`{yaw:0,pitch:0,throttle:.42}`, kaçınma yok),
- (c) `assisted` otomatik yönlendirmesi probda devreye girmiyor.

**Bu madde kapatılmadan "test paketi temiz" denmeyecek.**

---

## 5. Bu turun yan ürünleri

- `tools/diag --audit` modu eklendi: FAIL veren her iddianın gerçek değerini döker +
  doğru ön koşullarla yeniden koşar. Kalıcı araç.
- `tools/diag` görev-dizisi deseni v3.x üretecine (`e%48/12`, sezonlu) uyarlandı.
- **Test paketinin kendisi henüz düzeltilmedi** — `$w()` oyun bundle'ının içinde ve
  `patch_vN.py` yamasıyla güncellenmesi gerekiyor. Karar kullanıcıda:
  (i) testleri v3.78 kurallarına göre güncelle, (ii) olduğu gibi bırak.

## 6. Doğrulanamayanlar

Bu sandbox'ta GPU/ses/dokunma yok. Sorti başarısızlığının **gerçek oyuncu** için de
geçerli olup olmadığı (yani görev 0'ın gerçekten bitirilebilir olup olmadığı) ancak
tarayıcıda oynanarak anlaşılır. `striker-dev/tests/smoke_flight.js` Puppeteer istiyor;
`/home/user/.pptr` bu sandbox'ta yok.
