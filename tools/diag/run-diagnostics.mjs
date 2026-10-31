#!/usr/bin/env node
/**
 * Striker — gömülü tanılama + denge doğrulama aracı  (sıfır bağımlılık, sadece Node)
 * ---------------------------------------------------------------------------
 * Oyunun bundle'ı (minify React + Three.js) içinde geliştiricinin yazdığı 10 adet
 * simülasyon testi gömülü: `$w()`. Bu araç o fonksiyonu DEĞİŞTİRMEDEN Node altında
 * çalıştırır. `npm install` gerekmez.
 *
 * Yapılan tek müdahaleler (yalnızca geçici kopyada, tools/diag/.build/bundle.mjs):
 *   1. `<script type="module">` gövdesi HTML'den çıkarılır.
 *   2. Son satırdaki `createRoot(...).render(...)` bootstrap'ı kaldırılır — testler
 *      saf simülasyon mantığı (`Pa` sınıfı) olduğu için DOM/WebGL/Audio gerekmez.
 *   3. Otomatik tespit edilen minify tanımlayıcılar `export` edilir.
 *
 * Kullanım:
 *   node run-diagnostics.mjs ../../striker-dev/index.html            # 10 gömülü test
 *   node run-diagnostics.mjs ../../inner.html                        # temel build (regresyon A/B)
 *   node run-diagnostics.mjs ../../striker-dev/index.html --probe    # başarısız testin kök nedeni
 *   node run-diagnostics.mjs ../../striker-dev/index.html --balance  # füze ekonomisi dökümü
 *   node run-diagnostics.mjs ../../striker-dev/index.html --save     # save/migrasyon senaryoları (v1.9+)
 *
 * Çıkış kodu: 0 = hepsi geçti · 1 = en az bir test başarısız · 2 = araç hatası
 *
 * NOT: Bu araç tarayıcı render'ını, GPU performansını veya sesi TEST ETMEZ.
 *      Onlar için: python3 striker-dev/server.py → http://localhost:8080
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const MODE = args.includes('--probe') ? 'probe'
  : args.includes('--balance') ? 'balance'
  : args.includes('--save') ? 'save'
  : args.includes('--terrain') ? 'terrain' : 'diag';
const htmlArg = args.find((a) => !a.startsWith('--'));
const target = resolve(htmlArg || join(here, '../../striker-dev/index.html'));

// ============================================================ 1. bundle çıkar
const html = readFileSync(target, 'utf8');
const scriptMatch = html.match(/<script type="module" crossorigin>([\s\S]*?)<\/script>/);
if (!scriptMatch) fail(`HTML içinde inline modül script bulunamadı: ${target}`);
let js = scriptMatch[1];

const boot = js.match(/\w+\.createRoot\(document\.getElementById\("root"\)\)\.render\([^;]*\);\s*$/);
if (!boot) fail('bootstrap satırı bulunamadı — bundle yapısı değişmiş olabilir');
js = js.slice(0, boot.index);

// ============================================ 2. minify tanımlayıcıları otomatik bul
const findAny = (patterns, what) => {
  for (const re of patterns) { const m = js.match(re); if (m) return m[1]; }
  fail(`tanımlayıcı bulunamadı: ${what}`);
};
const DIAG = findAny([/function (\$?\w+)\(\)\{const \w+=\[\],\w+=\(\w+,\w+\)=>\{try\{\w+\(\),\w+\.push\(\{name:\w+,passed:!0/], 'tanılama koşucusu');
const MISSIONS = findAny([
  /(\w+)=\w+\.map\(\(\w+,\w+\)=>\{const \w+=Math\.floor\(\w+%\d+\/\d+\)/,   // v3.x : sezonlu (e%48/12)
  /(\w+)=\w+\.map\(\(\w+,\w+\)=>\{const \w+=Math\.floor\(\w+\/\d+\)/,       // v1.x
  /(\w+)=\w+\.map\(\(\w+,\w+\)=>\{[^}]{0,120}?kind:/,
], 'görev dizisi');
const AIRCRAFT = findAny([/(\w+)=\[\{id:"striker",code:/], 'uçak dizisi');
const DEFAULTS = findAny([/function (\w+)\(\)\{return\{version:\d+,callsign:/], 'varsayılan profil');
const SAVEKEY = findAny([
  /(\w+)="striker\.profile\.v\d+"/,      // v1.9+ : striker.profile.v3
  /(\w+)="idea-game\.striker\.v\d+"/,    // v1.8- : idea-game.striker.v2
], 'save anahtarı');
const SIM = findAny([/new (\w+)\(\w+\[0\],"striker"/], 'simülasyon sınıfı');

// v1.9 ile gelen save/migrasyon sembolleri (eski build'lerde yok -> opsiyonel)
const opt = (re) => (js.match(re) || [])[1] || null;
const MIG = opt(/function (__mig)\(/);
const RAW = opt(/function (__raw)\(/);
const LD = opt(/function (__ld)\(/);
const QKEY = opt(/(\w+)="striker\.profile\.v\d+\.quarantine"/);
const LKEYS = opt(/(\w+)=\["idea-game\.striker\.v2"/);
const exports = [
  `${DIAG} as __diag`, `${MISSIONS} as __missions`, `${AIRCRAFT} as __aircraft`,
  `${DEFAULTS} as __defaults`, `${SAVEKEY} as __saveKey`, `${SIM} as __Sim`,
  MIG && `${MIG} as __migFn`, RAW && `${RAW} as __rawFn`, LD && `${LD} as __ldFn`,
  QKEY && `${QKEY} as __quarantineKey`, LKEYS && `${LKEYS} as __legacyKeys`,
].filter(Boolean);
js += `\nexport{${exports.join(',')}};\n`;

const outDir = join(here, '.build');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'bundle.mjs');
writeFileSync(outFile, js, 'utf8');

// ======================================= 3. minimal DOM + WebAudio stub (bağımlılıksız)
const store = new Map();
const el = () => ({
  relList: { supports: () => true }, style: {}, dataset: {}, children: [],
  setAttribute() {}, getAttribute: () => null, appendChild() {}, removeChild() {},
  addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [],
  classList: { add() {}, remove() {}, contains: () => false },
});
globalThis.document = {
  createElement: el, createElementNS: el, createTextNode: (t) => ({ textContent: t }),
  querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
  addEventListener() {}, removeEventListener() {}, documentElement: el(), head: el(), body: el(),
};
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k), clear: () => store.clear(),
};
globalThis.window = Object.assign(globalThis.window || {}, {
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, localStorage: globalThis.localStorage,
  document: globalThis.document, MutationObserver: globalThis.MutationObserver,
  addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  setTimeout, clearTimeout, requestAnimationFrame: (f) => setTimeout(() => f(Date.now()), 16),
});
globalThis.window.window = globalThis.window;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;

class Param {
  constructor() { this.value = 0; }
  setValueAtTime() { return this; } linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; } setTargetAtTime() { return this; }
  cancelScheduledValues() { return this; } setValueCurveAtTime() { return this; }
}
class AudioNodeStub {
  constructor() {
    for (const p of ['gain', 'frequency', 'detune', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[p] = new Param();
    this.type = 'sine'; this.buffer = null; this.loop = false; this.onended = null;
  }
  connect(n) { return n; } disconnect() {} start() {} stop() {}
}
class AudioContextStub {
  constructor() { this.currentTime = 0; this.sampleRate = 48000; this.state = 'running'; this.destination = new AudioNodeStub(); }
  createGain() { return new AudioNodeStub(); } createOscillator() { return new AudioNodeStub(); }
  createBiquadFilter() { return new AudioNodeStub(); } createBufferSource() { return new AudioNodeStub(); }
  createDynamicsCompressor() { return new AudioNodeStub(); } createConvolver() { return new AudioNodeStub(); }
  createStereoPanner() { return new AudioNodeStub(); } createWaveShaper() { return new AudioNodeStub(); }
  createBuffer(c, l, r) { const d = Array.from({ length: c }, () => new Float32Array(l)); return { numberOfChannels: c, length: l, sampleRate: r, getChannelData: (i) => d[i] }; }
  createPeriodicWave() { return {}; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
}
globalThis.AudioContext = AudioContextStub;
globalThis.OfflineAudioContext = AudioContextStub;
globalThis.window.AudioContext = AudioContextStub;
globalThis.window.OfflineAudioContext = AudioContextStub;

// ================================================================= 4. içe aktar
const mod = await import(outFile);
const { __diag, __missions: MISSION_LIST, __aircraft: AIRCRAFT_LIST, __defaults, __saveKey, __Sim: Sim } = mod;

console.log(`hedef      : ${target.replace(process.cwd() + '/', '')}`);
console.log(`bundle     : ${scriptMatch[1].length.toLocaleString('tr-TR')} karakter  (bootstrap kaldırıldı)`);
console.log(`tanımlayıcı: diag=${DIAG} missions=${MISSIONS} aircraft=${AIRCRAFT} sim=${SIM}`);
console.log(`içerik     : ${AIRCRAFT_LIST.length} uçak · ${MISSION_LIST.length} görev · save="${__saveKey}" · kalite=${__defaults().preferences.quality}\n`);

const prefs = { ...__defaults().preferences, assisted: true, difficulty: 'normal' };
const INPUT = { yaw: 0, pitch: 0, throttle: 0.42, fire: false, boost: false };

if (MODE === 'diag') {
  const res = __diag();
  const pass = res.filter((r) => r.passed).length;
  for (const r of res) console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.name}${r.passed ? '' : '  -> ' + r.detail}`);
  console.log(`\nSONUÇ: ${pass}/${res.length} test geçti`);
  process.exit(pass === res.length ? 0 : 1);
}

if (MODE === 'save') {
  const { __ldFn, __quarantineKey, __legacyKeys, __saveKey: KEY } = mod;
  if (!__ldFn) fail('bu build\'de migrasyonlu yükleyici yok (v1.9+ gerekir)');
  const ls = globalThis.localStorage;
  const LEGACY = (__legacyKeys || ['idea-game.striker.v2'])[0];
  let fails = 0;
  const check = (name, cond, detail) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + detail}`);
    if (!cond) fails++;
  };
  const rich = {
    version: 2, callsign: 'MAVERICK', aircraft: 'spectre', credits: 4321,
    owned: ['striker', 'spectre', 'kraken'], upgrades: { striker: 3, kraken: 1 },
    records: { 0: { score: 2750, seconds: 143, stars: 3 }, 5: { score: 900, seconds: 300, stars: 1 } },
    preferences: { quality: 'ultra', language: 'de', sound: false, sensitivity: 1.5, assisted: true, cockpit: true, heavyMissiles: true, wingman: true, difficulty: 'hard', reducedMotion: true },
  };

  // --- senaryo 1: boş depolama
  ls.clear();
  let p1 = __ldFn();
  check('boş depolama → geçerli varsayılan profil', p1.version === 3 && p1.callsign === 'VIPER' && p1.credits === 600, JSON.stringify(p1).slice(0, 120));
  check('boş depolama → gereksiz yazma yok', ls.getItem(KEY) === null, 'yeni anahtara yazılmış');

  // --- senaryo 2: eski v2 profili (gerçek oyuncu verisi)
  ls.clear();
  ls.setItem(LEGACY, JSON.stringify(rich));
  const p2 = __ldFn();
  check('v2 profili v3\'e taşındı', p2.version === 3, 'version=' + p2.version);
  check('çağrı adı / kredi / uçak korundu', p2.callsign === 'MAVERICK' && p2.credits === 4321 && p2.aircraft === 'spectre', `${p2.callsign}/${p2.credits}/${p2.aircraft}`);
  check('sahip olunan uçaklar korundu', p2.owned.join() === 'striker,spectre,kraken', p2.owned.join());
  check('upgrade seviyeleri korundu', p2.upgrades.striker === 3 && p2.upgrades.kraken === 1, JSON.stringify(p2.upgrades));
  check('görev kayıtları (skor/yıldız) korundu', p2.records[0].score === 2750 && p2.records[0].stars === 3 && p2.records[5].stars === 1, JSON.stringify(p2.records));
  check('tercihler korundu (dil/kalite/zorluk)', p2.preferences.language === 'de' && p2.preferences.quality === 'ultra' && p2.preferences.difficulty === 'hard', JSON.stringify(p2.preferences));
  check('migrasyon yolu kaydedildi', Array.isArray(p2.migrations) && p2.migrations.includes('2->3'), JSON.stringify(p2.migrations));
  check('yeni anahtara kalıcı yazıldı', !!ls.getItem(KEY) && JSON.parse(ls.getItem(KEY)).version === 3, 'yazılmamış');
  check('ESKİ anahtar silinmedi (doğal yedek)', ls.getItem(LEGACY) === JSON.stringify(rich), 'eski anahtar değiştirilmiş/silinmiş');
  const again = __ldFn();
  check('ikinci açılışta tekrar taşımıyor (idempotent)', again.callsign === 'MAVERICK' && again.version === 3, 'tekrar okuma bozdu');

  // --- senaryo 3: bozuk kayıt
  ls.clear();
  ls.setItem(KEY, '{bozuk json,,,');
  const p3 = __ldFn();
  check('bozuk kayıt → geçerli varsayılana düşer', p3.version === 3 && p3.callsign === 'VIPER', JSON.stringify(p3).slice(0, 100));
  check('bozuk kayıt KARANTİNAYA alındı (silinmedi)', typeof ls.getItem(__quarantineKey) === 'string' && ls.getItem(__quarantineKey).length > 0, 'karantina boş');

  // --- senaryo 4: bilinmeyen (gelecek) sürüm
  ls.clear();
  ls.setItem(KEY, JSON.stringify({ version: 99, callsign: 'FUTURE', credits: 999999 }));
  const p4 = __ldFn();
  check('bilinmeyen sürüm profile SIZMAZ', p4.callsign === 'VIPER', 'callsign=' + p4.callsign);
  check('bilinmeyen sürüm karantinada saklandı', !!ls.getItem(__quarantineKey), 'karantina boş');

  console.log(`\nSONUÇ: ${fails === 0 ? 'tüm save senaryoları geçti' : fails + ' senaryo BAŞARISIZ'}  (anahtar: ${KEY}, eski: ${LEGACY}, karantina: ${__quarantineKey})`);
  process.exit(fails === 0 ? 0 : 1);
}

if (MODE === 'terrain') {
  // ================================================================== --terrain
  // Kullanıcı hatası: "dağın içinde hedef gösteriyor".
  // İki ayrı kusur ölçülür — ikisi de koddan gerçek zamanlı hesaplanır:
  //   A) GÖMÜLME  : hedef merkezi (veya gövde yarıçapı) arazi yüksekliğinin altında.
  //                 terr() Pa.prototype üzerinde olduğu için sim.terr(x,z) doğrudan çağrılır.
  //   B) GÖRÜŞ HATTI (LOS): oyuncudan hedefe ışın yürütülür; arada dağ varsa HUD
  //                 işaretçisi hâlâ çiziliyor mu? (occlusion culling yok)
  // Sıfır bağımlılık: üçgen/izdüşüm hesabı yok, yalnızca oyunun kendi terr() fonksiyonu.
  const BURIED = 1;          // merkezin zemin altında sayılması için eşik (m)
  const clipFactor = 0.5;    // gövde yarıçapının bu kadarı KARAYA girerse "kesişiyor"
  const SEA = 1;             // terr <= SEA ise deniz: gemi y=8'de DOĞRU konumdadır (yanlış pozitif önleme)
  const LOS_HEAD = 0.05;     // ışının oyuncuya yakın %5'i yoksay (uçak zaten alçak uçabilir)
  const LOS_TAIL = 0.85;     // ışının hedefe yakın %15'i yoksay — yoksa A kusuru C'yi şişirir

  // arazi örnekleyici: iki nokta arasında 60 m adımlarla yürü
  const los = (sim, from, to) => {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const len = Math.hypot(dx, dy, dz);
    const steps = Math.max(8, Math.min(400, Math.round(len / 60)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (t < LOS_HEAD || t > LOS_TAIL) continue;      // yalnızca ORTA bölüm: gerçek "araya dağ girdi"
      const y = from.y + dy * t;
      const h = sim.terr(from.x + dx * t, from.z + dz * t);
      if (h > y + 2) return { blocked: true, t, h, y };
    }
    return { blocked: false };
  };

  const buried = [], clipping = [], occluded = [], allX = [];
  let targets = 0, missionsBad = new Set(), worst = null, peak = -Infinity, peakAt = null;

  for (const mission of MISSION_LIST) {
    const sim = new Sim(mission, 'striker', prefs);
    // arazi zirvesini de raporla (dağ ne kadar yüksek?)
    for (let x = -4200; x <= 4200; x += 200) {
      for (let z = -7200; z <= 2000; z += 200) {
        const h = sim.terr(x, z);
        if (h > peak) { peak = h; peakAt = { x, z }; }
      }
    }
    let badHere = false;
    for (const e of sim.entities) {
      targets++;
      const p = e.position;
      allX.push(p.x);
      const h = sim.terr(p.x, p.z);
      const clearance = p.y - h;
      if (clearance <= BURIED) {
        buried.push({ m: mission.id, k: e.kind, air: !!e.airborne, x: p.x, y: p.y, z: p.z, h, clearance, r: e.radius });
        badHere = true;
      } else if (h > SEA && clearance < e.radius * clipFactor) {   // h>SEA: denizdeki gemi yanlış pozitif sayılmaz
        clipping.push({ m: mission.id, k: e.kind, air: !!e.airborne, x: p.x, y: p.y, z: p.z, h, clearance, r: e.radius });
        badHere = true;
      }
      const oc = los(sim, sim.player, p);
      if (oc.blocked) { occluded.push({ m: mission.id, k: e.kind, pct: oc.t * 100, h: oc.h, y: oc.y }); badHere = true; }
      if (!worst || clearance < worst.clearance) worst = { m: mission.id, k: e.kind, clearance, h, y: p.y };
    }
    if (badHere) missionsBad.add(mission.id);
  }

  console.log('=== ARAZİ (terr) — koddan okundu ===');
  console.log(`  zirve            : ${peak.toFixed(0)} m @ (${peakAt.x}, ${peakAt.z})`);
  console.log(`  incelenen hedef  : ${targets} hedef / ${MISSION_LIST.length} görev\n`);

  console.log('=== A) DAĞIN İÇİNE GÖMÜLMÜŞ HEDEF ===');
  if (!buried.length) console.log('  yok');
  for (const b of buried.slice(0, 25)) {
    console.log(`  görev ${String(b.m).padStart(2)}  ${b.k.padEnd(11)} ${b.air ? 'hava' : 'kara'}  y=${String(Math.round(b.y)).padStart(4)}  arazi=${String(Math.round(b.h)).padStart(4)}  → ${Math.round(b.clearance)} m  (yarıçap ${b.r})`);
  }
  if (buried.length > 25) console.log(`  ... ve ${buried.length - 25} hedef daha`);
  console.log(`  TOPLAM: ${buried.length}/${targets} hedef zeminin altında\n`);

  console.log('=== B) DAĞA KESİŞEN (gövdesi gömülü) HEDEF ===');
  if (!clipping.length) console.log('  yok');
  for (const c of clipping.slice(0, 25)) {
    console.log(`  görev ${String(c.m).padStart(2)}  ${c.k.padEnd(11)} y=${String(Math.round(c.y)).padStart(4)}  arazi=${String(Math.round(c.h)).padStart(4)}  açıklık=${Math.round(c.clearance)} m < ${Math.round(c.r * clipFactor)} m eşik`);
  }
  if (clipping.length > 25) console.log(`  ... ve ${clipping.length - 25} hedef daha`);
  console.log(`  TOPLAM: ${clipping.length}/${targets}\n`);

  console.log('=== C) GÖRÜŞ HATTI KAPALI AMA HUD İŞARETÇİSİ ÇİZİLİYOR ===');
  if (!occluded.length) console.log('  yok');
  for (const o of occluded.slice(0, 25)) {
    console.log(`  görev ${String(o.m).padStart(2)}  ${o.k.padEnd(11)} hattın %${o.pct.toFixed(0)}'inde dağ: zemin ${Math.round(o.h)} m > ışın ${Math.round(o.y)} m`);
  }
  if (occluded.length > 25) console.log(`  ... ve ${occluded.length - 25} hedef daha`);
  console.log(`  TOPLAM: ${occluded.length}/${targets}\n`);

  console.log(`  en kötü hedef    : görev ${worst.m} ${worst.k} → açıklık ${Math.round(worst.clearance)} m (y=${worst.y}, arazi=${Math.round(worst.h)})`);
  console.log(`  etkilenen görev  : ${missionsBad.size}/${MISSION_LIST.length}`);

  // --- yerleşim dağılımı: düzeltme hedefleri merkezde YIĞMIŞ mı?
  // (v6 kaçış döngüsü hedefleri uzağa savuruyordu; yeni arama en yakın geçerli x'i
  //  seçtiği için deniz boşluğuna, yani merkez hattına çekebilir. Bunu görünür kıl.)
  const xs = allX.map((v) => Math.abs(v));
  xs.sort((a, b) => a - b);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const q = (p) => xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];
  console.log(`\n=== YERLEŞİM DAĞILIMI (|x|, kara hedefleri dahil tümü) ===`);
  console.log(`  min ${xs[0].toFixed(0)} m · medyan ${q(0.5).toFixed(0)} m · ort ${mean.toFixed(0)} m · %90 ${q(0.9).toFixed(0)} m · maks ${xs[xs.length - 1].toFixed(0)} m`);
  console.log(`  merkez hattına yığılma (|x|<300 m): ${xs.filter((v) => v < 300).length}/${xs.length} hedef`);

  const fails = buried.length + clipping.length;
  console.log(`\nSONUÇ: ${fails === 0 ? 'temiz — hiçbir hedef araziye gömülü değil' : fails + ' hedef arazi kusuru taşıyor'}`);
  process.exit(fails === 0 ? 0 : 1);
}

if (MODE === 'probe') {
  const sim = new Sim(MISSION_LIST[0], 'striker', prefs);
  const step = (n) => { for (let i = 0; i < n && !sim.result; i++) { sim.update(1 / 60, INPUT); sim.events.length = 0; } };
  step(90);
  const tgt = sim.entities[0];
  const hp0 = tgt.hp;
  sim.fireMissile();
  const missile = sim.projectiles.find((p) => p.active && p.kind === 'missile');
  const dmg = missile?.damage;
  let hitFrame = -1;
  for (let f = 0; f < 240; f++) {
    sim.update(1 / 60, INPUT);
    if (hitFrame < 0 && sim.events.some((e) => e.kind === 'hit')) hitFrame = f;
    sim.events.length = 0;
  }
  const ok = sim.kills >= 1 && sim.score > 0;
  console.log('=== PROB: "Lock, guided missile, impact" ===');
  console.log(`  görev            : ${MISSION_LIST[0].name} (${MISSION_LIST[0].kind})`);
  console.log(`  ilk hedef        : ${tgt.kind}  hp=${hp0}  mesafe=${Math.abs(tgt.position.z).toFixed(0)} m`);
  console.log(`  füze hasarı      : ${dmg}   (mSet=${JSON.stringify(sim.mSet)})`);
  console.log(`  vuruş anı        : ${hitFrame < 0 ? 'yok' : hitFrame + ' kare (' + (hitFrame / 60).toFixed(2) + ' sn)'}`);
  console.log(`  hedef hp         : ${hp0} → ${tgt.hp}`);
  console.log(`  kills / score    : ${sim.kills} / ${sim.score}`);
  console.log(`  test beklentisi  : kills>=1 && score>0  →  ${ok ? 'KARŞILANDI' : 'KARŞILANMADI'}`);
  process.exit(ok ? 0 : 1);
}

// ================================================== 5. --balance: füze ekonomisi
// Düşman HP'leri koddan gerçek zamanlı okunur (sabit sayı yazılmaz — denge değişince araç yalan söylemesin)
const hpByKind = new Map();
for (let i = 0; i < Math.min(8, MISSION_LIST.length); i++) {
  const s = new Sim(MISSION_LIST[i], 'striker', prefs);
  for (const e of s.entities) if (!hpByKind.has(e.kind)) hpByKind.set(e.kind, e.hp);
}
const hpList = [...hpByKind.entries()].sort((a, b) => a[1] - b[1]);
const light = hpList[0];
const heavy = hpList[hpList.length - 1];
console.log('=== düşman HP (koddan okundu) ===');
console.log('  ' + hpList.map(([k, v]) => `${k}=${v}`).join('  '));

console.log(`\n=== mSet tabloları  [hız, ömür(sn), hasar, dolum(sn)] ===`);
console.log(`  uçak      hız  ömür  hasar  dolum | ${light[0]}(${light[1]})→atış  ${heavy[0]}(${heavy[1]})→atış | kapasite`);
const rows = AIRCRAFT_LIST.map((a) => {
  const s = new Sim(MISSION_LIST[0], a.id, prefs);
  const [spd, life, dmg, reload] = s.mSet;
  return { id: a.id, spd, life, dmg, reload, sL: Math.ceil(light[1] / dmg), sH: Math.ceil(heavy[1] / dmg), cap: a.missiles };
});
for (const r of rows) {
  console.log(`  ${r.id.padEnd(9)} ${String(r.spd).padEnd(4)} ${String(r.life).padEnd(5)} ${String(r.dmg).padEnd(6)} ${String(r.reload).padEnd(5)} | ${String(r.sL).padEnd(16)} ${String(r.sH).padEnd(17)} | ${r.cap}`);
}
const distinct = new Set(rows.map((r) => [r.spd, r.life, r.dmg, r.reload].join('|'))).size;
const oneShot = rows.filter((r) => r.sL === 1).length;
console.log(`\n  farklı füze tablosu : ${distinct}/${rows.length}  ${distinct === 1 ? '← HEPSİ VARSAYILANA ÇÖKMÜŞ (B-12)' : '← uçaklar ayrışıyor'}`);
console.log(`  en hafif hedefi tek füzeyle öldüren: ${oneShot}/${rows.length}`);

const s0 = new Sim(MISSION_LIST[0], 'striker', prefs);
const dmg0 = s0.mSet[2];
const need = s0.entities.reduce((t, e) => t + Math.ceil(e.hp / dmg0), 0);
console.log(`\n=== ${MISSION_LIST[0].name} — füze ekonomisi (striker, hasar ${dmg0}) ===`);
console.log(`  hedefler         : ${s0.entities.map((e) => `${e.kind}(${e.hp})`).join(' ')}`);
console.log(`  gereken atış     : ${need}   kapasite: ${s0.missiles} füze + ${s0.bombs} bomba`);
console.log(`  açık             : ${Math.max(0, need - s0.missiles)} atış → top/bomba ile kapanmalı`);

const s = new Sim(MISSION_LIST[0], 'striker', prefs);
let fired = 0, emptyAt = -1;
for (let f = 0; f < 10800 && !s.result; f++) {
  s.update(1 / 60, { ...INPUT, fire: true });
  if (s.lock >= 1) { const before = s.missiles; s.fireMissile(); if (s.missiles < before) fired++; }
  if (s.missiles === 0 && emptyAt < 0) emptyAt = f;
  s.events.length = 0;
}
console.log(`\n=== asistli tam sorti (striker) ===`);
console.log(`  sonuç            : ${s.result ? (s.result.success ? 'BAŞARILI' : 'BAŞARISIZ (' + s.result.reason + ')') : 'BİTMEDİ'}`);
console.log(`  süre / kills     : ${(s.time || 0).toFixed(1)} sn · ${s.kills}/${s.entities.length} · skor ${s.score}`);
console.log(`  ateşlenen füze   : ${fired} · kalan ${s.missiles} · füze bitişi: ${emptyAt < 0 ? 'bitmedi' : (emptyAt / 60).toFixed(1) + ' sn'}`);
console.log(`  görev limiti     : ${MISSION_LIST[0].limit} sn (par ${MISSION_LIST[0].par} sn)`);
process.exit(0);

function fail(msg) { console.error('HATA: ' + msg); process.exit(2); }
