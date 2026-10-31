# -*- coding: utf-8 -*-
# =============================================================================
# v3.89 -> v3.90 : alt HUD cakismasi (Faz 7)
# -----------------------------------------------------------------------------
# ROTA dugmesi altta ortada. Secili hedefin "KILITLENIYOR %" yazisi ve KM
# etiketi isaretin altina asiliyor; hedef alcakta veya telefonda ust seritte
# ise dugmenin ustune biniyor.
# Kilit yazisi rota satirina alindi. Isaret yalnizca bant disindayken tur adi
# tasiyor; mesafe zaten rota satirinda.
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
    'b.selected&&S.jsxs(S.Fragment,{children:[S.jsx("span",{className:"target-status",children:e.lock>=1?o("targetLocked"):`${o("tracking")} ${Math.round(e.lock*100)}%`}),S.jsx("svg",{className:"lock-progress",viewBox:"0 0 80 80",children:S.jsx("circle",{cx:"40",cy:"40",r:"37",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeDasharray:"233",strokeDashoffset:233*(1-e.lock)})})]}),b.selected&&S.jsxs("div",{className:"target-caption",children:[b.kind.toUpperCase(),S.jsx("br",{}),S.jsxs("b",{children:[(b.distance/1e3).toFixed(1)," KM"]}),S.jsx("em",{style:{width:`${b.hp*100}%`}})]})',
    'b.selected&&S.jsx("svg",{className:"lock-progress",viewBox:"0 0 80 80",children:S.jsx("circle",{cx:"40",cy:"40",r:"37",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeDasharray:"233",strokeDashoffset:233*(1-e.lock)})}),b.selected&&!(b.y>64||(typeof window!="undefined"&&window.innerWidth<=600&&b.y>8&&b.y<32))&&S.jsxs("div",{className:"target-caption",children:[b.kind.toUpperCase(),S.jsx("em",{style:{width:`${b.hp*100}%`}})]})',
)
rep(
    'S.jsxs("span",{children:[v?o("extraction"):Math.abs(e.bearing)>.4?o(e.bearing<0?"left":"right"):o("ahead")," ",S.jsxs("b",{children:[(e.distance/1e3).toFixed(1)," KM"]})]})',
    'S.jsxs("span",{className:"nav-readout",children:[v?o("extraction"):Math.abs(e.bearing)>.4?o(e.bearing<0?"left":"right"):o("ahead")," ",S.jsxs("b",{children:[(e.distance/1e3).toFixed(1)," KM"]}),!v&&S.jsx("i",{children:(_&&(_.y>64||(typeof window!="undefined"&&window.innerWidth<=600&&_.y>8&&_.y<32))?_.kind.toUpperCase()+" ":"")+(e.lock>=1?o("targetLocked"):`${o("tracking")} ${Math.round(e.lock*100)}%`)})]})',
)
rep(
    '.flight-navigation>span{letter-spacing:1.4px;font-size:8px}',
    '.flight-navigation>span{letter-spacing:1.4px;font-size:8px;white-space:nowrap}.flight-navigation>span>i{margin-left:8px;font-style:normal;color:#e8c9a0}',
)
rep('3.89 DEV', '3.90 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v105 ok · hud · boyut:', len(s))
