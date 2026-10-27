import re,sys
old_audio=open('audio_class.js',encoding='utf-8').read().strip()
new_audio=open('striker-dev/audio4.js',encoding='utf-8').read().strip()
h=open('inner.html',encoding='utf-8').read()
def rep(old,new,n=1):
    global h
    c=h.count(old)
    if c!=n:
        print("FAIL count",c,"for:",old[:90]); sys.exit(1)
    h=h.replace(old,new)

# Audio 4.0 (studio-style)
rep(old_audio,new_audio)
# Missions: 48, 12/chapter
rep('const n=Math.floor(e/6),a=ob[e%6]','const n=Math.floor(e/12),a=ob[e%6]')
rep('strike:["corvette","destroyer","corvette"]','strike:["corvette","destroyer","corvette","radar","destroyer","corvette"]')
rep('intercept:["interceptor","attacker","heavy"]','intercept:["interceptor","attacker","interceptor","heavy","attacker","interceptor"]')
rep('defense:["destroyer","corvette","bomber"]','defense:["destroyer","corvette","bomber","interceptor","bomber","destroyer"]')
rep('radar:["radar","destroyer","drone"]','radar:["radar","destroyer","drone","corvette","drone","radar"]')
rep('carrier:["destroyer","carrier","corvette"]','carrier:["destroyer","carrier","corvette","interceptor","corvette","destroyer"]')
rep('boss:["heavy","carrier","destroyer","drone"]','boss:["heavy","carrier","destroyer","drone","interceptor","heavy"]')
rep('for(let u=0;u<n;u++)c.push(u%2?"interceptor":"destroyer")','for(let u=0;u<n*2;u++)c.push(u%3===2?"drone":u%2?"interceptor":"destroyer")')
rep('reward:400+e*65,limit:420+n*60,par:165+n*45','reward:420+e*55,limit:480+n*60,par:240+n*50')
rep('"FINAL APPROACH","NEW DAWN"]','"FINAL APPROACH","NEW DAWN","IRON DAWN","PEARL RUN","SIGNAL FIRE","BULWARK","NIGHT WATCH","STEEL RAIN","ORCA HUNT","RIPTIDE","FROSTBITE","MIDNIGHT SUN","QUIET WATER","VANADIS","STORM CELL","EYE OF TARANIS","PHANTOM WAKE","SALT WIND","UNDERTOW","LIGHTNING REEF","KRAKEN","LAST LIGHT","METEOR SHOWER","AZURE WALL","HOMECOMING","FIRST DAWN"]')
# Longer corridors v2
rep('(270+u*145)','(360+u*210)')
rep('p=-710-u*255-e.chapter*100','p=-1100-u*520-e.chapter*140')
# Tougher enemies (longer fights)
rep('(a.difficulty==="hard"?1.2:1);this.entities.push','(a.difficulty==="hard"?1.2:1)*1.6;this.entities.push')
# Terrain collision
rep('get target(){','terr(e,n){let t=0;for(const[d,p,g,o,c]of[[-1900,-2200,920,420,0],[1600,-3200,1400,510,1],[-3200,1300,1400,330,2],[3100,-850,780,210,3],[400,-6200,1600,690,4],[-3500,-6600,1800,520,5]]){const w=e-d,E=n-p;if(Math.abs(w)<g*1.7&&Math.abs(E)<g*1.4){const x=Math.sqrt((w/g)**2+(E/(g*.75))**2),L=Math.sin(w*.007+c)*.19+Math.sin(E*.012+w*.004)*.13+Math.sin(w*.025-E*.019)*.035;t=Math.max(t,Math.max(-12,(1-x+L)*o)-3)}}return t}get target(){')
rep('this.player.y<20&&(this.health-=a*7,this.player.y=Math.max(6,this.player.y),this.pitch=Math.max(this.pitch,.03))','this.player.y<Math.max(20,this.terr(this.player.x,this.player.z)+16)&&(this.health-=a*8,this.player.y=Math.max(6,this.player.y,this.terr(this.player.x,this.player.z)+8),this.pitch=Math.max(this.pitch,.05),this.shake=Math.min(1,this.shake+.4))')
# Aircraft +5
rep('accent:"#58e6e0",price:2600}],Zd=[','accent:"#58e6e0",price:2600},{id:"falchion",code:"SF-16C",name:"FALCHION",role:["INTERCEPTOR","ÖNLEME"],description:["Radar-guided patience. Fast climb, steady gun, long missile reach.","Radar güdümlü sabır. Hızlı tırmanış, stabil top, uzun füze menzili."],speed:285,agility:1.35,hull:95,missiles:12,color:"#6b7466",accent:"#ffd08a",price:1200},{id:"ravager",code:"XA-44",name:"RAVAGER",role:["STRIKE","TAARRUZ"],description:["Heavy ordnance for the hardest decks. Slow to turn, hard to stop.","En zor güverteler için ağır mühimmat. Dönmesi ağır, durdurması zor."],speed:255,agility:1.0,hull:160,missiles:16,color:"#4a5560",accent:"#ff9d7a",price:3200}],Zd=[')
rep('const o=e!=="striker",c=e==="tempest"','const o=e!=="striker"&&e!=="falchion",c=e==="tempest"')
# Copy + badge
rep('24 operations across four fictional theaters.','48 operations across four fictional theaters.')
rep('Dört kurgusal bölgede 24 operasyon.','Dört kurgusal bölgede 48 operasyon.')
rep('build:["FLIGHT BUILD 0.9","UÇUŞ SÜRÜMÜ 0.9"]','build:["FLIGHT BUILD 1.2 DEV","UÇUŞ SÜRÜMÜ 1.2 DEV"]')
rep('this.bloom.enabled=e.quality==="high"||e.quality==="ultra"','this.bloom.enabled=e.quality!=="low"')

open('striker-dev/index.html','w',encoding='utf-8').write(h)
print("ALL V4 PATCHES APPLIED, size:",len(h))
m=re.search(r'<script type="module" crossorigin>([\s\S]*?)</script>', h)
open('/tmp/app_check.mjs','w',encoding='utf-8').write(m.group(1))
print("script extracted:",len(m.group(1)))
