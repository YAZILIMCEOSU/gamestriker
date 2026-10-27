# STRIKER — Fighter Aircraft | İnceleme Raporu

**İncelenen URL:** `https://01a0c419-3071-7b46-816d-318eef9ed4e0.arena.site/`
**Tarih:** 27 Eylül 2026 · **Yöntem:** HTTP/HTML statik analizi (canlı tarayıcı testi bu ortamda yapılamadı — sandbox'ta başsız tarayıcı/GPU yok)

---

## 1. Neyle karşı karşıyayız?

Arena "Code Arena"da **Idea Game** imzasıyla üretilmiş, tarayıcıda çalışan **tam teşekküllü bir 3D deniz-hava muharebe oyunu**. Sıradan bir tanıtım sayfası değil: hangar (uçak seçimi/geliştirme), 24 operasyonluk kampanya, ekonomi sistemi, pilot profili ve ayarlar ekranlarıyla eksiksiz bir ürün.

### Mimari (doğrulanmış bulgular)
- **Tek dosyalık build:** Uygulamanın tamamı ~**1.03 MB**'lık tek bir HTML içinde gömülü (`inner.html`, 4.509 satır). React + **Three.js (r186)** minify edilmiş halde inline `<script type="module">` olarak geliyor. `<div id="root">` boş — her şey istemci tarafında render ediliyor.
- **Sunum katmanı:** Verilen URL önce Arena'nın sarmalayıcı (wrapper) sayfasını (~14,7 KB) döndürüyor; gerçek uygulama `?embed=true` iframe'i içinde geliyor ve sunucu bunu **iframe benzeri istek başlıklarına** (`Sec-Fetch-Dest: iframe`) göre ayırt ediyor (başlıksız istek 302 ile sarmalayıcıya dönüyor). Cloudflare üzerinden **Brotli (`content-encoding: br`)** ile sıkıştırılıyor; `cache-control: public, no-cache`.
- **Kalıcılık:** İlerleme `localStorage` anahtarı **`idea-game.striker.v2`**'de, `version: 2` şemasıyla saklanıyor; şema uyuşmazsa varsayılana dönüyor. Başlangıç kredisi 600.
- **Dil:** Varsayılan **TR**, tam **EN** çevirisi mevcut (arayüzde TR/EN anahtarı). `lang="tr"`.

## 2. Oyun içeriği

### Uçaklar (3 özgün tasarım)
| Uçak | Kod | Rol | Fiyat | Hız | Çeviklik | Gövde | Füze |
|---|---|---|---|---|---|---|---|
| STRIKER | SF-16 | Çok amaçlı | 0 | 260 | 1.45 | 100 | 10 |
| SPECTRE | SF-22 | Hava üstünlüğü | 1400 | 240 | 1.10 | 140 | 14 |
| TEMPEST | XA-40 | Deneysel | 2600 | 310 | 1.80 | 85 | 8 |

### Kampanya
- **4 bölge × 6 operasyon = 24 görev:** İLK IŞIK (Pelagic Islands), KUZEY CEPHESİ (Northern Flotilla), SESSİZ FIRTINA (Taranis Archipelago), SON UFUK (Shenlong Strait).
- **Görev tipleri döngüsü:** strike, intercept, defense, radar, carrier, boss — yani gemi taarruzu, önleme, üs savunması, radar imhası, uçak gemisi saldırısı ve bölüm sonu karşılaşmaları.
- Görevler kilit sistemiyle sıralı açılıyor; başarılar cihazda "Uçuş Kaydı"na (skor, süre) işleniyor.

### Kontroller
- **Yön:** W/S veya ↑/↓ (pitch), A/D veya ←/→ (yaw) · **Gaz:** Shift (artır) / Ctrl (azalt)
- **Silahlar:** Space/M füze, F fişek (karşı önlem), B bomba, T hedef değiştir, R uçuş yardımı aç/kapat, C kamera.
- Oyun tuşlarında `preventDefault` uygulanıyor (sayfa kayması engellenmiş).
- **Mobil:** sol sanal kol, sağ ateş tuşları, dikey gaz kaydırıcısı, isteğe bağlı eğim (jroskop) kontrolü + sensör yoksa zarif uyarı.

### Ayarlar & teknik profiller
- **Kalite:** low / medium / high / **ultra** — gölge haritası 1024→2048, deniz ızgarası 32/64/112 segment; masaüstünde varsayılan `high`, <768 px'te `medium` (akıllıca).
- Ses (özün sentezlenmiş SFX), hassasiyet, uçuş yardımı, zorluk, **kamera hareketini azalt** seçeneği.

## 3. Güçlü yanlar

1. **Ürün olgunluğu yüksek:** brifing → görev → debriefing → ödül döngüsü, kilit/ekonomi sistemi ve pilot dosyasıyla gerçek bir oyun iskeleti kurulmuş.
2. **Erişilebilirlik ciddiye alınmış:** 22 `aria-label`, diyaloglarda **odak tuzağı** (Tab yönetimi), `prefers-reduced-motion` desteği, "kamera hareketini azalt" seçeneği, WebGL 2 yoksa ve localStorage kapalıysa açıklayıcı düşüş (fallback) mesajları.
3. **İki dillilik (TR/EN)** metinlerde kalite iyi; Türkçe yerelleştirme doğal, makine çevirisi hissi yok.
4. **Cihaz uyarlaması:** mobilde otomatik `medium` kalite, sanal kontroller, eğim sensörü yedeği.
5. **Tasarım dili tutarlı:** Barlow Condensed + IBM Plex Mono ile askeri-HUD estetiği; turkuaz/antrasit + turuncu palet; OG ekran görüntüsündeki low-poly jet + deniz sahnesi profesyonel duruyor.
6. **Dürüst iletişim:** "İlerlemen bu cihazda kaydedilir", "kontrol başarılı; GPU performans testi değildir" gibi net mikro metinler.

## 4. Eleştiriler & riskler

1. **Tek dosyada 1.03 MB (ham) JS+HTML:** Brotli indirmeyi küçültse de **ayrıştırma/derleme maliyeti** cihazda aynı kalır. Kod bölme (code-splitting) yok; oyun motoru, React ve tüm içerik açılışta yükleniyor. Düşük uç cihazlarda ilk açılış yavaş olabilir.
   - *Öneri:* Three.js + oyun mantığını ayrı chunk'a ayırıp ana menüyü önce çizmek (route-level lazy import).
2. **OG görseli 2.8 MB PNG (2400×1260):** sosyal paylaşım kartları için çok ağır.
   - *Öneri:* WebP/AVIF veya optimize PNG (~100–200 KB hedefi).
3. **SEO / JS'siz erişim yok:** `<div id="root">` boş; arama motoru ve JS kapalıyken içerik görünmez. Oyun için kabul edilebilir ama statik bir özet/`<noscript>` bloğu ucuz bir iyileştirme.
4. **Yalnızca localStorage kalıcılığı:** tarayıcı verisi temizlenince ilerleme gider; çoklu cihaz senkronu yok. (Oyun bunu arayüzde dürüstçe belirtiyor — en azından doğru iletişim.)
   - *Öneri:* dışa/içe aktar (JSON) butonu bile yeterli; IndexedDB daha sağlam olur.
5. **WebGL 2 zorunlu:** geniş ama eski cihazları dışarıda bırakır; fallback mesajı var, bu iyi. WebGL 1 düşüşü maliyetli olurdu — mevcut tercih savunulabilir.
6. **Canlı çalışma testi yapılamadı:** bu sandbox'ta başsız tarayıcı/GPU bulunmadığı için render, FPS ve ses davranışı **statik olarak** doğrulandı; kodda WebGL 2 denetimi ve hata mesajları mevcut.

## 5. Sonuç

"Striker", bir kod arenasında üretilmiş olmaktan çok **küçük bir stüdyo ürünü** gibi duruyor: 3 uçak + 24 görevlik kampanya, ekonomi, i18n, erişilebilirlik ve mobil kontroller tek pakette. En büyük yapısal risk, her şeyi tek 1.03 MB dosyaya gömmek (açılış performansı) ve 2.8 MB'lık OG görseli. İçerik, denge verileri (uçak istatistikleri) ve görev çeşitliliği düşünüldüğünde, kod bölme + asset optimizasyonu yapıldığında rahatlıkla yayınlanabilir kalitede.

**Genel not: 8.5/10** — içerik ve olgunluk çok iyi; paketleme/optimizasyon tek gerçek zayıflık.
