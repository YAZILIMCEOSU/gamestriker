# -*- coding: utf-8 -*-
# v3.92 -> v3.93 : katapult cikis
# Deniz uzerinde 110 m tampon, hiz 74 olunca catT=4 yapinca ucagi
# guverte ustunde bir karede 25 m yukari firlatiyordu.
# Katapult bitene kadar bas sabit, burun 3 derece, bow gecilince combat.
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()
need = [
    'if(tg>1&&tg+110-this.player.y>need)',
    'this.phase==="takeoff"&&(c=0)',
    'this.phase==="takeoff"&&(this.pitch=Math.min(this.pitch,.06))',
    'this.player.z<this.homePos.z-130',
    '3.93 DEV',
]
missing = [n for n in need if n not in s]
assert not missing, missing
assert 'catT=Math.max(4,this.catT)' not in s
assert s.count('3.93 DEV') == 2
print('v108 kayit · katapult · boyut:', len(s))
