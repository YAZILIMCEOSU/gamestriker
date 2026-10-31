# -*- coding: utf-8 -*-
# =============================================================================
# v3.91 -> v3.92 : kara tesis olcegi (P2 ilk adim)
# -----------------------------------------------------------------------------
# Olcum: radar taban 90 m, SAM 120, depo 160. Plan 200-400 m.
# inner.scale: 2.45 / 1.85 / 1.4 -> 220 / 222 / 224 m.
# Radar AA parcasi [30,2,26]te kalir. Olcekli [83,5,64] noktasi
# gorev 1 sortisini 100/41s den 88/44s e dusurdu; o ofset uygulanmadi.
# Havaalani hangar vurusu z=+140 idi, gorunen hangar z=-80.
# =============================================================================
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'striker-dev', 'index.html')
s = open(P, encoding='utf-8').read()
need = [
    'inner.scale.setScalar(2.45)',
    'inner.scale.setScalar(1.85)',
    'inner.scale.setScalar(1.4)',
    '{k:"dish",o:[0,112.7,0],r:25,h:90},{k:"aa",o:[30,2,26],r:8,h:80}',
    '{k:"hangar",o:[-240,12,-80],r:22,h:150}',
    '3.92 DEV',
]
missing = [n for n in need if n not in s]
assert not missing, missing
assert s.count('3.92 DEV') == 2
print('v107 kayit · tesis 200 m · boyut:', len(s))
