import re,sys
sys.path.insert(0,'striker-dev')
from i18n_data import T,AIR,CH,LB
from i18n_ar import AR,AIR_AR,CH_AR,LB_AR
old_audio=open('audio_class.js',encoding='utf-8').read().strip()
new_audio=open('striker-dev/audio5.js',encoding='utf-8').read().strip()
h=open('inner.html',encoding='utf-8').read()
def rep(old,new,n=1):
    global h
    c=h.count(old)
    if c!=n:
        print("FAIL count",c,"for:",old[:90]); sys.exit(1)
    h=h.replace(old,new)

# ---------- i18n helpers ----------
rep('})();function Ux','})();function __L(c,a){const i={tr:1,de:2,es:3,fr:4,it:5,pt:6,ru:7,id:8,ar:9}[c]||0;return a[Math.min(i,a.length-1)]}function __nx(c){const L=["tr","en","de","es","fr","it","pt","ru","id","ar"];return L[(L.indexOf(c)+1)%L.length]}function Ux')
# ---------- dictionary expansion ----------
dicttxt=open('fw_dict.txt',encoding='utf-8').read().strip()
pairs=re.findall(r'(\w+):\["((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)"\]',dicttxt)
assert len(pairs)==130, len(pairs)
newdict=[]
for k,en,tr in pairs:
    assert k in AR, k
    if k not in T:
        print("MISSING TRANSLATION",k); sys.exit(1)
    vals=[en,tr]+list(T[k])
    if k=="hangarDesc":
        vals=["Five original airframes. Five ways to own the sky.","Beş özgün tasarım. Gökyüzüne hükmetmenin beş yolu.","Fünf originale Zellen. Fünf Arten, den Himmel zu beherrschen.","Cinco células originales. Cinco formas de dominar el cielo.","Cinq cellules originales. Cinq façons de dominer le ciel.","Cinque cellule originali. Cinque modi per dominare il cielo.","Cinco células originais. Cinco formas de dominar o céu.","Пять оригинальных машин. Пять способов господства в небе.","Lima airframe orisinal. Lima cara menguasai langit."]
    if k=="build":
        vals=["FLIGHT BUILD 1.5 DEV","UÇUŞ SÜRÜMÜ 1.5 DEV"]+list(T[k])
    if k=="missionDesc":
        vals[0]="48 operations across four fictional theaters. Your progress is saved on this device."
        vals[1]="Dört kurgusal bölgede 48 operasyon. İlerlemen bu cihazda kaydedilir."
    vals=list(vals)+[AR.get(k,"")]
    newdict.append(k+':['+','.join('"'+v.replace('"','\\"')+'"' for v in vals)+']')
for k in ["dragHint","lockedNote","diagBtn","diagNote","fsError","retryBtn","cockpitView","cockpitHint"]:
    vals=[None,None]+list(T[k])+[AR[k]]
    newdict.append(k+':['+','.join('""' if v is None else '"'+v+'"' for v in vals)+']')
newdict.append('catapult:["CATAPULT LAUNCH","KATAPULT KALKIŞ","KATAPULTSTART","LANZAMIENTO CON CATAPULTA","DÉCOLLAGE CATAPULTE","LANCIO CATAPULTA","DECOLAGEM CATAPULTADA","КАТАПУЛЬТНЫЙ СТАРТ","PELONTARAN KATAPULT","إقلاع بالمجناق"]')
rep(dicttxt,'{'+','.join(newdict)+'}')
rep('function Jn(s,e){return Fw[e][s==="tr"?1:0]}','function Jn(s,e){return __L(s,Fw[e])}')
# array-index ternaries (role/desc/briefing)
h=re.sub(r'([\w.]+)\[(\w+)==="tr"\?1:0\]', lambda m: '__L(%s,%s)'%(m.group(2),m.group(1)), h)
# inline literal ternaries -> dict
rep('u==="tr"?"İNCELEMEK İÇİN SÜRÜKLE":"DRAG TO INSPECT"','__L(u,Fw.dragHint)')
rep('c==="tr"?"Önce bir önceki görevi tamamla.":"Complete the previous mission to unlock this operation."','__L(c,Fw.lockedNote)')
rep('s==="tr"?"UÇUŞ SİSTEMİNİ DENETLE":"RUN FLIGHT SYSTEM CHECKS"','__L(s,Fw.diagBtn)')
rep('s==="tr"?"kontrol başarılı. GPU / cihaz performans testi değildir.":"checks passed. Not a GPU / device performance test."','__L(s,Fw.diagNote)')
rep('de==="tr"?"Bu tarayıcı tam ekran modunu desteklemiyor.":"Fullscreen is unavailable in this browser."','__L(de,Fw.fsError)')
rep('de==="tr"?"YENİDEN DENE":"RETRY"','__L(de,Fw.retryBtn)')
# language UI: 9 buttons + header cycle
rep('S.jsxs("div",{className:"segmented-options",children:[S.jsx("button",{className:s.language==="tr"?"active":"",onClick:()=>e({language:"tr"}),children:"Türkçe"}),S.jsx("button",{className:s.language==="en"?"active":"",onClick:()=>e({language:"en"}),children:"English"})]})','S.jsxs("div",{className:"segmented-options lang-grid",children:["tr","en","de","es","fr","it","pt","ru","id","ar"].map(L9=>S.jsx("button",{className:s.language===L9?"active":"",onClick:()=>e({language:L9}),children:L9.toUpperCase()},L9))})')
rep('onLanguage:()=>Xe({language:de==="tr"?"en":"tr"})','onLanguage:()=>Xe({language:__nx(de)})')
# chapter data: nm/ds arrays + tab label
for nm,(names,descs) in CH.items():
    pass
rep('place:"PELAGIC ISLANDS",description:"A new pilot. An unfamiliar horizon."}','place:"PELAGIC ISLANDS",description:"A new pilot. An unfamiliar horizon.",nm:["FIRST LIGHT","İLK IŞIK","ERSTES LICHT","PRIMERA LUZ","PREMIÈRE LUMIÈRE","PRIMA LUCE","PRIMEIRA LUZ","ПЕРВЫЙ СВЕТ","CAHAYA PERTAMA","النور الأول"],ds:["Ein neuer Pilot. Ein fremder Horizont.","Un piloto nuevo. Un horizonte desconocido.","Un nouveau pilote. Un horizon inconnu.","Un nuovo pilota. Un orizzonte sconosciuto.","Um novo piloto. Um horizonte desconhecido.","Новый пилот. Незнакомый горизонт.","Pilot baru. Cakrawala asing.","طيار جديد. أفق غير مألوف."]}')
rep('place:"NORTHERN FLOTILLA",description:"The fleet is moving. Hold the line."}','place:"NORTHERN FLOTILLA",description:"The fleet is moving. Hold the line.",nm:["NORTHERN FRONT","KUZEY CEPHESİ","NORDFRONT","FRENTE NORTE","FRONT NORD","FRONTE NORD","FRENTE NORTE","СЕВЕРНЫЙ ФРОНТ","FRONT UTARA","الجبهة الشمالية"],ds:["Die Flotte bewegt sich. Halte die Linie.","La flota se mueve. Mantén la línea.","La flotte avance. Tenez la ligne.","La flotta si muove. Tieni la linea.","A frota se move. Segure a linha.","Флот в движении. Держи строй.","Armada bergerak. Tahan garis.","الأسطول يتحرك. اثبت على الخط."]}')
rep('place:"TARANIS ARCHIPELAGO",description:"Beyond the radar. Behind the front."}','place:"TARANIS ARCHIPELAGO",description:"Beyond the radar. Behind the front.",nm:["SILENT THUNDER","SESSİZ FIRTINA","STILLER DONNER","TRUENO SILENCIOSO","TONNERRE SILENCIEUX","TUONO SILENZIOSO","TROVÃO SILENCIOSO","ТИХИЙ ГРОМ","GUNTUR SENYAP","الرعد الصامت"],ds:["Jenseits des Radars. Hinter der Front.","Más allá del radar. Tras el frente.","Au-delà du radar. Derrière le front.","Oltre il radar. Dietro il fronte.","Além do radar. Atrás da frente.","За радаром. За линией фронта.","Di luar radar. Di balik garis depan.","وراء الرادار. خلف الجبهة."]}')
rep('place:"SHENLONG STRAIT",description:"One last flight. Everything to protect."}','place:"SHENLONG STRAIT",description:"One last flight. Everything to protect.",nm:["FINAL HORIZON","SON UFUK","LETZTER HORIZONT","HORIZONTE FINAL","HORIZON FINAL","ORIZZONTE FINALE","HORIZONTE FINAL","ПОСЛЕДНИЙ ГОРИЗОНТ","CAKRAWALA TERAKHIR","الأفق الأخير"],ds:["Ein letzter Flug. Alles zu schützen.","Un último vuelo. Todo por proteger.","Un dernier vol. Tout à protéger.","Un ultimo volo. Tutto da proteggere.","Um último voo. Tudo a proteger.","Последний полёт. Всё, что дорого.","Penerbangan terakhir. Semua untuk dilindungi.","طلعة أخيرة. كل شيء يستحق الحماية."]}')
rep('accent:"#58e6e0",price:2600}],Zd=[','accent:"#58e6e0",price:2600},{id:"falchion",code:"SF-16C",name:"FALCHION",role:["INTERCEPTOR","ÖNLEME"],description:["Radar-guided patience. Fast climb, steady gun, long missile reach.","Radar güdümlü sabır. Hızlı tırmanış, stabil top, uzun füze menzili."],speed:285,agility:1.35,hull:95,missiles:12,color:"#6b7466",accent:"#ffd08a",price:1200},{id:"ravager",code:"XA-44",name:"RAVAGER",role:["STRIKE","TAARRUZ"],description:["Heavy ordnance for the hardest decks. Slow to turn, hard to stop.","En zor güverteler için ağır mühimmat. Dönmesi ağır, durdurması zor."],speed:255,agility:1.0,hull:160,missiles:16,color:"#4a5560",accent:"#ff9d7a",price:3200}],Zd=[')
rep('const o=e!=="striker",c=e==="tempest"','const o=e!=="striker"&&e!=="falchion",c=e==="tempest"')
rep('o==="tr"?u.tr:u.name','__L(o,u.nm||[u.name,u.tr])')
# briefings 9 langs
# defense/radar/carrier/boss: match by EN lead
def rep_lb(kind,en_lead):
    global h
    m=re.search(re.escape(kind+':['+'"'+en_lead)+r'[^"]*","[^"]*"\]',h)
    if not m:
        print("FAIL lb",kind); sys.exit(1)
    old=m.group(0)
    en_tr=re.findall(r'"((?:[^"\\]|\\.)*)"',old)
    h=h.replace(old,kind+':['+','.join('"'+v+'"' for v in en_tr+list(LB[kind])+[LB_AR[kind]])+']')
rep_lb("strike","A hostile patrol")
rep_lb("intercept","Interceptors are approaching")
rep_lb("defense","Aurora is under threat.")
rep_lb("radar","A coastal radar")
rep_lb("carrier","An enemy carrier group")
rep_lb("boss","The command fleet")
# aircraft role/desc 9 langs
def rep_arr(old2,kind,key):
    global h
    old=kind+':['+','.join('"'+v+'"' for v in old2)+']'
    vals=old2+list(AIR[key][0 if kind=="role" else 1])+[AIR_AR[key][0 if kind=="role" else 1]]
    rep(old,kind+':['+','.join('"'+v+'"' for v in vals)+']')
rep_arr(["MULTIROLE","ÇOK AMAÇLI"],"role","striker")
rep_arr(["AIR SUPERIORITY","HAVA ÜSTÜNLÜĞÜ"],"role","spectre")
rep_arr(["EXPERIMENTAL","DENEYSEL"],"role","tempest")
rep_arr(["INTERCEPTOR","ÖNLEME"],"role","falchion")
rep_arr(["STRIKE","TAARRUZ"],"role","ravager")
for key,en,tr in [("striker","Precision meets agility. A balanced platform for every sortie.","Hassasiyet ve çeviklik. Her sorti için dengeli bir platform."),
 ("spectre","Twin-engine power. Heavy armor and an expanded missile payload.","Çift motor gücü. Ağır zırh ve genişletilmiş füze kapasitesi."),
 ("tempest","A new flight philosophy. Blended wings, incredible speed, minimal armor.","Yeni bir uçuş felsefesi. Bütünleşik kanatlar, yüksek hız, hafif zırh."),
 ("falchion","Radar-guided patience. Fast climb, steady gun, long missile reach.","Radar güdümlü sabır. Hızlı tırmanış, stabil top, uzun füze menzili."),
 ("ravager","Heavy ordnance for the hardest decks. Slow to turn, hard to stop.","En zor güverteler için ağır mühimmat. Dönmesi ağır, durdurması zor.")]:
    rep('description:["'+en+'","'+tr+'"]','description:['+','.join('"'+v+'"' for v in [en,tr]+list(AIR[key][1])+[AIR_AR[key][1]])+']')

# ---------- v4 core patches ----------
rep(old_audio,new_audio)
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
rep('(270+u*145)','(360+u*210)')
rep('p=-710-u*255-e.chapter*100','p=-1100-u*520-e.chapter*140')
rep('(a.difficulty==="hard"?1.2:1);this.entities.push','(a.difficulty==="hard"?1.2:1)*1.6;this.entities.push')
rep('get target(){','terr(e,n){let t=0;for(const[d,p,g,o,c]of[[-1900,-2200,920,420,0],[1600,-3200,1400,510,1],[-3200,1300,1400,330,2],[3100,-850,780,210,3],[400,-6200,1600,690,4],[-3500,-6600,1800,520,5]]){const w=e-d,E=n-p;if(Math.abs(w)<g*1.7&&Math.abs(E)<g*1.4){const x=Math.sqrt((w/g)**2+(E/(g*.75))**2),L=Math.sin(w*.007+c)*.19+Math.sin(E*.012+w*.004)*.13+Math.sin(w*.025-E*.019)*.035;t=Math.max(t,Math.max(-12,(1-x+L)*o)-3)}}return t}get target(){')
rep('this.player.y<20&&(this.health-=a*7,this.player.y=Math.max(6,this.player.y),this.pitch=Math.max(this.pitch,.03))','this.player.y<Math.max(20,this.terr(this.player.x,this.player.z)+16)&&(this.health-=a*8,this.player.y=Math.max(6,this.player.y,this.terr(this.player.x,this.player.z)+8),this.pitch=Math.max(this.pitch,.05),this.shake=Math.min(1,this.shake+.4))')
rep('this.bloom.enabled=e.quality==="high"||e.quality==="ultra"','this.bloom.enabled=e.quality!=="low"')
# ---------- aircraft paint from data ----------
rep('const a=new Vi;a.name=e;const o=e!=="striker"&&e!=="falchion",c=e==="tempest",u=this.material(new aa({color:c?"#4a6974":o?"#81909d":"#a0acb2",map:this.panel,metalness:.77,roughness:c?.42:.46,envMapIntensity:1.5})),f=this.material(new aa({color:c?"#65d5d0":"#b1c7cf",metalness:.55,roughness:.36}))','const a=new Vi;a.name=e;const o=e!=="striker"&&e!=="falchion",c=e==="tempest",P=no.find(x=>x.id===e)||{},u=this.material(new aa({color:P.color||(c?"#4a6974":o?"#81909d":"#a0acb2"),map:this.panel,metalness:.77,roughness:c?.42:.46,envMapIntensity:1.5})),f=this.material(new aa({color:P.accent||(c?"#65d5d0":"#b1c7cf"),metalness:.55,roughness:.36}))')
# ---------- per-aircraft missile loadout ----------
rep('this.aircraft=wl(n,o),this.health','this.aircraft=wl(n,o),this.mSet={striker:[450,8,110,.8],spectre:[450,9,125,.85],tempest:[520,6,95,.6],falchion:[540,7,100,.55],ravager:[380,14,160,1.15]}[n.id]||[450,8,110,.8],this.health')
rep('this.temp.copy(this.forward).multiplyScalar(450),this.spawn("missile",this.player,this.temp,8,110+this.upgrade*10,e.id)&&(this.missiles--,this.missileTimer=.8,this.shake=.18,this.event("launch",this.player))','this.temp.copy(this.forward).multiplyScalar(this.mSet[0]),this.spawn("missile",this.player,this.temp,this.mSet[1],this.mSet[2]+this.upgrade*10,e.id)&&(this.missiles--,this.missileTimer=this.mSet[3],this.shake=.18,this.event("launch",this.player))')
# ---------- AI upgrades ----------
rep('n.airborne&&(n.position.y=n.origin.y+Math.sin(n.phase*1.3)*55)','n.airborne&&(n.position.y+=(n.origin.y+Math.sin(n.phase*1.3)*55-n.position.y)*Math.min(1,e*1.5),n.position.x+=(this.player.x-n.position.x)*Math.min(1,e*.1),n.position.z+=(this.player.z-n.position.z)*Math.min(1,e*.1))')
rep('(this.preferences.difficulty==="hard"?7:11)+n.id%4*1.5','(this.preferences.difficulty==="hard"?6:9)+n.id%4*1.5')
rep('normalize().multiplyScalar(180),this.spawn("hostile"','normalize().multiplyScalar(200),this.spawn("hostile"')

# ---------- v6 gameplay ----------
rep('const f=["interceptor","heavy","attacker","drone","bomber"].includes(c),d=u===0?0:(u%2?-1:1)*(360+u*210),p=-1100-u*520-e.chapter*140,g=','const f=["interceptor","heavy","attacker","drone","bomber"].includes(c),p=-1100-u*520-e.chapter*140;let d=u===0?0:(u%2?-1:1)*(360+u*210);for(let q=1;q<8&&this.terr(d,p)>4;q++)d+=(q%2?1:-1)*(260+q*190);const g=')
rep('player=new H(0,165,420);forward','player=new H(0,24,860);forward')
rep('entities=[];projectiles=','entities=[];catT=0;projectiles=')
rep('speed=165;health','speed=0;health')
rep('this.time+=a,this.gunTimer-=a,','this.time+=a,this.catT+=a,this.gunTimer-=a,')
rep('const f=88+n.throttle*(this.aircraft.speed-88)+(n.boost?40:0);if(this.speed=li.damp(this.speed,f,.8,a),','const f=this.catT<2.6?Math.min(178,this.speed+260*a):88+n.throttle*(this.aircraft.speed-88)+(n.boost?40:0);if(this.speed=li.damp(this.speed,f,this.catT<2.6?3:.8,a),this.catT<2.6&&(this.pitch=Math.max(this.pitch,.07)),')
rep('this.catT>3&&this.player.y<Math.max(20,' if False else 'this.player.y<Math.max(20,this.terr(this.player.x,this.player.z)+16)&&(','this.catT>3&&this.player.y<Math.max(20,this.terr(this.player.x,this.player.z)+16)&&(')
rep('this.carrier.position.set(-230,0,1080)','this.carrier.position.set(0,0,1050)',2)
rep('this.assisted=a.assisted,e.targets.forEach','this.assisted=a.assisted,this.notify("catapult",3),e.targets.forEach')

# ---------- v7 S1 ----------
rep('language:u.language==="en"?"en":"tr"','language:["tr","en","de","es","fr","it","pt","ru","id","ar"].includes(u.language)?u.language:"tr"')
rep('language:"tr",assisted:!0,difficulty:"normal"','language:"tr",assisted:!1,cockpit:!1,difficulty:"normal"')
rep('assisted:typeof u.assisted=="boolean"?u.assisted:!0','assisted:typeof u.assisted=="boolean"?u.assisted:!1')
rep('reducedMotion:u.reducedMotion===!0,','reducedMotion:u.reducedMotion===!0,cockpit:u.cockpit===!0,')
rep('n(dn.length===24&&new Set(dn.map(u=>u.id)).size===24,"Mission IDs must be unique.")','n(dn.length===48&&new Set(dn.map(u=>u.id)).size===48,"Mission IDs must be unique.")')
rep('e("24 mission configurations"','e("48 mission configurations"')
rep('size===3,"Aircraft must have distinct flight stats."','size===5,"Aircraft must have distinct flight stats."')
rep('["reducedMotion","motion","motionDesc"]].map','["reducedMotion","motion","motionDesc"],["cockpit","cockpitView","cockpitHint"]].map')
rep('$.current.begin(ae),$.current.cameraMode="chase",z("chase"),','$.current.begin(ae),$.current.cameraMode=s.preferences.cockpit?"cockpit":"chase",z($.current.cameraMode),')
rep('this.renderer.toneMappingExposure=1,','this.renderer.toneMappingExposure=1.12,')
rep('this.bloom.strength=e.quality==="ultra"?.28:.19','this.bloom.strength=e.quality==="ultra"?.34:.24')
rep('this.flash.intensity=800','this.flash.intensity=1400')
rep('this.sun=new rx("#ffe1b9",4.1)','this.sun=new rx("#ffe1b9",4.5)')

open('striker-dev/index.html','w',encoding='utf-8').write(h)
print("ALL V5 PATCHES APPLIED, size:",len(h))
m=re.search(r'<script type="module" crossorigin>([\s\S]*?)</script>', h)
open('/tmp/app_check.mjs','w',encoding='utf-8').write(m.group(1))
print("script extracted:",len(m.group(1)))
