# -*- coding: utf-8 -*-
# =============================================================================
# v3.90 -> v3.91 : deniz hedefi ekranda ayirt edilir (P6 / Faz 5)
# -----------------------------------------------------------------------------
# Radar: hava ucgen, kara ve deniz ayni turuncu kare. Dalmis denizalti
# y=-16, kilitlenemez, ama radar'da kara hedef gibi duruyor.
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
    'id:n.id,wy:n.position.y,kind:n.kind,',
    'id:n.id,wy:n.position.y,kind:n.kind,sea:!n.friendly&&["corvette","destroyer","sub","port"].includes(n.kind),submerged:n.kind==="sub"&&!n.surf,',
)
rep(
    'airborne:n.airborne,selected:s.targetId===n.id,d:Math.round(Math.hypot(a,o))',
    'airborne:n.airborne,sea:["corvette","destroyer","sub","port"].includes(n.kind),sub:n.kind==="sub"&&!n.surf,selected:s.targetId===n.id,d:Math.round(Math.hypot(a,o))',
)
rep(
    'fill:b.selected?"#afffd2":"#ecaa79",children:[b.airborne?S.jsx("path",{d:"M0-4l4 7h-8Z"}):S.jsx("rect",{x:"-2.4",y:"-2.4",width:"4.8",height:"4.8"})',
    'fill:b.selected?"#afffd2":b.sea?"#7ee0ff":"#ecaa79",children:[b.sub?S.jsx("circle",{r:"3.2",fill:"none",stroke:"#7ee0ff",strokeWidth:"1.2"}):b.airborne?S.jsx("path",{d:"M0-4l4 7h-8Z"}):b.sea?S.jsx("path",{d:"M0-4.2l3.4 4.2-3.4 4.2-3.4-4.2Z"}):S.jsx("rect",{x:"-2.4",y:"-2.4",width:"4.8",height:"4.8"})',
)
rep(
    'className:"radar-dist",transform:`rotate(${-an})`,y:"11"',
    'className:`radar-dist${b.sea?" sea":""}`,transform:`rotate(${-an})`,y:"11"',
)
rep(
    'className:`target-marker ${b.selected?"primary-target":""} ${b.selected&&e.lock>=1?"is-locked":""}`',
    'className:`target-marker ${b.selected?"primary-target":""} ${b.selected&&e.lock>=1?"is-locked":""} ${b.sea?"sea-mark":""} ${b.submerged?"sub-mark":""}`',
)
rep(
    'borderBottom:"14px solid #e8a33d"',
    'borderBottom:`14px solid ${b.sea?"#7ee0ff":"#e8a33d"}`',
)
rep(
    'color:"#ffd9a0",textShadow:"0 1px 3px #000",letterSpacing:".08em"},children:`${(b.distance/1000).toFixed(1)} KM`',
    'color:b.sea?"#9ee7ff":"#ffd9a0",textShadow:"0 1px 3px #000",letterSpacing:".08em"},children:`${b.sea?({corvette:"COR",destroyer:"DST",sub:"SUB",port:"PRT"}[b.kind]||"SEA")+" ":""}${(b.distance/1000).toFixed(1)} KM`',
)
rep(
    '.target-marker.primary-target{width:68px;height:68px;color:var(--hud)}',
    '.target-marker.primary-target{width:68px;height:68px;color:var(--hud)}.target-marker.sea-mark{color:#7ee0ff}.target-marker.sub-mark{color:#9fdfff}.target-marker.sub-mark>i{border-style:dashed}',
)
rep(
    '.radar-dist{font-family:var(--mono);font-size:6.5px;fill:#ffb3a6;text-anchor:middle}',
    '.radar-dist{font-family:var(--mono);font-size:6.5px;fill:#ffb3a6;text-anchor:middle}.radar-dist.sea{fill:#9ee7ff}',
)
rep('3.90 DEV', '3.91 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v106 ok · deniz isaret · boyut:', len(s))
