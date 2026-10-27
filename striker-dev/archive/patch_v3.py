import re,sys
old_audio=open('audio_class.js',encoding='utf-8').read().strip()
new_audio=open('striker-dev/audio2.js',encoding='utf-8').read().strip()
h=open('inner.html',encoding='utf-8').read()

def rep(old,new,n=1):
    global h
    c=h.count(old)
    if c!=n:
        print("FAIL count",c,"for:",old[:80]); sys.exit(1)
    h=h.replace(old,new)

# 1) Audio 3.0
rep(old_audio,new_audio)
# 2) Mission generator: 12 per chapter, longer corridors, richer rewards/par
rep('const n=Math.floor(e/6),a=ob[e%6]','const n=Math.floor(e/12),a=ob[e%6]')
rep('strike:["corvette","destroyer","corvette"]','strike:["corvette","destroyer","corvette","radar","destroyer"]')
rep('intercept:["interceptor","attacker","heavy"]','intercept:["interceptor","attacker","interceptor","heavy","attacker"]')
rep('defense:["destroyer","corvette","bomber"]','defense:["destroyer","corvette","bomber","interceptor","bomber"]')
rep('radar:["radar","destroyer","drone"]','radar:["radar","destroyer","drone","corvette","drone"]')
rep('carrier:["destroyer","carrier","corvette"]','carrier:["destroyer","carrier","corvette","interceptor","corvette"]')
rep('boss:["heavy","carrier","destroyer","drone"]','boss:["heavy","carrier","destroyer","drone","interceptor","heavy"]')
rep('for(let u=0;u<n;u++)c.push(u%2?"interceptor":"destroyer")','for(let u=0;u<n*2;u++)c.push(u%3===2?"drone":u%2?"interceptor":"destroyer")')
rep('reward:400+e*65,limit:420+n*60,par:165+n*45','reward:420+e*55,limit:480+n*60,par:240+n*50')
# 3) 24 extra mission names -> 48
rep('"FINAL APPROACH","NEW DAWN"]','"FINAL APPROACH","NEW DAWN","IRON DAWN","PEARL RUN","SIGNAL FIRE","BULWARK","NIGHT WATCH","STEEL RAIN","ORCA HUNT","RIPTIDE","FROSTBITE","MIDNIGHT SUN","QUIET WATER","VANADIS","STORM CELL","EYE OF TARANIS","PHANTOM WAKE","SALT WIND","UNDERTOW","LIGHTNING REEF","KRAKEN","LAST LIGHT","METEOR SHOWER","AZURE WALL","HOMECOMING","FIRST DAWN"]')
# 4) target spacing (longer missions)
rep('(270+u*145)','(330+u*175)')
rep('p=-710-u*255-e.chapter*100','p=-900-u*430-e.chapter*120')
# 5) two new aircraft
rep('accent:"#58e6e0",price:2600}],Zd=[','accent:"#58e6e0",price:2600},{id:"falchion",code:"SF-16C",name:"FALCHION",role:["INTERCEPTOR","ÖNLEME"],description:["Radar-guided patience. Fast climb, steady gun, long missile reach.","Radar güdümlü sabır. Hızlı tırmanış, stabil top, uzun füze menzili."],speed:285,agility:1.35,hull:95,missiles:12,color:"#6b7466",accent:"#ffd08a",price:1200},{id:"ravager",code:"XA-44",name:"RAVAGER",role:["STRIKE","TAARRUZ"],description:["Heavy ordnance for the hardest decks. Slow to turn, hard to stop.","En zor güverteler için ağır mühimmat. Dönmesi ağır, durdurması zor."],speed:255,agility:1.0,hull:160,missiles:16,color:"#4a5560",accent:"#ff9d7a",price:3200}],Zd=[')
rep('const o=e!=="striker",c=e==="tempest"','const o=e!=="striker"&&e!=="falchion",c=e==="tempest"')
# 6) copy updates
rep('24 operations across four fictional theaters.','48 operations across four fictional theaters.')
rep('Dört kurgusal bölgede 24 operasyon.','Dört kurgusal bölgede 48 operasyon.')
rep('build:["FLIGHT BUILD 0.9","UÇUŞ SÜRÜMÜ 0.9"]','build:["FLIGHT BUILD 1.1","UÇUŞ SÜRÜMÜ 1.1"]')
# 7) bloom on medium too (juicier default on mobile)
rep('this.bloom.enabled=e.quality==="high"||e.quality==="ultra"','this.bloom.enabled=e.quality!=="low"')

open('striker-dev/index.html','w',encoding='utf-8').write(h)
print("ALL PATCHES APPLIED, size:",len(h))
m=re.search(r'<script type="module" crossorigin>([\s\S]*?)</script>', h)
open('/tmp/app_check.mjs','w',encoding='utf-8').write(m.group(1))
print("script extracted:",len(m.group(1)))
