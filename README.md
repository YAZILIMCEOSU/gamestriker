# STRIKER — Fighter Aircraft

Tarayıcıda çalışan 3D deniz-hava muharebe oyunu. **Tek dosyalık** minify React + Three.js bundle'ı
ve onu üreten Python yama hattı. 16 uçak · 48 görev (4 bölüm) · 10 dil · 4 kalite profili ·
tamamen prosedürel grafik ve sentezlenmiş ses (harici asset yok).

**Güncel build:** `striker-dev/index.html` — *UÇUŞ SÜRÜMÜ 1.9 DEV*

## Hızlı başlangıç

```bash
python3 build.py                 # derle + sözdizimi + 11 gömülü test + özet
python3 striker-dev/server.py    # önizleme → http://localhost:8080
```

## Mimari

```
inner.html                     dokunulmamış temel build (v0.9) — DEĞİŞTİRME
   │  python3 striker-dev/patch_v11.py   (build.py en güncel patch_vN.py'yi otomatik seçer)
   │  girdiler: audio_class.js · striker-dev/audio5.js · fw_dict.txt
   │            striker-dev/i18n_data.py · striker-dev/i18n_ar.py
   ▼
striker-dev/index.html         MASTER build (v1.8 DEV)
   ├─ inline CSS   ~121 KB
   └─ inline JS    ~965 KB   (React + Three.js + oyun)
```

> **Kural:** `striker-dev/index.html` elle düzenlenmez. Her değişiklik `patch_vN.py` içinde
> `rep(eski, yeni)` olarak yapılır (`rep`, çıpa tam olarak 1 kez eşleşmezse build'i durdurur),
> sonra `python3 build.py` ile doğrulanır.

## Depo düzeni

| Yol | İçerik |
|---|---|
| `build.py` | tek komutla derle + doğrula |
| `striker-dev/index.html` | güncel build (master) |
| `striker-dev/patch_v11.py` | **aktif** build script'i (`build.py` en yüksek N'yi otomatik seçer) |
| `striker-dev/archive/` | tarihî build script'leri — **çalıştırma** (bkz. içindeki README) |
| `striker-dev/server.py` | `no-store` başlıklı geliştirme sunucusu (`0.0.0.0:8080`) |
| `inner.html` | v0.9 temel (build girdisi) |
| `tools/diag/` | gömülü test paketini dışarıdan çalıştıran araç (sıfır bağımlılık) |
| `PROJECT_AUDIT.md` | Phase 0 adli analizi: mimari, hatalar, riskler, yol haritası |
| `QA_CHECKLIST.md` | doğrulama listesi (otomatik / manuel / eksik ayrımıyla) |
| `striker-gelistirme-plani.md` | v1.0 → v1.7 geliştirme günlüğü |
| `new.html` | ayrı bir araç: "Tanıtım Videosu Stüdyosu" (oyun değil) |
| `page.html`, `app.html` | Arena sarmalayıcı sayfası (oyun değil, birbirinin kopyası) |

## Doğrulama

```bash
python3 build.py                                                   # exit 0 beklenir
cd tools/diag && node run-diagnostics.mjs ../../striker-dev/index.html            # 11/11 PASS
cd tools/diag && node run-diagnostics.mjs ../../striker-dev/index.html --balance  # denge dökümü
```

Bu araçlar simülasyon mantığını test eder; render/GPU/ses test etmez. Onlar için tarayıcıda
önizleme gerekir. Bilinen açıklar ve yol haritası: `PROJECT_AUDIT.md`.
