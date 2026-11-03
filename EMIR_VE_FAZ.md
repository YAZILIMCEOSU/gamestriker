# Emir listesi ve faz planı (2026-11-03)

Bu dosya bugünkü isteğin kaydıdır. Oyun kodu bu turda değişmedi. «Düzeldi» yok. Cihaz yok.

Hangi plan yürütülür: bundan sonra yalnız bu dosyanın «Sıradaki fazlar» bölümü. Aşağıdaki eski planlar silinmez, bir turda da yürütülmez.

## Bu tur ölçülen — Deep Sky Winter

Karttaki ad `DEEP SKY · WINTER`. Dört görev aynı adı taşıyor: id 1, 49, 97, 145. Açılan ilk kart id 1. İlk görev `FIRST STRIKE · SPRING` (id 0). Eğrideki «görev 1, 126 s» id 0’dır. Deep Sky Winter değildir.

id 1, yardımlı, ateş açık, sim:

| Ölçü | Sonuç |
|---|---|
| Tür | intercept, kademe 0 |
| Listed hedef | 4: corvette, destroyer, heli, attacker |
| Mesafe | dördü de 3389 m, aynı küme |
| İlk öldürme | 13,6 s |
| 30. saniye | 4/4 ölü, faz dönüş, iniş henüz yok |
| Bitiş | 51 s, iniş, can 100 |
| Saat tavanı | 637 s. Bu oynanan süre değil |

Ateş kapalı, yardımlı, 40 s: can 100, öldürme 0, y 1325, x −3042. Uçak sırtta. İniş yok.

Oyuncu yazdı: 30 saniye bile sürmüyor, bozuk, iniş olmuyor. Botun 51 saniyelik inişi bunu kapatmaz. İnsan yolu ölçülmedi. Kabul yok.

## Kalkış ve iniş isteği — kabul yok

3.127 kodda ve 8080’de var. Oyuncu görmedi. Görmediyse yapılmış sayılmaz.

Kodda olan, ekranda zayıf kalan:

- 3 saniye fren, yazı olarak 3 / 2 / 1 / KALK. Kule binası yok.
- Tekerlek grubu var. Teker yarıçapı 0,27 m. Takip kamerasında okunmaz.
- Konuşma sentezi cihazda ölçülmedi. Duyuldu denmez.
- İniş cümlesi radyo metni. Oyuncu inişi zaten yapamıyor.

## Eski plan dosyaları — yürütülmez

| Dosya | Ne | Neden yürütülmez |
|---|---|---|
| `FAZ_PLANI.md` | v1.10 denetim, P0–P10 | Sürüm 1.10. «14/14 test» bugün doğru değil. Gömülü paket 7/14, 3.126’da da 7/14 idi |
| `PLAN_SIMDI.md` | 1 Kasım dilim 21–30 | 12 km ve «4 dk için koridor» kalktı. Ateş dilimi geçti. Toplu yürütme yok |
| `striker-dev/plan/ANA_PLAN.md` | P1–P14 açık liste | 27 Ekim yönü. 205’i ve reklamı aynı turda açar. Yürütülmez |
| `striker-dev/plan/FAZ_PLANI_SAVUNMA_ZORLUK.md` | Faz A–F | A kısmi. B–F açık. Tek turda yok |
| `striker-dev/plan/FAZ_PLANI_HEDEF.md` | hedef düzeltme | Sayaç tutarlılığı ayrı iş. Bu tur değil |
| `striker-dev/plan/KONSEPTLER_192.md` | 192 satır etiket | Motora bağlı değil. 192 kuralı bir yamada bağlamak yok |
| `striker-dev/PLAN_FAZLAR.md` | eski prompt özeti | Ses ve replay kaydı. Güncel kabul değil |
| `striker-dev/PLAN_GERCEK_DURUM.md` | madde 1–15 | Bir kısmı eski. Toplu kapatma yok |
| `striker-dev/RAKIP_ANALIZI.md` | K1–K8 | İlke. Kod kopyası değil. Paket olarak yürütülmez |
| `striker-gelistirme-plani.md` | Play rakibi | «Görevler havada başlıyor» satırı eski. Toplu yürütülmez |
| `PLAYSTORE_MASTER_PLAN.md` | yok | Varsa da yürütülmez |
| `COZUM_PLANI.md` | Dilim A–H | Kayıt. A–H kabul satırları geçmedi. Yeni fazlar aşağıda |

## Tüm emirler

Durum sözleri: kabul yok, kısmi, durur, sıra değil. «Yapıldı» yalnız senin gördüğün iş için kullanılır. Hiçbiri senin kabulün değil.

### Dövüş ve süre — `COZUM_PLANI.md` Dilim A–F

| Dilim | Emir | Durum |
|---|---|---|
| A | Görev 1’de avcı ve yakın gemi karşılık versin. Otomatik ateş yok. SAM duvarı yok | Kısmi. Simde atış sayıldı. Sen hâlâ karşılık yok diyorsun. Kabul yok |
| B | Önce yakın çift, sonra kanat avcısı. Brifing bir cümle. Kart 4 kalsın | Kısmi. Sen strateji yok diyorsun. Kabul yok |
| C | İkinci vuruş süreyi uzatsın. Kilometre yok. 4 dk yazılmaz | Ölçü id 0’da 126–150 s. Deep Sky Winter (id 1) 30 s’de bitiyor. Kabul yok |
| D | Bir savunma görevinde gemi düşünce kayıp. 205’i birden değiştirme | Yazılmadı |
| E | Vurulan tür görünsün. Yarıçap aynı | Hava ölçeği 2,5 kodda. Sen «hâlâ küçük» demedin, gemi için dedin. Gemi boyu kabul yok |
| F | A–D ölçülünce kademe kademe yay | Açılmadı. A–D kabul değil |

### Kalıcı istek, 3 Kasım — Dilim G

| Emir | Durum |
|---|---|
| İt dalaşı dövüş olsun. 3 m yapışma dövüş değil | Kabul yok. Son eğri kapanış 310 m, atış 3. Ayrı faz |
| Her görevde taşıyıcı saldırısı ve Apache. Karta eklenmez | Kısmi, 3.126. Sen kabul etmedin |
| Her bölümde sürpriz araç değişsin | Kısmi. 205’e yayılmadı |
| Boş ve yavaş dönüş olmasın. Kıça iniş dursun | Kıça iniş kodda. Sen iniş yapamıyorsun. Kabul yok |
| Korvet ve destroyer küçük. Yarıçap değişmesin | Görünür boy kabul yok |
| 205 birden yazılmasın | Durur |
| Mobil ve tablet, 44 px, üç genişlik | Sıra değil. Cihaz turu yok |
| Sahte AdMob yok | Durur |

### Son emir — Dilim H, kabul yok

| Emir | Durum |
|---|---|
| Kalkışta moda sokan ses, uçaktan kalkıyormuş hissi, geri sayım, seslendirme olabilir | Kodda yazı ve bip. Sen görmedin. Kabul yok |
| İnişte tekerlek açılsın, inişe geçiliyor hissi | Teker 0,27 m. Sen görmedin. İniş de olmuyor |
| Kalkış ve inişte kule | Radyo cümlesi. Kule yok |
| Pilot dosyası çok geliştirilsin | Çağrı adı duruyor. Şerit eklendi. Sen kabul etmedin |
| Rakipleri incele, kopyalama, hatasız uygula | İnceleme notu var. Uygulama kabul değil |

### Daha eski emirler — hâlâ duranlar

Kaynak: `PLAN_SIMDI.md`, `PLAN_FAZLAR.md`, `PLAN_GERCEK_DURUM.md`, konuşma.

| Emir | Durum |
|---|---|
| Oyun çok kısa. Hedef uzak ve saçma. Bitiş inişi sıkıntılı | Deep Sky Winter’da hedef 3,4 km ve aynı noktada. Kısa olan mesafe değil, dövüş. İniş senin turunda bozuluyor |
| Düşman karşılık vermiyor | Kabul yok |
| En hızlı sorti 4–5 dk. Boş kilometre yok. 12 km geri gelmez | 4 dk yok. 12 km yok. Öyle kalacak |
| Hız tablosunu yükseltme. İnişi hızla kapatma | Durur |
| `chaseAI` 7000 kör açma. Otomatik ateş yok | Durur |
| Mıknatıs iniş yok. 3.124 kabul değil | Durur |
| Dik katapult durur | Durur |
| Kolayda deniz füzesi tek, flare siler. İlk 12’de SAM ve radar suskun | Durur |
| Sayaç kart, HUD ve sonuç aynı payda. Taşıyıcı skor hedefi değil | Durur |
| Hangar: uçak ortalı ve tam, palet çakışmasın, menü küçük | Kısmi. Sen «bitti» demedin. Bu tur değil |
| TB2/B2 sprite, kokpit, üç genişlik | Açık |
| Kış, yağmur, kar görülsün | Görülmedi |
| Ses berbat. Cihaz duymadan «ses çalışıyor» yazma | Durur |
| Yasal duvar ürkütmesin. Duvarı geri getirme. Sahte KVKK yok | Durur |
| Rütbe: çömez, pilot adayı, üsteğmen, yüzbaşı, kaptan. Çağrı adını silme | İsimler dosyada. Kabul yok |
| Reklam: zorlaşınca 1, ileri kademede 2 ödüllü izleme. SDK yok | Sözleşme. SDK yok. Sıra değil |
| Capacitor AAB, kapalı beta, gizlilik, gerçek reklam | Sıra değil. Hesap sende |
| Replay donuyor | Eski not. Bu tur ölçülmedi |
| Çift motor uçuşta görünsün | Kısmi, ekran görüntüsü senin |
| Müzik | Açık |
| Her görev farklı, dost ve düşman bölgeleri, askeri alan, yol | Açık. 205 birden yok |
| Adacıkta kitlenme | Eski P1. Bu tur yeniden üretilmedi |
| 16 sistem silinmez. Sıfırdan yazma yok. Mimari değişmez | Durur |

### Bilerek yapılmayanlar

- 3.127’deki çift hedef denemesi. Sorti bitmedi, top atışı 0. Geri alındı. Tekrar yazılmaz.
- Bitmemiş sortiyi geçti saymak.
- 70 saniye tabanını düşürmek.
- Namlu menzilini 1200’den açmak, `msl=1` yapmak.
- Eğriyi, v3.87 kapısını, katapult `3be37fa`’yı seçimsiz silmek.

## Sıradaki fazlar

Bir faz, bir konu. Kabul satırı geçmezse sonraki açılmaz. Kabul, sim sayısı artı senin önizlemede gördüğün. Sim yeşil, sen görmedin: kabul yok.

### Faz 1 — Deep Sky Winter inişi

Yalnız id 1. Süreye dokunulmaz. Hedef eklenmez. Hız artmaz.

Sorun: bot 51 saniyede iniyor, sen inemiyorsun. Ateş yokken uçak 40 saniyede y 1325’te.

Yapılacak: insan ıskasını yeniden üret. Eksen dışı, ters yön, yüksek ten. Mıknatıs yok. Adım 4 m’yi geçmeyecek. Sırtta kalan yolu iniş yamasıyla dağdan çekme.

Kabul: eksen dışı deneme iner. Botun 51 saniyesi bozulmaz. Sen önizlemede aynı operasyonda inişi denersin. Sen inemezsen faz geri alınır.

### Faz 2 — kalkış ve iniş görünsün

Faz 1 kabulünden sonra. 3.127 tekrar «yapıldı» diye sunulmaz.

Yapılacak: geri sayım kaçmayacak kadar büyük. Tekerlek takip kamerasında okunur. İnişe geçince açılır, kalkınca kapanır. Kule, varsa mevcut gemi kulesi. Yeni bina yazılmaz. Ses cihazda duyulmadan «duyuluyor» yazılmaz.

Kabul: sen kalkışta 3, 2, 1 görürsün. İnişte tekeri görürsün. Görmezsen kabul yok.

### Faz 3 — Deep Sky Winter 30 saniyede bitmesin

Faz 1 inişi duruyorsa. Kilometre eklenmez. Dört hedef aynı 3389 m noktasında. İlk öldürme 13,6 s.

Yapılacak: sıra ve karşılık. Aynı türü kopyalayıp listeyi şişirmek yok. 6 hedef denendi, süre olmadı.

Kabul: id 1’de dördü 30 saniyede ölmez. İniş durur. Can yazılır. 4 dk yoksa yazılmaz.

### Faz 4 — it dalaşı

Ayrı. `chaseAI` 7000 açılmaz. Otomatik ateş yok. Kapanış 310 m ve 3 atış kabul değil.

### Faz 5 — pilot dosyası

Uçuş kabulünden sonra. Çağrı adı silinmez. Rütbe merdiveni durur. Metin şeridi «çok geliştirildi» değildir.

### Faz 6 ve sonu — sıra değil

Hangar, kış ve yağmur, müzik, 205’e yayma, tablet, AdMob SDK, Capacitor. Oynanış kabulünden sonra. Bir turda yok.

## 3.128 notu — SİHA

Eski `droneTick` ilk satırda dronu gizleyip dönüyordu. O yüzden görünmüyordu. 3.128’de combat 12–38 sn arasında uzun kanatlı SİHA burnun 560 m önünden geçer. Radyo `siha` 12. sn’de ölçüldü. Deep Sky Winter’da düşman dron da 640 m önde doğuyor. Kart sayısına eklenmez. Cihazda görülmeden «göründü» denmez. İniş, 4 dk, yakıt tankeri bu turda yok.

## Senin turun

Önizlemede `DEEP SKY · WINTER` (ikinci kart, id 1). Üç şey yaz: kaç saniyede bitti, iniş neden olmadı, kalkışta 3 yazısını gördün mü. Cihaz sesi bu listede kapanmaz.
