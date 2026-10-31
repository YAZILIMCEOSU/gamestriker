# store/ — Google Play hazırlık klasörü

Bu klasör yalnızca mağaza metinlerini ve gizlilik politikası taslağını içerir. Oyunun Android paketi bu klasörde değildir.

| Dosya | Durum |
|---|---|
| store_listing.md | Taslak (metinler, derecelendirme, veri güvenliği önerileri) |
| privacy-policy.html | Taslak (TR/EN); URL ve karar bekleyen maddeler işaretli |

Android paketi için kalan adımlar (henüz yapılmadı):
1. Capacitor ile Android sarmalayıcı oluşturma (JDK 17 ve Android SDK gerekli).
2. Yayın imzalama anahtarını (keystore) oluşturup yedekleme. Kaybolursa güncelleme yapılamaz.
3. Release AAB üretme ve gerçek cihazda test.
4. Google Play Console: uygulama kaydı, $25 tek seferlik hesap ücreti, Internal Testing.
5. Satın alma/reklam varsa Play Billing veya AdMob SDK entegrasyonu (web sürümünde Play Billing çalışmaz).
