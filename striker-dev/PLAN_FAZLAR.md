# Striker — Prompt özeti ve faz planı

## 1. Kullanıcının tüm istekleri (özet)
1. Replay (tekrar izle) donuyor, kesik kesik. Kayıtlar ve pilot dosyası sorunlu.
2. Yakın takip eden / boşta dolaşan savaş uçağı var ("kaç kere dedim").
3. Çift motorlu uçak seçiliyor, oyunda tek motorlu görünüyor.
4. Mağaza (hangar) karışık; puanlama anlaşılmıyor.
5. Rakiplere benzer gelişim şart; hatasız ve kontrollü ilerleme.
6. Fazla hedef ve düşman varsa azaltılsın (keyif).
7. Kalkışta füze sesi çıkıyor (katapult).
8. Füze ateşleme sesi berbat; rakiplere benzer olmalı.
9. Oyunda müzik sistemi olmalı (menü + görev).
10. Önceki: hedefleme etiketleri okunur olsun, nedensiz uçan uçak olmasın, bomba sesi ayrı olsun, patlama gerçekçi olsun, görsel/ses kontrast fazlalığı azaltılsın.
11. Plan işlemiyor: her faz commit + kanıt + kullanıcı onayı ile ilerlemeli.

## 2. Durum
| Madde | Durum |
|---|---|
| Replay: enterpolasyon, dost/mermi kaydı, kayıt sınırı | Yapıldı, headless kanıt var (commit `see git log`) |
| Replay: oyun içi gerçek oynanış doğrulaması | Açık |
| Kalkış füze sesi (katapult) | Yapıldı (ayrı `catapult` sesi) |
| Hedef etiketleri okunur, en yakın 5 | Yapıldı (37da174) |
| Kalkışta dormant uçak donması | Yapıldı (37da174) |
| Bomba ayrı ses | Yapıldı (37da174), kulak onayı bekliyor |
| Füze ateşleme sesi | Kısmen: B seçildi ama oyunda sert/baraton çıktı. C (tonsuz, gürültü tabanlı) gömüldü; sentez katmanı sample varken kapatıldı. Kulak onayı bekliyor |
| Patlama sesi | Kısmen: B tasarım diliyle yeniden üretildi (sfx/explosion_b.wav), kulak onayı bekliyor |
| Ses aç/kapa (mobil) | Yapıldı: ≤900 px'de de görünüyor (telefon 390 px ve tablet 820 px ölçümü) |
| Mobil/tablet uyumu | Kısmen: menü ve ses düğmesi ölçüldü, oyun içi dokunmatik kontrol henüz ölçülmedi |
| Yakın takip eden uçak | Yapıldı (Faz 1, kanıt: v351takipdetay.js): 120 sn ölçümde en uzun yakın takip 7,6 sn (<1 km), saldırganlar üssünden en fazla 2,5 km uzaklaşıyor (sınır 2,6 km). Oyuncu 16 km uzaklaşınca düşmanlar üssünde kalıyor (tasarım gereği, kullanıcı isterse değişir) |
| Çift motorlu model | Kısmen: model kodu SPECTRE dahil tüm uçaklarda çift nozul çiziyor (yalnızca STRIKER ve FALCHION tek). Uçuşta görünmediği bildirildi; uçuş ve hangar ekran görüntüsü kanıtı bekliyor (Faz 2) |
| Mağaza / puanlama açıklığı | Açık |
| Hedef/düşman yoğunluğu ayarı | Açık |
| Müzik sistemi | Açık |

## 2b. Faz 0 (kritik): hedef görünürlüğü
- Ölçüm (v360targets.js): görev başında 18 hedefin 15'i 3,5 km'den uzak; eski kural yalnızca 3,5 km içindeki 5 hedefi işaretliyordu.
- Yapıldı: işaret yarıçapı 12 km, en fazla 7 hedef (kod: markers(), 37da174 sonrası). Kanıt: boot ve hedef probe'unda konsol hatası yok.
- Kenar okları eklendi (K1): görüş dışındaki en yakın 3 hedef için ekran kenarında hedefe dönük ok ve mesafe (12 km içinde). Kanıt: v361edges.js → 3 ok, metinler 7.3/8.8/9.6 km, konsol hatası yok, /tmp/edges.png. Açık: ekran görüntüsünde yalnızca bir ok görünüyor; diğer ikisi arkada olabilir, doğrulanacak.

## 2d. K2 — görev çeşitliliği (uygulandı, kısmi)
- Ölçüm öncesi (node ile dn üretici çıkarılarak): 192 görevde 53 farklı hedef imzası, en çok tekrar 12, 6 görev türü (her biri 32 görev), 6 brifing metni.
- Uygulandı: hedef türleri görev kimliğine bağlı (seeded) kendi kategorisi içinde (kara/deniz/hava) değiştiriliyor; ilk görev, uçak gemisi ve boss görevleri değişmiyor. Sonuç: 144 farklı imza, en çok tekrar 8. Açılış kanıtı (v341launch.js): konsol hatası yok (commit öncesi değil, sonrası doğrulandı). Kategori sayıları, ad, tür, limit ve ödül farkı: 0 (her görevde doğrulandı).
- Brifing (uygulandı): her 192 görevin 10 dilli brifingine görev hedef dökümü eklendi (ör. "▸ 2 CORVETTE · 2 INTERCEPTOR · 2 SUB"). Kanıt: 138/192 farklı İngilizce brifing; v380briefing.js ekranında metin görünüyor, konsol hatası yok.
- Açık: tür başına temel metin hâlâ 6 tane; görev başına anlatı metni ve 4 bölge yapısı (fragman: 4 bölge, 24 operasyon) yapılacak.

## 2c. Faz 10: görev çeşitliliği (kullanıcı kararı: 192 görevi koru, her birini farklılaştır)
- Kök neden (kod, index.html satır 38, dn.push üreticisi): hedef listesi sabit havuzdan (id+i)%n ile seçiliyor; brifing metni yalnızca görev türüne (lb[a]) bağlı; ödül/süre/par formülle.
- Yapıldı: ödül, süre ve par değerlerine görev kimliğine bağlı deterministik çeşitlilik (±%20). Kanıt: boot probe'unda konsol hatası yok. Etki küçük.
- Açık (asıl iş): (a) hedef dizilimini tohumla (seed) üret, sabit havuz yerine karışık sayı ve tür; (b) brifingi görev hedeflerine ve bölgeye göre üret (10 dilde); (c) 192 görevin hedef imza tekilliği ölçümü (node ile tarama).

## 3. Fazlar (her faz: değişiklik → headless kanıt → commit → kullanıcı onayı)
- **Faz 1 — Takip eden uçak:** chaseAI'da takip süresi sınırı, kapsam dışına çıkınca geri dönüş, boşta kalma yasağı. Kanıt: 60 sn oynatma ölçümünde düşman-oyuncu mesafesi ve boşta süre.
- **Faz 2 — Çift motor ve uçak modeli:** seçilen uçağın gövde/motor modeli hangar ve uçuşta aynı olacak. Kanıt: hangar ve uçuş ekran görüntüsü karşılaştırması.
- **Faz 3 — Mağaza ve puanlama:** tek ekranda uçak karşılaştırması; puanlama formülü ekranda açıklanacak (zaman, isabet, hasar). Kanıt: ekran görüntüleri + puan hesap testi.
- **Faz 4 — Yoğunluk ayarı:** Kolay / Normal / Yoğun; varsayılan Kolay-Normal arası. Kanıt: hedef sayıları tablosu.
- **Faz 5 — Füze ateşleme sesi:** iki aday ses üretilip kullanıcı dinleyerek seçer; seçileni oyuna gömülür.
- **Faz 6 — Müzik sistemi:** menü ve görev müziği, ses ayarları (müzik/efekt). Kanıt: müzik açma-kapatma ve geçiş testi.
- **Faz 1 — durum:** Tamamlandı, kanıt v351takipdetay.js. Bir sonraki iyileştirme onay sonrası.
- **Faz 2 — durum:** Kanıt (v370twin.js, /tmp/twin_spectre.png): SPECTRE sahipli kayıtla başlayan görevde oyun SPECTRE kullanıyor ve uçuş görünümünde iki egzoz parlaması görünüyor. Test düzeneği hatası düzeltildi (kayıt, sayfa açılmadan yazılıyor). Açık: kullanıcı başka bir görünüm (kokpit) veya başka uçak kastediyorsa tekrar bakılır.
- **Faz 5b — Füze/patlama sesi düzeltmesi (aktif):** tonal baraton kaldırıldı, sample varken sentez katmanı kapatıldı. Kanıt: spektral ölçüm (tonal oran B 57,6 → C 9,7; 1–3,2 kHz pay %45 → %26), boot ve fırlatma probe'unda konsol hatası yok. Kulak onayı bekleniyor.
- **Faz 8 — Mobil ve tablet:** telefon (390×844) ve tablet (820×1180) görünümünde menü taşması yok, ses düğmesi görünür. Kanıt: v340mobile.js. Sonraki adım: oyun içi dokunmatik kontrol ve yatay mod ölçümü.
- **Faz 7 — Replay son doğrulama:** gerçek oynanış kaydı, kare başına zaman ve konum adımı ölçümü, tüm görevlerde tarama.

## 4. Kurallar
- Her faz tek commit, tek amaç.
- Kanıt olmadan "tamam" denmez.
- Ses ve görsel kararlar için kullanıcı onayı beklenir.
