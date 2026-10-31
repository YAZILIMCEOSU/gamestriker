# -*- coding: utf-8 -*-
# =============================================================================
# v3.86 -> v3.87 : ilk sorti — deniz fuzesi, sessiz SAM, ekran
# -----------------------------------------------------------------------------
# Olcum:
#   Yardımcısız düz uçuşta gemiler 2.3 km dışına düşüyor, fireIn eksiye iniyor
#   ama menzil koşulu atışı yutuyor. Atış olsa da küçük mermi, füze değil.
#   Radar AA parçası 11. saniyede ateş ediyor; oyuncu bunu göremiyor.
#   Hafif kol (>0.07) rotayı tamamen kesiyor, hedef arkada kalıyor.
#   Hedef yazısı 7 işaretin hepsinde, sahte "2.3 KM", büyük ok + kenar oku.
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
    'if(t.cd<=0&&n.position.distanceTo(this.player)<1600){t.cd=1.5+Math.random()*.9;const wp=this.partW(n,t,this.temp);',
    'if(t.cd<=0&&(this.mission.tier||0)>=1&&n.position.distanceTo(this.player)<1600){t.cd=1.5+Math.random()*.9;const wp=this.partW(n,t,this.temp);',
)
rep(
    'this.flareTimer<=0&&n.position.distanceToSquared(this.player)<2300**2',
    'this.flareTimer<=0&&!((this.mission.tier||0)<1&&n.grounded)&&n.position.distanceToSquared(this.player)<((n.kind==="corvette"||n.kind==="destroyer")?((this.mission.tier||0)<2?4200:2800):2300)**2',
    2,
)
rep(
    'this.temp.copy(this.player).sub(n.position).normalize().multiplyScalar(200),this.spawn("hostile",n.position,this.temp,11,[9,11,14,17,20][this.di]),n.tele=!1',
    '(n.kind==="corvette"||n.kind==="destroyer")&&(this.mission.tier||0)<1&&this.projectiles.some(p=>p.active&&p.msl)?n.fireIn=4:(n.kind==="corvette"||n.kind==="destroyer")?(this.temp.copy(this.player).sub(n.position).normalize().multiplyScalar((this.mission.tier||0)<1?150:240),this.spawn("hostile",n.position,this.temp,(this.mission.tier||0)<1?16:12,(this.mission.tier||0)<1?26:[16,20,24,28,34][this.di],-1,1),this.event("launch",n.position,6)):(this.temp.copy(this.player).sub(n.position).normalize().multiplyScalar(200),this.spawn("hostile",n.position,this.temp,11,[9,11,14,17,20][this.di])),n.tele=!1',
)
rep(
    'spawn(e,n,a,o,c,u=-1){const f=this.projectiles.find(d=>!d.active);return f?(f.active=!0,f.kind=e,f.position.copy(n),f.previous.copy(n),f.velocity.copy(a),f.life=o,f.damage=c,f.target=u,!0):!1}',
    'spawn(e,n,a,o,c,u=-1,g=0){const f=this.projectiles.find(d=>!d.active);return f?(f.active=!0,f.kind=e,f.position.copy(n),f.previous.copy(n),f.velocity.copy(a),f.life=o,f.damage=c,f.target=u,f.msl=g,!0):!1}',
)
rep(
    'else if(n.kind==="hostile")this.desired.copy(this.player).sub(n.position).normalize().multiplyScalar(215),n.velocity.lerp(this.desired,e*.85);',
    'else if(n.kind==="hostile")this.desired.copy(this.player).sub(n.position).normalize().multiplyScalar(n.msl?180:215),n.velocity.lerp(this.desired,Math.min(1,e*(n.msl?1.7:.85)));',
)
rep(
    'this.dummy.scale.setScalar(o.kind==="gun"?.6:1.1)',
    'this.dummy.scale.setScalar(o.kind==="gun"?.6:o.msl?2.8:1.1)',
)
rep(
    'o.kind==="hostile"?"#ceae9b":"#d9e1de"',
    'o.msl?"#ff8a4a":o.kind==="hostile"?"#ceae9b":"#d9e1de"',
)
rep(
    'const o=Math.abs(n.yaw)+Math.abs(n.pitch)>.07;',
    'const o=Math.abs(n.yaw)+Math.abs(n.pitch)>((this.mission.tier||0)<1?.42:.07);',
)
rep(
    'S.jsxs("div",{className:"target-caption",children:',
    'b.selected&&S.jsxs("div",{className:"target-caption",children:',
)
rep(
    'S.jsxs("div",{className:"obj-banner",children:',
    '(e.mkind==="recon"||e.boss||e.mkind==="timer"||e.carrierHealth<100)&&S.jsxs("div",{className:"obj-banner",children:',
)
rep(
    '"TSD ",S.jsx("span",{children:"2.3 KM"})',
    '"TSD"',
)
rep(
    '.slice(0,3).map(m=>{const k=.5/Math.max',
    '.slice(0,(e.mission&&(e.mission.tier||0)<1)?1:2).map(m=>{const k=.5/Math.max',
)
rep(
    'y&&S.jsxs("div",{className:`offscreen-guide',
    'y&&!e.markers.some(b=>b.edge)&&S.jsxs("div",{className:`offscreen-guide',
)
rep('3.86 DEV', '3.87 DEV', 2)
open(P, 'w', encoding='utf-8').write(s)
print('v102 ok · deniz fuzesi + ekran · boyut:', len(s))
