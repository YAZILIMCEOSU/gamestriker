# -*- coding: utf-8 -*-
# =============================================================================
# v3.79 -> v3.80 : FAZ 2b - GECE / ALACAKARANLIK / TOZLU icin GERCEK GORSEL
# -----------------------------------------------------------------------------
# SORUN (v3.79'da olculdu, --world ciktisi):
#   planin 8 havasindan 3'unun motorda karsiligi yoktu, kayipli eslenmisti:
#       gece           -> motor 0 (acik)  + sunset=1
#       alacakaranlik  -> motor 0 (acik)  + sunset=1   (gece ile AYNI gorunum)
#       tozlu          -> motor 2 (sisli)              (gri sisle ayni)
#   Yani "gece gorevi" verisi vardi ama ekranda gunduz+gunbatimiydi.
#
# COZUM: shader'lara uNight / uDust (0..1) uniform'lari eklendi + isik/sis
#        profili. Atmosfer, mevcut 5 hava indeksine DOKUNMAZ:
#        uNight=uDust=0 iken shader matematigi v3.79 ile birebir aynidir,
#        dolayisiyla acik/sisli/yagmurlu/karli/firtinali'da regresyon riski yok.
#
# OKUNAN TABAN CIZGISI (yamadan once, kaynaktan):
#   this.sun = new rx("#ffe1b9", 3.9)                    -> DirectionalLight, golgeli
#   e.add(new _T("#c8e2f5","#263943",2.8))               -> HemisphereLight (this'e bagli DEGILDI)
#   const o = new rx("#82c1e8",1.15); e.add(o)           -> dolgu isigi   (this'e bagli DEGILDI)
#   sun.intensity HIC kullanilmamisti -> serbest.
#   Iki isik da this'e baglanmadan atilmis; gece karartmasi icin sart,
#   yoksa hemi@2.8 sahneyi aydinlik birakirdi. Bu yuzden asagida ikisi de
#   this.hemi / this.fill olarak saklaniyor.
#
# DOGRULAMA: node --check + @shaderfrog/glsl-parser ile 14 fragment shader
#            ayristirma + tools/diag --atmos (uniform/tanim tutarliligi)
# =============================================================================
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')

s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:100])
    s = s.replace(old, new)


# ---------------------------------------------------------------- 1) isiklari this'e bagla
# HemisphereLight: gece karartmasinin en buyuk kaldiraci (ambient 2.8).
rep('e.add(new _T("#c8e2f5","#263943",2.8)),this.sun=new rx("#ffe1b9",3.9)',
    'this.hemi=new _T("#c8e2f5","#263943",2.8),e.add(this.hemi),this.sun=new rx("#ffe1b9",3.9)')
# Dolgu isigi
rep('o.position.set(-60,20,0),e.add(o),this.skyMaterial=',
    'o.position.set(-60,20,0),this.fill=o,e.add(o),this.skyMaterial=')

# ---------------------------------------------------------------- 2) uniform tanimlari
# Bu nesne hem sky hem sea material'de birebir ayni metin -> 2 kez degisir.
rep('uniforms:{uTime:{value:0},uSunset:{value:1}}',
    'uniforms:{uTime:{value:0},uSunset:{value:1},uNight:{value:0},uDust:{value:0}}', 2)

rep('varying vec3 vDirection; uniform float uTime; uniform float uSunset;',
    'varying vec3 vDirection; uniform float uTime; uniform float uSunset; uniform float uNight; uniform float uDust;')
rep('varying vec3 vWorld; uniform float uTime; uniform float uSunset;',
    'varying vec3 vWorld; uniform float uTime; uniform float uSunset; uniform float uNight; uniform float uDust;')

# ---------------------------------------------------------------- 3) SKY: gece + toz rengi
rep('vec3 horizon=mix(vec3(.7,.79,.81),vec3(.82,.66,.48),uSunset);',
    'vec3 horizon=mix(vec3(.7,.79,.81),vec3(.82,.66,.48),uSunset);'
    'zenith=mix(zenith,vec3(.010,.020,.052),uNight);'
    'horizon=mix(horizon,vec3(.040,.058,.104),uNight);'
    'zenith=mix(zenith,vec3(.29,.23,.16),uDust);'
    'horizon=mix(horizon,vec3(.63,.51,.34),uDust);')

# gun batimi kizilligi gece kaybolur
rep('col+=vec3(1.0,.65,.32)*pow(s,12.0)*.32*uSunset;',
    'col+=vec3(1.0,.65,.32)*pow(s,12.0)*.32*uSunset*(1.0-uNight);')
# gunes diski -> gece ay (soguk beyaz, soluk), tozda gorunmez
rep('col+=vec3(1.0,.86,.62)*pow(s,800.0)*1.5;',
    'col+=mix(vec3(1.0,.86,.62),vec3(.72,.80,.95),uNight)*pow(s,800.0)*mix(1.5,1.05,uNight)*(1.0-uDust*.75);')

# bulutlar gece kararir, tozda isinir; parlaklik dusur
rep('vec3 shadow=mix(vec3(.49,.61,.68),vec3(.38,.45,.48),uSunset);',
    'vec3 shadow=mix(vec3(.49,.61,.68),vec3(.38,.45,.48),uSunset);'
    'shadow=mix(shadow,vec3(.030,.042,.070),uNight);'
    'shadow=mix(shadow,vec3(.30,.25,.18),uDust);')
rep('col=mix(col,cloudCol,cloud*.93);',
    'col=mix(col,cloudCol,cloud*.93*(1.0-uNight*.55));')

# ince bulut katmani + yildiz alani (yalniz gece, yalniz ufkun ustunde)
rep('col=mix(col,vec3(.86,.85,.81),wisps*.26);',
    'col=mix(col,vec3(.86,.85,.81),wisps*.26*(1.0-uNight*.7));'
    'if(uNight>0.001){'
    'vec3 sp=dir*230.0;vec3 ip=floor(sp);vec3 fp=fract(sp);'
    'float hs=fract(sin(dot(ip,vec3(12.9898,78.233,37.719)))*43758.5453);'
    'float st=smoothstep(.9975,1.0,hs)*pow(max(1.0-length(fp-.5)*2.0,0.0),3.0);'
    'col+=vec3(.86,.90,1.0)*st*uNight*2.2;}')

# ---------------------------------------------------------------- 4) SEA: gece + toz rengi
rep('vec3 deep=vec3(.025,.14,.185);vec3 shallow=vec3(.085,.255,.295);',
    'vec3 deep=vec3(.025,.14,.185);vec3 shallow=vec3(.085,.255,.295);'
    'deep=mix(deep,vec3(.005,.017,.038),uNight);'
    'shallow=mix(shallow,vec3(.016,.045,.075),uNight);'
    'deep=mix(deep,vec3(.055,.062,.045),uDust);'
    'shallow=mix(shallow,vec3(.13,.135,.085),uDust);')
rep('vec3 reflectSky=mix(vec3(.33,.53,.61),vec3(.52,.52,.45),uSunset);',
    'vec3 reflectSky=mix(vec3(.33,.53,.61),vec3(.52,.52,.45),uSunset);'
    'reflectSky=mix(reflectSky,vec3(.045,.070,.125),uNight);'
    'reflectSky=mix(reflectSky,vec3(.55,.46,.32),uDust);')
rep('col+=vec3(1.,.78,.43)*spec*2.6;',
    'col+=vec3(1.,.78,.43)*spec*2.6*(1.0-uNight*.82);')
rep('float glit=pow(max(dot(reflect(-sun,normal),view),0.0),900.0);col+=vec3(1.,.9,.66)*glit*4.2;',
    'float glit=pow(max(dot(reflect(-sun,normal),view),0.0),900.0);col+=vec3(1.,.9,.66)*glit*4.2*(1.0-uNight*.9);')
rep('col=mix(col,mix(vec3(.58,.71,.77),vec3(.66,.66,.6),uSunset),haze);',
    'vec3 hazeCol=mix(vec3(.58,.71,.77),vec3(.66,.66,.6),uSunset);'
    'hazeCol=mix(hazeCol,vec3(.045,.062,.100),uNight);'
    'hazeCol=mix(hazeCol,vec3(.60,.50,.35),uDust);'
    'col=mix(col,hazeCol,clamp(haze*(1.0+uDust*1.6),0.0,1.0));')

# ---------------------------------------------------------------- 5) setAtmosphere()
ATMO = (
    "setAtmosphere(k){"
    "this.atmo=k||\"\";"
    "const A={\"gece\":{n:1,d:0,sc:\"#7090c8\",si:.55,hs:\"#16243c\",hg:\"#080d16\",hi:.42,fc:\"#22365a\",fi:.30,gc:\"#0d1522\",gd:3e-5},"
    "\"alacakaranl\u0131k\":{n:.42,d:0,sc:\"#ff8f4d\",si:2.3,hs:\"#6a4a6a\",hg:\"#2a2038\",hi:1.15,fc:\"#7a5a72\",fi:.85,gc:\"#7a5f6a\",gd:4e-5},"
    "\"tozlu\":{n:0,d:1,sc:\"#d9b273\",si:2.6,hs:\"#c9ae7d\",hg:\"#6a5a3a\",hi:2.1,fc:\"#b08f5a\",fi:.95,gc:\"#b39a6d\",gd:1.6e-4}}"
    "[this.atmo];"
    "const n=A?A.n:0,d=A?A.d:0;"
    "this.skyMaterial.uniforms.uNight.value=n;this.skyMaterial.uniforms.uDust.value=d;"
    "this.seaMaterial.uniforms.uNight.value=n;this.seaMaterial.uniforms.uDust.value=d;"
    "if(A){this.sun.color.set(A.sc);this.sun.intensity=A.si;"
    "this.hemi&&(this.hemi.color.set(A.hs),this.hemi.groundColor.set(A.hg),this.hemi.intensity=A.hi);"
    "this.fill&&(this.fill.color.set(A.fc),this.fill.intensity=A.fi);"
    "this.sceneE&&this.sceneE.fog&&(this.sceneE.fog.color.set(A.gc),this.sceneE.fog.density=A.gd);}"
    "else{this.sun.intensity=3.9;"
    "this.hemi&&(this.hemi.color.set(\"#c8e2f5\"),this.hemi.groundColor.set(\"#263943\"),this.hemi.intensity=2.8);"
    "this.fill&&(this.fill.color.set(\"#82c1e8\"),this.fill.intensity=1.15);}"
    "}"
)
rep('setWeather(e){this.weatherN=e;', ATMO + 'setWeather(e){this.weatherN=e;')

# ---------------------------------------------------------------- 6) cagirma noktalari
# begin(): setSunset -> setWeather -> setAtmosphere sirasi; en son bu kazanir.
rep('this.environment.setWeather(e.mission.weather||0),',
    'this.environment.setWeather(e.mission.weather||0),this.environment.setAtmosphere(e.mission.weatherKey||""),')
# setMode: hangar/menu'ye donuste atmosfer sifirlanmazsa gece tonu hangarda kalirdi.
rep('e!=="game"&&this.environment.setSunset(!0),',
    'e!=="game"&&(this.environment.setSunset(!0),this.environment.setAtmosphere("")),')

# ---------------------------------------------------------------- 7) rozet
s = s.replace('3.79 DEV', '3.80 DEV')

open(P, 'w', encoding='utf-8').write(s)
print('v95 ok · gece/alacakaranlık/tozlu atmosferi bağlandı · boyut:', len(s))
