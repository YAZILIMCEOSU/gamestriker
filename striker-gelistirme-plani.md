# STRIKER → "Play Store Rakibi" Geliştirme Planı

**Amaç:** Mevcut web oyununu (Three.js + React) kalitesini bozmadan, Play Store'daki benzerleriyle (Modern Warplanes, Apex Combat OL, Modern Jet Fighter) yarışacak seviyeye taşımak.
**İlke:** Cerrahi yama — `original.html` her zaman elde; her değişiklik `node --check` + canlı önizleme ile doğrulanır.

---

## 1. İskeletinize Yorum (madde madde)

İskeletiniz aslında **Striker'ın Unity lehçesiyle yazılmış şartnamesi**: maddelerin ~%70'i zaten gemide.

| İskelet maddesi | Striker'da bugün | Durum / Aksiyon |
|---|---|---|
| Jiroskop / sanal joystick | ✔ İkisi de var (eğim sensörü + sanal kol, sensör yoksa zarif uyarı) | Korunur |
| Solda dikey gaz kaydırıcısı | ✔ Var | Korunur |
| Sağda Füze / Top / Fişek butonları | ✔ Var (+ bomba) | Korunur |
| Yeşil kilit vizörü + "Locked" sesli uyarı | ✔ Görsel var; ses tek bip'ti | **Audio 2.0 ile bu tur yükseltildi**; P4'te AI sesli anons ("KİLİTLİ") eklenecek |
| Gemiler, kruvazörler, uçak gemisi, kıyı radarı, önleme jetleri | ✔ Hepsi görev tiplerinde var (strike/intercept/defense/radar/carrier/boss) | Korunur |
| Uçak gemisinden kalkış | ✘ Görevler havada başlıyor | **Faz 2:** kalkış sinematiği |
| Birinci şahıs kokpit | ✘ Sadece chase/orbit kamera (C tuşu) | **Faz 2:** prosedürel kokpit + cam yansıması |
| Unity URP / Baked Lighting | N/A — biz Three.js'teyiz | Eşdeğeri: envMap + hemisferik ışık + kalite profilleri (zaten var) |
| Yüksekliğe göre detay değiştiren Water Shader | ✘ Standart malzeme + envMap | **Faz 1:** Gerstner dalgaları + güneş parıltısı + köpük + yükseklik LOD'u |
| Object Pooling | Mermi/parçacık sistemi havuzlama kullanıyor (kodda `bullets/particles` dispose desenleri) | Doğrulandı, korunur |
| Modernize retro sanat yönü | ✔ Low-poly stilize + HUD estetiği zaten bu dili konuşuyor | Faz 1'de ton haritası/palet ile pekiştirilir |

**Dürüst teknoloji notu:** Unity/URP satırı bu projede çalıştırılabilir bir yol değil — ürün web'de doğdu ve bu bir dezavantaj değil: rakipler 200–800 MB kurulum isterken biz **0 kurulumla** açılıyoruz. Play Store'a giriş yolu **PWA → TWA (Bubblewrap/Capacitor)** sarmalayıcısıdır (Faz 5).

## 2. Rakip Gerçekliği (Play Store, 2025–26)

| Eksen | Modern Warplanes | Apex Combat OL | Striker bugün | Aksiyon |
|---|---|---|---|---|
| Çok oyunculu PvP | ✔ 4v4/1v1 | ✔ Ranked 4v4 | ✘ | **En büyük boşluk** — uzun vade (Faz 5+); önce "gölge liderlik tablosu" (seed'li rakipler) |
| Uçak sayısı | 37+ | 100+ | 3 | İçerik maliyeti yüksek; ara çözüm: **prosedüral kamuflaj/cila sistemi** (rakiplerin 26 camo'suna kozmetik cevap) |
| Tech tree / upgrade | ✔ | ✔ 16 seviye | 3 seviye | Faz 3'te derinleştir (modül slotları) |
| Günlük görev / etkinlik | ✔ | ✔ Sezonluk | ✘ | **Faz 3: "Günün Sortisi"** — tarihe seed'li sonsuz görev; sıfır içerik maliyeti |
| "Konsol kalitesi" grafik | ✔ | ✔ | Orta | **Faz 1** (su/gökyüzü/VFX/tone-map) ile algı büyük sıçrar |
| Ses | Kayıt/lisanslı | Kayıt | Tek testere dişi osilatör | **Audio 2.0 ✔ bu tur** |

Bizim farklılığımız (pazarlamada vurgu): *anında oynanış, küçük boyut, özgün tasarım, tarayıcıda AAA hissi.*

## 3. Arena AI Olarak Yapabileceklerim / Yapamayacaklarım

**Yapabildiklerim (bu çalışma alanında, canlı önizlemeli):**
- Oyun koduna cerrahi özellik yamaları (ses, shader, VFX, HUD, kokpit, modlar)
- WebAudio ile tamamen sentezlenmiş profesyonel ses tasarımı (kayıt stüdyosuz "kayıt kalitesi" illüzyonu)
- **AI seslendirme:** `generate_speech` ile TR/EN kokpit anonsları ("Kilitli", "Füze yaklaşıyor", "Eve hoş geldin pilot") ve **fragman dış sesi**
- **Fragman hattı:** oyun içi sinematik otopilot + `canvas.captureStream` + `MediaRecorder` → tarayıcıda gerçek **WebM video indirme**; poster/anahtar sanat (`generate_image`)
- PWA (manifest + service worker + çevrimdışı) ve TWA paket konfigürasyonu → Play Store'a sarılabilir AAB
- ASO metinleri, mağaza açıklaması, gizlilik politikası sayfası

**Yapamadıklarım:** Unity/APK derlemek, gerçek cihaz ısı/profil ölçümü, mağaza hesabı açma/yayınlama, telifli gerçek ses kayıtları (sentez + AI ses bu boşluğu doldurur), gerçek para IAP (store billing).

## 4. Fazlar

- **Faz 0 — ✔ BU TUR:** Geliştirme üssü (`striker-dev/`, canlı önizleme) + **Audio 2.0** (aşağıda).
- **Faz 1 — Grafik 2.0:** Gerstner su + güneş parıltısı + köpük; atmosferik gökyüzü/bulut; patlama VFX (şok dalgası, kıvılcım, duman); füze izi parlaması; ACES ton haritası ayarı; prosedüral kamuflaj.
- **Faz 2 — Kokpit & Sinematik:** Birinci şahıs prosedürel kokpit (canopy + göstergeler), HUD bantları (irtifa/hız ladder), uçak gemisi kalkış sinematiği, hasar vinyeti.
- **Faz 3 — Meta/İçerik:** Günün Sortisi (seed'li), başarımlar, gamepad, foto modu, modül slotlu upgrade derinliği.
- **Faz 4 — Fragman:** Sinematik kayıt modu + AI seslendirme + müzik sentezi + poster seti → indirilebilir WebM fragman.
- **Faz 5 — Mağaza:** PWA + TWA → AAB konfigürasyonu, ikon seti, ASO metni, gizlilik sayfası; ileride WebSocket PvP prototipi.

## 5. Faz 0 Teknik Notu — Audio 2.0 (bu tur uygulandı)

Eski motor: 1 sawtooth osilatör + 160 Hz lowpass + tek noise tamponu (2,1 KB). Yeni motor (`striker-dev/audio2.js`, drop-in `zw` değiştirimi, API birebir aynı: `start/setEnabled/setEngine/play/dispose`):
- **Motor:** detune'lu çift sawtooth + tri sub → hızla açılan lowpass; 5,3 Hz LFO ile "pürüz"; hıza bağlı turbo whine (420→1770 Hz) ve rüzgar band-geçirişi (∝ v²)
- **Master:** gain → **DynamicsCompressor** (limiter) — clipping yok
- **Olaylar:** `lock` çift ton onay; `warning` 3'lü alternatör; `launch` bandpass süpürme + ateşleme çıtırtıları; `explosion` sub-bass düşüşü + metalik ping; `splash`, `hit`, `flare`, `gun`, `click` ayrı katmanlarla
- Doğrulama: yamalı bundle `node --check` **temiz**. Başsız tarayıcı/GPU burada olmadığı için **sesin kendisini kulak testiyle doğrulayamıyorum** — lütfen önizlemede `/` (yeni) ile `/original.html` (eski) arasında A/B yapın.

## 6. Test Protokolü (her faz için)

1. `node --check` (sözdizimi) → 2. canlı önizlemede oynanış → 3. orijinalle A/B → 4. mobil önizleme (dokunmatik + jiroskop) → 5. geri bildirimle ince ayar.

## 7. Faz 0.5 — BU TUR (geri bildirim sonrası)

**Gelen geri bildirim:** ses rahatsız edici · görevler 10–30 sn sürüyor · 24 görev az · uçak çeşidi az · günlük mod/listeleme/çoklu dil eksik.
Not: Paylaşılan `01a0e2e4…` linki oyunun kendisi değil, başka oturumda üretilen **Tanıtım Videosu Stüdyosu**'dur; oyun geliştirmesi `striker-dev/` tabanında sürer.

Uygulanan cerrahi yamalar (`patch_v3.py`, tümü veri seviyesi — format bozulmadı):
1. **Audio 3.0 (yumuşak miks):** master .5→.34, kompresör daha nazik (−20 dB, ratio 6), motor lowpass 140→120+640·r (daha koyu, tırmalamayan), LFO wobble 70→26, whine −%50, rüzgar −%35; `warning` testere→üçgen ve 2 bip; tüm olay gain'leri −%25-35.
2. **Görev süresi:** taban hedef 3→5-6, bölüm başına ek `n`→`2n` (drone karışımlı); hedef koridoru derinliği `710+255u`→`900+430u` (+bölüm·120). Beklenti: Bölüm 1 ≈ 1,5–2,5 dk, Bölüm 4 ≈ 2,5–4 dk. `par` 165→240 sn'e çekildi.
3. **Görev sayısı 24→48:** bölüm başına 6→12; 24 yeni operasyon adı eklendi; metinler "48 operasyon".
4. **Uçak 3→5:** FALCHION SF-16C (önleme, 1200 kr) ve RAVAGER XA-44 (taarruz, 3200 kr). Dürüst not: gövdeler mevcut airframe'leri yeniden kullanır (falchion→striker, ravager→spectre); özgün gövde geometrisi Faz 1'de.
5. **Görsel algı:** bloom artık `medium`'da da açık (mobil varsayılan daha zengin).
6. Sürüm 0.9→1.1.

Doğrulama: tüm replacements count==1 asserted; `node --check` temiz; 48 ad / 5 uçak / divisor 12 dosyadan geri okunarak doğrulandı.
**Hâlâ burada test edemediğim:** sesin kulağa nasıl geldiği ve gerçek görev süresi → önizlemede A/B şart.

**Sıradaki (Faz 3, UI gerektirir, kör yama riskli):** Günlük Sorti (seed'li), liderlik listesi ("listeleme"), 3.+ dil (DE/ES) i18n yeniden yapısı. Bunlar için menüye yeni ekran eklemek gerekir; minify yapıda DOM enjeksionu yerine bir sonraki adım olarak **yeniden derleme kaynağı** oluşturmayı öneriyorum.

## 8. Faz 0.6 — v1.2 DEV (bu tur)

Geri bildirim: vınlama rahatsız · stüdyo sesi oyuna istendi · atış/füze/patlama zayıf · dağ içinden geçiliyor · ilk görev 29 sn · hâlâ 24 görev görünüyor (eski build önbelleği).
1. **Audio 4.0:** whine osilatörü **tamamen kaldırıldı**; motor = koyu uğultu + boğaz noise'ı. Stüdyonun ses dili taşındı: convolver reverb (1,6 sn), patlamada 110→30 Hz sub-drop + bandpass 190 gövde + crack; top = hp 6,5k crack + bp 190 gövde; fırlatma = 260→2600 süpürme + sub + çıtırtı. **Üretken müzik döngüsü** (24 sn, offline render): detune'lu sawtooth D-minör pad yığını (36.71–174.61 Hz), yumuşak tek kick, seyrek hat, tek riser — menü + uçuşta düşük seviye.
2. **Dağ çarpışması:** adaların analitik yükseklik formülü JS'ye taşındı (`terr()`); zemin+16 altında su ile aynı ceza: hasar + yukarı itme + sarsıntı.
3. **Süre v2:** taban 6 hedef, derinlik adımı 520 m, düşman HP ×1.6 → beklenen B1 ≈ 1,5–2,5 dk.
4. **Build rozeti:** "UÇUŞ SÜRÜMÜ 1.2 DEV" — hangi build'de olduğunuz alt bilgiden okunur (24 görev görüyorsanız eski build'desiniz; `?v=12` ekleyin).
Doğrulama: node --check temiz; tüm yama noktaları dosyadan geri okundu. Kulak testi + süre ölçümü yine kullanıcıda.

## 9. Faz 0.7 — v1.3 DEV (9 dil + içerik derinliği)

1. **9 dil:** TR, EN, DE, ES, FR, IT, PT, RU, ID. 130 anahtar ×9 + brifingler (6 tür), uçak rol/açıklamaları (5), bölüm adları/tanımları (4), ayarlar ekranında 9 dil butonu, başlıktaki dil çipi döngüsel (`__nx`). Mekanizma: `__L(c,arr)` güvenli indeks (kısa dizide düşer), `Jn` artık `__L(s,Fw[e])`.
2. **Uçak değiştirme "bozuk" hissi giderildi:** gövdeler artık veri kartındaki `color/accent` ile boyanıyor; FALCHION/RAVAGER eskiden mevcut airframe rengini paylaştığı için seçim değişmiyormuş gibi görünüyordu.
3. **Füze çeşitliliği:** uçak başına loadout (`mSet`): striker dengeli, spectre ağır hasar, tempest/falchion hızlı+seri, ravager yavaş+ağır vuruş.
4. **AI rakipler:** önleme jetleri oyuncuyu konum+irtifada takip ediyor (stalk), atış aralığı 11→9 sn (hard 6), düşman füze hızı 180→200.
5. Rozet 1.3 DEV (önbellek ayrımı).
Doğrulama: node --check temiz; 20 nokta dosyadan geri okundu (dil butonları, __L, nm dizileri, mSet, stalk, boya, rozet…). Kulak/göz testi kullanıcıda.
Play Store referansı: PvP 4v4 + sezonluk etkinlikler + 100 uçak [1](https://play.google.com/store/apps/details?id=com.EvilChaotic.ModernWarplanes&hl=en_US)[2](https://play.google.com/store/apps/details?id=com.vector.apexcombat.google); sim odaklı yaklaşım [3](https://play.google.com/store/apps/details?id=com.technoapps.jet.fighter). Bizim sıradaki meta: Günün Sortisi + gölge liderlik (Faz 3), PvP prototipi (Faz 5).

## 10. v1.4 DEV (bu tur) + ANA TASLAK (adım adım)

**v1.4 içeriği (doğrulandı):**
1. **Dağ içi hedef hatası GİTTİ:** hedef spawn'ı artık `terr()` ile açık denize kaydırılıyor (8 denemeli yanl ofset). "Oyun sapıtıyor"un kökü buydu.
2. **Katapult kalkış:** görev artık uçak gemisi güvertesinde başlar (0,0,1050'deki Aurora), 2,6 sn katapult ivmesi + "KATAPULT KALKIŞ" bildirimi (10 dilde); kalkış sonrası kontrol serbest.
3. **Audio 5 — vınlama fiziken imkânsız:** motor artık **hiç sawtooth içermiyor** (testere dişi = vınlamanın kaynağıydı); saf noise-roar + sub-sin. Müzik pad'leri triangle. Launch/patlama daha sert.
4. **Arapça eklendi → 10 dil.**
5. İlk görev 1:40 ölçümü ✔ hedef bantta (1–3 dk).

**ANA TASLAK — öncelik sırası (her adım ayrı tur, her adım doğrulamalı):**
- **S1 Grafik 2.0 (trailer hissi):** Gerstner su + köpük, güneş parıltısı, patlama şok dalgası/duman VFX, ACES ayarı; kokpit kamerasını varsayılan seçenek yap + ayarlar genişletme.
- **S2 Ekonomi & çeşitlilik:** füze satın alma (kredi→mühimmat), füze tipleri (swarm/ağır), +2 uçak, dron dalgaları & AI wingman (dost kanat adamı).
- **S3 Meta:** Günün Sortisi, gölge liderlik, başarımlar, **kendi sortini kaydet** (stüdyo kaydedicisi oyuna entegre).
- **S4 Mobil/Tablet:** dokunmatik UI ölçekleme, tablet yerleşimi, ısınma dostu profiller, PWA offline.
- **S5 Mağaza:** TWA→AAB, **AdMob** (ödüllü reklam: "izle→kredi"), IAP, **dünya sıralaması** (Firebase backend), ASO + gizlilik; kod koruma: web'de tam kapalı kaynak mümkün değil — APK içinde obfuscation + lisans notu (aboutText zaten belirtiyor).
**Açık soru:** "geçişinde menü çıkmıyor" — hangi ekrandan hangi ekrana geçişte? (tekrar üretebilirsem tek turda kapatırım)

## 11. v1.5 DEV — S1 dalga 1 + gizli hata temizliği
Gizli hatalar (kullanıcı şikayetlerinin kökü):
1. Dil seçim sıfırlanıyordu: cb() `language` alanını en/tr'ye kısıtlıyordu → 10 dil kalıcı.
2. Gömülü tanılama `dn.length===24` ve `speed set===3` assert ediyordu → 48 görev/5 uçakla "hata" gösteriyordu → 48/5.
3. Otopilot varsayılan AÇIK'tı → varsayılan KAPALI (manuel), yardımcı R/ayarlar.
Yeni: kokpit ayar satırı (10 dil) + görev kokpitte başlar seçeneği; ACES exposure 1.12, bloom .24/.34, güneş 4.5, patlama flash 1400.
Sunucu: server.py no-cache → eski build önbelleği imkânsız. Rozet 1.5.
S1 dalga 2 (sıradaki): Gerstner su + köpük + şok dalgası/duman VFX.

## 12) v1.6 DEV — S2: İçerik & Savaş Derinliği (28 Eyl 2026)
Build: 1.085.520 B (patch_v8.py, inner.html tabanından yeniden derlendi; node --check OK)
- **16 uçak**: 5 mevcut + 11 yeni (vanguard, ghost, talon, bastion, horizon, cyclone, marauder, sentinel, phantom, archer, kraken). 10 dilde açıklama + rol çevirisi; hangar metni "Sixteen original airframes" (10 dil). Tanı testi 16'ya güncellendi.
- **Denizaltı (sub)**: yeni düşman türü. Model: silindir gövde + kule (ship() yeni dalı). Davranış: 26 sn'lik dalga döngüsünde ~12 sn yüzeyde (y=2, ateş edebilir, hasar alabilir) / ~14 sn dalmış (y=-16, görünmez, dokunulmaz). Yüzeye çıkışta "surf" ses efekti (sine gıcırtı + bandpass su sıçraması). damageEnemy guard: dalmışken hasar yok. Hp 220, radius 26, iz (wake) yalnız yüzeyde. strike/radar/carrier/boss hedef listelerine eklendi.
- **Combo skoru**: 6 sn içinde ardışık imhalar +40/kat (damageEnemy kill dalı).
- **Rubber-band**: can %35 altındayken düşman atış aralığı ×1.4 (zorluk korunur, ezici yenilgi önlenir).
- **Patlama dumanı**: flash sonrası 2 katmanlı duman partikülü (processEvents explosion dalı).
- Düzeltmeler: marauder TR/ID/RU metinlerindeki Kiril "для" karışıklığı temizlendi (doğrulandı: 0 kalıntı).
- Doğrulama: 16 marker True; served==build (no-store sunucu, proc striker-build-server-0ceced10).
Sıradaki: S2 dalga 2 (füze satın alma/türleri + AI kanat arkadaşı), sonra S3 meta (Günün Sortisi + sorti kaydedici).

## 13) v1.7 DEV — S2 dalga 2: Silah çeşitliliği + AI kanat arkadaşı (28 Eyl 2026)
Build: 1.088.218 B (patch_v9.py; node --check OK; served==build)
- **mSet 16 uçağa tamamlandı**: yeni 11 uçağın füze tablosu (hız/ömür/hasar/dolum) özgün değerlerle eklendi — önceden hepsi varsayılana düşüyordu (gizli denge hatası).
- **Ağır Füze Modu** (ayarlar satırı, 10 dil): hasar ×1.7 (+upgrade*14), füze hızı ×0.85, ömür ×1.35, dolum ×1.25. prefs whitelist + varsayılanlar güncellendi (kalıcı).
- **AI Kanat Arkadaşı** (ayarlar satırı, 10 dil): updateWingman() — 1500 m içindeki en yakın canlı düşmana 3.4 sn'de bir güdümlü füze (70+upgrade*6 hasar), "launch" sesiyle. Bağımsız cephane yok, denge için hasar düşük.
- Doğrulama: 13 marker True; mSet tablosunda 16 uçak teyit edildi.
Sıradaki: S3 meta — Günün Sortisi (seeded daily) + sorti kaydedici.
