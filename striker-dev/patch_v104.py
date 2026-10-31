# -*- coding: utf-8 -*-
# =============================================================================
# v3.88 -> v3.89 : adacık kenarında çarpma (P1)
# -----------------------------------------------------------------------------
# Ölçüm (düşman susturulmuş, görev 36, seviye uçuş y=140 hız 220):
#   pad zemini 31–57, kenar 245–477. Açıklık 8. 8 sn'de 45–60 gövde.
#   Konum kilitlenmedi; kaçış hızı düşmedi. Duvar, pad'in tepeyi oyup
#   içini alçaltmasından. İleri bakış iki alçak örnek arasında kenarı kaçırıyor.
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:80])
    s = s.replace(old, new)


# Pad yalnızca alçak zemini yükseltsin; tepeyi oyup krater duvarı bırakmasın.
rep('t=q[3]+(t-q[3])*s2', 't<q[3]&&(t=q[3]+(t-q[3])*s2)')
rep('F=q[3]+(F-q[3])*s2', 'F<q[3]&&(F=q[3]+(F-q[3])*s2)', 2)
# Kara hedef oyuğun dibinde kalmasın.
rep(
    'const gy=lk?LP[3]+1.5:lb2?Math.max(3,this.terr(d,p)+1.5):g',
    'const gy=lk?Math.max(LP[3]+1.5,this.terr(d,p)+1.5):lb2?Math.max(3,this.terr(d,p)+1.5):g',
)
# Otomatik pilot yer hedefini 200 m'de bırakıp yamaca girmesin.
rep(
    'this.target?.airborne?Math.max(150,Math.min(700,this.target.position.y)):200',
    'this.target?.airborne?Math.max(150,Math.min(700,this.target.position.y)):Math.max(200,Math.min(900,(this.target?.position.y||0)+120))',
)
# İnce kenar 4 örnekte kayboluyordu. 16 m'de bir bak.
rep(
    'lk=Math.max(350,this.speed*2.2);let need=0;for(const dd of[lk*.35,lk*.7,lk,lk*1.4]){const tg=Math.max(0,this.terr(this.player.x+fxn*dd,this.player.z+fzn*dd));need=Math.max(need,tg+110-this.player.y)}',
    'lk=Math.max(420,this.speed*2.6);let need=0;for(let dd=16;dd<=lk*1.35;dd+=16){const tg=Math.max(0,this.terr(this.player.x+fxn*dd,this.player.z+fzn*dd));if(tg+110-this.player.y>need)need=tg+110-this.player.y}',
)
rep('3.88 DEV', '3.89 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v104 ok · adacık · boyut:', len(s))
