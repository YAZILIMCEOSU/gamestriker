# -*- coding: utf-8 -*-
# =============================================================================
# v3.85 -> v3.86 : gorev 1 pusu dalgasi
# -----------------------------------------------------------------------------
# Olcum (asistan + top + fuze, 150 sn, normal):
#   FIRST STRIKE 4 hedefi t=40'ta bitiriyor, can 100.
#   t=38'den itibaren her goreve 3 pusu (ambush/heavy/swarm) yaziliyor.
#   Cikis yalniz t>=140 ve gokyuzu bos ise. Pusu geldigi icin gorev bitmiyor.
#   Can 150 sn'de 21'e iniyor, hala 5 ucak ayakta.
#   Twist "90 sn takviye" surpriseTick icinde `a` okuyor; `a` yok, gorev cokuyor.
# Kolay (tier 0): pusu yok, hedefler bitince donus.
# Orta: 1 drone/ikmal, gec baslar. Zor ve sonrasi eski takvim.
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


rep(
    'const tier=Math.min(3,Math.floor(id/48));const n=3+tier;const pool=["ambush","swarm","heavy","swarm","ambush","heavy"];\nthis.sched=[];let t=this.time+38+rnd()*12;',
    'const camp=this.mission.tier!=null?this.mission.tier:0,legacy=3+Math.min(3,Math.floor(id/48)),n=camp<1?0:camp<2?1:legacy,pool=camp<2?["swarm","supply"]:["ambush","swarm","heavy","swarm","ambush","heavy"];\nthis.sched=[];let t=this.time+(camp<2?95:38)+rnd()*12;'
)
rep(
    'this.reinfT=(this.reinfT||0)+a;if(this.reinfT>=90)',
    'this.reinfT=(this.reinfT||0)+dt;if(this.reinfT>=90)'
)
rep(
    'this.alive.length===0&&!["race","chain","waves"].includes(this.mission.kind)&&(this.ext||this.time>=140||this.mission.kind==="escort")',
    'this.alive.length===0&&!["race","chain","waves"].includes(this.mission.kind)&&(this.ext||this.time>=140||this.mission.kind==="escort"||(this.mission.tier||0)<1)'
)
rep('3.85 DEV', '3.86 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v101 ok · gorev 1 pusu · boyut:', len(s))
