# -*- coding: utf-8 -*-
# =============================================================================
# v3.83 -> v3.84 : kolay/orta gorevler oyuncunun onune cekilir
# -----------------------------------------------------------------------------
# Olcum (v3.83 dogusu): gorev 0 en yakin hedef 3781 m. Kilit menzili 2900.
# Mobil ilk dakika bos ucus; asistan 20 sn'de kilit alamiyor.
# tier<2 hedefler 1000-1400 m one, deniz/kara ayrilarak tasinir.
# Uygun zemin bulunamazsa eski konum kalir.
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:90])
    s = s.replace(old, new)


# kurucu govdesi virgul zinciri. if deyimi zinciri kirar; ifade olarak baglanir.
rep(
    'boss:e.kind==="boss"&&u===0?1:0})})}mission;',
    'boss:e.kind==="boss"&&u===0?1:0})}),(this.mission.tier||0)<2&&this.entities.filter(q=>q.hp>0&&!q.friendly).forEach((q,i)=>{'
    'const pz=this.player.z,sea=["corvette","destroyer","sub","carrier","port"],ang=-.6+i*.28,base=this.mission.tier===0?1000:1400;'
    'let x=0,z=pz-base,ok=0,best=1e9;const wantSea=sea.includes(q.kind);'
    'for(let ia=-10;ia<=10;ia++)for(let id=0;id<18;id++){const d=(wantSea?900:1500)+id*130,a2=ang+ia*.12,xx=Math.sin(a2)*d,zz=pz-Math.cos(a2)*d,h=this.terr(xx,zz);'
    'if((wantSea?h<=1:!q.airborne?h>=5&&h<80:h<40)&&d<best){best=d;x=xx;z=zz;ok=1}}'
    'if(ok){const gy=q.airborne?(q.kind==="heli"?85:190):Math.max(8,this.terr(x,z)+2);'
    'q.position.set(x,gy,z);q.origin&&q.origin.set(x,gy,z)}})}mission;'
)
rep('3.83 DEV', '3.84 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v99 ok · yakin dogus · boyut:', len(s))
