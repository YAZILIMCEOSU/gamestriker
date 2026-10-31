class zw{context=null;master=null;comp=null;enabled=!0;eOsc1=null;eOsc2=null;eSub=null;eFilter=null;eGain=null;whOsc=null;whGain=null;windSrc=null;windBP=null;wGain=null;lfo=null;lfoG=null;noiseBuf=null;
async start(){try{if(!this.context){const n=this.context=new (window.AudioContext||window.webkitAudioContext)();
this.master=n.createGain();this.master.gain.value=this.enabled?.34:0;
this.comp=n.createDynamicsCompressor();this.comp.threshold.value=-20;this.comp.knee.value=26;this.comp.ratio.value=6;this.comp.attack.value=.006;this.comp.release.value=.3;
this.master.connect(this.comp);this.comp.connect(n.destination);
this.noiseBuf=n.createBuffer(1,n.sampleRate*2,n.sampleRate);const d=this.noiseBuf.getChannelData(0);let la=0;
for(let i=0;i<d.length;i++){const w=Math.random()*2-1;la=(la+.03*w)/1.03;d[i]=(w*.5+la*1.5)*.45;}
this.eOsc1=n.createOscillator();this.eOsc1.type="sawtooth";this.eOsc1.frequency.value=40;
this.eOsc2=n.createOscillator();this.eOsc2.type="sawtooth";this.eOsc2.frequency.value=40.3;
this.eSub=n.createOscillator();this.eSub.type="triangle";this.eSub.frequency.value=20;
const subG=n.createGain();subG.gain.value=.4;
this.eFilter=n.createBiquadFilter();this.eFilter.type="lowpass";this.eFilter.frequency.value=140;this.eFilter.Q.value=.9;
this.eGain=n.createGain();this.eGain.gain.value=0;
this.eOsc1.connect(this.eFilter);this.eOsc2.connect(this.eFilter);this.eSub.connect(subG);subG.connect(this.eFilter);
this.eFilter.connect(this.eGain);this.eGain.connect(this.master);
this.lfo=n.createOscillator();this.lfo.type="sine";this.lfo.frequency.value=4.1;this.lfoG=n.createGain();this.lfoG.gain.value=26;
this.lfo.connect(this.lfoG);this.lfoG.connect(this.eFilter.detune);
this.whOsc=n.createOscillator();this.whOsc.type="sine";this.whOsc.frequency.value=420;
this.whGain=n.createGain();this.whGain.gain.value=0;this.whOsc.connect(this.whGain);this.whGain.connect(this.master);
this.windSrc=n.createBufferSource();this.windSrc.buffer=this.noiseBuf;this.windSrc.loop=!0;
this.windBP=n.createBiquadFilter();this.windBP.type="bandpass";this.windBP.frequency.value=280;this.windBP.Q.value=.6;
this.wGain=n.createGain();this.wGain.gain.value=0;
this.windSrc.connect(this.windBP);this.windBP.connect(this.wGain);this.wGain.connect(this.master);
this.eOsc1.start();this.eOsc2.start();this.eSub.start();this.lfo.start();this.whOsc.start();this.windSrc.start();}
await this.context.resume()}catch{}}
setEnabled(e){this.enabled=e;this.master&&this.context&&this.master.gain.setTargetAtTime(e?.34:0,this.context.currentTime,.15)}
setEngine(e,n){if(!this.context||!this.eOsc1)return;const t=this.context.currentTime,s=Math.max(0,Math.min(400,e||0)),r=s/340;
this.eOsc1.frequency.setTargetAtTime(34+r*66,t,.3);this.eOsc2.frequency.setTargetAtTime(34.3+r*66.5,t,.3);
this.eSub.frequency.setTargetAtTime(17+r*33,t,.3);
this.eFilter.frequency.setTargetAtTime(120+r*640,t,.35);
this.eGain.gain.setTargetAtTime(n?.055+.075*r:0,t,.35);
this.whOsc.frequency.setTargetAtTime(360+r*880,t,.35);this.whGain.gain.setTargetAtTime(n?.005+.014*r:0,t,.4);
this.windBP.frequency.setTargetAtTime(220+r*900,t,.35);this.wGain.gain.setTargetAtTime(n?.025+.13*r*r:0,t,.45)}
_shot(o){const n=this.context,g=n.createGain();g.connect(this.master);o(g,n.currentTime);return g}
_env(g,a,p,dec){g.gain.setValueAtTime(.0001,a);g.gain.linearRampToValueAtTime(p,a+(a>0?.008:.006));g.gain.exponentialRampToValueAtTime(.0001,a+dec)}
_nz(g,n,a,dur,fType,f0,f1,q){const s=n.createBufferSource();s.buffer=this.noiseBuf;s.loop=!0;s.playbackRate.value=.9+Math.random()*.2;
const f=n.createBiquadFilter();f.type=fType;f.frequency.setValueAtTime(f0,a);if(f1)f.frequency.exponentialRampToValueAtTime(f1,a+dur);f.Q.value=q||.8;
s.connect(f);f.connect(g);s.start(a,Math.random()*1.5);s.stop(a+dur+.05);s.onended=()=>{s.disconnect();f.disconnect()}}
play(e){if(!this.context||!this.master||!this.enabled||this.context.state!=="running")return;const n=this.context;
if(e==="click"){this._shot((g,a)=>{this._env(g,0,.09,.06);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(880,a);o.frequency.exponentialRampToValueAtTime(620,a+.05);o.connect(g);o.start(a);o.stop(a+.08);o.onended=()=>o.disconnect()})}
else if(e==="lock"){this._shot((g,a)=>{this._env(g,0,.12,.09);const o=n.createOscillator();o.type="sine";o.frequency.value=1240;o.connect(g);o.start(a);o.stop(a+.1);o.onended=()=>o.disconnect()});
this._shot((g,a)=>{this._env(g,.1,.14,.11);const o=n.createOscillator();o.type="sine";o.frequency.value=1560;o.connect(g);o.start(a+.1);o.stop(a+.22);o.onended=()=>o.disconnect()})}
else if(e==="warning"){for(let i=0;i<2;i++)this._shot((g,a)=>{const t0=a+i*.2;this._env(g,i*.2,.1,.13);const o=n.createOscillator();o.type="triangle";o.frequency.setValueAtTime(i%2?520:640,t0);o.connect(g);o.start(t0);o.stop(t0+.14);o.onended=()=>o.disconnect()})}
else if(e==="gun"){this._shot((g,a)=>{this._env(g,0,.2,.06);this._nz(g,n,a,.06,"lowpass",1600,0)});
this._shot((g,a)=>{this._env(g,0,.14,.05);const o=n.createOscillator();o.type="square";o.frequency.setValueAtTime(140,a);o.frequency.exponentialRampToValueAtTime(70,a+.05);o.connect(g);o.start(a);o.stop(a+.07);o.onended=()=>o.disconnect()})}
else if(e==="launch"){this._shot((g,a)=>{this._env(g,0,.38,.8);this._nz(g,n,a,.8,"bandpass",300,2200,1.1)});
this._shot((g,a)=>{this._env(g,0,.3,.55);this._nz(g,n,a,.55,"lowpass",450,110)});
for(let i=0;i<4;i++)this._shot((g,a)=>{this._env(g,i*.03,.08,.03);this._nz(g,n,a+i*.03,.03,"highpass",1400,0)})}
else if(e==="explosion"){this._shot((g,a)=>{this._env(g,0,.65,1.3);this._nz(g,n,a,1.3,"lowpass",2200,90)});
this._shot((g,a)=>{this._env(g,0,.55,1);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(90,a);o.frequency.exponentialRampToValueAtTime(26,a+.95);o.connect(g);o.start(a);o.stop(a+1.05);o.onended=()=>o.disconnect()});
this._shot((g,a)=>{this._env(g,0,.08,.25);const o=n.createOscillator();o.type="square";o.frequency.value=300;o.detune.value=35;o.connect(g);o.start(a);o.stop(a+.27);o.onended=()=>o.disconnect()})}
else if(e==="splash"){this._shot((g,a)=>{this._env(g,0,.4,.5);this._nz(g,n,a,.5,"bandpass",700,0,1)});
this._shot((g,a)=>{this._env(g,.05,.18,.3);this._nz(g,n,a+.05,.3,"bandpass",1400,0,1.4)});
this._shot((g,a)=>{this._env(g,0,.12,.28);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(280,a);o.frequency.exponentialRampToValueAtTime(80,a+.26);o.connect(g);o.start(a);o.stop(a+.28);o.onended=()=>o.disconnect()})}
else if(e==="hit"){this._shot((g,a)=>{this._env(g,0,.26,.11);this._nz(g,n,a,.11,"lowpass",900,0)});
this._shot((g,a)=>{this._env(g,0,.15,.08);const o=n.createOscillator();o.type="square";o.frequency.setValueAtTime(210,a);o.frequency.exponentialRampToValueAtTime(110,a+.08);o.connect(g);o.start(a);o.stop(a+.09);o.onended=()=>o.disconnect()})}
else if(e==="flare"){this._shot((g,a)=>{this._env(g,0,.16,.45);this._nz(g,n,a,.45,"highpass",1100,0)});
this._shot((g,a)=>{this._env(g,0,.14,.11);const o=n.createOscillator();o.type="sine";o.frequency.setValueAtTime(500,a);o.frequency.exponentialRampToValueAtTime(180,a+.1);o.connect(g);o.start(a);o.stop(a+.12);o.onended=()=>o.disconnect()})}
else{this._shot((g,a)=>{this._env(g,0,.08,.07);this._nz(g,n,a,.07,"bandpass",800,0,1)})}}
dispose(){try{this.eOsc1&&this.eOsc1.stop();this.eOsc2&&this.eOsc2.stop();this.eSub&&this.eSub.stop();this.lfo&&this.lfo.stop();this.whOsc&&this.whOsc.stop();this.windSrc&&this.windSrc.stop()}catch{}this.context&&this.context.close();this.context=null}}
