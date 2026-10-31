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
  : args.includes('--terrain') ? 'terrain'
  : args.includes('--audit') ? 'audit'
  : args.includes('--world') ? 'world' : 'diag';
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

if (MODE === 'world') {
  // ================================================================== --world
  // "her görev farklı lokasyon + hava şartları" — plan verisi gerçekten devrede mi?
  // missions_192.json (build girdisi) ile build'i BİREBİR karşılaştırır.
  const planPath = resolve(htmlArg ? dirname(target) : join(here, '../../striker-dev'), 'plan', 'missions_192.json');
  let PLAN = null;
  try { PLAN = JSON.parse(readFileSync(planPath, 'utf8')); } catch (e) { fail(`plan okunamadı: ${planPath} (${e.message})`); }

  let fails = 0;
  const chk = (name, cond, detail) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + detail}`); if (!cond) fails++; };
  const F = ['region', 'regionKey', 'regionNote', 'weatherKey', 'conceptType', 'twist'];

  console.log(`plan       : ${planPath.replace(process.cwd() + '/', '')}  (${PLAN.length} konsept)`);
  console.log(`görevler   : ${MISSION_LIST.length}\n`);

  // 1) alan doluluğu
  const empty = [];
  for (const m of MISSION_LIST) for (const f of F) {
    if (typeof m[f] !== 'string' || !m[f].length) empty.push(`${m.id}.${f}`);
  }
  chk(`tüm görevlerde 6 konsept alanı dolu`, empty.length === 0, empty.slice(0, 6).join(', ') + (empty.length > 6 ? ` …(${empty.length})` : ''));

  // 2) motor indeksleri geçerli aralıkta (tüketiciler 0..5 / 0..4 bekliyor)
  const badB = MISSION_LIST.filter((m) => !(m.biome >= 0 && m.biome <= 5));
  const badW = MISSION_LIST.filter((m) => !(m.weather >= 0 && m.weather <= 4));
  chk('biome 0..5 aralığında (buildIslands/biomePal)', badB.length === 0, `${badB.length} görev: ${badB.slice(0, 4).map((m) => m.id + '=' + m.biome).join(', ')}`);
  chk('weather 0..4 aralığında (setWeather/HUD overlay)', badW.length === 0, `${badW.length} görev: ${badW.slice(0, 4).map((m) => m.id + '=' + m.weather).join(', ')}`);

  // 3) 0..191 plan ile BİREBİR eşleşiyor mu
  const WMAP = { 'açık': 0, 'sisli': 2, 'yağmurlu': 1, 'karlı': 3, 'fırtınalı': 4, 'gece': 0, 'tozlu': 2, 'alacakaranlık': 0 };
  const mism = [];
  for (const c of PLAN) {
    const i = c.id - PLAN[0].id;              // plan id 301..492 -> 0..191
    const m = MISSION_LIST.find((x) => x.id === i);
    if (!m) { mism.push(`${i}: görev yok`); continue; }
    if (m.region !== c.region || m.conceptType !== c.type || m.weatherKey !== c.weather || m.twist !== c.twist) {
      mism.push(`${i}: ${m.region}/${m.weatherKey} ≠ ${c.region}/${c.weather}`);
    }
    if (m.weather !== WMAP[c.weather]) mism.push(`${i}: weather ${m.weather} ≠ ${WMAP[c.weather]} (${c.weather})`);
  }
  chk('192 konsept plan ile birebir eşleşiyor', mism.length === 0, mism.slice(0, 4).join(' | ') + (mism.length > 4 ? ` …(${mism.length})` : ''));

  // 4) gece / alacakaranlık -> sunset=1 (mevcut gece ışığı devreye giriyor)
  const night = MISSION_LIST.filter((m) => m.weatherKey === 'gece' || m.weatherKey === 'alacakaranlık');
  chk('gece/alacakaranlık görevlerde sunset=1', night.length > 0 && night.every((m) => m.sunset === 1), `${night.filter((m) => m.sunset !== 1).length}/${night.length} aykırı`);

  // 5) çeşitlilik dağılımı
  const cnt = (f) => new Set(MISSION_LIST.map((m) => m[f])).size;
  const uniqCombo = new Set(MISSION_LIST.map((m) => `${m.region}|${m.weatherKey}|${m.twist}`)).size;
  console.log('\n=== DAĞILIM ===');
  console.log(`  bölge      : ${cnt('region')} farklı`);
  console.log(`  hava       : ${cnt('weatherKey')} farklı`);
  console.log(`  twist      : ${cnt('twist')} farklı`);
  console.log(`  konsept tür: ${cnt('conceptType')} farklı`);
  console.log(`  biome      : ${cnt('biome')} farklı (motor 6 destekliyor)`);
  console.log(`  benzersiz bölge+hava+twist kombinasyonu: ${uniqCombo}/${MISSION_LIST.length}`);
  chk('en az 20 bölge kullanılıyor', cnt('region') >= 20, `${cnt('region')}`);
  chk('8 hava durumu da kullanılıyor', cnt('weatherKey') === 8, `${cnt('weatherKey')}`);
  chk('8 twist de kullanılıyor', cnt('twist') === 8, `${cnt('twist')}`);

  console.log('\n=== ÖRNEK (ilk 6 görev) ===');
  for (const m of MISSION_LIST.slice(0, 6)) {
    console.log(`  #${String(m.id).padStart(3)} ${m.region.padEnd(18)} ${String(m.weatherKey).padEnd(14)} biome${m.biome} w${m.weather} sunset${m.sunset} · ${m.conceptType} · ${m.twist}`);
  }
  console.log('\n=== ÖZEL GÖREVLER (id≥192, elle yazılmış) ===');
  for (const m of MISSION_LIST.filter((x) => x.id >= 192).slice(0, 4)) {
    console.log(`  #${m.id} ${m.name} → ${m.region} / ${m.weatherKey} / ${m.twist}`);
  }

  console.log(`\nSONUÇ: ${fails === 0 ? 'plan verisi devrede ve planla birebir' : fails + ' kontrol BAŞARISIZ'}`);
  process.exit(fails === 0 ? 0 : 1);
}

if (MODE === 'audit') {
  // ================================================================== --audit
  // Gömülü test paketi FAIL verdiğinde: iddia edilen değer ile GERÇEK değeri
  // yan yana döker. Amaç "test mi bayat, oyun mu bozuk" sorusunu kanıtla ayırmak.
  // Oyunun kendi $w() fonksiyonuna DOKUNMAZ — aynı sınıfları dışarıdan çalıştırır.
  const PR = { ...__defaults().preferences, assisted: true, difficulty: 'normal' };
  const IN = { yaw: 0, pitch: 0, throttle: 0.42, fire: false, boost: false };
  const step = (u, n, fire = false) => {
    for (let i = 0; i < n && !u.result; i++) {
      u.update(1 / 60, { ...IN, fire });
      if (fire && u.lock >= 1) u.fireMissile();
      u.events.length = 0;
    }
  };
  const L = (k, v) => console.log(`  ${k.padEnd(34)} ${v}`);

  const m0 = MISSION_LIST[0];
  console.log('=== 1) "193 mission configurations" ===');
  L('dn.length (gerçek)', MISSION_LIST.length);
  L('benzersiz id', new Set(MISSION_LIST.map((m) => m.id)).size);
  L('testin beklediği', 193);
  L('id aralığı', `${Math.min(...MISSION_LIST.map((m) => m.id))} – ${Math.max(...MISSION_LIST.map((m) => m.id))}`);
  L('tekrar eden id var mı', MISSION_LIST.length === new Set(MISSION_LIST.map((m) => m.id)).size ? 'HAYIR' : 'EVET');

  console.log('\n=== 2) görev 0 içeriği (birçok test dn[0] üzerinden koşuyor) ===');
  L('id / kind', `${m0.id} / ${m0.kind}`);
  L('hedefler', m0.targets.join(', '));
  L('limit / par', `${m0.limit} / ${m0.par}`);
  {
    const u = new Sim(m0, 'striker', PR);
    L('entities', u.entities.map((e) => `${e.kind}(hp${e.hp},y${Math.round(e.position.y)})`).join(' '));
    L('hava hedefi sayısı', u.entities.filter((e) => e.airborne).length);
  }

  console.log('\n=== 3) "Lock, guided missile, impact" — kilit ne zaman oluşuyor? ===');
  {
    const u = new Sim(m0, 'striker', PR);
    let at = -1;
    for (let f = 0; f < 1800 && !u.result; f++) {
      u.update(1 / 60, IN); u.events.length = 0;
      if (u.lock >= 1) { at = f; break; }
    }
    L('test 90 kare sonra lock===1 bekliyor', '—');
    L('lock gerçekte hangi karede', at < 0 ? '1800 karede OLUŞMADI' : `${at} kare (${(at / 60).toFixed(1)} sn)`);
    L('lock değeri (90. karede)', (() => { const v = new Sim(m0, 'striker', PR); for (let f = 0; f < 90; f++) { v.update(1 / 60, IN); v.events.length = 0; } return v.lock; })());
    L('füze hasarı (mSet)', JSON.stringify(new Sim(m0, 'striker', PR).mSet));
  }

  console.log('\n=== 4) "Countermeasures remove threats" ===');
  {
    const u = new Sim(m0, 'striker', PR);
    const p = u.projectiles[0];
    p.active = true; p.kind = 'hostile'; p.position.copy(u.player); p.life = 5;
    const f0 = u.flares;
    u.deployFlare();
    L('fişek sayısı önce/sonra', `${f0} → ${u.flares}   (test 5 bekliyor)`);
    L('tehdit mermisi active', `${p.active}   (test false bekliyor)`);
  }

  console.log('\n=== 5) "Extraction and stable result" ===');
  {
    const u = new Sim(m0, 'striker', PR);
    u.entities.forEach((d) => { d.hp = 0; });
    u.update(1 / 60, IN);
    L('phase (test "return" bekliyor)', u.phase);
    step(u, 1200);
    L('result', u.result ? `success=${u.result.success} reason=${u.result.reason || '-'}` : 'null');
  }

  console.log('\n=== 6) "Timeout and campaign unlock" ===');
  {
    const u = new Sim(m0, 'striker', PR);
    u.time = u.mission.limit;
    u.update(1 / 60, IN);
    L('result.reason (test "timeout")', u.result ? u.result.reason : 'null');
  }

  console.log('\n=== 7) "First sortie combat-to-return loop" ===');
  {
    const u = new Sim(m0, 'striker', PR);
    step(u, 10800, true);
    L('result', u.result ? `success=${u.result.success} reason=${u.result.reason || '-'}` : 'BİTMEDİ (10800 kare)');
    L('kills / hedef', `${u.kills} / ${u.entities.length}`);
    L('skor / süre', `${u.score} / ${(u.time || 0).toFixed(1)} sn`);
    L('kalan can / füze', `${u.health} / ${u.missiles}`);
  }

  console.log('\n=== 8) "Wingman engages nearby hostiles" ===');
  {
    const u = new Sim(m0, 'striker', { ...PR, wingman: true });
    u.player.copy(u.entities[0].position); u.player.y += 120; u.player.z -= 420;
    let fired = -1;
    for (let f = 0; f < 300; f++) {
      u.update(1 / 60, IN); u.events.length = 0;
      if (u.projectiles.some((p) => p.active && p.kind === 'missile')) { fired = f; break; }
    }
    L('wingman füze attı mı (300 kare)', fired < 0 ? 'HAYIR' : `EVET, ${fired}. karede`);
  }

  console.log('\n=== 9) "Heavy missile mode increases damage" ===');
  {
    const norm = new Sim(m0, 'striker', PR); step(norm, 90); norm.fireMissile();
    const heavy = new Sim(m0, 'striker', { ...PR, heavyMissiles: true }); step(heavy, 90); heavy.fireMissile();
    const g = (u) => { const p = u.projectiles.find((q) => q.active && q.kind === 'missile'); return p ? p.damage : null; };
    L('normal füze hasarı', g(norm));
    L('ağır füze hasarı (test >150)', g(heavy));
    L('mSet normal / ağır', `${JSON.stringify(norm.mSet)} / ${JSON.stringify(heavy.mSet)}`);
  }
  console.log('\n=== 10) AYNI 8 İDDİA, DOĞRU ÖN KOŞULLARLA ===');
  // v3.78 ile gelen üç gerçek kural (kaynaktan okundu):
  //   phase    : takeoff -> combat -> return -> landing  (testler combat varsayıyordu)
  //   unl      : Object.keys(save.records).length  (wingman >=3, ağır füze >=6)
  //   Rl(s,e)  : s<3 || s===4 || s===11 || !!e[s-1]   (ilk 3 görev hep açık)
  // Kurucu imzası (kaynaktan okundu): constructor(e,n,a,o=0,q5)
  //   4. param = upgrade (SAYI)   5. param = {upA,upV,unl}
  // unl = Object.keys(save.records).length -> wingman>=3, ağır füze>=6
  const PROG = { upA: 0, upV: 0, unl: 10 };
  const mk0 = (prefs, unl) => new Sim(m0, 'striker', prefs, 0, unl == null ? undefined : { ...PROG, unl });
  const toCombat = (u, max = 3000) => { let f = 0; while (f < max && u.phase === 'takeoff' && !u.result) { u.update(1 / 60, IN); u.events.length = 0; f++; } return f; };
  let ok = 0, tot = 0;
  const chk = (name, cond, detail) => {
    tot++; if (cond) ok++;
    console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + detail}`);
  };

  { // 1 — görev sayısı: sabit 193 değil, benzersizlik + pozitif sayı
    const ids = MISSION_LIST.map((m) => m.id);
    chk('görev kimlikleri benzersiz ve >0', MISSION_LIST.length > 0 && new Set(ids).size === ids.length, `${MISSION_LIST.length} görev`);
  }
  { // 2 — kilit oluşuyor (sabit 90 kare değil, makul bütçe içinde)
    const u = new Sim(m0, 'striker', PR); toCombat(u);
    let at = -1;
    for (let f = 0; f < 1800 && !u.result; f++) { u.update(1 / 60, IN); u.events.length = 0; if (u.lock >= 1) { at = f; break; } }
    chk('kilit 30 sn içinde oluşuyor', at >= 0, 'oluşmadı');
  }
  { // 3 — fişek: önce combat fazına geç
    const u = new Sim(m0, 'striker', PR); toCombat(u);
    const p = u.projectiles[0];
    p.active = true; p.kind = 'hostile'; p.position.copy(u.player); p.life = 5;
    const f0 = u.flares; u.deployFlare();
    chk('fişek tehdidi düşürüyor (combat fazında)', !p.active && u.flares === f0 - 1, `flares ${f0}→${u.flares}, active=${p.active}`);
  }
  { // 4 — extraction: takeoff'u geçtikten sonra
    const u = new Sim(m0, 'striker', PR); toCombat(u);
    u.entities.forEach((d) => { if (!d.friendly) d.hp = 0; });
    u.time = 200;                       // dönüş koşulu (kaynaktan): time>=140 kapısı
    console.log(`     [ara durum] kind=${u.mission.kind} phase=${u.phase} time=${u.time} alive=${u.alive.length} ext=${u.ext} entities=${u.entities.length} friendly=${u.entities.filter((d) => d.friendly).length}`);
    u.update(1 / 60, IN);
    console.log(`     [update sonrası] phase=${u.phase} alive=${u.alive.length} health=${u.health} entities=${u.entities.length}`);
    console.log(`     [canlı kalanlar] ${u.alive.map((d) => d.kind + '(hp' + d.hp + ')').join(' ') || 'yok'}`);
    chk('tüm hedefler düşünce phase=return', u.phase === 'return', `phase=${u.phase}`);
    step(u, 4000);
    chk('dönüş görevi başarıyla bitiriyor', !!u.result?.success, u.result ? `reason=${u.result.reason}` : 'result null');
  }
  { // 6 — sorti: görev limitine kadar bütçe + ilerleme
    const u = mk0(PR, 10);
    step(u, Math.ceil((u.mission.limit + 30) * 60), true);
    chk('asistli sorti limit içinde bitiyor', !!u.result, `${(u.time || 0).toFixed(0)} sn, ${u.kills} kill`);
    chk('sorti başarılı', !!u.result?.success, u.result ? `reason=${u.result.reason} kills=${u.kills}` : 'bitemedi');
  }
  { // 7 — wingman: unl>=3 + combat
    const u = mk0({ ...PR, wingman: true }, 10); toCombat(u);
    u.player.copy(u.entities[0].position); u.player.y += 120; u.player.z -= 420;
    let fired = false;
    for (let f = 0; f < 600 && !fired; f++) { u.update(1 / 60, IN); u.events.length = 0; fired = u.projectiles.some((p) => p.active && p.kind === 'missile'); }
    chk('kanat arkadaşı ateş ediyor (unl=10, combat)', fired, '600 karede atmadı');
  }
  { // 8 — ağır füze: unl>=6 + kilit bekle
    const mk = (heavy) => {
      const u = mk0({ ...PR, heavyMissiles: heavy }, 10);
      toCombat(u);
      for (let f = 0; f < 1800 && u.lock < 1 && !u.result; f++) { u.update(1 / 60, IN); u.events.length = 0; }
      u.fireMissile();
      const p = u.projectiles.find((q) => q.active && q.kind === 'missile');
      return p ? p.damage : null;
    };
    const dN = mk(false), dH = mk(true);
    chk('ağır füze hasarı normalden yüksek ve >150', dH != null && dN != null && dH > dN && dH > 150, `normal=${dN} ağır=${dH}`);
  }

  console.log(`\nSONUÇ: düzeltilmiş ön koşullarla ${ok}/${tot} geçti`);
  process.exit(ok === tot ? 0 : 1);
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
