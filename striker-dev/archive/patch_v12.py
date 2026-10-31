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
        vals=["Sixteen original airframes. Sixteen ways to own the sky.","On altı özgün tasarım. Gökyüzüne hükmetmenin on altı yolu.","Sechzehn originale Zellen. Sechzehn Arten, den Himmel zu beherrschen.","Dieciséis células originales. Dieciséis formas de dominar el cielo.","Seize cellules originales. Seize façons de dominer le ciel.","Sedici cellule originali. Sedici modi per dominare il cielo.","Dezesseis células originais. Dezesseis formas de dominar o céu.","Шестнадцать оригинальных машин. Шестнадцать способов господства в небе.","Enam belas airframe orisinal. Enam belas cara menguasai langit."]
    if k=="build":
        # v1.10 (B-11): rozet ARTIK 10 dilin hepsinde güncel. Eskiden yalnız EN/TR
        # override ediliyordu; de/es/fr/it/pt/ru/id "1.3 DEV", ar "1.4 DEV" gösteriyordu.
        _bv="1.10 DEV"
        vals=["FLIGHT BUILD "+_bv,"UÇUŞ SÜRÜMÜ "+_bv]+[re.sub(r"[0-9][0-9.]*\s*DEV",_bv,x) for x in T[k]]
    if k=="missionDesc":
        vals[0]="48 operations across four fictional theaters. Your progress is saved on this device."
        vals[1]="Dört kurgusal bölgede 48 operasyon. İlerlemen bu cihazda kaydedilir."
    _ar=AR.get(k,"")
    if k=="build": _ar=re.sub(r"[0-9][0-9.]*\s*DEV","1.10 DEV",_ar)   # ar rozeti de güncel kalsın
    vals=list(vals)+[_ar]
    newdict.append(k+':['+','.join('"'+v.replace('"','\\"')+'"' for v in vals)+']')
EXT4={"heavyMissiles":("Heavy Missile Mode","A\u011f\u0131r F\u00fcze Modu"),"heavyMissilesHint":("70% more damage, slower round, longer reload.","%70 daha fazla hasar, daha yava\u015f mermi, daha uzun dolum."),"wingman":("AI Wingman","AI Kanat Arkada\u015f\u0131"),"wingmanHint":("An AI jet follows you and fires at nearby hostiles.","Bir yapay zek\u00e2 u\u00e7a\u011f\u0131 seni takip eder ve yak\u0131n d\u00fc\u015fmanlara ate\u015f eder.")}
for k in ["dragHint","lockedNote","diagBtn","diagNote","fsError","retryBtn","cockpitView","cockpitHint","heavyMissiles","heavyMissilesHint","wingman","wingmanHint"]:
    vals=[None,None]+list(T[k])+[AR[k]]
    if k in EXT4: vals[0],vals[1]=EXT4[k]
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
# v1.8 (B-1): dusman HP x1.6 carpani GERI ALINDI.
# v1.2'de gorev suresini uzatmak icin eklenmisti, ama gorev suresi asil olarak hedef
# sayisindan (7-13) ve koridor derinliginden geliyor. Carpan yuzunden hafif hedef
# (corvette 160 hp) tek fuzeyle (110 hasar) olmuyor, 1. gorevde 18 vurus gerekiyordu
# (kapasite 10 fuze + 11 sn'de +1). Ölçüm: tools/diag --balance.
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
rep('size===3,"Aircraft must have distinct flight stats."','size===16,"Aircraft must have distinct flight stats."')
rep('["reducedMotion","motion","motionDesc"]].map','["reducedMotion","motion","motionDesc"],["cockpit","cockpitView","cockpitHint"]].map')
rep('$.current.begin(ae),$.current.cameraMode="chase",z("chase"),','$.current.begin(ae),$.current.cameraMode=s.preferences.cockpit?"cockpit":"chase",z($.current.cameraMode),')
rep('this.renderer.toneMappingExposure=1,','this.renderer.toneMappingExposure=1.12,')
rep('this.bloom.strength=e.quality==="ultra"?.28:.19','this.bloom.strength=e.quality==="ultra"?.34:.24')
rep('this.flash.intensity=800','this.flash.intensity=1400')
rep('this.sun=new rx("#ffe1b9",4.1)','this.sun=new rx("#ffe1b9",4.5)')

# ---------- v8 S2 ----------
from i18n_air2 import AIR2,ROLES2,STATS2,ROLE_TR
_objs=[]
for _id in ["vanguard","ghost","talon","bastion","horizon","cyclone","marauder","sentinel","phantom","archer","kraken"]:
    c,nm,sp,ag,hu,mi,co,ac,pr=STATS2[_id];rl=ROLES2[_id]
    _objs.append('{id:"%s",code:"%s",name:"%s",role:["%s","%s"],description:[%s],speed:%d,agility:%s,hull:%d,missiles:%d,color:"%s",accent:"%s",price:%d}'%(_id,c,nm,rl,ROLE_TR[rl],','.join('"'+v+'"' for v in AIR2[_id]),sp,ag,hu,mi,co,ac,pr))
rep("price:3200}],Zd=[","price:3200},"+",".join(_objs)+"],Zd=[")
rep("}const o=e===\"carrier\",","}if(e===\"sub\"){const t=this.mesh(new oi(7,7,64,14),this.dark,[0,0,0]);t.rotation.x=Math.PI/2,a.add(t);a.add(this.box([4,7,10],this.dark,[0,6,-4]));a.add(this.box([1.2,3,8],this.dark,[0,4,14]));return a}const o=e===\"carrier\",")
rep('_=(c==="carrier"?380:','_=(c==="carrier"?380:c==="sub"?220:')
rep('radius:c==="carrier"?90:f?22:','radius:c==="carrier"?90:c==="sub"?26:f?22:')
rep('n.fireIn<=0&&this.flareTimer<=0','n.fireIn<=0&&(n.kind!=="sub"||n.surf)&&this.flareTimer<=0')
rep('(this.preferences.difficulty==="hard"?6:9)+n.id%4*1.5','(this.preferences.difficulty==="hard"?6:9)*(this.healthPercent<35?1.4:1)+n.id%4*1.5')
rep('damageEnemy(e,n){if(!(e.hp<=0)&&','damageEnemy(e,n){if(e.kind==="sub"&&!e.surf)return;if(!(e.hp<=0)&&')
rep('this.kills++,this.score+=e.kind==="carrier"?800:e.airborne?350:250,','this.kills++,this.combo=this.time-(this.lastKill||-99)<6?(this.combo||0)+1:1,this.lastKill=this.time,this.score+=(e.kind==="carrier"?800:e.airborne?350:250)+40*((this.combo||1)-1),')
rep('o.airborne||(c.position.y=0)','o.airborne||o.kind==="sub"||(c.position.y=0)')
rep('o.visible=c.hp>0,o.position.set(c.position.x,.25,c.position.z)','o.visible=c.hp>0&&(c.kind!=="sub"||c.surf),o.position.set(c.position.x,.25,c.position.z)')
rep('this.flash.intensity=1400','this.flash.intensity=1400,this.particles.emit(a.position,new H(0,26,0),26,4,"#2b2f31",!0),this.particles.emit(a.position,new H(0,14,0),18,3,"#41484c",!0)')
rep('n.airborne&&(n.position.y+=(n.origin.y+Math.sin(n.phase*1.3)*55-n.position.y)*Math.min(1,e*1.5),n.position.x+=(this.player.x-n.position.x)*Math.min(1,e*.1),n.position.z+=(this.player.z-n.position.z)*Math.min(1,e*.1))','n.airborne&&(n.position.y+=(n.origin.y+Math.sin(n.phase*1.3)*55-n.position.y)*Math.min(1,e*1.5),n.position.x+=(this.player.x-n.position.x)*Math.min(1,e*.1),n.position.z+=(this.player.z-n.position.z)*Math.min(1,e*.1)),n.kind==="sub"&&(n.surf=((this.time+n.id*7)%26)>12&&((this.time+n.id*7)%26)<24,n.position.y=n.surf?2:-16,n.surf&&!n.ps&&this.event("surf",n.position,10),n.ps=n.surf)')
rep('strike:["corvette","destroyer","corvette","radar","destroyer","corvette"]','strike:["corvette","destroyer","corvette","radar","destroyer","corvette","sub"]')
rep('radar:["radar","destroyer","drone","corvette","drone","radar"]','radar:["radar","destroyer","drone","corvette","drone","radar","sub"]')
rep('carrier:["destroyer","carrier","corvette","interceptor","corvette","destroyer"]','carrier:["destroyer","carrier","corvette","interceptor","corvette","destroyer","sub"]')
rep('boss:["heavy","carrier","destroyer","drone","interceptor","heavy"]','boss:["heavy","carrier","destroyer","drone","interceptor","heavy","sub"]')

# ---------- v9 S2w2 ----------
def repn(a,b,n=2):
    global h
    assert h.count(a)==n,(a,h.count(a))
    h=h.replace(a,b)
repn('assisted:!1,cockpit:!1,difficulty:"normal"','assisted:!1,cockpit:!1,heavyMissiles:!1,wingman:!1,difficulty:"normal"',1)
repn('cockpit:u.cockpit===!0,','cockpit:u.cockpit===!0,heavyMissiles:u.heavyMissiles===!0,wingman:u.wingman===!0,',1)
rep('["cockpit","cockpitView","cockpitHint"]].map','["cockpit","cockpitView","cockpitHint"],["heavyMissiles","heavyMissiles","heavyMissilesHint"],["wingman","wingman","wingmanHint"]].map')
rep('ravager:[380,14,160,1.15]}[n.id]','ravager:[380,14,160,1.15],vanguard:[470,8,120,.8],ghost:[440,10,105,.9],talon:[500,7,115,.65],bastion:[360,15,150,1.2],horizon:[560,6,90,.55],cyclone:[580,5,95,.5],marauder:[400,13,140,1.05],sentinel:[460,9,110,.85],phantom:[530,7,100,.6],archer:[600,5,85,.45],kraken:[340,16,170,1.3]}[typeof n=="string"?n:n.id]')
rep('const e=this.target;if(this.lock<1||!e){this.notify("lockFirst");return}this.temp.copy(this.forward).multiplyScalar(this.mSet[0]),this.spawn("missile",this.player,this.temp,this.mSet[1],this.mSet[2]+this.upgrade*10,e.id)&&(this.missiles--,this.missileTimer=this.mSet[3],','const e=this.target;if(this.lock<1||!e){this.notify("lockFirst");return}const m=this.preferences.heavyMissiles?[this.mSet[0]*.85,this.mSet[1]*1.35,this.mSet[2]*1.7+this.upgrade*14,this.mSet[3]*1.25]:[this.mSet[0],this.mSet[1],this.mSet[2]+this.upgrade*10,this.mSet[3]];this.temp.copy(this.forward).multiplyScalar(m[0]),this.spawn("missile",this.player,this.temp,m[1],m[2],e.id)&&(this.missiles--,this.missileTimer=m[3],')
rep('this.updateEnemies(a);const d=this.target','this.updateEnemies(a),this.updateWingman(a);const d=this.target')
rep('updateEnemies(e){for(const n of this.entities){if(!n.hp)continue;','updateWingman(e){if(!this.preferences.wingman||this.phase!=="combat")return;this.wingT=(this.wingT||0)-e;if(this.wingT>0)return;let t=null,b=225e4;for(const n of this.entities)if(n.hp){const d=n.position.distanceToSquared(this.player);d<b&&(b=d,t=n)}if(!t)return;this.wingT=3.4;this.temp.copy(this.player).addScaledVector(this.forward,-28),this.temp.y+=7;const a=this.temp2||(this.temp2=new H);a.copy(t.position).sub(this.temp).normalize().multiplyScalar(420);this.spawn("missile",this.temp,a,7,70+this.upgrade*6,t.id)&&this.event("launch",this.temp)}updateEnemies(e){for(const n of this.entities){if(!n.hp)continue;')

rep('could not complete the first sortie.")}),s}','could not complete the first sortie.")}),e("Per-aircraft missile loadouts",()=>{const f=new Set;no.forEach(u=>{const d=new Pa(dn[0],u.id,a);n(d.mSet[2]>0,"Missile damage must be positive for "+u.id+"."),f.add(d.mSet.join("|"))}),n(f.size>=10,"Missile loadouts collapsed to the default: only "+f.size+" distinct tables for "+no.length+" aircraft.")}),s}')


# ============================================================================
# v1.9 (P2 / B-3): SURUMLU SAVE + MIGRASYON ZINCIRI + KARANTINA
# ----------------------------------------------------------------------------
# Eski durum: by="idea-game.striker.v2" ve cb() icinde `e.version!==2 -> varsayilan`.
# Yani sema degistigi an oyuncu profili SESSIZCE SILINIYORDU (denetim: B-3).
#
# Yeni durum:
#   by     = "striker.profile.v3"       guncel anahtar
#   __bl   = eski anahtarlar (v2, v1)   okuma sirasinda otomatik aranir
#   __bq   = "…quarantine"              bozuk/bilinmeyen kayit BURAYA yazilir, SILINMEZ
#   __mig  = 1 -> 2 -> 3 adimli migrasyon zinciri (saf fonksiyon, test edilebilir)
#   __raw  = ham string -> {profile, quarantine}
#   __ld   = oku -> gerekiyorsa tasi -> yeni anahtara yaz (migrate-on-read)
# Eski anahtar silinmez: dogal yedek olarak kalir.
# ============================================================================

# R2: anahtar + eski anahtar listesi + karantina anahtari
rep(',by="idea-game.striker.v2";',
    ',by="striker.profile.v3",__bq="striker.profile.v3.quarantine",'
    '__bl=["idea-game.striker.v2","idea-game.striker.v1"];')

# R3: varsayilan profili v3 zarfina cevir + migrasyon fonksiyonlarini ekle
rep('difficulty:"normal"}}}function cb(){',
    'difficulty:"normal"},createdAt:Date.now(),updatedAt:Date.now(),migrations:[]}}'
    'function __sv3(o){return Object.assign({},o,{version:3,'
    'createdAt:Number.isFinite(o.createdAt)?o.createdAt:Date.now(),updatedAt:Date.now(),'
    'migrations:Array.isArray(o.migrations)?o.migrations:[]})}'
    'function __mig(o){if(!o||typeof o!="object")throw new Error("save: not an object");'
    'const v=Number(o.version);'
    'if(v===3)return __sv3(o);'
    'if(v===2)return __sv3(Object.assign({},o,{migrations:["2->3"]}));'
    'if(v===1)return __sv3(Object.assign({},o,{migrations:["1->2","2->3"]}));'
    'throw new Error("save: unknown version "+v)}'
    'function __raw(t){const s=Ey();if(t==null||t==="")return{profile:s,quarantine:null};'
    'try{return{profile:__mig(JSON.parse(t)),quarantine:null}}'
    'catch(d){return{profile:s,quarantine:String(t).slice(0,4e3)}}}'
    'function __ld(){let t=null;try{t=localStorage.getItem(by)}catch{}'
    'if(t==null)for(const k of __bl){try{const q=localStorage.getItem(k);if(q){t=q;break}}catch{}}'
    'const r=__raw(t);'
    'if(r.quarantine!=null){try{localStorage.setItem(__bq,r.quarantine)}catch{}}'
    'else if(t!=null){try{localStorage.setItem(by,JSON.stringify(r.profile))}catch{}}'
    'return r.profile}function cb(){')

# R4: cb() artik migrasyonlu yukleyiciyi kullaniyor
rep('function cb(){const s=Ey();try{const e=JSON.parse(localStorage.getItem(by)||"null");'
    'if(!e||e.version!==2)return s;',
    'function cb(){const s=Ey();try{const e=__ld();if(!e||e.version!==3)return s;')

# R5: ub() yazarken v3 zarfini ve updatedAt'i damgalar
rep('function ub(s){try{return localStorage.setItem(by,JSON.stringify(s)),!0}catch{return!1}}',
    'function ub(s){try{return localStorage.setItem(by,JSON.stringify(Object.assign({},s,'
    '{version:3,updatedAt:Date.now()}))),!0}catch{return!1}}')

# R6: 3 yeni gomulu test (migrasyon + karantina + bilinmeyen surum)
rep('distinct tables for "+no.length+" aircraft.")}),s}',
    'distinct tables for "+no.length+" aircraft.")}),'
    'e("Save migration preserves the pilot",()=>{'
    'const p={version:2,callsign:"MAVERICK",aircraft:"spectre",credits:1234,'
    'owned:["striker","spectre"],upgrades:{striker:2},'
    'records:{0:{score:500,seconds:100,stars:3}},preferences:{language:"de",quality:"ultra"}};'
    'const m=__mig(p);'
    'n(m.version===3,"Migrated profile must be v3."),'
    'n(m.callsign==="MAVERICK"&&m.credits===1234&&m.owned.length===2&&m.upgrades.striker===2'
    '&&m.records[0].stars===3&&m.preferences.language==="de","v2 pilot data lost in migration."),'
    'n(Array.isArray(m.migrations)&&m.migrations.length>0,"Migration path not recorded.")}),'
    'e("Corrupt save is quarantined, not lost",()=>{const r=__raw("{oops not json");'
    'n(r.profile.version===3,"Corrupt save must fall back to a valid default."),'
    'n(typeof r.quarantine=="string"&&r.quarantine.length>0,'
    '"Corrupt payload must be quarantined for recovery, not discarded.")}),'
    'e("Unknown schema version is not merged",()=>{'
    'const r=__raw(JSON.stringify({version:99,callsign:"FUTURE",credits:999999}));'
    'n(r.profile.callsign==="VIPER","Unknown version must not be merged into the live profile."),'
    'n(r.quarantine!=null,"Unknown version payload must be kept for recovery.")}),s}')

# R2b: varsayilan profilin SEMA SURUMU 2 -> 3
# (R3 yalnizca createdAt/updatedAt/migrations alanlarini eklemisti; version alani 2 kalmisti.
#  Bunu gomulu test "Corrupt save is quarantined, not lost" yakaladi.)
rep('function Ey(){return{version:2,callsign:"VIPER"',
    'function Ey(){return{version:3,callsign:"VIPER"')

# ============================================================================
# v1.10 (B-13): HEDEF ARAZIYE GOMULMESIN  ->  "dagin icinde hedef gosteriyor"
# ----------------------------------------------------------------------------
# Eski durum (v6'dan beri):
#   let d=...; for(let q=1;q<8&&this.terr(d,p)>4;q++) d+=(q%2?1:-1)*(260+q*190);
#   const g=f?190+u*28:c==="radar"?26:8
# Iki kusur:
#   1) Esik `terr>4` SABIT; oysa kara hedefleri y=8 (gemi) / y=26 (radar) duruyor.
#      terr=240 olan noktada destroyer y=8'de -> 232 m TOPRAGIN ALTINDA.
#   2) Dongu en fazla 7 tur; kacamazsa hedef dagin icinde doguyor.
# Olcum: tools/diag --terrain -> 16/464 hedef gomulu (en kotu -232 m), 46/48 gorev.
#
# Yeni durum:
#   - Hava hedefleri (f) AYNEN kaliyor -> denge/sorti suresi degismiyor.
#   - Kara hedeflerinde kosul hedefin KENDI irtifasina bagli: terr <= g-6.
#     (gemi y=8 -> terr<=2 yani deniz; radar y=26 -> terr<=20 yani alcak tepe)
#   - Arama 96 tur, iki yone genisleyerek. Harita ~9.3 km genis, 6 dag blogu en
#     fazla |x|<=6.6 km -> deniz/duz zemin her zaman bulunur.
#   - Son care: yer bulunamazsa hedef zeminin 50 m USTUNE kaldirilir (asla gomulmez;
#     50 m en buyuk govde yaricapinin (carrier 90) yarisin uzerinde, kesisme olmaz).
# ----------------------------------------------------------------------------
rep('let d=u===0?0:(u%2?-1:1)*(360+u*210);for(let q=1;q<8&&this.terr(d,p)>4;q++)d+=(q%2?1:-1)*(260+q*190);const g=f?190+u*28:c==="radar"?26:8,_=',
    'let d=u===0?0:(u%2?-1:1)*(360+u*210),g=f?190+u*28:c==="radar"?26:8;'
    'if(f){for(let q=1;q<8&&this.terr(d,p)>4;q++)d+=(q%2?1:-1)*(260+q*190)}'
    'else{const __x0=d;let __ok=this.terr(__x0,p)<=g-6;'
    'for(let q=1;q<=96&&!__ok;q++)__ok=this.terr(d=__x0+(q%2?1:-1)*(140+q*95),p)<=g-6;'
    '__ok||(g=this.terr(d,p)+50)}const _=')

open('striker-dev/index.html','w',encoding='utf-8').write(h)
print("ALL V5 PATCHES APPLIED, size:",len(h))
m=re.search(r'<script type="module" crossorigin>([\s\S]*?)</script>', h)
open('/tmp/app_check.mjs','w',encoding='utf-8').write(m.group(1))
print("script extracted:",len(m.group(1)))
