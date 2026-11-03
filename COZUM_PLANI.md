# Çözüm planı — dövüş, strateji, süre (2026-11-02)

Bu dosya bugünkü isteğin planıdır. `PLAN_SIMDI.md`, `striker-dev/plan/ANA_PLAN.md`, `RAKIP_ANALIZI.md`, `FAZ_PLANI_SAVUNMA_ZORLUK.md` ve `KONSEPTLER_192.md` okundu. Onları silmez, hepsini bir turda yürütmez. `PLAYSTORE_MASTER_PLAN.md` yok; olsaydı da yürütülmezdi.

Bir dilim, ölç, yeşil değilse geri al. Ölçülmeyen madde «bitti» değildir. Mimari değişmez. Hız tablosu değişmez. 12 km geri gelmez. Otomatik ateş yok. `chaseAI` 7000 kör açılmaz. Ses bu planda yok. Hangar, reklam SDK, Capacitor bu planda yok.

## Teşhis (ölçüldü, 3.121)

Biten görev basit çünkü döngü şu: kümeye uç, dört hedefi vur, in. Karşılık yok, sıra yok, kaybetme nedeni yok.

| Ölçüm | Sonuç |
|---|---|
| İlk kademe, yardımlı bot, biten 4 görev | 69, 70, 94, 100 s. Ortalama 83 s (1,4 dk) |
| Görev 1 | indi, 94 s, can 100, 4 öldürme |
| 192 görev süre limiti | ortalama 15,2 dk. Bu tavan. Dolunca kaybedilir. Oynanan süre değil |
| Sonraki kademe örnekleri | 200 s içinde bitmedi ya da bot düştü. «Ortalama 4 dk» diye sayılamaz |
| Görev 0 avcısı | origin’e 1800 m’den uzakken y=190, `commit=0`, ateş yok |
| Kolay deniz füzesi | aynı anda bir. Flare siler. İlk 12 görevde SAM/radar suskun |
| Avcı ateşi | ancak 700–1600 m ve havada başka düşman füzesi yokken |
| `chaseAI` | 2800 m’ye kadar 450 m daire. 260 m’de 2,8 s geri. 25 s sonra 15 s çekilme |
| Görev 2 | 6 koşunun bazılarında y=1331, combat’ta kalıyor. Eski sırt sapması |

`KONSEPTLER_192.md` içindeki «90 s takviye», «radar kapalı», «yakıt üç kat» satırları canlı motora bağlı değil. Etiket. 192 kuralı bir yamada bağlamak yeniden yazmaktır. Yapılmaz.

## Rakip çıtası (uydurma yok)

- Sky Warriors maçları 3 dakika ile kesiliyor. Play yorumu bunu kısa buluyor. İçerik it dalaşı, boş koridor değil.
- Ace Fighter kısa it dalaşı diye tanıtılıyor. Yayınlanmış görev dakikası yok.
- Ace Combat görevleri yaklaşık 15 dakika. Konsol. Bu listenin Play rakibi değil.
- 4–5 dakika «rakip ortalaması» değil. Senin alt sınırın. Boş kilometreyle doldurulmaz. Dövüş ölçülmeden vaat edilmez.

Hedef çıtası: oyuncu bir karar versin, düşman karşılık versin, sorti kaybedilebilsin. Süre bunun sonucu olsun. İlk gerçek eşik, Sky Warriors’un oyuncuların kısa bulduğu 3 dakikalık maçı: boş uçuş değil, biten bir dövüş. 4–5 dk ancak o dövüş ölçüldükten sonra, ikinci vuruşla konuşulur.

## Yapılmayacaklar

- 205 görevi bir yamada uzatmak, hedef çoğaltmak, koridoru 12 km yapmak.
- Hız tablosunu yükseltmek. İnişi hızla kapatmak.
- `chaseAI` tasmasını 7000’e çekmek. Görev 2’yi y=1331’de bıraktı.
- Kolayda SAM duvarı. İlk 12 görevde SAM/radar suskunluğu durur.
- Oyuncuya otomatik ateş. Yardımlı flare yok.
- Konsept dosyasındaki 192 twist’i tek seferde koda dökmek.
- Rakip ekranını, füze listesini, uçak sayısını kopyalamak.
- Ses, hangar rewrite, reklam, mağaza metni. Sıra onlar değil.

## Sıra

Her dilim yalnız bir konu. Kabul satırı geçmezse sonraki dilim açılmaz.

### Dilim A — görev 1 karşılık versin

Sorun: dört hedef duruyor, vuruluyor, bitiyor. Avcı 1800 m’ye kadar ateş etmiyor. Gemi ateş etmiyor.

Yapılacak, yalnız görev 0:

1. Avcı, oyuncu dövüş kutusuna girince (hedefe ~2500 m, 12 km değil) tutmayı bırakır, burnunu oyuncuya çevirir, 700–1600 bantta ateş eder.
2. Kolayda havada yine tek düşman füzesi. Flare siler. İkinci füze birincisi bitmeden çıkmaz.
3. Yakın korvet, oyuncu 1200 m içindeyken kısa namlu ateşi açar. SAM açılmaz.
4. Görev 2’nin avcı mesafesi, tasması ve kıyı yolu aynı kalır.

Kabul, `--curve` ve ayrı sayım:

- Görev 0’da hedefler ölmeden en az 2 düşman füzesi veya namlu atışı çıkar.
- Yardımlı görev 1 iner, can ≥ 60, 4 öldürme. Süre yazılır, «düzeldi» denmez.
- Görev 2 iner, y < 40. İnmezse A geri alınır.

### Dilim B — görev 1’de sıra

Sorun: dört hedef aynı anda aynı ceza. Neyi önce vurduğunun önemi yok.

Yapılacak, hedef eklemeden:

1. Önce yakın çift. Onları atlayıp uzaktaki avcıya düz gidilirse korvet namlusu ceza keser.
2. Avcı, yakın çiftten biri düşünce kanattan girer. Ondan önce dairede beklemez, ama haritanın öbür ucundan da kovalamaz.
3. Brifing tek cümle: yakın çifti kes, kanat avcısı girer, sonra uzak korvet, gemiye dön. On dil. Yeni menü yok.

Kabul:

- Düz hatta uzak hedefe giden deneme, sıralı denemeden daha çok hasar alır.
- Sıralı yardımlı sorti yine iner, can ≥ 60.
- Kart, HUD ve sonuç hâlâ 4 hedef. Taşıyıcı sayılmaz.

### Dilim C — süreyi ikinci vuruş uzatsın

A ve B ölçüldükten sonra. Görev 1 hâlâ ~1,5 dk ise kilometre eklenmez.

Yapılacak: ilk iki hedef düşünce ikinci avcı dövüş kutusuna girer. Yeni tür yok. Mevcut interceptor. 6 hedef denendi, süreyi uzatmadı; bu sefer geliş zamanı ölçülür, sayı şişirilmez.

Kabul: yardımlı görev 1 iner, can ≥ 60, düşman atışı > 0, süre bir önceki dilimden uzun. 4 dk yoksa «4 dk oldu» yazılmaz. Görev 2 inişi bozulmaz.

Ölçüm 3.125, sim, cihaz yok: görev 1 üç koşu 132 / 137 / 140 s, can 98–100, iniş var, öldürme 6. Önceki dilim 97 s. 4 dk yok. İniş artık geminin önünden kaydırma değil: gemi geçilir, kıçta dönülür, eğimle güverteye uçulur. Görev 2 dönüşe giren koşular indi; sırtta kalanlar eski sapma.

### Dilim D — bir görev türü diğerinden ayrılsın

Şu an `strike`, `intercept`, `defense` aynı öldür-listesi. 205’ini birden değiştirmek yok.

Yapılacak, yalnız bir savunma görevi (id 1 değil): gemi canı düşünce görev kaybedilir, oyuncu bütün listeyi silmek zorunda kalmaz. Brifing bunu söyler.

Kabul: o görevde gemi canı 0 olunca `finish(false)`. Komşu strike hâlâ «hedefleri vur, in». Eğri görevi 2’yi bozmaz.

### Dilim E — vurduğun ve seni vuran görünsün

Dövüş varken. Gövdeyi ada yapmadan hava hedefi okunur olsun. Vuruşta tür adı 1,5 s bildirilir. Çarpışma yarıçapı değişmez. Cihaz «hâlâ küçük» derse çarpan sonraki dilimde artar.

### Dilim F — ancak o zaman 205

A–D bir görevde ölçülünce aynı kalıp, kademe kademe yayılır. Her kademede ateş aralığı ve geliş süresi tabloya yazılır. Kolayda SAM duvarı açılmaz. As kademesinde ikinci füze ve daha sık namlu serbest kalır. 192 konsept satırı ancak o görev gerçekten o kuralı çalıştırıyorsa bağlanır. Etiket bağlamak yok.

## 4–5 dakika ne zaman

Dilim C ölçüldükten sonra tabloya bakılır. Süre hâlâ 2 dk altındaysa üçüncü vuruş (kaçan hedef veya tek takviye) konuşulur, koridor değil. 4 dk, boş daire veya `time>=240` ile kapatılmaz. Rakip verisi 4–5 dk ortalaması vermedi; bu senin alt sınırın, dövüşün sonucu olacak.

## Kalıcı istek (2026-11-03)

Kullanıcı yazdı, bu dosya kaydı. Bir dilimde hepsi yok.

- İt dalaşı kalitesiz. İçinden geçip 3 metreye yapışmak dövüş değil.
- Her görevde uçak gemisi saldırısı ve Apache. Karttaki 4 hedefe eklenmez, taşıyıcı skor hedefi olmaz.
- Her bölümde sürpriz araç değişir: avcı, Apache, dron. Aynı avcıyı kopyalamak yetmez.
- Güvenli bölgeye boş ve yavaş dönüş istenmiyor. Kıça iniş durur, 1 km boş bacak durmaz.
- Korvet ve destroyer küçük görünüyor. Çarpışma yarıçapı bu dilimde değişmez, yalnız görünen boy.
- 205 görev birden yazılmaz. Mobil ve tablet: 44 px ve üç genişlik durur, cihaz turu ayrıca.
- Sahte AdMob SDK yok.

### Dilim G — boş dönüş, okunur gemi, farklı saldırı

Bu tur. Kabul: yardımlı görev 1 iner, can ≥ 60, düşman atışı > 0. Kuzeyden gelen iniş kıçta başlar, adım 4 metreyi geçmez. Görev 2 dönüşe girerse iner. 4 dk yazılmaz.

Ölçüm 3.126, sim: kuzeyden iniş 20 s, kıçta başladı, adım 1,5 m. Görev 1 üç koşu 115 / 126 / 127 s, can 98–100, öldürme 6. Eğri 125 s, çıkış 0. İt dalaşı kapanış 232 m, atış 2. Önceki kapanış 3 m. Görev 2 indi. 4 dk yok. Tablet bu turda yok.

## Senin turun

Dilim A kodlanınca 8080’de görev 1. Bakılacak üç şey: avcı dönüyor mu, gemi ateş ediyor mu, sorti hâlâ düz vuruşla bitiyor mu. Cihaz ölçümü bu ortamda kapanmaz.

### Dilim H — kalkış geri sayımı, iniş tekerleği, pilot dosyası

3.127. Hız artırılmadı. Hedef sayısı değişmedi. 3.126 iniş oluğu duruyor.

Sim, dt tavanı 0.04: 3,05 sn fren, hız 0, z 1560, tekerlek açık. Mesaj sırası count3, count2, count1, catapult. Hareket 3,7 sn, combat 7,2 sn, o anda tekerlek kapalı. Kuzeyden iniş denemesi: tekerlek açık, gearDown, 2,2 sn sonra clearedLand, sonuç landed, y 17, z 1513. Konuşma sentezi cihazda ölçülmedi.

Eğri bir koşuda görev 2 bitmedi (maxY 1296, sonuç yok). Aynı kodda sonraki koşu EXIT 0: görev 1 126 s, görev 2 indi, it dalaşı kapanış 310 m. 4 dk yok. Kol penceresi 6 sn iken uçak hâlâ kalkıştaydı; ölçüm 9 sn’ye alındı, iddia değişmedi.
