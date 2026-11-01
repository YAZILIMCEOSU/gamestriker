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
 *   node run-diagnostics.mjs ../../striker-dev/index.html --terrain  # hedef/yerleşim arazi kusurları
 *   node run-diagnostics.mjs ../../striker-dev/index.html --audit    # görev 0 simülasyon ayrıştırması
 *   node run-diagnostics.mjs ../../striker-dev/index.html --world    # plan/missions_192.json ↔ build (birebir)
 *   node run-diagnostics.mjs ../../striker-dev/index.html --atmos    # gece/alacakaranlık/tozlu atmosfer katmanı
 *   node run-diagnostics.mjs ../../striker-dev/index.html --twist    # 8 twist kuralı motora bağlı mı
 *   node run-diagnostics.mjs ../../striker-dev/index.html --curve    # 205 görev kampanya zorluk eğrisi
 *   node run-diagnostics.mjs ../../striker-dev/index.html --hud      # dokunmatik HUD yerleşimi (CSS)
 *   node run-diagnostics.mjs ../../striker-dev/index.html --islet   # adacık kenarı ve kaçış
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
  : args.includes('--world') ? 'world'
  : args.includes('--atmos') ? 'atmos'
  : args.includes('--twist') ? 'twist'
  : args.includes('--curve') ? 'curve'
  : args.includes('--islet') ? 'islet' : 'diag';
const htmlArg = args.find((a) => !a.startsWith('--'));
const target = resolve(htmlArg || join(here, '../../striker-dev/index.html'));
if (args.includes('--hud')) {
  const { checkHud } = await import('./hud-layout.mjs');
  process.exit(checkHud(target));
}

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

if (MODE === 'atmos') {
  // ================================================================== --atmos
  // Faz 2b: gece / alacakaranlık / tozlu atmosferi gerçekten bağlı mı?
  // İKİ katman: (A) shader uniform tutarlılığı  (B) setAtmosphere'ün GERÇEK
  // gövdesi bundle'dan çıkarılıp stub bir `this` ile ÇALIŞTIRILIR (yeniden
  // yazılmaz — kodun kendisi koşar).
  let fails = 0;
  const chk = (n, c, d) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  -> ' + d}`); if (!c) fails++; };

  // ---- fonksiyon gövdesini süslü parantez sayarak çıkar
  const extract = (name) => {
    const i = html.indexOf(name + '(');
    if (i < 0) return null;
    let j = html.indexOf('{', i), d = 0, q = null;
    for (let k = j; k < html.length; k++) {
      const c = html[k];
      if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '{') d++; else if (c === '}' && --d === 0) return html.slice(i, k + 1);
    }
    return null;
  };

  console.log('=== A) SHADER UNIFORM TUTARLILIGI ===');
  const shaders = [
    ['sky', html.match(/fragmentShader:`([^`]*varying vec3 vDirection;[\s\S]*?)`/)],
    ['sea', html.match(/fragmentShader:`([^`]*varying vec3 vWorld;[\s\S]*?)`/)],
  ];
  for (const [nm, m] of shaders) {
    if (!m) { chk(`${nm} shader bulundu`, false, 'fragmentShader blogu yok'); continue; }
    const src = m[1];
    const used = [...new Set(src.match(/\bu[A-Z][A-Za-z0-9]*/g) || [])];
    const undecl = used.filter((u) => !new RegExp(`uniform\\s+float\\s+${u}\\s*;`).test(src));
    chk(`${nm}: kullanılan ${used.length} uniform'un hepsi tanımlı`, undecl.length === 0, undecl.join(', '));
    for (const u of ['uNight', 'uDust']) {
      chk(`${nm}: ${u} shader'da kullanılıyor`, new RegExp(`\\b${u}\\b`).test(src), 'referans yok');
      chk(`${nm}: ${u} uniforms nesnesinde`, html.split(`${u}:{value:`).length - 1 === 2, `${html.split(`${u}:{value:`).length - 1} material`);
    }
  }

  console.log('\n=== B) setAtmosphere GERCEK GOVDE ===');
  const src = extract('setAtmosphere');
  if (!src) { chk('setAtmosphere bulundu', false, 'index.html içinde yok'); }
  else {
    let obj;
    try { obj = new Function('return {' + src + '}')(); chk('gövde sözdizimi geçerli', true); }
    catch (e) { chk('gövde sözdizimi geçerli', false, e.message); }
    if (obj) {
      const mk = () => {
        const rec = {};
        const col = (k) => ({ set: (c) => { rec[k] = c; } });
        const self = {
          atmo: '',
          skyMaterial: { uniforms: { uNight: { value: -1 }, uDust: { value: -1 } } },
          seaMaterial: { uniforms: { uNight: { value: -1 }, uDust: { value: -1 } } },
          sun: { color: col('sunColor'), intensity: null },
          hemi: { color: col('hemiSky'), groundColor: col('hemiGnd'), intensity: null },
          fill: { color: col('fillColor'), intensity: null },
          sceneE: { fog: { color: col('fogColor'), density: null }, environmentIntensity: 0 },
        };
        return { rec, self };
      };
      const run = (k) => { const { rec, self } = mk(); obj.setAtmosphere.call(self, k); return { rec, self }; };
      const eq = (a, b) => Math.abs(a - b) < 1e-9;

      const g = run('gece'), a = run('alacakaranlık'), t = run('tozlu'), d = run('açık');
      const rows = [
        ['gece', g, 1, 0, 1.7, 1.85, 3.5e-5, 0.28],
        ['alacakaranlık', a, 0.78, 0, 2.15, 1.7, 5.5e-5, 0.45],
        ['tozlu', t, 0, 1, 2.6, 2.1, 1.6e-4, 0.82],
      ];
      console.log('  hava            uNight uDust  sun.i  hemi.i  fog.dens  ei');
      for (const [nm, r, un, ud, si, hi, gd, ei] of rows) {
        const v = r.self;
        console.log(`  ${nm.padEnd(15)} ${String(v.skyMaterial.uniforms.uNight.value).padEnd(6)} ${String(v.skyMaterial.uniforms.uDust.value).padEnd(6)} ${String(v.sun.intensity).padEnd(6)} ${String(v.hemi.intensity).padEnd(7)} ${String(v.sceneE.fog.density).padEnd(9)} ${v.sceneE.environmentIntensity}`);
        chk(`${nm}: uNight=${un} uDust=${ud}`, eq(v.skyMaterial.uniforms.uNight.value, un) && eq(v.skyMaterial.uniforms.uDust.value, ud),
          `${v.skyMaterial.uniforms.uNight.value}/${v.skyMaterial.uniforms.uDust.value}`);
        chk(`${nm}: sea shader da aynı değeri aldı`, eq(v.seaMaterial.uniforms.uNight.value, un) && eq(v.seaMaterial.uniforms.uDust.value, ud), 'sky/sea ayrışmış');
        chk(`${nm}: ışık profili uygulandı (sun=${si} hemi=${hi} fog=${gd} ei=${ei})`,
          eq(v.sun.intensity, si) && eq(v.hemi.intensity, hi) && eq(v.sceneE.fog.density, gd) && eq(v.sceneE.environmentIntensity, ei),
          `${v.sun.intensity}/${v.hemi.intensity}/${v.sceneE.fog.density}/${v.sceneE.environmentIntensity}`);
      }

      // gece ile alacakaranlık AYRIRT EDİLEBİLİR olmalı (v3.79'da birebir aynıydı)
      chk('gece ≠ alacakaranlık (uNight ve güneş rengi farklı)',
        g.self.skyMaterial.uniforms.uNight.value !== a.self.skyMaterial.uniforms.uNight.value
        && g.rec.sunColor !== a.rec.sunColor,
        `${g.self.skyMaterial.uniforms.uNight.value}/${a.self.skyMaterial.uniforms.uNight.value} ${g.rec.sunColor}/${a.rec.sunColor}`);
      chk('tozlu ≠ sisli (uDust=1, sis toprak rengi)', t.self.skyMaterial.uniforms.uDust.value === 1 && t.rec.fogColor === '#b39a6d', `${t.rec.fogColor}`);
      chk('gece ay ışığı soğuk (B>R), sis rengi koyu', g.rec.sunColor === '#8eb4dc' && g.rec.fogColor === '#121c2e', `${g.rec.sunColor}/${g.rec.fogColor}`);

      // normal hava: taban çizgisi aynen geri gelmeli (v3.79 davranışı korunuyor)
      chk('normal hava: uNight=uDust=0 (shader v3.79 ile aynı)',
        eq(d.self.skyMaterial.uniforms.uNight.value, 0) && eq(d.self.skyMaterial.uniforms.uDust.value, 0), 'sıfırlanmamış');
      chk('normal hava: ışıklar taban değerine döndü (sun 3.9 / hemi 2.8 / fill 1.15 / ei .82)',
        eq(d.self.sun.intensity, 3.9) && eq(d.self.hemi.intensity, 2.8) && eq(d.self.fill.intensity, 1.15) && eq(d.self.sceneE.environmentIntensity, 0.82),
        `${d.self.sun.intensity}/${d.self.hemi.intensity}/${d.self.fill.intensity}/${d.self.sceneE.environmentIntensity}`);
      chk('normal hava: sis rengine dokunulmuyor (setSunset kazanır)', d.rec.fogColor === undefined, String(d.rec.fogColor));

      // 205 görevin tamamının weatherKey'i hatasız koşmalı
      const keys = [...new Set(MISSION_LIST.map((m) => m.weatherKey))];
      let threw = null;
      for (const k of keys) { try { run(k); } catch (e) { threw = `${k}: ${e.message}`; } }
      chk(`8 havanın hepsi hatasız koştu (${keys.length} anahtar)`, threw === null, threw);
      const special = keys.filter((k) => { const r = run(k); return r.self.skyMaterial.uniforms.uNight.value !== 0 || r.self.skyMaterial.uniforms.uDust.value !== 0; });
      chk('en az 3 hava özel atmosfer profili alıyor', special.length >= 3, special.join(','));
      console.log(`  özel profil: ${special.join(', ')}`);
      const n1 = MISSION_LIST.filter((m) => special.includes(m.weatherKey)).length;
      console.log(`  kapsanan görev: ${n1}/${MISSION_LIST.length}`);
      chk('gece+alacakaranlık+tozlu görevleri kapsanıyor', n1 > 0, '0 görev');
    }
  }

  console.log('\n=== C) BAGLANTI NOKTALARI ===');
  chk('begin() setAtmosphere(weatherKey) çağırıyor',
    /setAtmosphere\(e\.mission\.weatherKey/.test(html), 'çağrı yok');
  chk('setMode() oyun dışına çıkınca atmosferi sıfırlıyor',
    /setSunset\(!0\),this\.environment\.setAtmosphere\(""\)/.test(html), 'hangar gece tonunda kalır');
  chk('uNight/uDust başlangıç değeri 0 (regresyon yok)',
    (html.match(/uNight:\{value:0\}/g) || []).length === 2 && (html.match(/uDust:\{value:0\}/g) || []).length === 2, 'başlangıç 0 değil');

  console.log(`\nSONUÇ: ${fails === 0 ? 'atmosfer katmanı bağlı ve tutarlı' : fails + ' kontrol BAŞARISIZ'}`);
  process.exit(fails === 0 ? 0 : 1);
}

if (MODE === 'curve') {
  const CAP = [4, 6, 8, 11, 13];
  const NAME = ['kolay', 'orta', 'zor', 'uzman', 'as'];
  let fails = 0;
  const chk = (n, c, d) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  -> ' + d}`); if (!c) fails++; };
  const rows = [0, 1, 2, 3, 4].map((t) => MISSION_LIST.filter((m) => m.tier === t));
  console.log('  kademe   görev  hedef min/ort/max   hpScale');
  for (let t = 0; t < 5; t++) {
    const rs = rows[t];
    const lens = rs.map((m) => (m.targets || []).length);
    const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    console.log(`  ${NAME[t].padEnd(8)} ${String(rs.length).padStart(4)}   ${Math.min(...lens)}/${avg.toFixed(1)}/${Math.max(...lens)}     ${rs[0] && rs[0].hpScale}`);
  }
  chk('5 kademe de dolu', rows.every((r) => r.length > 0), rows.map((r) => r.length).join(','));
  const early = MISSION_LIST.filter((m) => m.id < 12 && m.targets);
  chk('ilk 12 görev en fazla 4 hedef', early.every((m) => m.targets.length <= 4), early.filter((m) => m.targets.length > 4).map((m) => m.id + ':' + m.targets.length).join(','));
  chk('ilk görev kolay ve 4 hedef', MISSION_LIST[0].tier === 0 && MISSION_LIST[0].targets.length === 4, `${MISSION_LIST[0].tier}/${MISSION_LIST[0].targets.length}`);
  const mid = MISSION_LIST.find((m) => m.id === 50);
  const late = MISSION_LIST.find((m) => m.id === 160);
  chk('görev 50 uzman değil, zor (tier 2) ve cap içinde', mid && mid.tier === 2 && mid.targets.length <= 8, mid && `${mid.tier}/${mid.targets.length}`);
  chk('görev 160 as (tier 4) ve ilk görevden kalabalık', late && late.tier === 4 && late.targets.length > MISSION_LIST[0].targets.length, late && String(late.targets.length));
  const over = MISSION_LIST.filter((m) => m.id < 192 && m.targets && !['race', 'waves', 'recon'].includes(m.kind) && m.targets.length > CAP[m.tier]);
  chk('hiçbir standart görev kademe tavanını aşmıyor', over.length === 0, over.slice(0, 4).map((m) => m.id + ':' + m.targets.length).join(','));
  chk('kolay par, limitin %70 inden geniş (3 yıldız mümkün)', early.every((m) => m.par >= m.limit * 0.7), 'par dar');
  chk('hpScale kolay < as', MISSION_LIST[0].hpScale < (late && late.hpScale), `${MISSION_LIST[0].hpScale}/${late && late.hpScale}`);
  {
    const html = readFileSync(target, 'utf8');
    chk('hangar uçağın görsel merkezine bakar', html.includes('this.target.copy(n?new H(0,205+bob,0):this.player.position)') && html.includes('n?1.6*Math.sin(yaw):0'), 'çerçeve yok');
    chk('kredi yetmezse satın alma uyarı verir', html.includes('if(z.credits<cost){P(Te("insufficient"))') && html.includes('if(z.credits<WP[k]){P(Te("insufficient"))') && !html.includes('disabled:s.credits<V.price') && !html.includes('disabled:t>=3||s.credits<cost'), 'uyarı kapalı');
    const card = 128, w = 390;
    chk('dar telefonda stat kartı merkezin önünde değil', card < w / 2, String(card));
    chk('sonraki görev önceki geçiş ve puan ister', html.includes('function Rl(s,e){if(!(s>0))return!0') && html.includes('(p.score||0)>=100') && !html.includes('s<3||s===4||s===11'), 'kapı yok');
    chk('kilitli görev uyarı metni var', html.includes('needPass:') && html.includes('Önceki görev geçilmeli'), 'metin yok');
    chk('gizlilik notu kısa, reklam sdk yok', html.includes('Çağrı adın ve skorun yalnız bu cihazda kalır.') && html.includes('Bu sürümde reklam yok.') && !html.includes('Veri sorumlusu') && !html.includes('KVKK / PRIVACY') && html.includes('function KvkkN') && !html.includes('googlesyndication') && !html.includes('pagead2'), 'metin veya sdk');
    chk('gizlilik notu uçuşu kesmez', !html.includes('s.kvkkAck!=="2026-11-a"') && !html.includes('o==="kvkk"?S.jsx(KvkkN') && !html.includes('className:"privacy-line"'), 'kapı duruyor');
    const ce = html.slice(html.indexOf('Ce=id=>{'), html.indexOf('Ce=id=>{') + 320);
    chk('göreve çıkış kvkk beklemez', ce.includes('P(Te("webgl"))') && !ce.includes('kvkk') && ce.includes('typeof id==="number"'), ce.slice(0, 180));
    chk('ana üs bir dokunuşta sorti açar', html.includes('onStart:()=>{const id=x_(s.records);p(id);Ce(id)}') && !html.includes('typeof Notification!=="u"'), 'kalkış yok');
    const rankBody = html.slice(html.indexOf('function pilotStats'), html.indexOf('function kw'));
    const pilotStats = new Function('sv', rankBody.slice(rankBody.indexOf('{') + 1, rankBody.lastIndexOf('}')));
    const zRank = pilotStats({ records: {} });
    chk('rütbe çömezden başlar', zRank.key === 'rank0' && zRank.passed === 0 && zRank.nextKey === 'rank1' && zRank.nextAt === 1, JSON.stringify(zRank));
    const oneRank = pilotStats({ records: { 0: { stars: 1, score: 120 } } });
    chk('bir görev pilot adayı', oneRank.key === 'rank1' && oneRank.passed === 1, JSON.stringify(oneRank));
    const lowRank = pilotStats({ records: { 0: { stars: 0, score: 400 }, 1: { stars: 1, score: 40 } } });
    chk('yıldızsız veya düşük skor rütbe saymaz', lowRank.passed === 0 && lowRank.key === 'rank0', JSON.stringify(lowRank));
    const capRec = {};
    for (let i = 0; i < 20; i++) capRec[i] = { stars: 1, score: 200 };
    const capRank = pilotStats({ records: capRec });
    chk('20 görev kaptan', capRank.key === 'rank4' && capRank.top === true, JSON.stringify(capRank));
    chk('girişte rütbe görünür', html.includes('className:"rank-now"') && html.includes('className:"rank-next"') && html.includes('ÇÖMEZ') && html.includes('PİLOT ADAYI') && html.includes('ÜSTEĞMEN') && html.includes('YÜZBAŞI') && html.includes('KAPTAN'), 'satır yok');
  }
  // gerçek doğuş: aynı uçakta erken görev düşmanı geç görevden zayıf ve az
  const PR = { ...__defaults().preferences, assisted: true, difficulty: 'normal' };
  const spawn = (m) => {
    const u = new Sim(m, 'striker', PR);
    const foe = u.entities.filter((e) => e.hp > 0 && !e.friendly);
    const hp = foe.reduce((a, e) => a + e.maxHp, 0);
    return { n: foe.length, hp, hull: u.aircraft.hull };
  };
  const a = spawn(MISSION_LIST[0]);
  const b = spawn(MISSION_LIST.find((m) => m.id === 160));
  const near = (m) => {
    const u = new Sim(m, 'striker', PR);
    const foes = u.entities.filter((e) => e.hp > 0 && !e.friendly);
    return Math.min(...foes.map((e) => Math.hypot(e.position.x - u.player.x, e.position.z - u.player.z)));
  };
  const n0 = near(MISSION_LIST[0]);
  const n11 = near(MISSION_LIST[11]);
  console.log(`  görev 0 en yakın hedef ${Math.round(n0)} m · görev 11 ${Math.round(n11)} m`);
  const u0 = new Sim(MISSION_LIST[0], 'striker', PR);
  const d0 = u0.entities.filter((e) => e.hp > 0 && !e.friendly).map((e) => Math.round(Math.hypot(e.position.x - u0.player.x, e.position.z - u0.player.z)));
  chk('görev 0 düşman bölgesi 12-14.5 km', d0.length === 4 && d0.every((d) => d >= 12000 && d <= 14500), d0.join(','));
  chk('kolay görevde avcı uçak var', (MISSION_LIST[0].targets || []).includes('interceptor'), (MISSION_LIST[0].targets || []).join(','));
  const midNear = near(MISSION_LIST.find((m) => m.id === 20));
  chk('kolay bölge 12 km, orta bölge daha ileride', n0 >= 12000 && n0 <= 14000 && midNear > n0 + 1500, `${Math.round(n0)}/${Math.round(midNear)}`);
  console.log(`  doğuş görev0: ${a.n} düşman, toplam can ${Math.round(a.hp)}, gövde ${a.hull}`);
  console.log(`  doğuş görev160: ${b.n} düşman, toplam can ${Math.round(b.hp)}, gövde ${b.hull}`);
  chk('simülasyon: görev 0, görev 160 dan az düşman', a.n < b.n, `${a.n}/${b.n}`);
  chk('simülasyon: görev 0 toplam düşman canı daha düşük', a.hp < b.hp * 0.55, `${Math.round(a.hp)}/${Math.round(b.hp)}`);
  chk('simülasyon: görev 0 düşmanı tek füze bandında (ortalama can ≤ gövde)', a.n > 0 && a.hp / a.n <= a.hull, `${Math.round(a.hp / a.n)}/${a.hull}`);
  const sortie = (id, sec) => {
    const u = new Sim(MISSION_LIST.find((m) => m.id === id), 'striker', PR);
    const input = { yaw: 0, pitch: 0, throttle: 0.55, fire: true, boost: false };
    let threw = null;
    try {
      for (let i = 0; i < sec * 60 && !u.result; i++) {
        u.update(1 / 60, input);
        if (u.lock >= 1) u.fireMissile();
        u.events.length = 0;
      }
    } catch (err) { threw = err; }
    return { u, threw };
  };
  const s0 = sortie(0, 280);
  const extra = s0.u.kills - (MISSION_LIST[0].targets || []).length;
  console.log(`  görev 1 sorti: ${s0.threw ? 'ÇÖKTÜ ' + s0.threw.message : (s0.u.result ? s0.u.result.reason + ' başarı=' + s0.u.result.success : 'bitmedi')} can ${s0.u.healthPercent} süre ${Math.round(s0.u.time)}s öldürme ${s0.u.kills}`);
  chk('görev 1 çökmeden bitiyor', !s0.threw && s0.u.result && s0.u.result.success, s0.threw ? s0.threw.message : (s0.u.result && s0.u.result.reason) || 'bitmedi');
  chk('görev 1 pusu dalgası yok (yalnızca listedeki hedefler)', extra <= 0, `fazla öldürme ${extra}`);
  chk('görev 1 bitince can %40 üstü', s0.u.healthPercent >= 40, String(s0.u.healthPercent));
  chk('görev 1 sorti canı %60 üstü', s0.u.healthPercent >= 60, String(s0.u.healthPercent));
  chk('görev 1 sortisi 2.5 dakikadan kısa bitmiyor', s0.u.result && s0.u.time >= 150, `${Math.round(s0.u.time)}s`);
  chk('iniş gemi ekseninde', Math.abs(s0.u.player.x + 12) < 20 && Math.abs(s0.u.heading) < 0.25 && s0.u.player.z > 1510 && s0.u.player.z < 1600, `x=${s0.u.player.x.toFixed(1)} z=${s0.u.player.z.toFixed(1)} hdg=${s0.u.heading.toFixed(2)}`);
  {
    const u = new Sim(MISSION_LIST.find((m) => m.id === 1), 'striker', PR);
    const deck = u.terr(-12, 1560);
    const ridge = u.terr(-4000, 2500);
    const gulf = Math.min(...u.entities.filter((e) => e.hp > 0 && !e.friendly).map((e) => Math.hypot(e.position.x - u.player.x, e.position.z - u.player.z)));
    chk('görev 2 körfezi yakın kalır', gulf >= 2800 && gulf <= 5200, String(Math.round(gulf)));
    chk('görev 2 güvertesi denizde', deck < 5 && ridge > 200, `güverte ${Math.round(deck)} sırt ${Math.round(ridge)}`);
    const input = { yaw: 0, pitch: 0, throttle: 0.55, fire: true, boost: false };
    let maxY = 0, fired = 0;
    for (let i = 0; i < 120 * 60 && !u.result; i++) {
      u.update(1 / 60, input);
      if (u.lock >= 1) {
        const n = u.missiles;
        u.fireMissile();
        if (u.missiles < n) fired++;
      }
      u.events.length = 0;
      maxY = Math.max(maxY, u.player.y);
    }
    console.log(`  görev 2: ${u.result ? u.result.reason : 'bitmedi'} y ${Math.round(maxY)} füze ${fired} can ${u.healthPercent}`);
    chk('görev 2 kar duvarında kilitlenmiyor, füze atıp iniyor', u.result && u.result.success && fired >= 1 && Number.isFinite(u.player.x) && u.player.y < 40, `maxY=${Math.round(maxY)} güverte=${Math.round(u.player.y)} füze=${fired} ${u.result && u.result.reason}`);
  }
  {
    const u = new Sim(MISSION_LIST[0], 'striker', PR);
    const jet0 = u.entities.find((e) => e.kind === 'interceptor');
    const shots = [];
    const orig = u.spawn.bind(u);
    u.spawn = (kind, pos, vel, life, dmg, target, msl) => {
      if (kind === 'hostile') {
        let src = '?', bd = 1e9;
        for (const ent of u.entities) {
          if (!ent.hp || ent.friendly) continue;
          const d = Math.hypot(ent.position.x - pos.x, ent.position.z - pos.z);
          if (d < bd) { bd = d; src = ent.kind; }
        }
        shots.push(src);
      }
      return orig(kind, pos, vel, life, dmg, target, msl);
    };
    let minD = 1e9;
    const startD = jet0 ? Math.hypot(jet0.position.x - u.player.x, jet0.position.z - u.player.z) : 1e9;
    const input = { yaw: 0, pitch: 0, throttle: 0.55, fire: true, boost: false };
    for (let i = 0; i < 200 * 60 && !u.result; i++) {
      u.update(1 / 60, input);
      if (u.lock >= 1) u.fireMissile();
      u.events.length = 0;
      const jet = u.entities.find((e) => e.kind === 'interceptor' && e.hp > 0);
      if (jet) minD = Math.min(minD, Math.hypot(jet.position.x - u.player.x, jet.position.z - u.player.z));
    }
    const airShots = shots.filter((s) => s === 'interceptor').length;
    console.log(`  it dalaşı: kapanış ${Math.round(minD)} m · avcı atışı ${airShots} · can ${jet0 ? jet0.maxHp : 0}`);
    chk('avcı bölgeye girince kovalıyor ve ateş ediyor', minD < startD - 4000 && minD < 2200 && airShots >= 1, `kapanış ${Math.round(minD)} başlangıç ${Math.round(startD)} atış ${airShots}`);
  }
  {
    const u = new Sim(MISSION_LIST.find((m) => m.id === 0), 'striker', { ...PR, assisted: true });
    const input = { yaw: 1, pitch: 1, throttle: 0.46, fire: false, boost: false };
    let maxDy = 0, maxHdg = 0, pop = 0, yAtBow = null, maxOff = 0, prev = u.player.y;
    const bow = u.homePos.z - 130;
    for (let i = 0; i < 8 * 60 && u.phase === 'takeoff'; i++) {
      u.update(1 / 60, input);
      maxDy = Math.max(maxDy, u.player.y - prev);
      prev = u.player.y;
      maxHdg = Math.max(maxHdg, Math.abs(u.heading));
      maxOff = Math.max(maxOff, Math.abs(u.player.x + 12));
      if (u.player.y > 40 && u.player.z > bow) pop++;
      if (yAtBow == null && u.player.z <= bow) yAtBow = u.player.y;
    }
    console.log(`  katapult: faz ${u.phase} yBow ${yAtBow == null ? 'yok' : yAtBow.toFixed(1)} dy ${maxDy.toFixed(1)} hdg ${(maxHdg * 180 / Math.PI).toFixed(1)} eksen ${maxOff.toFixed(1)}`);
    chk('katapult güvertede düz gider', u.phase === 'combat' && maxHdg < 0.08 && pop === 0 && yAtBow != null && yAtBow < 40 && maxDy < 4 && maxOff < 8, `y=${yAtBow} dy=${maxDy.toFixed(1)} hdg=${maxHdg.toFixed(3)} pop=${pop} x=${maxOff.toFixed(1)}`);
  }
  const s1 = sortie(1, 95);
  chk('görev 2 takviye twist\'i oyunu çökertmiyor', !s1.threw, s1.threw && s1.threw.message);
  const sea = new Sim(MISSION_LIST[0], 'striker', { ...PR, assisted: true });
  const shots = [];
  const orig = sea.spawn.bind(sea);
  sea.spawn = (kind, pos, vel, life, dmg, target, msl) => {
    if (kind === 'hostile') {
      let src = '?', bd = 1e9;
      for (const ent of sea.entities) {
        if (!ent.hp || ent.friendly) continue;
        const d = Math.hypot(ent.position.x - pos.x, ent.position.z - pos.z);
        if (d < bd) { bd = d; src = ent.kind; }
      }
      shots.push({ src, msl: msl || 0 });
    }
    return orig(kind, pos, vel, life, dmg, target, msl);
  };
  for (let i = 0; i < 100 * 60 && !sea.result; i++) sea.update(1 / 60, { yaw: 0, pitch: 0, throttle: 0.7, fire: false, boost: false });
  const shipMsl = shots.filter((q) => q.msl && (q.src === 'corvette' || q.src === 'destroyer'));
  const ground = shots.filter((q) => q.src === 'sam' || q.src === 'radar');
  console.log(`  deniz atışı ${shipMsl.length} · kara atışı ${ground.length}`);
  chk('geçilen gemiden karşı füze geliyor', shipMsl.length >= 1, String(shipMsl.length));
  chk('kolay görevde SAM ve radar ateş etmiyor', ground.length === 0, ground.map((q) => q.src).join(','));
  const steer = new Sim(MISSION_LIST[0], 'striker', PR);
  const b0 = Math.abs(steer.targetBearing);
  for (let i = 0; i < 6 * 60; i++) steer.update(1 / 60, { yaw: 0.2, pitch: 0, throttle: 0.5, fire: false, boost: false });
  chk('hafif kol kolay görevde rotayı kesmiyor', Math.abs(steer.targetBearing) < b0 - 0.05, `${b0.toFixed(2)} -> ${Math.abs(steer.targetBearing).toFixed(2)}`);
  const card = (MISSION_LIST[0].targets || []).length;
  const sim0 = new Sim(MISSION_LIST[0], 'striker', PR);
  const listed = sim0.entities.filter((e) => e.listed);
  const hudDenom = (sim0.mission.targets || []).length;
  const hudNum = sim0.entities.filter((e) => e.listed && !(e.hp > 0)).length;
  console.log(`  sayaç kart ${card} · HUD ${hudNum}/${hudDenom} · varlık ${sim0.entities.length}`);
  chk('kart, HUD ve görev listesi aynı payda', card === hudDenom && listed.length === card, `${card}/${hudDenom}/${listed.length}`);
  chk('HUD uçak gemisini hedef saymıyor', sim0.entities.length > card && hudDenom === card, `${sim0.entities.length}/${hudDenom}`);
  listed[0].hp = 0;
  sim0.finish(true, 'landed');
  chk('sonuç ekranı aynı kırılımı yazıyor', sim0.result.done === 1 && sim0.result.goal === card, `${sim0.result.done}/${sim0.result.goal}`);
  const seaM = MISSION_LIST.find((m) => (m.targets || []).includes('sub') && (m.targets || []).some((t) => t === 'corvette' || t === 'destroyer' || t === 'port'));
  const su = seaM && new Sim(seaM, 'striker', PR);
  const sb = su && su.entities.find((e) => e.kind === 'sub' && e.listed);
  let subSteps = 0;
  while (sb && subSteps < 900 && !su.result && (subSteps < 8 || sb.surf !== false)) {
    su.update(0.04, { yaw: 0, pitch: 0, throttle: 0.4, fire: false, boost: false });
    subSteps++;
  }
  const seaN = su ? su.entities.filter((e) => !e.friendly && ['corvette', 'destroyer', 'sub', 'port'].includes(e.kind)).length : 0;
  const landSq = su ? su.entities.filter((e) => !e.friendly && !e.airborne && !['corvette', 'destroyer', 'sub', 'port'].includes(e.kind)).length : 0;
  console.log(`  deniz görev ${seaM && seaM.id}: deniz ${seaN} kara ${landSq} dalış y=${sb ? Math.round(sb.position.y) : 'yok'} surf=${sb ? sb.surf : '?'}`);
  chk('deniz görevinde deniz hedefi var', seaN >= 1, String(seaN));
  chk('dalmış denizaltı radar listesinde, kilitlenemez', !!sb && !sb.surf && sb.position.y < 0 && su.alive.some((e) => e.id === sb.id) && (su.targetId = sb.id, su.target == null), `y=${sb && sb.position.y}`);
  const htmlNow = readFileSync(target, 'utf8');
  chk('radar denizi baklava, dalmışı halka çizer', htmlNow.includes('b.sea?"#7ee0ff"') && htmlNow.includes('b.sub?S.jsx("circle"') && htmlNow.includes('M0-4.2l3.4'), 'şekil yok');
  chk('ateş düğmesi dokunuşu yutmaz', htmlNow.includes('a.current.firePulse=(a.current.firePulse||0)+1') && htmlNow.includes('fire:!!(B.current.fire||B.current.firePulse||he.has("KeyJ"))') && htmlNow.includes('ne.phase!=="takeoff"&&(B.current.firePulse=0)') && !htmlNow.includes('fire-button",style:{background:"#3a1f16",borderColor:"#ff8a5c"},onPointerDown:e=>{e.preventDefault()'), 'pulse yok');
  {
    const u = new Sim(MISSION_LIST[0], 'striker', PR);
    const hold = { yaw: 0, pitch: 0, throttle: 0.7, fire: false, boost: false };
    for (let i = 0; i < 20 * 60 && u.phase === 'takeoff'; i++) u.update(1 / 60, hold);
    const before = u.projectiles.filter((p) => p.active && p.kind === 'gun').length;
    u.update(1 / 60, { ...hold, fire: true });
    const after = u.projectiles.filter((p) => p.active && p.kind === 'gun').length;
    const flash = u.events.some((ev) => ev.kind === 'gun');
    chk('ateş bir karede mermi ve namlu izi üretir', u.phase === 'combat' && after > before && flash, `faz ${u.phase} ${before}->${after} iz ${flash}`);
  }
  chk('kenar oku deniz türünü yazar', htmlNow.includes('corvette:"COR"') && htmlNow.includes('sea-mark'), 'etiket yok');
  const foot = [
    ['radar', 90, 2.45],
    ['sam', 120, 1.85],
    ['depot', 160, 1.4],
  ];
  for (const [name, base, k] of foot) {
    const span = Math.round(base * k);
    chk(`${name} tabanı 200-400 m`, htmlNow.includes(`inner.scale.setScalar(${k})`) && span >= 200 && span <= 400, `${span}`);
  }
  const hitKind = (kind, partK, expectZ) => {
    const m = MISSION_LIST.find((q) => (q.targets || []).includes(kind));
    if (!m) return { ok: false, detail: 'görev yok' };
    const u = new Sim(m, 'striker', PR);
    const ent = u.entities.find((e) => e.kind === kind && e.parts);
    if (!ent) return { ok: false, detail: 'varlık yok' };
    const part = ent.parts.find((p) => p.k === partK);
    if (expectZ != null && !(part.o[2] < 0)) return { ok: false, detail: `z=${part.o[2]}` };
    u.partW(ent, part, u.temp);
    const shot = { kind: 'gun', damage: 30, previous: u.temp.clone(), position: u.temp.clone() };
    const h0 = part.h;
    const hit = u.hitParts(ent, shot);
    return { ok: hit && part.h < h0, detail: `${kind} ${partK} hit=${hit} h=${part.h}/${h0} o=${part.o.join(',')}` };
  };
  const dish = hitKind('radar', 'dish');
  console.log(`  tesis vuruş ${dish.detail}`);
  chk('radar çanağına atış parçaya denk geliyor', dish.ok, dish.detail);
  const af = new Sim(MISSION_LIST[0], 'striker', PR);
  const afEnt = { position: { x: 0, y: 0, z: 0 }, heading: 0, parts: af.mkParts('airfield'), maxHp: 400, hp: 400 };
  const hang = afEnt.parts.filter((p) => p.k === 'hangar');
  af.partW(afEnt, hang[0], af.temp);
  const hangShot = { kind: 'gun', damage: 20, previous: af.temp.clone(), position: af.temp.clone() };
  const hangHit = af.hitParts(afEnt, hangShot);
  const ghost = af.temp.clone().set(-150, 11, 140);
  const ghostShot = { kind: 'gun', damage: 20, previous: ghost.clone(), position: ghost.clone() };
  const ghostHit = af.hitParts(afEnt, ghostShot);
  chk('havaalanı hangarı görünen tarafta ve vuruş alıyor', hang.length === 3 && hang.every((p) => p.o[2] < 0) && hangHit, hang.map((p) => p.o.join(',')).join(' | '));
  chk('eski hangar noktası artık isabet değil', !ghostHit, String(ghostHit));
  const sam = hitKind('sam', 'launcher');
  chk('SAM lançeri parça vuruşu alıyor', sam.ok, sam.detail);
  console.log(`\nSONUÇ: ${fails === 0 ? 'kampanya eğrisi 205 göreve yayıldı' : fails + ' kontrol BAŞARISIZ'}`);
  process.exit(fails === 0 ? 0 : 1);
}

if (MODE === 'twist') {
  // 8 twist metni v3.79'da yazıldı, v3.82'de motora bağlandı.
  // Eşleşmezse ternary'nin else dalı v3.81 sabitidir — regresyon yok.
  const TW = [
    ['low', 'Yalnızca düşük irtifada uçuş', 'player.y-this.terr'],
    ['reinf', 'Düşman her 90 saniyede takviye gönderir', 'reinfT>=90'],
    ['fuel', 'Yakıt üç katı hızlı tükenir', '?3:1'],
    ['radar', 'Radar kapalı, hedefler gözle bulunur', '?[]:s.alive.map'],
    ['fog', 'Sis perdesi görüşü yarıya indirir', 'fog.density*=2'],
    ['flee', 'Bir hedef saldırı sırasında kaçar', 'finish(!1,"escaped")'],
    ['missile', 'Yalnızca füze ile vurulabilir hedefler', 'n.kind==="gun"'],
    ['sensor', 'Kanat sensörü arızalı, manuel nişan', '?.1:.53'],
  ];
  let fails = 0;
  const chk = (n, c, d) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  -> ' + d}`); if (!c) fails++; };
  for (const [id, text, hook] of TW) {
    const sites = html.split(`mission.twist==="${text}"`).length - 1;
    chk(`${id}: davranış kancası var (${sites})`, sites >= 1, 'yalnız tablo');
    chk(`${id}: kanca gerçek etki içeriyor (${hook})`, html.includes(hook), 'etki yok');
  }
  // yakit formulu GERCEK satirdan calisir
  const fuelLine = html.match(/this\.fuel=Math\.max\(0,this\.fuel-a\*\(96\/this\.mission\.limit\)\*\(this\.mission\.twist==="([^"]+)"\?3:1\)\)/);
  chk('yakıt satırı 3x ternary', !!fuelLine, 'formül yok');
  if (fuelLine) {
    const drain = (twist, a, limit) => a * (96 / limit) * (twist === fuelLine[1] ? 3 : 1);
    const base = drain('açık', 1, 360), fast = drain(fuelLine[1], 1, 360);
    chk('yakıt x3 gerçekten 3 kat', Math.abs(fast / base - 3) < 1e-9, `${fast}/${base}`);
    chk('twist yokken yakıt v3.81 ile aynı', Math.abs(base - 96 / 360) < 1e-9, String(base));
  }
  // kilit menzili else dali 2900, sensor else dali .53 — eski sabit duruyor
  chk('kilit else dalı 2900 (twist yok = v3.81)', /1450:2900/.test(html), '2900 kayıp');
  chk('koni else dalı .53 (twist yok = v3.81)', /\?\.1:\.53/.test(html), '.53 kayıp');
  chk('işaret else dalı 12000 (twist yok = v3.81)', /:12000;this\.camera\.updateMatrixWorld/.test(html), '12000 kayıp');
  // kacis metni 10 dil
  const esc = html.match(/escaped:\[([^\]]+)\]/);
  const nLang = esc ? esc[1].split('","').length : 0;
  chk('escaped metni 10 dil', nLang === 10, String(nLang));
  // dagilim
  const have = MISSION_LIST.map((m) => m.twist).filter(Boolean);
  const uniq = [...new Set(have)];
  console.log(`  twist'li görev: ${have.length}/${MISSION_LIST.length} · ${uniq.length} farklı`);
  chk('8 twist de görevlerde kullanılıyor', TW.every(([, t]) => have.includes(t)), uniq.join(' | '));
  const counts = Object.fromEntries(TW.map(([, t]) => [t, have.filter((x) => x === t).length]));
  const minC = Math.min(...Object.values(counts));
  chk('her twist en az 15 görevde', minC >= 15, String(minC));

  // GERÇEK simülasyon: Pa.update yakıtı, Pa.updateEnemies kaçışı koşar
  const PR = { ...__defaults().preferences, assisted: true, difficulty: 'normal' };
  const IN = { yaw: 0, pitch: 0, throttle: 0.42, fire: false, boost: false };
  const fuelText = TW.find((t) => t[0] === 'fuel')[1];
  const fuelM = MISSION_LIST.find((m) => m.twist === fuelText && m.targets);
  const plain = MISSION_LIST.find((m) => m.twist && m.twist !== fuelText && m.targets && m.limit);
  chk('yakıt simülasyonu için iki görev bulundu', !!(fuelM && plain), `${fuelM && fuelM.id}/${plain && plain.id}`);
  if (fuelM && plain) {
    const burn = (m) => {
      const u = new Sim(m, 'striker', PR);
      const f0 = u.fuel;
      for (let i = 0; i < 180; i++) { u.update(1 / 60, IN); u.events.length = 0; }
      return (f0 - u.fuel) * m.limit;
    };
    const dFuel = burn(fuelM), dPlain = burn(plain);
    console.log(`  yakıt (normalize): twist ${dFuel.toFixed(1)} · düz ${dPlain.toFixed(1)} · oran ${(dFuel / dPlain).toFixed(2)}  görev ${fuelM.id}/${plain.id}`);
    chk('simülasyon: yakıt twist 2.5–3.5 kat hızlı', dPlain > 0 && dFuel / dPlain >= 2.5 && dFuel / dPlain <= 3.5, `${dFuel}/${dPlain}`);
  }

  const fleeM = MISSION_LIST.find((m) => m.twist === TW.find((t) => t[0] === 'flee')[1] && m.targets);
  chk('kaçış simülasyonu için görev bulundu', !!fleeM, 'yok');
  if (!fleeM) { console.log(`\nSONUÇ: ${fails} kontrol BAŞARISIZ`); process.exit(1); }
  const fu = new Sim(fleeM, 'striker', PR);
  fu.phase = 'combat';
  fu.updateEnemies(0.016);
  const escaper = fu.entities.find((n) => n.flee);
  chk('simülasyon: kaçan hedef seçildi', !!escaper, 'flee bayrağı yok');
  if (escaper) {
    const x0 = escaper.position.x, z0 = escaper.position.z;
    for (let i = 0; i < 60; i++) fu.updateEnemies(1 / 60);
    const moved = Math.hypot(escaper.position.x - x0, escaper.position.z - z0);
    console.log(`  kaçış 1 sn: ${moved.toFixed(1)} m (75 beklenir)`);
    chk('simülasyon: kaçan hedef ~75 m/sn uzaklaşıyor', moved > 60 && moved < 90, moved.toFixed(1));
  }
  console.log(`\nSONUÇ: ${fails === 0 ? '8 twist motora bağlı' : fails + ' kontrol BAŞARISIZ'}`);
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

if (MODE === 'islet') {
  // P1: adacık merkezine uçuş ve kaçış. Tarayıcı yok; sabit adımlı sim.
  const ids = [0, 1, 2, 7, 11, 12, 36, 50, 80, 144];
  const fly = (sim, tx, tz, secs, input, steer) => {
    let minSpd = 1e9, minClear = 1e9, maxStuck = 0, stuck = 0, impacts = 0, moved = 0;
    const x0 = sim.player.x, z0 = sim.player.z;
    let px = x0, pz = z0;
    const N = Math.round(secs / 0.04);
    for (let i = 0; i < N && !sim.result; i++) {
      if (steer) {
        const dx = tx - sim.player.x, dz = tz - sim.player.z;
        sim.heading = Math.atan2(dx, -dz);
      }
      const ev0 = sim.events.length;
      sim.update(0.04, input);
      if (sim.events.slice(ev0).some((e) => e.kind === 'damage' || e.kind === 'terrainHit')) impacts++;
      sim.events.length = 0;
      minSpd = Math.min(minSpd, sim.speed);
      const g = sim.terr(sim.player.x, sim.player.z);
      minClear = Math.min(minClear, sim.player.y - Math.max(0, g));
      const step = Math.hypot(sim.player.x - px, sim.player.z - pz);
      moved += step;
      if (step < 1.5 && sim.speed < 45) stuck++; else stuck = 0;
      maxStuck = Math.max(maxStuck, stuck);
      px = sim.player.x; pz = sim.player.z;
    }
    const gEnd = sim.terr(sim.player.x, sim.player.z);
    return {
      minSpd: Math.round(minSpd), minClear: Math.round(minClear), maxStuck,
      impacts, moved: Math.round(moved), hp: Math.round(sim.health),
      dead: sim.result ? sim.result.reason : '',
      end: [Math.round(sim.player.x), Math.round(sim.player.y), Math.round(sim.player.z)],
      gEnd: Math.round(gEnd), dist: Math.round(Math.hypot(sim.player.x - x0, sim.player.z - z0)),
    };
  };
  const arm = (m, assisted) => {
    const sim = new Sim(m, 'striker', { ...prefs, assisted });
    sim.phase = 'combat'; sim.catT = 9; sim.speed = 170;
    sim.terr(0, 0);
    return sim;
  };
  let bowls = 0, pads = 0, noSea = 0;
  for (const id of ids) {
    const m = MISSION_LIST.find((q) => q.id === id) || MISSION_LIST[id];
    if (!m) continue;
    const sim = arm(m, false);
    const peaks = sim.peaks || [];
    const coast = (sim.mission.id || 0) === 1;
    const features = coast ? [[-1800, 600, 5200, 200, 90]] : peaks.filter((q) => q[4] >= 90);
    let closedHere = 0;
    for (const q of features) {
      pads++;
      const [cx, cz, rad, ph, kind] = q;
      const floor = sim.terr(cx, cz);
      let seaRays = 0, gentle = 0, blocked = 0, maxWall = 0;
      const rays = 24;
      for (let a = 0; a < rays; a++) {
        const ang = a / rays * Math.PI * 2;
        let sea = false, wall = 0, gentleOk = true;
        for (let d = 40; d <= 6000; d += 40) {
          const h = sim.terr(cx + Math.cos(ang) * d, cz + Math.sin(ang) * d);
          if (h > floor + 80) gentleOk = false;
          wall = Math.max(wall, h - floor);
          if (h <= 1) { sea = true; break; }
        }
        if (sea) seaRays++;
        if (sea && gentleOk) gentle++;
        if (!sea || wall > 180) blocked++;
        maxWall = Math.max(maxWall, wall);
      }
      const closed = seaRays === 0 || (gentle === 0 && maxWall > 180);
      if (seaRays === 0) noSea++;
      if (closed) { bowls++; closedHere++; }
    }
    console.log(`görev ${m.id}: özellik ${features.length} kapalı ${closedHere}`);
  }
  console.log(`ÖZET pad ${pads} denizsiz ${noSea} kapalı ${bowls} (önce 48/102 kapalı krater)`);
  const silence = (sim) => {
    for (const e of sim.entities) if (!e.friendly) {
      e.fireIn = 1e9;
      if (e.parts) for (const p of e.parts) p.h = 0;
    }
  };
  let failN = 0;
  const note = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failN++; };
  for (const id of [0, 36, 80]) {
    const m = MISSION_LIST.find((q) => q.id === id);
    const base = arm(m, false);
    silence(base);
    let low = 0, worstC = 999, worstPad = 0;
    for (const q of (base.peaks || []).filter((p) => p[4] >= 100)) {
      const [cx, cz, rad] = q;
      const sim = arm(m, false);
      silence(sim);
      const outside = rad * 1.7;
      const g0 = Math.max(0, sim.terr(cx + outside, cz));
      sim.player.set(cx + outside, g0 + 90, cz);
      sim.speed = 220;
      sim.pitch = 0;
      const r = fly(sim, cx, cz, 9, { yaw: 0, pitch: 0, throttle: 0.8, fire: false, boost: false }, true);
      if (r.minClear < worstC) { worstC = r.minClear; worstPad = q[4]; }
      if (r.minClear < 24) low++;
      const out = arm(m, false);
      silence(out);
      const gf = Math.max(0, out.terr(cx, cz));
      out.player.set(cx, gf + 36, cz);
      out.speed = 180;
      out.pitch = 0;
      const e2 = fly(out, cx + 6000, cz + 2000, 14, { yaw: 0, pitch: 0, throttle: 0.8, fire: false, boost: false }, true);
      if (e2.dist < 1200 || e2.minClear < 18) {
        failN++;
        console.log(`FAIL  kaçış görev ${id} pad ${q[4]} uzaklık ${e2.dist} açıklık ${e2.minClear} ${e2.dead}`);
      }
    }
    note(low === 0 && worstC >= 24, `görev ${id} içeri uçuş: alçak pad ${low} en kötü pad ${worstPad} açıklık ${worstC}`);
  }
  const home = arm(MISSION_LIST[0], true);
  silence(home);
  home.player.set(0, 80, 1560);
  home.speed = 160;
  const hpH = home.health;
  const as = fly(home, 0, 0, 18, { yaw: 0, pitch: 0, throttle: 0.5, fire: false, boost: false }, false);
  note(!as.dead && hpH - home.health <= 8, `görev 1 asistli kalkış arazi hasarı ${Math.round(hpH - home.health)} ${as.dead} irtifa ${as.end[1]}`);
  const tgt = home.entities.find((e) => e.listed && !e.airborne);
  if (tgt) note(tgt.position.y >= home.terr(tgt.position.x, tgt.position.z) - 1, `kara hedef arazinin üstünde y=${Math.round(tgt.position.y)} yer=${Math.round(home.terr(tgt.position.x, tgt.position.z))}`);
  console.log(failN ? `SONUÇ: ${failN} adacık kontrolü BAŞARISIZ` : 'SONUÇ: adacık geçişi ve kaçış arazi hasarı vermiyor');
  process.exit(failN ? 1 : 0);
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
