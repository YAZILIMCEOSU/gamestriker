#!/usr/bin/env node
/**
 * Striker — atmosfer renk kalibrasyonu  (WebGL/GPU gerektirmez)
 * ---------------------------------------------------------------------------
 * Bu sandbox'ta GPU yok, yani gerçek render GÖRÜLEMİYOR. Bu araç bunun yerine
 * shader matematiğini CPU'da BİREBİR değerlendirir ve ölçülebilir sayılar +
 * bakılabilir bir PNG üretir.
 *
 * Nelerin GERÇEK olduğu (elle kopyalanmadı):
 *   - sky.frag / sea.frag / noise öneki  -> index.html'den regex ile çıkarılır
 *   - setAtmosphere gövdesi              -> index.html'den çıkarılıp ÇALIŞTIRILIR
 *   - ACES matrisleri + exposure + sRGB  -> bundle'dan doğrulanır (assert)
 *   - renderer.toneMapping=Zu(=4, ACESFilmic), toneMappingExposure=.84, srgb
 *
 * Nelerin YAKLAŞIK olduğu (dürüstlük):
 *   - Deniz tek bir düzlem + gerçek kamera geometrisi ile örneklenir; ada/gemi
 *     mesh'leri, partiküller, HUD yok.
 *   - Gölgeler, bloom, MSAA yok.
 *   Yani: RENKLER doğru, SAHNE değil. Karar vermek için renk/metrik yeterli.
 *
 * Kullanım: node tools/diag/calibrate-atmosphere.mjs [index.html] [--png out.png]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const pngArg = process.argv.find((a) => a.startsWith('--png='));
const PNG = pngArg ? pngArg.slice(6) : join(here, 'atmosphere-preview.png');
const html = readFileSync(resolve(args[0] || join(here, '../../striker-dev/index.html')), 'utf8');

/* ---------------------------------------------------------- 0) renderer doğrula */
const need = (re, ad) => { const m = html.match(re); if (!m) { console.error('HATA: bulunamadı ' + ad); process.exit(2); } return m[1]; };
const toneVar = need(/this\.renderer\.toneMapping=([A-Za-z0-9_$]+)/, 'toneMapping atamasi');
const toneVal = Number(need(new RegExp('\\b' + toneVar + '\\s*=\\s*(\\d+)'), toneVar + ' sabiti'));
// DIKKAT: 'toneMappingExposure=1' three.js VARSAYILANIDIR ve dosyada once gecer.
// Oyunun gercek ayari this.renderer.toneMappingExposure=.84 -> o yakalanmali.
const exposure = Number(need(/this\.renderer\.toneMappingExposure=([0-9.]+)/, 'oyun exposure ayari'));
const cspace = need(/outputColorSpace=([A-Za-z0-9_$]+)/, 'cspace');
const cspaceVal = need(new RegExp('\\b' + cspace + '\\s*=\\s*"([a-z0-9]+)"'), 'cspace value');
console.log(`renderer : toneMapping=${toneVal} (4=ACESFilmic) · exposure=${exposure} · colorSpace=${cspaceVal}`);
if (toneVal !== 4) { console.error('BEKLENMEDİK toneMapping — ACES varsayımı geçersiz'); process.exit(2); }

/* --------------------------------------------- 1) shader metinlerini çıkar (elle kopyalama yok) */
const skyFrag = html.match(/fragmentShader:`([^`]*varying vec3 vDirection;[\s\S]*?)`/)[1];
const seaFrag = html.match(/fragmentShader:`([^`]*varying vec3 vWorld;[\s\S]*?)`/)[1];
const prefix = html.match(/\bDx\s*=\s*`([\s\S]*?)`/)[1];
// fidelity guard: JS portunda kullandığım her sabit GLSL'de de geçmeli
const GLSL = skyFrag + seaFrag + prefix;
const fidelity = ['127.1', '311.7', '43758.5453123', '3.0-2.0', '1.6,-1.2,1.2,1.6', '0.5',
  '.13,.32,.49', '.12,.25,.35', '.7,.79,.81', '.82,.66,.48', '.010,.020,.052', '.040,.058,.104',
  '.29,.23,.16', '.63,.51,.34', '12.0', '.32', '800.0', '1.05', '.75', '.49,.61,.68', '.38,.45,.48',
  '.030,.042,.070', '.30,.25,.18', '.93,.89,.78', '.93', '.55', '.86,.85,.81', '.26', '.7',
  '12.9898,78.233,37.719', '.9975', '.86,.90,1.0', '2.2', '.025,.14,.185', '.085,.255,.295',
  '.005,.017,.038', '.016,.045,.075', '.055,.062,.045', '.13,.135,.085', '.33,.53,.61', '.52,.52,.45',
  '.045,.070,.125', '.55,.46,.32', '.78,.43', '2.6', '.82', '.9,.66', '4.2', '.9',
  '.58,.71,.77', '.66,.66,.6', '.045,.062,.100', '.60,.50,.35', '.000105', '1.6', '.42', '.68', '.16',
  'uNight*(1.0-uNight)*(1.0-uDust)', '1.05,.18,0.0', '.55,.12,0.0', 'smoothstep(.62,1.0,uNight)'];
const missing = fidelity.filter((c) => !GLSL.includes(c));
if (missing.length) { console.error('FIDELITY HATASI — GLSL değişmiş, port bayat: ' + missing.join(', ')); process.exit(2); }
console.log(`fidelity : ${fidelity.length}/${fidelity.length} sabit GLSL'de doğrulandı`);

/* ------------------------------------------------------- 2) GLSL -> JS temel */
const fract = (x) => x - Math.floor(x);
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sat = (x) => cl(x, 0, 1);
const mix = (a, b, t) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * t) : a + (b - a) * t);
const sm = (e0, e1, x) => { const t = cl((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const add = (a, b) => a.map((v, i) => v + b[i]);
const scl = (a, k) => a.map((v) => v * k);
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };

// prefix.glsl birebir portu
const hash2 = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = fract(x), fy = fract(y);
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return mix(mix(hash2(ix, iy), hash2(ix + 1, iy), fx), mix(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), fx), fy);
}
function fbm2(x, y) {
  let v = 0, a = 0.5;
  for (let i = 0; i < 5; i++) { v += a * noise2(x, y); const nx = 1.6 * x - 1.2 * y, ny = 1.2 * x + 1.6 * y; x = nx; y = ny; a *= 0.5; }
  return v;
}

/* ------------------------------------------------- 3) sky/sea renk fonksiyonları */
const SUNDIR = norm3([-.6, .23, -.8]);
function sky(dir, u) {
  const d = norm3(dir); const h = cl(d[1]);
  let zenith = mix([.13, .32, .49], [.12, .25, .35], u.sunset);
  let horizon = mix([.7, .79, .81], [.82, .66, .48], u.sunset);
  zenith = mix(zenith, [.010, .020, .052], u.night); horizon = mix(horizon, [.040, .058, .104], u.night * u.night);
  zenith = mix(zenith, [.29, .23, .16], u.dust); horizon = mix(horizon, [.63, .51, .34], u.dust);
  const dusk = u.night * (1 - u.night) * (1 - u.dust);
  zenith = add(zenith, scl([.08, 0, .35], dusk)); horizon = add(horizon, scl([1.05, .18, 0], dusk));
  let col = mix(horizon, zenith, Math.pow(h, .42));
  const s = Math.max(dot3(d, SUNDIR), 0);
  const n4 = u.night ** 4;
  col = add(col, scl([1.0, .65, .32], Math.pow(s, 12) * .32 * u.sunset * (1 - u.night * u.night)));
  col = add(col, scl(mix([1.0, .86, .62], [.72, .80, .95], n4), Math.pow(s, 800) * mix(1.5, 1.05, n4) * (1 - u.dust * .75)));
  if (d[1] > 0.012) {
    const uvx = d[0] / (d[1] + .16) * 1.25 + u.t * .0015, uvy = d[2] / (d[1] + .16) * 1.25;
    const inner = fbm2(uvx * 1.7, uvy * 1.7);
    const n = fbm2(uvx + inner * .62, uvy + inner * .62);
    const cloud = sm(.44, .72, n) * sm(.012, .14, d[1]);
    let shadow = mix([.49, .61, .68], [.38, .45, .48], u.sunset);
    shadow = mix(shadow, [.030, .042, .070], u.night * u.night); shadow = mix(shadow, [.30, .25, .18], u.dust);
    const cloudCol = mix(shadow, [.93, .89, .78], sm(.49, .77, n));
    col = mix(col, cloudCol, cloud * .93 * (1 - u.night * u.night * .55));
    const wisps = sm(.55, .77, fbm2(uvx * 2.3 + 30, uvy * 2.3 + 30));
    col = mix(col, [.86, .85, .81], wisps * .26 * (1 - u.night * u.night * .7));
    if (u.night > 0.001) {
      const sp = d.map((v) => v * 230); const ip = sp.map(Math.floor); const fp = sp.map(fract);
      const hs = fract(Math.sin(ip[0] * 12.9898 + ip[1] * 78.233 + ip[2] * 37.719) * 43758.5453);
      const st = sm(.9975, 1, hs) * Math.pow(Math.max(1 - Math.hypot(fp[0] - .5, fp[1] - .5, fp[2] - .5) * 2, 0), 3);
      col = add(col, scl([.86, .90, 1.0], st * sm(.62, 1, u.night) * 2.2));
    }
  }
  if (d[1] < 0) col = mix(horizon, [.25, .38, .44], cl(-d[1] * 3));
  return col;
}
function sea(dist, camY, u) {
  const vw = [0, 0, -dist];
  const view = norm3([0 - vw[0], camY - vw[1], 0 - vw[2]]);
  const normal = [0, 1, 0];
  const fresnel = Math.pow(1 - Math.max(dot3(view, normal), 0), 4);
  let deep = [.025, .14, .185], shallow = [.085, .255, .295];
  deep = mix(deep, [.005, .017, .038], u.night); shallow = mix(shallow, [.016, .045, .075], u.night);
  deep = mix(deep, [.055, .062, .045], u.dust); shallow = mix(shallow, [.13, .135, .085], u.dust);
  const water = mix(deep, shallow, noise2(vw[0] * .008, vw[2] * .008));
  let rs = mix([.33, .53, .61], [.52, .52, .45], u.sunset);
  rs = mix(rs, [.045, .070, .125], u.night * u.night);
  rs = add(rs, scl([.55, .12, 0], u.night * (1 - u.night) * (1 - u.dust)));
  rs = mix(rs, [.55, .46, .32], u.dust);
  let col = mix(water, rs, fresnel * .68);
  const I = SUNDIR.map((v) => -v);
  const R = I.map((v, i) => v - 2 * dot3(normal, I) * normal[i]);
  const spec = Math.pow(Math.max(dot3(R, view), 0), 110);
  col = add(col, scl([1., .78, .43], spec * 2.6 * (1 - u.night * u.night * .82)));
  const glit = Math.pow(Math.max(dot3(R, view), 0), 900);
  col = add(col, scl([1., .9, .66], glit * 4.2 * (1 - u.night * u.night * .9)));
  const haze = 1 - Math.exp(-dist * .000105);
  let hc = mix([.58, .71, .77], [.66, .66, .6], u.sunset);
  hc = mix(hc, [.045, .062, .100], u.night * u.night);
  hc = add(hc, scl([.28, .06, 0], u.night * (1 - u.night) * (1 - u.dust)));
  hc = mix(hc, [.60, .50, .35], u.dust);
  return mix(col, hc, cl(haze * (1 + u.dust * 1.6)));
}

/* ------------------------------------------- 4) ACES + sRGB (bundle'dan doğrulanır) */
const ACES = html.match(/vec3 ACESFilmicToneMapping\([\s\S]*?\n\}/)[0];
const RRT = html.match(/vec3 RRTAndODTFit\([\s\S]*?\n\}/)[0];
const acs = ['0.59719', '0.07600', '0.02840', '0.35458', '0.90834', '0.13383', '0.04823', '0.01566', '0.83777'];
const acsOut = ['1.60475', '-0.10208', '-0.00327', '-0.53108', '1.10813', '-0.07276', '-0.07367', '-0.00605', '1.07602'];
const rrtK = ['0.0245786', '0.000090537', '0.983729', '0.4329510', '0.238081'];
const bad = [...acs, ...acsOut, ...rrtK].filter((k) => !(ACES + RRT).includes(k));
if (bad.length) { console.error('ACES fidelity hatası: ' + bad.join(', ')); process.exit(2); }
const matv = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
const IN = acs.map(Number), OUT = acsOut.map(Number);
const rrt = (v) => v.map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081));
function aces(c) { return matv(OUT, rrt(matv(IN, c.map((v) => v * (exposure / 0.6))))).map(sat); }
const SRGB = html.match(/pow\(\s*value\.rgb,\s*vec3\(\s*([0-9.]+)\s*\)\s*\)/);
const SRGB_E = SRGB ? Number(SRGB[1]) : 1 / 2.4;
const toSRGB = (v) => v.map((c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, SRGB_E) - 0.055));
const to255 = (lin) => toSRGB(aces(lin)).map((c) => Math.round(cl(c) * 255));
const lum = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; // sRGB Rec.709 parlaklık

/* ----------------------------------------- 5) GERÇEK setAtmosphere'ü çalıştır */
const i0 = html.indexOf('setAtmosphere(');
let d = 0, q = null, j = html.indexOf('{', i0), end = -1;
for (let k = j; k < html.length; k++) {
  const c = html[k];
  if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
  if (c === '"' || c === "'" || c === '`') { q = c; continue; }
  if (c === '{') d++; else if (c === '}' && --d === 0) { end = k; break; }
}
const obj = new Function('return {' + html.slice(i0, end + 1) + '}')();
function profile(key, sunset) {
  const rec = {};
  const col = (k) => ({ set: (c) => { rec[k] = c; } });
  const self = {
    atmo: '', skyMaterial: { uniforms: { uNight: { value: 0 }, uDust: { value: 0 } } },
    seaMaterial: { uniforms: { uNight: { value: 0 }, uDust: { value: 0 } } },
    sun: { color: col('sunColor'), intensity: 3.9 },
    hemi: { color: col('hemiSky'), groundColor: col('hemiGnd'), intensity: 2.8 },
    fill: { color: col('fillColor'), intensity: 1.15 },
    sceneE: { fog: { color: col('fogColor'), density: 2e-5 }, environmentIntensity: 0 },
  };
  obj.setAtmosphere.call(self, key);
  return {
    night: self.skyMaterial.uniforms.uNight.value, dust: self.skyMaterial.uniforms.uDust.value, sunset,
    sun: self.sun.intensity, hemi: self.hemi.intensity, fill: self.fill.intensity, ei: self.sceneE.environmentIntensity,
    sunHex: rec.sunColor || (sunset ? '#ffe1b9' : '#fff6e6'),
    hs: rec.hemiSky || '#c8e2f5', hg: rec.hemiGnd || '#263943', fc: rec.fillColor || '#82c1e8',
  };
}
// MeshStandardMaterial yayilim tahmini (three.js: irradyans / PI * albedo * (1-metalness)).
// Yansima (IBL) dahil DEGIL — o environmentIntensity ile ayri olceklenir.
function shade(albedoHex, metal, L, ndotl, ndotup, fdot) {
  const alb = hex2lin(albedoHex).map((a) => a * (1 - metal));
  const sun = hex2lin(L.sunHex).map((c) => c * L.sun * Math.max(ndotl, 0));
  const w = 0.5 * ndotup + 0.5;
  const hemi = mix(hex2lin(L.hg), hex2lin(L.hs), w).map((c) => c * L.hemi);
  const fill = hex2lin(L.fc).map((c) => c * L.fill * Math.max(fdot, 0));
  return to255(sun.map((c, i) => (c + hemi[i] + fill[i]) / Math.PI * alb[i]));
}
const hex2lin = (h) => [1, 3, 5].map((o) => { const c = parseInt(h.slice(o, o + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });

/* --------------------------------------------------------- 6) metrikler + PNG */
const COLS = [
  { ad: 'acik (gunduz)', key: 'açık', sunset: 0 },
  { ad: 'acik (gunbatim)', key: 'açık', sunset: 1 },
  { ad: 'gece', key: 'gece', sunset: 1 },
  { ad: 'alacakaranlik', key: 'alacakaranlık', sunset: 1 },
  { ad: 'tozlu', key: 'tozlu', sunset: 0 },
];
const SKY_H = 200, SEA_H = 88, SW = 34, W = 192;
const rows = [];
const ref = {};
console.log('\n=== METRIKLER (ACES+exposure 0.84+sRGB sonrasi sRGB parlaklik 0..255) ===');
console.log('profil            zenit   ufuk   deniz(yakin/uzak)   gunes.i  hemi.i   gun/zenit orani');
for (const c of COLS) {
  const p = profile(c.key, c.sunset);
  const u = { t: 0, sunset: p.sunset, night: p.night, dust: p.dust };
  const zen = to255(sky([0, 1, 0], u));
  const hor = to255(sky([-.6 * Math.cos(0.02), Math.sin(0.02), -.8 * Math.cos(0.02)], u));
  const seaNear = to255(sea(300, 300, u));
  const seaFar = to255(sea(12000, 300, u));
  if (c.ad.startsWith('acik (gunduz)')) ref.zen = lum(zen), ref.sea = lum(seaNear), ref.hor = lum(hor);
  const ratio = ref.zen ? lum(zen) / ref.zen : NaN;
  const isle = shade('#7f8a83', .02, p, .224, 1, 0);
  const jet = shade('#a0acb2', .77, p, .45, .25, .55);
  console.log(`${c.ad.padEnd(17)} ${String(Math.round(lum(zen))).padStart(5)} ${String(Math.round(lum(hor))).padStart(6)}   ${String(Math.round(lum(seaNear))).padStart(4)}/${String(Math.round(lum(seaFar))).padEnd(4)}       ${String(p.sun).padStart(5)}  ${String(p.hemi).padStart(5)}   ei ${String(p.ei).padEnd(4)} ada ${String(Math.round(lum(isle))).padStart(3)}  ucak ${String(Math.round(lum(jet))).padStart(3)}   ${isNaN(ratio) ? '' : (ratio * 100).toFixed(0) + '%'}`);
  rows.push({ c, u, p, zen, hor, seaNear, seaFar, isle, jet });
}

// PNG: gok + deniz + ada seridi + ucak seridi (son ikisi dogrudan isik, IBL haric)
const H = SKY_H + SEA_H + 3 + SW + 2 + SW;
const buf = Buffer.alloc(COLS.length * W * H * 3);
for (let ci = 0; ci < COLS.length; ci++) {
  const { u } = rows[ci];
  for (let y = 0; y < SKY_H; y++) {
    const el = ((SKY_H - 1 - y) / (SKY_H - 1)) * (Math.PI / 2);
    const dir = [-.6 * Math.cos(el), Math.sin(el), -.8 * Math.cos(el)];
    const px = to255(sky(dir, u));
    for (let x = 0; x < W; x++) { const o = ((y * COLS.length * W) + ci * W + x) * 3; buf[o] = px[0]; buf[o + 1] = px[1]; buf[o + 2] = px[2]; }
  }
  for (let y = 0; y < SEA_H; y++) {
    const t = y / (SEA_H - 1);
    const dist = 300 + Math.pow(t, 3) * 26000; // üst=uzak ufuk, alt=yakın
    const px = to255(sea(dist, 300, u));
    for (let x = 0; x < W; x++) { const o = (((SKY_H + y) * COLS.length * W) + ci * W + x) * 3; buf[o] = px[0]; buf[o + 1] = px[1]; buf[o + 2] = px[2]; }
  }
  const y0 = SKY_H + SEA_H;
  const paint = (x, y, px) => { const o = ((y * COLS.length * W) + ci * W + x) * 3; buf[o] = px[0]; buf[o + 1] = px[1]; buf[o + 2] = px[2]; };
  for (let x = 0; x < W; x++) {
    for (let y = y0; y < y0 + 3; y++) paint(x, y, [0, 0, 0]);
    for (let y = y0 + 3; y < y0 + 3 + SW; y++) paint(x, y, rows[ci].isle);
    for (let y = y0 + 3 + SW; y < y0 + 5 + SW; y++) paint(x, y, [255, 255, 255]);
    for (let y = y0 + 5 + SW; y < H; y++) paint(x, y, rows[ci].jet);
  }
}
// kolon ayraçları
for (let ci = 1; ci < COLS.length; ci++) for (let y = 0; y < H; y++) { const o = ((y * COLS.length * W) + ci * W) * 3; buf[o] = 255; buf[o + 1] = 255; buf[o + 2] = 255; }

/* ---- minimal PNG yazıcı ---- */
const CRC_T = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
const W2 = COLS.length * W;
const raw = Buffer.alloc(H * (1 + W2 * 3));
for (let y = 0; y < H; y++) { raw[y * (1 + W2 * 3)] = 0; buf.copy(raw, y * (1 + W2 * 3) + 1, y * W2 * 3, (y + 1) * W2 * 3); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W2, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(PNG, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`\nPNG      : ${PNG}  (${W2}x${H})`);
console.log('kolonlar : ' + COLS.map((c, i) => `${i + 1}=${c.ad}`).join(' · '));
console.log('satırlar : gökyüzü (ufuk altta, güneş yönü) · deniz · siyah çizgi · ada üst yüzeyi · uçak yan yüzeyi');
console.log('not      : son iki şerit yalnız doğrudan ışık (güneş+hemi+dolgu). Metal uçağın studyo yansıması ei ile ölçeklenir, şeritte yok.');

/* ------------------------------------------------- 7) objektif kalibrasyon kararları */
console.log('\n=== KALIBRASYON KARARLARI ===');
let fails = 0;
const chk = (n, c, d) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  -> ' + d}`); if (!c) fails++; };
const g = rows.find((r) => r.c.key === 'gece'), k = rows.find((r) => r.c.key === 'alacakaranlık'), t = rows.find((r) => r.c.key === 'tozlu'), day = rows[0], bat = rows[1];
const rn = lum(g.zen) / ref.zen;
chk(`gece zenit parlaklığı gündüzün %2–25'i (oyun-gecesi bandı)`, rn >= 0.02 && rn <= 0.25, `%${(rn * 100).toFixed(1)}`);
chk('gece zenit görünür kalıyor (≥ 3/255)', lum(g.zen) >= 3, String(Math.round(lum(g.zen))));
chk('gece denizi tamamen siyah değil (≥ 2/255)', lum(g.seaNear) >= 2, String(Math.round(lum(g.seaNear))));
chk('gece zenit soğuk okunuyor (B>R)', g.zen[2] > g.zen[0], g.zen.join(','));
const rk = lum(k.zen) / ref.zen;
chk(`alacakaranlık zeniti gece ile gündüz arasında (%22–50)`, rk > rn + 0.08 && rk >= 0.22 && rk <= 0.50, `%${(rk * 100).toFixed(1)}`);
chk('alacakaranlık ufku sıcak (R−B ≥ 20)', k.hor[0] - k.hor[2] >= 20, k.hor.join(','));
chk('alacakaranlık zeniti mor/mavi (B>R)', k.zen[2] > k.zen[0], k.zen.join(','));
chk('alacakaranlık geceden en az 20 puan aydınlık', lum(k.zen) >= lum(g.zen) + 20, `${Math.round(lum(k.zen))} vs ${Math.round(lum(g.zen))}`);
// açık hava v3.80 taban çizgisi (uNight=0 yolu değişmemeli)
chk('gündüz zenit taban çizgisi (140–155)', lum(day.zen) >= 140 && lum(day.zen) <= 155, String(Math.round(lum(day.zen))));
chk('günbatımı zenit taban çizgisi (120–140)', lum(bat.zen) >= 120 && lum(bat.zen) <= 140, String(Math.round(lum(bat.zen))));
chk('gündüz zenit patlamıyor (≤ 250)', Math.max(...day.zen) <= 250, String(Math.max(...day.zen)));
// tozlu ile sisli AYRI okunmalı: toprak rengi = R > G > B
chk('tozlu zenit sıcak okunuyor (R>G>B)', t.zen[0] > t.zen[1] && t.zen[1] > t.zen[2], t.zen.join(','));
chk('tozlu deniz sıcak okunuyor (R>G>B)', t.seaNear[0] > t.seaNear[1] && t.seaNear[1] > t.seaNear[2], t.seaNear.join(','));
// tozlu ufuk mesafeyi kapatmalı ama sıfırlamamalı
const rt = lum(t.seaNear) / ref.sea;
chk(`tozlu deniz gündüzün %20–110'u (haze görünürlüğü boğmuyor)`, rt >= 0.2 && rt <= 1.1, `%${(rt * 100).toFixed(1)}`);
// gece ay diski: gündüz güneşinden soluk ama yok değil
const sunPix = to255(sky(SUNDIR, { t: 0, sunset: 1, night: 1, dust: 0 }));
const daySun = to255(sky(SUNDIR, { t: 0, sunset: 1, night: 0, dust: 0 }));
chk('gece ay diski gündüz güneşinden soluk', lum(sunPix) < lum(daySun), `${Math.round(lum(sunPix))} vs ${Math.round(lum(daySun))}`);
chk('gece ay diski yine de seçiliyor (≥ 20/255)', lum(sunPix) >= 20, String(Math.round(lum(sunPix))));
// ada okunabilirliği: doğrudan ışık, IBL hariç. Gündüz ~125. Gece siluet kaybı ~1'di.
const dayIsle = lum(day.isle), geceIsle = lum(g.isle), duskIsle = lum(k.isle);
chk('gece adası okunuyor (18–55) ve gündüzün %40\'ından koyu', geceIsle >= 18 && geceIsle <= 55 && geceIsle < dayIsle * 0.40, `${Math.round(geceIsle)} / gün ${Math.round(dayIsle)}`);
chk('gece adası soğuk (B>R)', g.isle[2] > g.isle[0], g.isle.join(','));
chk('alacakaranlık adası geceden aydınlık, gündüzden koyu, sıcak', duskIsle > geceIsle && duskIsle < dayIsle * 0.6 && k.isle[0] > k.isle[2], `${Math.round(duskIsle)} ${k.isle.join(',')}`);
chk('studyo yansıması gecede kısılıyor (ei .20–.35), normale dönüyor (.82)', g.p.ei >= 0.20 && g.p.ei <= 0.35 && day.p.ei === 0.82 && t.p.ei === 0.82, `gece ${g.p.ei} gün ${day.p.ei} toz ${t.p.ei}`);
chk('alacakaranlık studyo yansıması ara değerde (.35–.55)', k.p.ei >= 0.35 && k.p.ei <= 0.55, String(k.p.ei));
console.log(`\nSONUÇ: ${fails === 0 ? 'tüm kalibrasyon sınırları içinde' : fails + ' sınır AŞILDI'}`);
process.exit(fails === 0 ? 0 : 1);
