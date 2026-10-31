# -*- coding: utf-8 -*-
# =============================================================================
# v3.84 -> v3.85 : dokunmatik HUD
# -----------------------------------------------------------------------------
# Olcum (CSS kademesi, 844x390 / 667x375 / 390x844 / 1024x768, coarse):
#   Silah tuslari zaten 52px. Flare/bomba 31px, rota 30px, kamera/duraklat 31px.
#   Yakit cubugu (right 12, bottom 70) ve govde gostergesi silah yigininin ustunde.
#   Ates, pointerleave ile birakiliyor (capture yok). Boost capture'siz; parmak
#   kayinca acik kaliyor.
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


rep(
    'className:"weapon fire-button",style:{background:"#3a1f16",borderColor:"#ff8a5c"},onPointerDown:e=>{e.preventDefault(),s.input.current.fire=!0},onPointerUp:()=>{s.input.current.fire=!1},onPointerLeave:()=>{s.input.current.fire=!1}',
    'className:"weapon fire-button",style:{background:"#3a1f16",borderColor:"#ff8a5c"},onPointerDown:e=>{e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}s.input.current.fire=!0},onPointerUp:()=>{s.input.current.fire=!1},onPointerCancel:()=>{s.input.current.fire=!1},onLostPointerCapture:()=>{s.input.current.fire=!1}'
)
rep(
    'className:"weapon boost-button",onPointerDown:()=>{a.current.boost=!0}',
    'className:"weapon boost-button",onPointerDown:e=>{try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}a.current.boost=!0}'
)

CSS = '''<style id="touch-hud-v85">
.fuel-bar{top:100px;left:16px;right:auto;bottom:auto;width:96px}
.hull-display{top:78px;right:16px;bottom:auto;left:auto}
@media (pointer:coarse){
.fuel-bar{top:100px;left:16px;right:auto;bottom:auto;width:96px}
.hull-display{top:78px;right:16px;bottom:auto;left:auto}
.aux-weapons button{min-height:44px;min-width:44px}
.flight-navigation button{height:44px;min-width:44px}
.flight-tools button{width:44px;min-width:44px;height:44px;padding:0}
}
@media (max-height:600px) and (min-width:601px) and (pointer:coarse){
.virtual-stick{width:92px;height:92px;left:10px;bottom:10px}
.throttle-control{left:14px;bottom:112px;top:auto;height:auto}
.vthr-track{height:64px;width:28px}
.radar-block{width:80px;left:112px;bottom:12px}
.weapons-controls{width:160px;right:8px;bottom:8px;gap:4px}
.flight-navigation{bottom:8px;top:auto}
.hull-display{top:70px;bottom:auto;right:12px;left:auto}
.fuel-bar{top:92px;left:12px;right:auto;bottom:auto;width:88px}
}
@media (max-width:600px) and (pointer:coarse){
.flight-navigation{top:118px;bottom:auto;min-width:0}
.hull-display{top:196px;bottom:auto;left:12px;right:auto}
.fuel-bar{top:78px;left:8px;right:auto;bottom:auto;width:64px}
.weapons-controls{width:148px;right:8px;bottom:8px}
.vthr-track{height:84px}
}
</style>
'''
rep('</style>\n<script>(function(){var tr=', '</style>\n' + CSS + '<script>(function(){var tr=')
rep('3.84 DEV', '3.85 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v100 ok · dokunmatik HUD · boyut:', len(s))
