# -*- coding: utf-8 -*-
# =============================================================================
# v3.82 -> v3.83 : mobil kampanya zorluk egrisi (205 gorev)
# -----------------------------------------------------------------------------
# OLCUM (kaynak):
#   Her goreve TM=8+id%3 kara hedefi ZORLA ekleniyor, sonra yalniz id<=20
#   8'e kirpiliyor. Bolum 21+ 15-25 hedef. HP tabani *1.6 *sezon *id.
#   Ilk gorev bile mobil/tablet seansina sigmiyor.
#   Zorluk dugmesi e1-e5 jargon; kampanya konumu zorlugu tasimiyor.
#
# EGRi (gorev id, oyuncu ayarindan bagimsiz):
#   0-11   kolay   4 hedef  hp .48  ates yavas  gelen hasar .55  yildiz esigi %40
#   12-35  orta    6        hp .68  ...
#   36-79  zor     8        hp .88
#   80-143 uzman   11       hp 1.05
#   144-191 as     13       hp 1.22
#   192-204 ozel   yazarin listesi korunur, as olcegi
# Oyuncu e1-e5 carpani duruyor (Kolay..As etiketli).
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:100])
    s = s.replace(old, new)


CURVE = r'''dn.forEach(m=>{const id=m.id||0,tier=id>=192?4:id<12?0:id<36?1:id<80?2:id<144?3:4;m.tier=tier;m.hpScale=[.48,.68,.88,1.05,1.22][tier];m.fireScale=[1.55,1.25,1.05,.92,.78][tier];m.dmgScale=[.55,.75,.9,1,1.15][tier];if(!m.targets||["race","waves","recon"].includes(m.kind)||id>=192)return;const cap=[4,6,8,11,13][tier];if(m.targets.length>cap){const pri=["sam","radar","corvette","interceptor","bridge","destroyer","heli","refinery","attacker","sub","uav"],rest=m.targets.slice(),kept=[];for(const k of pri){const i=rest.indexOf(k);if(i>=0&&kept.length<cap)kept.push(rest.splice(i,1)[0])}while(kept.length<cap&&rest.length)kept.push(rest.shift());m.targets=kept}m.limit=Math.max(150,Math.round(m.limit*[.7,.82,.92,1,1.05][tier]));m.par=Math.round(m.limit*[.78,.68,.58,.5,.45][tier]);m.reward=Math.round((m.reward||400)*[.75,.9,1,1.12,1.3][tier]);if(m.briefing){const q={};for(const t of m.targets)q[t]=(q[t]||0)+1;const sm=Object.entries(q).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>v+" "+k.toUpperCase()).join(" \u00b7 ");m.briefing=m.briefing.map(t=>String(t).split(" \u25b7 ")[0]+" \u25b7 "+sm)}});'''

rep('m.targets=m.targets.slice(0,8)});function Ey(){',
    'm.targets=m.targets.slice(0,8)});' + CURVE + 'function Ey(){')

# dusman cani: kampanya olcegi * mevcut di carpani
rep('*[.85,1,1.2,1.45,1.75][this.di]*1.6*(1+(e.season||0)*.18)*(1+((e.id||0)%48)/48*.28)',
    '*[.85,1,1.2,1.45,1.75][this.di]*(e.hpScale||1)*1.6*(1+(e.season||0)*.18)*(1+((e.id||0)%48)/48*.28)')

# ates araligi: kolayda daha seyrek
rep('*(n.kind==="drone"?.55:n.kind==="uav"?.5:n.kind==="heli"?.85:1),this.temp.copy(this.player)',
    '*(n.kind==="drone"?.55:n.kind==="uav"?.5:n.kind==="heli"?.85:1)*(this.mission.fireScale||1),this.temp.copy(this.player)')

# gelen hasar
rep('this.health=Math.max(0,this.health-n.damage)',
    'this.health=Math.max(0,this.health-n.damage*(this.mission.dmgScale||1))')

# yildiz: erken bolumde %40 can yeter
rep('const a=e?1+(this.healthPercent>=60?1:0)+(this.time<=this.mission.par?1:0):0',
    'const a=e?1+(this.healthPercent>=(this.mission.tier<1?40:this.mission.tier<2?50:60)?1:0)+(this.time<=this.mission.par?1:0):0')

# kart rozeti + ayar etiketi
rep('biome0:["SEA BASE","DENİZ ÜSSÜ"',
    'tier0:["EASY","KOLAY","LEICHT","FÁCIL","FACILE","FACILE","FÁCIL","ЛЕГКО","MUDAH","سهل"],'
    'tier1:["MEDIUM","ORTA","MITTEL","MEDIO","MOYEN","MEDIO","MÉDIO","СРЕДНЕ","SEDANG","متوسط"],'
    'tier2:["HARD","ZOR","SCHWER","DIFÍCIL","DIFFICILE","DIFFICILE","DIFÍCIL","СЛОЖНО","SULIT","صعب"],'
    'tier3:["EXPERT","UZMAN","EXPERTE","EXPERTO","EXPERT","ESPERTO","ESPECIALISTA","ЭКСПЕРТ","AHLI","خبير"],'
    'tier4:["ACE","AS","ASS","AS","AS","ASSO","ÁS","АС","AS","بطل"],'
    'biome0:["SEA BASE","DENİZ ÜSSÜ"')

rep('S.jsx("span",{className:"mission-biome",children:c("biome"+(u.biome||0))})',
    'S.jsx("span",{className:"mission-biome",children:c("biome"+(u.biome||0))}),S.jsx("span",{className:"mission-tier t"+(u.tier||0),children:c("tier"+(u.tier||0))})')

rep('.mission-biome{position:absolute;left:10px;bottom:10px;',
    '.mission-tier{position:absolute;right:8px;top:8px;font-size:9px;font-weight:800;letter-spacing:.12em;padding:2px 6px;border-radius:3px;background:#163024;color:#b7f0c8}'
    '.mission-tier.t1{background:#163044;color:#b9d7f5}.mission-tier.t2{background:#3a3014;color:#f0d48a}'
    '.mission-tier.t3{background:#3a2414;color:#f0b48a}.mission-tier.t4{background:#3a1614;color:#f0a49a}'
    '.mission-biome{position:absolute;left:10px;bottom:10px;')

rep('onClick:()=>e({difficulty:a}),children:a.toUpperCase()',
    'onClick:()=>e({difficulty:a}),children:n(["tier0","tier1","tier2","tier3","tier4"]["e1e2e3e4e5".indexOf(a)/2])')

rep('3.82 DEV', '3.83 DEV', 2)

open(P, 'w', encoding='utf-8').write(s)
print('v98 ok · kampanya egrisi · boyut:', len(s))
