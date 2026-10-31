# -*- coding: utf-8 -*-
# =============================================================================
# v3.80 -> v3.81 : FAZ 2b KALIBRASYON — alacakaranlik + gece okunabilirligi
# -----------------------------------------------------------------------------
# OLCUM (tools/diag/calibrate-atmosphere.mjs, ACES + exposure .84 + sRGB):
#   acik gunduz zenit 147 / ufuk 204 / ada ust yuzey ~125
#   alacakaranlik     zenit 96  (%65) — gunduz gibi okunuyor, ufuk sicakligi
#                     uNight dogrusal karisimiyla ole gune gidiyordu
#   gece              zenit 16  — gokyuzu dogru, AMA:
#                     hemi rengi #16243c o kadar koyu ki ada ust yuzeyi ~1/255
#                     (oyun-gecesi degil, siluet kaybi)
#                     scene.environmentIntensity=.82 hic degismiyordu: RoomEnvironment
#                     studyo yansimasi gece gorevinde uçaklari gunduz gibi birakirdi
#
# KURALLAR:
#   uNight=0 (acik/sisli/yagmurlu/karli/firtinali) ve uNight=1 (tam gece gokyuzu)
#   shader matematigi v3.80 ile birebir ayni kalir. Degisen yalniz ARA deger
#   (alacakaranlik) ve isik tablosu + environmentIntensity.
#   Tozlu gokyuzu ayni; yalniz ei acikca .82 yazilir (geceden kalmasin).
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:120])
    s = s.replace(old, new)


# ---------------------------------------------------------------- 1) gokyuzu: ara deger egrisi
# Ufuk kararmasi uNight^2: alacakaranlikta gunbatimi sicakligi kalir, tam gecede ayni.
rep('zenith=mix(zenith,vec3(.010,.020,.052),uNight);horizon=mix(horizon,vec3(.040,.058,.104),uNight);',
    'zenith=mix(zenith,vec3(.010,.020,.052),uNight);horizon=mix(horizon,vec3(.040,.058,.104),uNight*uNight);')
# Alacakaranlik imzasi: yalniz 0<uNight<1 ve toz yokken. uNight=0 ve =1'de sifir.
rep('zenith=mix(zenith,vec3(.29,.23,.16),uDust);horizon=mix(horizon,vec3(.63,.51,.34),uDust);',
    'zenith=mix(zenith,vec3(.29,.23,.16),uDust);horizon=mix(horizon,vec3(.63,.51,.34),uDust);'
    'float dusk=uNight*(1.0-uNight)*(1.0-uDust);zenith+=vec3(.08,0.0,.35)*dusk;horizon+=vec3(1.05,.18,0.0)*dusk;')
# Gunbatimi kizilligi tam gecede yine soner, ara degerde kalir.
rep('col+=vec3(1.0,.65,.32)*pow(s,12.0)*.32*uSunset*(1.0-uNight);',
    'col+=vec3(1.0,.65,.32)*pow(s,12.0)*.32*uSunset*(1.0-uNight*uNight);')
# Gunes diski: ara degerde turuncu kalir (4. kuvvet), tam gecede yine ay.
rep('col+=mix(vec3(1.0,.86,.62),vec3(.72,.80,.95),uNight)*pow(s,800.0)*mix(1.5,1.05,uNight)*(1.0-uDust*.75);',
    'col+=mix(vec3(1.0,.86,.62),vec3(.72,.80,.95),uNight*uNight*uNight*uNight)*pow(s,800.0)*mix(1.5,1.05,uNight*uNight*uNight*uNight)*(1.0-uDust*.75);')
# Bulutlar ara degerde gece kadar kararmasin.
rep('shadow=mix(shadow,vec3(.030,.042,.070),uNight);',
    'shadow=mix(shadow,vec3(.030,.042,.070),uNight*uNight);')
rep('col=mix(col,cloudCol,cloud*.93*(1.0-uNight*.55));',
    'col=mix(col,cloudCol,cloud*.93*(1.0-uNight*uNight*.55));')
rep('col=mix(col,vec3(.86,.85,.81),wisps*.26*(1.0-uNight*.7));',
    'col=mix(col,vec3(.86,.85,.81),wisps*.26*(1.0-uNight*uNight*.7));')
# Yildizlar yalniz derin gecede; alacakaranlikta belirmez. uNight=1'de katsayi 1 (ayni).
rep('col+=vec3(.86,.90,1.0)*st*uNight*2.2;',
    'col+=vec3(.86,.90,1.0)*st*smoothstep(.62,1.0,uNight)*2.2;')

# ---------------------------------------------------------------- 2) deniz: ara deger sicakligi
rep('reflectSky=mix(reflectSky,vec3(.045,.070,.125),uNight);',
    'reflectSky=mix(reflectSky,vec3(.045,.070,.125),uNight*uNight);reflectSky+=vec3(.55,.12,0.0)*uNight*(1.0-uNight)*(1.0-uDust);')
rep('hazeCol=mix(hazeCol,vec3(.045,.062,.100),uNight);',
    'hazeCol=mix(hazeCol,vec3(.045,.062,.100),uNight*uNight);hazeCol+=vec3(.28,.06,0.0)*uNight*(1.0-uNight)*(1.0-uDust);')
rep('col+=vec3(1.,.78,.43)*spec*2.6*(1.0-uNight*.82);',
    'col+=vec3(1.,.78,.43)*spec*2.6*(1.0-uNight*uNight*.82);')
rep('col+=vec3(1.,.9,.66)*glit*4.2*(1.0-uNight*.9);',
    'col+=vec3(1.,.9,.66)*glit*4.2*(1.0-uNight*uNight*.9);')

# ---------------------------------------------------------------- 3) isik tablosu + studyo yansimasi
# environmentIntensity: RoomEnvironment .82 gunduz tabanidir. Gece dusmezse
# metal uçak studyo isiginda kalir, gokyuzu kararirken dunya gunduz gorunur.
OLD = (
    'const A={"gece":{n:1,d:0,sc:"#7090c8",si:.55,hs:"#16243c",hg:"#080d16",hi:.42,fc:"#22365a",fi:.30,gc:"#0d1522",gd:3e-5},'
    '"alacakaranlık":{n:.42,d:0,sc:"#ff8f4d",si:2.3,hs:"#6a4a6a",hg:"#2a2038",hi:1.15,fc:"#7a5a72",fi:.85,gc:"#7a5f6a",gd:4e-5},'
    '"tozlu":{n:0,d:1,sc:"#d9b273",si:2.6,hs:"#c9ae7d",hg:"#6a5a3a",hi:2.1,fc:"#b08f5a",fi:.95,gc:"#b39a6d",gd:1.6e-4}}[this.atmo];'
)
NEW = (
    'const A={"gece":{n:1,d:0,sc:"#8eb4dc",si:1.7,hs:"#5c7eae",hg:"#1a2433",hi:1.85,fc:"#7f9cc4",fi:.72,gc:"#121c2e",gd:3.5e-5,ei:.28},'
    '"alacakaranlık":{n:.78,d:0,sc:"#ff6a2e",si:2.15,hs:"#b09098",hg:"#3a2838",hi:1.7,fc:"#e09070",fi:.7,gc:"#8a5c58",gd:5.5e-5,ei:.45},'
    '"tozlu":{n:0,d:1,sc:"#d9b273",si:2.6,hs:"#c9ae7d",hg:"#6a5a3a",hi:2.1,fc:"#b08f5a",fi:.95,gc:"#b39a6d",gd:1.6e-4,ei:.82}}[this.atmo];'
)
rep(OLD, NEW)
rep('this.sceneE&&this.sceneE.fog&&(this.sceneE.fog.color.set(A.gc),this.sceneE.fog.density=A.gd);}',
    'this.sceneE&&this.sceneE.fog&&(this.sceneE.fog.color.set(A.gc),this.sceneE.fog.density=A.gd);this.sceneE&&(this.sceneE.environmentIntensity=A.ei);}')
rep('this.fill&&(this.fill.color.set("#82c1e8"),this.fill.intensity=1.15);}',
    'this.fill&&(this.fill.color.set("#82c1e8"),this.fill.intensity=1.15);this.sceneE&&(this.sceneE.environmentIntensity=.82);}')

rep('3.80 DEV', '3.81 DEV', 2)

open(P, 'w', encoding='utf-8').write(s)
print('v96 ok · atmosfer kalibrasyonu · boyut:', len(s))
