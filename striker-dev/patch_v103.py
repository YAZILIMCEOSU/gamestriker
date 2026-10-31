# -*- coding: utf-8 -*-
# =============================================================================
# v3.87 -> v3.88 : hedef sayaci tek kaynak (Faz 6 / P6)
# -----------------------------------------------------------------------------
# Olcum: kart mission.targets.length. HUD targets:entities.length.
# Gorev 1: kart 4, HUD paydasi 5 (dost uçak gemisi 901 sayiliyor).
# Sonuc ekraninda hedef kirilimi yok.
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('BULUNAMADI/COKLU', c, old[:70])
    s = s.replace(old, new)


rep(
    'airborne:f,boss:e.kind==="boss"&&u===0?1:0})',
    'airborne:f,listed:1,boss:e.kind==="boss"&&u===0?1:0})',
)
rep(
    'kills:s.kills,targets:s.entities.length',
    'kills:s.entities.filter(n=>n.listed&&!(n.hp>0)).length,targets:(s.mission.targets||[]).length',
)
rep(
    'kills:this.kills,reason:n',
    'kills:this.kills,done:this.entities.filter(q=>q.listed&&!(q.hp>0)).length,goal:(this.mission.targets||[]).length,reason:n',
)
rep(
    'S.jsxs("div",{className:"result-numbers",children:[S.jsxs("div",{children:[S.jsx("strong",{children:s.score.toLocaleString()}),S.jsx("span",{children:u("score")})]})',
    'S.jsxs("div",{className:"result-numbers",children:[S.jsxs("div",{children:[S.jsx("strong",{children:(s.goal?s.done+"/"+s.goal:s.kills)}),S.jsx("span",{children:u("kills")})]}),S.jsxs("div",{children:[S.jsx("strong",{children:s.score.toLocaleString()}),S.jsx("span",{children:u("score")})]})',
)
rep('3.87 DEV', '3.88 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v103 ok · sayac · boyut:', len(s))
