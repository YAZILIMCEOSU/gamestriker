# -*- coding: utf-8 -*-
# =============================================================================
# v1.10 -> v3.79 : GOREV BASINA BOLGE + HAVA + TWIST  (plan verisi devrede)
# -----------------------------------------------------------------------------
# Kullanici istegi: "her gorev farkli lokasyonlar hava sartlari ... devreye sok"
#
# ESKI DURUM (v3.78, dn uretecinden okundu):
#     sunset:[0,0,.6,1][sn], biome:e%6, weather:(e+sn)%5
#   -> 6 biyom x 5 hava, basit modulo. Plan verisiyle BAGLANTISI YOKTU.
#   -> Kanit: grep 'region_key' index.html = 0, 'Buzul Fiyordu' = 0.
#
# YENI DURUM:
#   striker-dev/plan/missions_192.json build GIRDISI olarak okunur
#   (fw_dict.txt / i18n_data.py ile ayni gelenek). 192 konseptin deseni
#   formulle uretilir ve BUILD SIRASINDA 192/192 dogrulanir:
#       r = floor(i/8)  t = i%8
#       bolge = R[r]   tur = T[t]   hava = W[(r+t)%8]   twist = X[(t+3r)%8]
#   Desenden sapma olursa assert build'i durdurur (sessiz bozulma yok).
#
# KIRILMAYAN SEYLER (tuketiciler tek tek okundu):
#   * biome 0..5  -> buildIslands(id,biome,variant) + biomePal[biome]
#                    24 bolge mevcut 6 biyoma eslenir (__B2B), palet fallback'i var.
#   * weather 0..4 -> setWeather() fog yogunlugu + HUD overlay + weather===4 turbulans
#                    planin 8 havasi mevcut 5 indekse eslenir (__W2E).
#   * gece/alacakaranlik -> mevcut sunset mekanizmasi 1'e zorlanir (yeni shader yok).
#   * biome===5 (NIGHT OPS) zaten setSunset(!0) cagiriyor -> "Gece Limani" otomatik gece.
#
# YENI ALANLAR (simdilik veri; gorsel/kural karsiligi sonraki faz):
#   weatherKey, region, regionKey, regionNote, conceptType, twist
# =============================================================================
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
PLAN = os.path.join(ROOT, 'striker-dev', 'plan', 'missions_192.json')

s = open(P, encoding='utf-8').read()


def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (n, old[:90])
    s = s.replace(old, new)


# ---------------------------------------------------------------- plan verisi
concepts = json.load(open(PLAN, encoding='utf-8'))
assert len(concepts) == 192, len(concepts)


def uniq(key):
    out = []
    for m in concepts:
        if m[key] not in out:
            out.append(m[key])
    return out


REG = uniq('region')          # 24
TYP = uniq('type')            # 8
WEA = uniq('weather')         # 8
TWI = uniq('twist')           # 8
assert (len(REG), len(TYP), len(WEA), len(TWI)) == (24, 8, 8, 8), (len(REG), len(TYP), len(WEA), len(TWI))

RKEY = {}
RNOTE = {}
for m in concepts:
    RKEY.setdefault(m['region'], m['region_key'])
    RNOTE.setdefault(m['region'], m['region_note'])

# --- formulu 192/192 dogrula (plan degisirse build dursun)
bad = []
for i, m in enumerate(concepts):
    r, t = i // 8, i % 8
    got = (REG[r], TYP[t], WEA[(r + t) % 8], TWI[(t + 3 * r) % 8])
    exp = (m['region'], m['type'], m['weather'], m['twist'])
    if got != exp:
        bad.append((i, got, exp))
assert not bad, bad[:3]
print('plan formulu dogrulandi: 192/192')

# --- 24 bolge -> mevcut 6 ada biyomu (0 SEA BASE,1 DESERT,2 ARCTIC,3 JUNGLE,4 CANYON,5 NIGHT OPS)
KEY2BIOME = {
    'ice': 2, 'desert': 1, 'tropic': 3, 'volcano': 4, 'arctic': 2, 'delta': 3,
    'salt': 1, 'bay': 2, 'estuary': 3, 'rig': 0, 'storm': 0, 'night': 5,
    'canyon': 4, 'cliff': 4, 'reef': 3, 'steppe': 1, 'shelf': 2, 'typhoon': 0,
    'lava': 4, 'plateau': 4, 'fogvalley': 4, 'jungle': 3, 'breakwater': 0, 'redplain': 1,
}
missing = set(RKEY.values()) - set(KEY2BIOME)
assert not missing, missing
B2B = [KEY2BIOME[RKEY[r]] for r in REG]

# --- planin 8 havasi -> motorun 5 indeksi
# motor: 0 yok · 1 yagmur(rain-overlay) · 2 sis(fog) · 3 kar(snow) · 4 firtina(storm-flash+turbulans)
WKEY2ENG = {'acik': 0, 'sisli': 2, 'yagmurlu': 1, 'karli': 3, 'firtinali': 4,
            'gece': 0, 'tozlu': 2, 'alacakaranlik': 0}


def norm(x):
    return (x.replace('ı', 'i').replace('İ', 'i').replace('ş', 's').replace('ğ', 'g')
             .replace('ü', 'u').replace('ö', 'o').replace('ç', 'c'))


W2E = []
for w in WEA:
    k = norm(w)
    assert k in WKEY2ENG, (w, k)
    W2E.append(WKEY2ENG[k])
# kontrol: 5 bilinen hava dogru indekse gitmeli
assert W2E[:5] == [0, 2, 1, 3, 4], W2E

js_arr = lambda xs: '[' + ','.join(json.dumps(x, ensure_ascii=False) for x in xs) + ']'
RGN = js_arr([[r, RKEY[r], RNOTE[r]] for r in REG])

# ONEMLI: dn=rb.map(...) bir `const A=...,B=...,dn=...` BILDIRIM ZINCIRININ parcasidir
# (oncesi: `...return P?P[Math.floor(nx()*P.length)]:t})},dn=rb.map(`).
# Bu yuzden buraya `const ...;` KONMAZ -- ayrac VIRGUL olmali, yoksa zincir kirilir
# (node --check: "Unexpected token 'const'"). Bu hata ilk denemede yakalandi.
TABLES = (
    '__RGN=' + RGN + ','
    '__WKEY=' + js_arr(WEA) + ','
    '__TWS=' + js_arr(TWI) + ','
    '__CTY=' + js_arr(TYP) + ','
    '__B2B=' + js_arr(B2B) + ','
    '__W2E=' + js_arr(W2E) + ','
)

# ---------------------------------------------------------------- 1) tablolar
rep('dn=rb.map((s,e)=>{const n=Math.floor(e%48/12)',
    TABLES + 'dn=rb.map((s,e)=>{const n=Math.floor(e%48/12)')

# ---------------------------------------------------------------- 2) konsept degiskenleri
rep('dn=rb.map((s,e)=>{const n=Math.floor(e%48/12),sn=Math.floor(e/48),a=ob[e%6],',
    'dn=rb.map((s,e)=>{const n=Math.floor(e%48/12),sn=Math.floor(e/48),a=ob[e%6],'
    '__i=e%192,__rr=Math.floor(__i/8),__tt=__i%8,__wi=(__rr+__tt)%8,__xi=(__tt+3*__rr)%8,__rg=__RGN[__rr],')

# ---------------------------------------------------------------- 3) alanlar
# sunset: gece(5) / alacakaranlik(7) -> mevcut gece isigi (yeni shader gerekmez)
rep('sunset:[0,0,.6,1][sn],biome:e%6,weather:(e+sn)%5}',
    'sunset:__wi===5||__wi===7?1:[0,0,.6,1][sn],'
    'biome:__B2B[__rr],'
    'weather:__W2E[__wi],'
    'weatherKey:__WKEY[__wi],'
    'region:__rg[0],regionKey:__rg[1],regionNote:__rg[2],'
    'conceptType:__CTY[__tt],twist:__TWS[__xi]}')

# ---------------------------------------------------------------- 4) özel görevler
# id 192..204 elle yazilmis (dn.push) -> ureteçten gecmedikleri icin konsept alani yok.
# Kullanici istegi "HER gorev farkli lokasyon/hava" -> ayni formulle (i = id % 192) doldur.
# Mevcut sunset korunur (id 192 zaten sunset:1), yalniz gece/alacakaranlik 1'e zorlar.
rep('par:260});dn.forEach(m=>{if(!m.targets||',
    'par:260});'
    'dn.forEach(m=>{if(m.region)return;'
    'const __i=m.id%192,__rr=Math.floor(__i/8),__tt=__i%8,__wi=(__rr+__tt)%8,__xi=(__tt+3*__rr)%8,__rg=__RGN[__rr];'
    'm.region=__rg[0],m.regionKey=__rg[1],m.regionNote=__rg[2],'
    'm.conceptType=__CTY[__tt],m.weatherKey=__WKEY[__wi],m.twist=__TWS[__xi],'
    'm.biome=__B2B[__rr],m.weather=__W2E[__wi],'
    'm.sunset=__wi===5||__wi===7?1:(m.sunset||0)});'
    'dn.forEach(m=>{if(!m.targets||')

# ---------------------------------------------------------------- 5) rozet
s = s.replace('3.78 DEV', '3.79 DEV')
assert '3.79 DEV' in s

open(P, 'w', encoding='utf-8').write(s)
print('v94 ok · 24 bolge x 8 hava x 8 twist baglandi · boyut:', len(s))
