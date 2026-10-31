# Hedef ve Savaş Düzeltme Fazları

Her faz bittiğinde: sayfa hatası yok, ekran görüntüsü kanıtı, ayrı commit.

## Faz 1 — Dağa çarpma (KOD TAMAM, UÇUŞ TESTİ BEKLİYOR)
- Sorun: Terrain kontrolü yalnızca uçağın altına bakıyordu. Yamaca hızla girilince anlık yükseltme ve sürekli sürtünme hasarı vardı.
- Değişiklik: Uçuş yönünde 350 m ile 1,4×lk arasında 4 nokta kontrol edilir. Gerekli yükseklik (arazi + 110 m) için yumuşak tırmanma uygulanır. Sürekli sürtünme hasarı 4 → 1,2 /sn.
- Doğrulama: Sayfa hatası yok. Gerçek uçuşta çarpma sayısı henüz ölçülmedi.
- Commit: (bu faz)

## Faz 2 — Deniz hedefleri az
- Sorun: Deniz hedefleri (korvet, muhrip, denizaltı, liman) az yerleştiriliyor.
- Yapılacak: Konvoy, sahil savunması, denizaltı avı görevlerinde deniz hedef sayısını en az 6'ya çıkar. Hedef türü karışımını dosyada kontrol et.
- Doğrulama: 3 deniz görevinin hedef sayımı ve ekran görüntüsü.

## Faz 3 — Düşman hava saldırısı yok
- Sorun: Hava hedefleri (attacker, bomber) saldırmıyor.
- Kök neden adayı: Hava düşmanlarının "dormant" (gizli) başlatılması ve ateş zamanlayıcısı (`fireIn`) için menzil kuralları (2300 m).
- Yapılacak: Dormant süresini kısalt, hava düşmanlarını 1800 m içinde saldırı moduna al.

## Faz 4 — Başıboş geçen uçaklar
- Sorun: Uçaklar oyuncuya yaklaşmadan dolanıyor.
- Yapılacak: Havadaki düşmanlar 2500 m içinde oyuncuyu takip eder (chaseAI). Dolaşma yarıçapını küçült.

## Faz 5 — Hedef netliği
- Sorun: Çok fazla hedef işareti, hangisinin hedef olduğu belirsiz.
- Yapılacak: Yalnızca seçili hedefin etiketi tam görünsün. Diğerleri sadeleşsin. Denizaltı (dalmış) hedefleri ayrı işaretlensin.

## Faz 6 — Hedef sayacı tutarsızlığı (ekran görüntüsünden)
- Sorun: Kart "17 TARGET" ve "12 TARGET" diyor, HUD "0/18" ve "0/13" gösteriyor.
- Kök neden adayı: Kart ile HUD farklı sayı kaynağı kullanıyor.
- Yapılacak: Tek kaynak (görev hedef listesi) kullan. Kart, HUD ve sonuç ekranı aynı sayıyı göstersin.

## Faz 7 — HUD çakışması
- Sorun: Alt HUD'da ROUTE düğmesi ile hedef mesafe etiketi ve "ACQUIRING 0%" üst üste biniyor.
- Yapılacak: Alt HUD düzenini sabitle, çakışan öğeleri ayır.
