class zw{context=null;master=null;comp=null;verb=null;verbG=null;enabled=!0;eOsc1=null;eOsc2=null;eSub=null;eFilter=null;eGain=null;eNoise=null;eNG=null;windSrc=null;windBP=null;wGain=null;noiseBuf=null;musicSrc=null;musicG=null;
async start(){try{if(!this.context){const n=this.context=new (window.AudioContext||window.webkitAudioContext)();
this.master=n.createGain();this.master.gain.value=this.enabled?.4:0;
this.comp=n.createDynamicsCompressor();this.comp.threshold.value=-18;this.comp.knee.value=20;this.comp.ratio.value=5;this.comp.attack.value=.005;this.comp.release.value=.28;
this.master.connect(this.comp);this.comp.connect(n.destination);
const vl=Math.floor(n.sampleRate*1.6),vb=n.createBuffer(2,vl,n.sampleRate);
for(let ch=0;ch<2;ch++){const d=vb.getChannelData(ch);for(let i=0;i<vl;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/vl,2.6)}
this.verb=n.createConvolver();this.verb.buffer=vb;this.verbG=n.createGain();this.verbG.gain.value=.4;
this.verb.connect(this.verbG);this.verbG.connect(this.master);
this.noiseBuf=n.createBuffer(1,n.sampleRate*2,n.sampleRate);const d=this.noiseBuf.getChannelData(0);let la=0;
for(let i=0;i<d.length;i++){const w=Math.random()*2-1;la=(la+.03*w)/1.03;d[i]=(w*.5+la*1.5)*.45;}
this.eSub=n.createOscillator();this.eSub.type="sine";this.eSub.frequency.value=26;
const subG=n.createGain();subG.gain.value=.5;
this.eFilter=n.createBiquadFilter();this.eFilter.type="lowpass";this.eFilter.frequency.value=130;this.eFilter.Q.value=.8;
this.eGain=n.createGain();this.eGain.gain.value=0;
this.eSub.connect(subG);subG.connect(this.eFilter);
this.eFilter.connect(this.eGain);this.eGain.connect(this.master);
this.eNoise=n.createBufferSource();this.eNoise.buffer=this.noiseBuf;this.eNoise.loop=!0;
const eNF=n.createBiquadFilter();eNF.type="lowpass";eNF.frequency.value=220;this.eNG=n.createGain();this.eNG.gain.value=0;this._eNF=eNF;
this.eNoise.connect(eNF);eNF.connect(this.eNG);this.eNG.connect(this.master);
this.windSrc=n.createBufferSource();this.windSrc.buffer=this.noiseBuf;this.windSrc.loop=!0;
this.windBP=n.createBiquadFilter();this.windBP.type="bandpass";this.windBP.frequency.value=260;this.windBP.Q.value=.55;
this.wGain=n.createGain();this.wGain.gain.value=0;
this.windSrc.connect(this.windBP);this.windBP.connect(this.wGain);this.wGain.connect(this.master);
this.eSub.start();this.eNoise.start();this.windSrc.start();
this._music(n).catch(()=>{});}
await this.context.resume()}catch{}}
async _music(n){const sr=n.sampleRate,len=Math.ceil(sr*24),t=new OfflineAudioContext(2,len,sr);
const o=t.createGain();o.gain.value=.9;o.connect(t.destination);
const nb=t.createBuffer(1,sr*2,sr);{const d=nb.getChannelData(0);let la=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;la=(la+.03*w)/1.03;d[i]=w*.5+la*1.4}}
const padF=t.createBiquadFilter();padF.type="lowpass";padF.Q.value=1;
padF.frequency.setValueAtTime(280,0);padF.frequency.linearRampToValueAtTime(950,10);padF.frequency.linearRampToValueAtTime(320,22);
const padG=t.createGain();padG.gain.setValueAtTime(1e-4,0);padG.gain.linearRampToValueAtTime(.12,3);padG.gain.setValueAtTime(.12,20);padG.gain.linearRampToValueAtTime(1e-4,23.8);
padF.connect(padG);padG.connect(o);
for(const f of[36.71,73.42,110,146.83,174.61])for(const dt of[-5,5]){const os=t.createOscillator();os.type="triangle";os.frequency.value=f;os.detune.value=dt;const g=t.createGain();g.gain.value=.04;os.connect(g);g.connect(padF);os.start(0);os.stop(24)}
const sub=t.createOscillator();sub.type="sine";sub.frequency.value=36.71;const sg=t.createGain();sg.gain.setValueAtTime(1e-4,0);sg.gain.linearRampToValueAtTime(.22,2);sg.gain.setValueAtTime(.22,21);sg.gain.linearRampToValueAtTime(1e-4,23.9);sub.connect(sg);sg.connect(o);sub.start(0);sub.stop(24);
for(let k=1;k<12;k+=2){const t0=k*2,os=t.createOscillator();os.type="sine";os.frequency.setValueAtTime(120,t0);os.frequency.exponentialRampToValueAtTime(40,t0+.22);const g=t.createGain();g.gain.setValueAtTime(1e-4,t0);g.gain.linearRampToValueAtTime(.4,t0+.005);g.gain.exponentialRampToValueAtTime(1e-4,t0+.4);os.connect(g);g.connect(o);os.start(t0);os.stop(t0+.45)}
for(let k=0;k<24;k+=1.5){const t0=k+ .75,s=t.createBufferSource();s.buffer=nb;s.loop=!0;const f=t.createBiquadFilter();f.type="highpass";f.frequency.value=8000;const g=t.createGain();g.gain.setValueAtTime(1e-4,t0);g.gain.linearRampToValueAtTime(.05,t0+.004);g.gain.exponentialRampToValueAtTime(1e-4,t0+.05);s.connect(f);f.connect(g);g.connect(o);s.start(t0,Math.random());s.stop(t0+.08)}
{const t0=10,s=t.createBufferSource();s.buffer=nb;s.loop=!0;const f=t.createBiquadFilter();f.type="bandpass";f.Q.value=1.2;f.frequency.setValueAtTime(400,t0);f.frequency.exponentialRampToValueAtTime(2600,t0+3);const g=t.createGain();g.gain.setValueAtTime(1e-4,t0);g.gain.linearRampToValueAtTime(.1,t0+2.4);g.gain.exponentialRampToValueAtTime(1e-4,t0+3.2);s.connect(f);f.connect(g);g.connect(o);s.start(t0);s.stop(t0+3.3)}
const rb=await t.startRendering();
if(!this.context)return;
this.musicSrc=n.createBufferSource();this.musicSrc.buffer=rb;this.musicSrc.loop=!0;
this.musicG=n.createGain();this.musicG.gain.value=.33;
this.musicSrc.connect(this.musicG);this.musicG.connect(this.master);this.musicSrc.start()}
setEnabled(e){this.enabled=e;this.master&&this.context&&this.master.gain.setTargetAtTime(e?.4:0,this.context.currentTime,.15)}
setEngine(e,n){if(!this.context||!this.eOsc1)return;const t=this.context.currentTime,s=Math.max(0,Math.min(400,e||0)),r=s/340;
this.eSub.frequency.setTargetAtTime(24+r*34,t,.3);
this.eFilter.frequency.setTargetAtTime(90+r*300,t,.35);
this.eGain.gain.setTargetAtTime(n?.05+.06*r:0,t,.35);
this._eNF&&this._eNF.frequency.setTargetAtTime(120+r*560,t,.35);
this.eNG.gain.setTargetAtTime(n?.05+.09*r:0,t,.4);
this.windBP.frequency.setTargetAtTime(200+r*850,t,.35);this.wGain.gain.setTargetAtTime(n?.02+.11*r*r:0,t,.45)}
_shot(o,rv=0){const n=this.context,g=n.createGain();g.connect(this.master);if(rv>0&&this.verb){const s=n.createGain();s.gain.value=rv;g.connect(s);s.connect(this.verb)}o(g,n.currentTime);return g}
_env(g,a,p,dec){g.gain.setValueAtTime(.0001,a);g.gain.linearRampToValueAtTime(p,a+(a>0?.008:.005));g.gain.exponentialRampToValueAtTime(.0001,a+dec)}
_nz(g,n,a,dur,fType,f0,f1,q){const s=n.createBufferSource();s.buffer=this.noiseBuf;s.loop=!0;s.playbackRate.value=.9+Math.random()*.2;
const f=n.createBiquadFilter();f.type=fType;f.frequency.setValueAtTime(f0,a);if(f1)f.frequency.exponentialRampToValueAtTime(f1,a+dur);f.Q.value=q||.8;
s.connect(f);f.connect(g);s.start(a,Math.random()*1.5);s.stop(a+dur+.05);s.onended=()=>{s.disconnect();f.disconnect()}}
play(e){if(!this.context||!this.master||!this.enabled||this.context.state!=="running")return;const n=this.context;
if(e==="click"){this._shot((g,a)=>{this._env(g,0,.09,.06);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(880,a);o.frequency.exponentialRampToValueAtTime(620,a+.05);o.connect(g);o.start(a);o.stop(a+.08);o.onended=()=>o.disconnect()})}
else if(e==="lock"){this._shot((g,a)=>{this._env(g,0,.13,.09);const o=n.createOscillator();o.type="sine";o.frequency.value=1240;o.connect(g);o.start(a);o.stop(a+.1);o.onended=()=>o.disconnect()});
this._shot((g,a)=>{this._env(g,.1,.15,.12);const o=n.createOscillator();o.type="sine";o.frequency.value=1560;o.connect(g);o.start(a+.1);o.stop(a+.23);o.onended=()=>o.disconnect()})}
else if(e==="warning"){for(let i=0;i<2;i++)this._shot((g,a)=>{const t0=a+i*.2;this._env(g,i*.2,.11,.13);const o=n.createOscillator();o.type="triangle";o.frequency.setValueAtTime(i%2?520:640,t0);o.connect(g);o.start(t0);o.stop(t0+.14);o.onended=()=>o.disconnect()})}
else if(e==="gun"){this._shot((g,a)=>{this._env(g,0,.3,.05);this._nz(g,n,a,.05,"highpass",6500,0)});
this._shot((g,a)=>{this._env(g,0,.3,.09);this._nz(g,n,a,.09,"bandpass",190,0,1.2)});
this._shot((g,a)=>{this._env(g,0,.16,.06);const o=n.createOscillator();o.type="triangle";o.frequency.setValueAtTime(185,a);o.frequency.exponentialRampToValueAtTime(90,a+.05);o.connect(g);o.start(a);o.stop(a+.07);o.onended=()=>o.disconnect()})}
else if(e==="launch"){this._shot((g,a)=>{this._env(g,0,.55,.9);this._nz(g,n,a,.9,"bandpass",260,2600,1.2)},.3);
this._shot((g,a)=>{this._env(g,0,.4,.7);this._nz(g,n,a,.7,"lowpass",500,110)},.3);
this._shot((g,a)=>{this._env(g,0,.5,1);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(70,a);o.frequency.exponentialRampToValueAtTime(34,a+.8);o.connect(g);o.start(a);o.stop(a+1);o.onended=()=>o.disconnect()},.25);
for(let i=0;i<5;i++)this._shot((g,a)=>{this._env(g,i*.028,.1,.03);this._nz(g,n,a+i*.028,.03,"highpass",3000,0)});this._shot((g,a)=>{this._env(g,0,.3,.25);this._nz(g,n,a,.25,"highpass",2400,0)},.2)}
else if(e==="explosion"){this._shot((g,a)=>{this._env(g,0,.95,1.6);this._nz(g,n,a,1.6,"lowpass",2600,80)},.55);
this._shot((g,a)=>{this._env(g,0,.8,1.2);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(110,a);o.frequency.exponentialRampToValueAtTime(30,a+1.1);o.connect(g);o.start(a);o.stop(a+1.25);o.onended=()=>o.disconnect()},.45);
this._shot((g,a)=>{this._env(g,.04,.5,.9);this._nz(g,n,a+.04,.9,"bandpass",190,0,1.2)},.4);
this._shot((g,a)=>{this._env(g,0,.22,.12);this._nz(g,n,a,.12,"highpass",2500,0)},.2);
this._shot((g,a)=>{this._env(g,0,.1,.3);const o=n.createOscillator();o.type="square";o.frequency.value=300;o.detune.value=35;o.connect(g);o.start(a);o.stop(a+.32);o.onended=()=>o.disconnect()},.3)}
else if(e==="splash"){this._shot((g,a)=>{this._env(g,0,.45,.55);this._nz(g,n,a,.55,"bandpass",700,0,1)},.3);
this._shot((g,a)=>{this._env(g,.05,.2,.32);this._nz(g,n,a+.05,.32,"bandpass",1400,0,1.4)},.25);
this._shot((g,a)=>{this._env(g,0,.14,.3);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(280,a);o.frequency.exponentialRampToValueAtTime(80,a+.28);o.connect(g);o.start(a);o.stop(a+.3);o.onended=()=>o.disconnect()},.2)}
else if(e==="hit"){this._shot((g,a)=>{this._env(g,0,.32,.12);this._nz(g,n,a,.12,"lowpass",900,0)},.25);
this._shot((g,a)=>{this._env(g,0,.18,.09);const o=n.createOscillator();o.type="square";o.frequency.setValueAtTime(210,a);o.frequency.exponentialRampToValueAtTime(110,a+.08);o.connect(g);o.start(a);o.stop(a+.1);o.onended=()=>o.disconnect()},.2)}
else if(e==="flare"){this._shot((g,a)=>{this._env(g,0,.2,.5);this._nz(g,n,a,.5,"highpass",1100,0)},.25);
this._shot((g,a)=>{this._env(g,0,.16,.12);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(500,a);o.frequency.exponentialRampToValueAtTime(180,a+.1);o.connect(g);o.start(a);o.stop(a+.13);o.onended=()=>o.disconnect()},.15)}
else if(e==="surf"){this._shot((g,a)=>{this._env(g,0,.3,.6);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(120,a);o.frequency.exponentialRampToValueAtTime(55,a+.5);o.connect(g);o.start(a);o.stop(a+.6);o.onended=()=>o.disconnect()},.3);this._shot((g,a)=>{this._env(g,.1,.25,.5);this._nz(g,n,a+.1,.5,"bandpass",700,0,1)},.2)}
else{this._shot((g,a)=>{this._env(g,0,.08,.07);this._nz(g,n,a,.07,"bandpass",800,0,1)})}}
dispose(){try{this.eSub&&this.eSub.stop();this.eNoise&&this.eNoise.stop();this.windSrc&&this.windSrc.stop();this.musicSrc&&this.musicSrc.stop()}catch{}this.context&&this.context.close();this.context=null}}
