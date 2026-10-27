# striker-dev/archive — tarihî build script'leri (ÇALIŞTIRMA)

Buradaki dosyalar **geçmiş sürümlerin** build tanımlarıdır. Güncel build script'i
`striker-dev/patch_v10.py`'dur ve kök dizindeki `python3 build.py` ile çalıştırılır.

## Neden arşivdeler

v1.7'ye kadar her `patch_vN.py` **aynı çıktı yoluna** yazıyordu:

```python
h = open('inner.html').read()          # her zaman v0.9 temelinden
…
open('striker-dev/index.html','w').write(h)
```

Yani `python3 striker-dev/patch_v8.py` çalıştırmak, güncel build'i **sessizce v1.6'ya
düşürüyordu** (denetim kaydı: `PROJECT_AUDIT.md` → B-2). Arşive taşınarak bu tuzak kapatıldı.

## İçerik

| Dosya | Ürettiği sürüm | Not |
|---|---|---|
| `patch_v3.py` | v1.1 | 24→48 görev, 3→5 uçak, Audio 3.0 |
| `patch_v4.py` | v1.2 | Audio 4.0, dağ çarpışması, süre v2 |
| `patch_v5.py` | v1.3 | 9 dil, mSet, boya, AI stalk |
| `patch_v6.py` | v1.4 | katapult kalkışı, Audio 5, Arapça (10 dil) |
| `patch_v7.py` | v1.5 | dil kalıcılığı, tanılama 48/5, ACES ayarı |
| `patch_v8.py` | v1.6 | 16 uçak, denizaltı, combo, rubber-band |
| `patch_v9.py` | v1.7 | ağır füze modu, AI kanat arkadaşı, mSet genişletme |
| `patch_v10.py` | v1.8 | B-1 (HP ×1.6 geri alındı) + B-12 (mSet anahtarı) + füze tablosu testi |
| `audio2.js` | — | sadece `patch_v3` kullanıyor (eski ses motoru) |
| `audio4.js` | — | sadece `patch_v4/v5` kullanıyor (eski ses motoru) |

Güncel build script'i arşivde **değildir**: `striker-dev/patch_v11.py` (v1.9).
Güncel ses motoru `striker-dev/audio5.js` (arşivde değil, hâlâ build girdisi).

## Çalıştırırsan ne olur

Bu script'ler `open('inner.html')`, `open('audio_class.js')`, `open('striker-dev/audio5.js')`
gibi **depoya göre** yollar kullanır. Arşivden çalıştırılırsa ya dosya bulunamaz ya da
(kök dizinden çalıştırılırsa) güncel build'in üzerine eski sürüm yazılır. İkisi de istenmez.

Tarihî bir sürümü gerçekten yeniden üretmen gerekirse: script'i geçici olarak `striker-dev/`
altına kopyala, kök dizinden çalıştır, çıktıyı başka bir yere kaydet, sonra `python3 build.py`
ile güncel build'i geri getir.
