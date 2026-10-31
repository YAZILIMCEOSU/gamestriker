# -*- coding: utf-8 -*-
# =============================================================================
# v3.81 -> v3.82 : FAZ 3 — twist kurallari motora baglanir
# -----------------------------------------------------------------------------
# v3.79 twist metnini goreve yazdi, hicbir sistem okumadi (kaynak: .twist
# yalniz atamada gecer). Brifing "yakit 3 kat hizli" diyordu, motor uygulamadi.
#
# Her kural mevcut bir kancaya baglanir. twist eslesmezse ifade v3.81 ile
# birebir aynidir (ternary'nin else dali eski sabittir).
#
#   dusuk irtifa     -> yerden 260 m ustunde 4 hp/sn + burun asagi
#   90 sn takviye    -> combat'ta her 90 sn ambush cagri (2 interceptor)
#   yakit x3         -> fuel drain * 3 (0'da zaten finish fuel)
#   radar kapali     -> radar listesi bos, kilit menzili 2900->1450, isaret 12->3.5 km
#   sis gorus yari   -> fog.density * 2, isaret/kilit menzili yariya
#   hedef kacar      -> ilk dusman combat'ta kacar; 3200 m'de gorev "escaped"
#   yalniz fuze      -> gun mermisi hasar uygulamaz
#   kanat sensoru    -> kilit konisi .53 rad -> .10 rad (burun ustunde nişan)
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()

T = {
    'low': 'Yalnızca düşük irtifada uçuş',
    'reinf': 'Düşman her 90 saniyede takviye gönderir',
    'fuel': 'Yakıt üç katı hızlı tükenir',
    'radar': 'Radar kapalı, hedefler gözle bulunur',
    'fog': 'Sis perdesi görüşü yarıya indirir',
    'flee': 'Bir hedef saldırı sırasında kaçar',
    'missile': 'Yalnızca füze ile vurulabilir hedefler',
    'sensor': 'Kanat sensörü arızalı, manuel nişan',
}


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:110])
    s = s.replace(old, new)


# ---------------------------------------------------------------- yakit
rep('this.fuel=Math.max(0,this.fuel-a*(96/this.mission.limit))',
    'this.fuel=Math.max(0,this.fuel-a*(96/this.mission.limit)*(this.mission.twist==="%s"?3:1))' % T['fuel'])

# ---------------------------------------------------------------- kilit konisi + menzil
rep('g=d&&this.targetDistance<2900&&Math.abs(this.targetBearing)<.53&&Math.abs(p)<.5',
    'g=d&&this.targetDistance<(this.mission.twist==="%s"||this.mission.twist==="%s"?1450:2900)&&Math.abs(this.targetBearing)<(this.mission.twist==="%s"?.1:.53)&&Math.abs(p)<.5'
    % (T['radar'], T['fog'], T['sensor']))

# ---------------------------------------------------------------- yalniz fuze: gun hasari yok
rep('else for(const a of this.entities)if(a.hp>0&&kp(a.position,n.previous,n.position)<a.radius+(n.kind==="bomb"?20:3)){this.hitParts(a,n)||this.damageEnemy(a,n.damage)',
    'else for(const a of this.entities)if(a.hp>0&&!(n.kind==="gun"&&this.mission.twist==="%s")&&kp(a.position,n.previous,n.position)<a.radius+(n.kind==="bomb"?20:3)){this.hitParts(a,n)||this.damageEnemy(a,n.damage)'
    % T['missile'])

# ---------------------------------------------------------------- dusuk irtifa (yerden 260 m)
rep('this.player.y>2e3&&(this.player.y=2e3)',
    'this.player.y>2e3&&(this.player.y=2e3),this.mission.twist==="%s"&&this.player.y-this.terr(this.player.x,this.player.z)>260&&(this.health-=a*4,this.pitch=Math.min(this.pitch,-.06),this.shake=Math.min(.4,this.shake+.02))'
    % T['low'])

# ---------------------------------------------------------------- 90 sn takviye (update kapanmadan, a kapsaminda)
rep('this.fireSurprise(ev.k,this.schedI)}\n}',
    'this.fireSurprise(ev.k,this.schedI)}\n'
    'if(this.mission.twist==="%s"&&this.phase==="combat"&&!this.result){this.reinfT=(this.reinfT||0)+a;if(this.reinfT>=90){this.reinfT-=90;this.fireSurprise("ambush",80+(this.reinfN=(this.reinfN||0)+1))}}\n}'
    % T['reinf'])

# ---------------------------------------------------------------- kacan hedef
rep('updateEnemies(e){for(const n of this.entities){if(!n.hp||n.friendly)continue;',
    'updateEnemies(e){if(this.mission.twist==="%s"&&this.phase==="combat"&&!this.escaperSet){this.escaperSet=1;const __t=this.entities.find(n=>n.hp>0&&!n.friendly);__t&&(__t.flee=1)}'
    'for(const n of this.entities){if(n.flee&&n.hp>0){n.origin||(n.origin=n.position.clone());const dx=n.position.x-this.player.x,dz=n.position.z-this.player.z,L=Math.hypot(dx,dz)||1;n.position.x+=dx/L*75*e;n.position.z+=dz/L*75*e;n.position.distanceTo(n.origin)>3200&&(n.hp=0,this.finish(!1,"escaped"));continue}'
    'if(!n.hp||n.friendly)continue;' % T['flee'])

# ---------------------------------------------------------------- sis: yogunluk x2 (setAtmosphere'ten sonra, o kazanmasin diye)
rep('this.environment.setAtmosphere(e.mission.weatherKey||"")',
    'this.environment.setAtmosphere(e.mission.weatherKey||""),e.mission.twist==="%s"&&this.environment.sceneE&&this.environment.sceneE.fog&&(this.environment.sceneE.fog.density*=2)'
    % T['fog'])

# ---------------------------------------------------------------- radar listesi + isaret menzili
rep('radar:s.alive.map',
    'radar:s.mission.twist==="%s"?[]:s.alive.map' % T['radar'])
rep('markers(e){this.camera.updateMatrixWorld();',
    'markers(e){const __vis=e.mission&&e.mission.twist==="%s"?3500:e.mission&&e.mission.twist==="%s"?6000:12000;this.camera.updateMatrixWorld();'
    % (T['radar'], T['fog']))
rep('m.distance<12000', 'm.distance<__vis', 2)

# ---------------------------------------------------------------- kacis sonucu metni (10 dil, timeout ile ayni sira)
rep('timeout:["Mission time expired.","Görev süresi doldu."',
    'escaped:["A target escaped.","Bir hedef kaçtı.","Ein Ziel ist entkommen.","Un objetivo escapó.","Une cible s\'est échappée.","Un bersaglio è fuggito.","Um alvo escapou.","Цель сбежала.","Satu target lolos.","أفلت هدف."],timeout:["Mission time expired.","Görev süresi doldu."')

rep('3.81 DEV', '3.82 DEV', 2)

open(P, 'w', encoding='utf-8').write(s)
print('v97 ok · twist kurallari baglandi · boyut:', len(s))
