# STRIKER — güncel faz planı (2026-11-01)

Bu dosya bugünkü işin planıdır. Eski `FAZ_PLANI.md` v1.10 denetimidir; onu yürütme. Claude `PLAYSTORE_MASTER_PLAN.md` yürütülmez. Ölçülmeyen madde «bitti» yazılmaz. Bir dilimde bir konu. Yirmi değişiklik birden yok.

Oyun ücretsiz kalır. Premium yok. Reklam SDK’sı bu planda yok. Sahte kreatif, sahte «KVKK’ya kayıtlıyız», sahte mağaza kaydı yok. iOS, Play Store yorumlarından sonra.

## Şu an ölçülen

| Konu | Ölçüm | Durum |
|---|---|---|
| Sürüm | 3.100 DEV, commit bu dilimle | ateş dilimi |
| Assisted görev 1 | iniş, 162 s, can %94, 4 hedef, bölge 12.5–13.6 km | süre hâlâ kısa |
| Görev 2 kıyı | körfez ~3.4 km, iniş, can %100 | bozulmayacak |
| Ateş düğmesi | dokunuş `firePulse` ile bir kareye taşınır; combat’ta bir kare top mermisi + `gun` olayı | bu dilim |
| Avcı | 450 m devriye, 2800 m’den önce kovalamaz; 260 m’de 2.8 s geri kaçış + 1.25 rad jink | düşman gibi değil |
| Görünen atış | top izi ölçek 0.6 idi, 8 oldu; namlu parçacığı eklendi | hedef hâlâ küçük |
| Avcı gövdesi | yaklaşık 11 m | ekranda nokta |
| Kara tesis tabanı | radar/sam/depo görsel tabanı 200–400 m | uçakla aynı ölçek değil |
| İşaret yarıçapı | normal 18000 m, radar-kapalı 3500, sis 6000 | süre uzarsa birlikte büyür |
| Reklam SDK | string yok | öyle kalacak |
| Aydınlatma | `2026-11-a`, cihaz-içi, kutu değil | reklam onayı değil |

Önizleme: `https://8080-igdt0vc6wnjt2dcwtqcsj.e2b.app/` — panel token’ı basar. Ham link 403 olabilir.

## Rakip, kopya değil

- Sky Force Reloaded: okunur bölüm, güç eğrisi, uzun kampanya. Bir kaynak bölümleri 7–10 dk diye yazar; resmi tasarım belgesi değil. Tek başına «rakip 8 dk» yazma. Zayıf yan: acele edince döngü kısa kalır.
- Ace Fighter (`com.ParsisGames.AirCombatEn`): görev çeşidi (it dalaşı, eskort, belirli hedef), öğrenmesi kolay. Metin, sistem ve sayı kopyalanmaz.
- Sky Warriors: şikayet haksız savunma, kazanılamaz görev, rastgele kilit, ıskalayan füze. Süre, dağda dolaştırarak veya öldürerek uzatılmaz.

Fırsat: gidiş, vuruş, dönüş. Tehdit: süreyi görünmez hedef ve başıboş daireyle doldurmak.

## Dilim 21 — ateş düğmesi (bu tur)

Sorun: HUD’daki ATEŞ, `preventDefault` + `lostpointercapture` ile aynı turda `fire`’ı kapatıyordu. Kısa dokunuş kareye yetişmeden siliniyordu. Top izi 0.6 ölçekte görünmüyordu.

Yapılan: pulse, kalkışta pulse silinmez, combat’ta bir atış, iz ölçek 8, sarı namlu parçacığı. Otomatik ateş yok. Füze düğmesi ayrı kaldı.

Kabul: `--curve` içinde «ateş düğmesi dokunuşu yutmaz» ve «ateş bir karede mermi ve namlu izi üretir» PASS. Görev 1 canı %60 üstü, görev 2 inişi bozulmaz.

Sen: önizlemede ATEŞ’e bir kez dokun. Namlu izi yoksa yaz. Basılı tutunca seri atış sürmeli.

## Dilim 22 — dairedeki uçağı düşman yap

Sorun: interceptor, oyuncu 2800 m’ye gelene kadar kendi noktası etrafında 450 m daire çizer. 260 m’de 2.8 saniye ters uçar ve kilitlenince 1.25 rad kaçınır. Kokpitte başıboş eşlik eden, burnu çevrilemeyen uçak budur. Dost kanat değil.

Bu tur denendi: kovalama 7000 m, tasma 8000 m, kaçınma küçültüldü. Görev 2 assisted pilotu 1331 m’de kaldı, 120 s’de inemedi. Geri alındı. Kıyı yolu bozulmadan kapanmaz.

Yapılacak, yalnız bu:

1. Görev 2 (id 1) avcı mesafesi, tasmasi ve 25 s geri çekilmesi aynı kalır.
2. Diğer erken görevde, oyuncu 6000–7000 m’ye gelince daire biter, burun oyuncuya döner.
3. 3500 m içindeyken 25 s’de savaşı bırakıp daireye dönmez.
4. Çarpışma kaçışı 180 m ve 0.5 s’den uzun sürmez. Jink 0.5 rad altında, kilit varken burun tutulabilir.
5. Ölç: görev 0’da 6500 m içindeyken heading oyuncuya 0.75 rad’dan yakın, örneklerin en az yarısı. Görev 2 iniş, y<40, 120 s. Görev 1 can %60, süre 150 s altı düşmez.

Yapılmayacak: otomatik ateş, eğriyi geri alma, kıyı körfezini 3400 m’den çıkarma.

## Dilim 23 — süre, 4 dakika tabanı

162 s hâlâ kısa. 7–10 dk bu dilimde yok. Önce 4 dk, koridor açıkken.

Yapılacak:

1. Yalnız kıyı dışı erken bölge. Görev 2 körfezi 2800–5200 m kalır.
2. Koridor testi aynı: ±600 m, 400 m adım, arazi ≤12 m. Dağ sırtına geri dönme.
3. İşaret yarıçapı bölgeden en az 2 km büyük. Sis ve radar-kapalı özel yarıçapları büyütme.
4. Yakıt bitmeden iniş. Can %60 altı olursa mesafeyi geri al, düşmanı zayıflatma.
5. Kabul: assisted görev 1 iniş, süre ≥ 230 s, can ≥ 60, 4 hedef, görev 2 iniş bozulmaz.
6. 230 s geçmeden «süre düzeldi» yazılmaz. 7–10 ancak 4 dk uçulup sen «hâlâ kısa» dersen sonraki dilim.

## Dilim 24 — ne vurduğunun görünmesi

Sorun: avcı gövdesi ~11 m, kamera 44 m geride. 2 km’de açı ~0.3 derece. Vuruş `hit` parçacığı var ama hedef kimliği ve enkaz okunmuyor. Kara tesis zaten 200–400 m tabanlı; uçak ve gemi değil.

Yapılacak, bir dilim:

1. Havadaki düşman görsel ölçeği, çarpışma yarıçapını değiştirmeden, en az 2.5 kat. Gövde hâlâ uçak gibi okunur, ada gibi değil.
2. Vuruşta hedefin türü 1.5 s HUD’da kalır (SAM, avcı, korvet). On dil. Yeni sistem yok, mevcut `notify`.
3. Ölen hedef 2 s enkaz/duman bırakır, sonra kaybolur. Liste sayacı mevcut kırılımı kullanır (`listed` / `mission.targets`). Taşıyıcıyı sayma.
4. Ölç: bir füze vuruşu `hit` veya `explosion` olayı üretir ve notify anahtarı tür adını taşır. Görsel ölçek kaynakta tek çarpan. Çarpışma yarıçapı aynı kalır (curve can eşiği bozulmasın).

Cihazda «hâlâ küçük» dersen çarpan bir sonraki dilimde artar. Bu ortam GPU ölçemez.

## Dilim 25 — hangar ve mağaza, üç genişlik

Sorun: 900 px altında kredi bakiyesi `display:none`. Hangar katmanı `pointer-events:none`; çocuklar tek tek açılıyor. Mağaza ızgarası `minmax(160px)`. Tablet ve telefonda kart, uçağın ve düğmenin üstüne biniyor olabilir.

Yapılacak:

1. 390, 768 ve 1280 px için aynı üç kontrol: uçak seçici kayar, satın al / yükselt düğmesi 44 px, kredi görünür, yetersiz kredide mevcut uyarı durur.
2. Mağaza sekmesi uçağın önünü kaplamaz. Dar ekranda altta, kaydırılır.
3. Ölç: kaynaktan üç genişlikte bu sınıfların çakışmadığı bir kontrol. Dokunma bu ortamda kapanmaz; sen tablette bir tur yazarsın.
4. Sahte satın alma, premium, reklam kreatifi yok. Kredi yolu durur.

## Dilim 26 — bölüm kalitesi, aynı koridor değil

Erken görevlerin çoğu aynı su koridoruna dizildi. SAM ve radar denizin üstünde. Köprü, rafineri, havaalanı, liman suya taşınmadı.

Yapılacak, görev 0’dan başlayarak bir görev:

1. Her görevde bir cümlelik plan: nereden çık, neyi vur, nereye dön. Mevcut briefing anahtarı. On dil. Uydurma posta adresi yok.
2. SAM/radar ancak koridor bozulmadan kara rafa oturursa karaya alınır. Oturmazsa deniz üstü olduğu açıkça yazılır, «kara üssü» denmez.
3. Görev 2 körfezi, deniz füzesi (aynı anda bir, flare siler), ilk 12 görevde SAM suskunluğu durur.
4. 205 eğrisi geri alınmaz. Uçak tablosuna dokunulmaz.

## Dilim 27 — reklam mantığı, SDK yok

İleri kademede isteğe bağlı 1 izleme, zorluk artınca 2. Ödül kalkan, silah veya uçak. Kredi yolu durur. «Uygulamayı desteklemek için izle» yazılmaz. Kutu önceden işaretli olmaz. Ret oyunu kapatmaz. Aydınlatma `2026-11-a` reklam onayı değildir; SDK gelince ayrı ekran.

Bu dilim yalnız sözleşme ve kapı. SDK, sahte video, sahte ödül yok.

## Dilim 28 — senin cihaz turu

Bu ortam ölçemez: FPS, GPU, ses, dokunma, iOS AudioContext, yön kilidi.

Sen: telefon yatay, tablet, laptop. ATEŞ, füze, hangar satın alma, görev 1 süresi, dairedeki uçak. Yaz. Ben bir maddeyi düzeltirim.

## Dilim 29 — Play Store kapalı beta

Ancak 22–26 ölçülünce. Capacitor AAB, gizlilik URL’si, mağaza metni, gerçek cihaz. Hesap ve imza sende. Agent paket iskeletini hazırlar, «yayında» demez.

## Dilim 30 — iOS

Play Store yorumlarından sonra. Önce değil.

## Senin / benim

Sen: önizlemeyi uçur, bir cümle yaz (ateş göründü mü, süre hâlâ kısa mı, uçak hâlâ daire mi). Mağaza hesabı, reklam hesabı, KVKK kaydı, iOS bu dilimlerde sende değil.

Ben: 22’den devam. Bir dilim, ölç, yeşil değilse geri al, sonra sonraki. Süre 4 dk olmadan «düzeldi» yazmam. 7–10’u bu planda vaat etmem.
