/**
 * Uçuş HUD'unun dokunmatik yerleşimini CSS kademesinden ölçer.
 * Tarayıcı yok: eşleşen @media kuralları sırayla uygulanır, kutular hesaplanır.
 * Yükseklik formülü (CSS yükseklik vermezse): radar = genişlik + 22,
 * silah yığını = (boost görünürse 4 yoksa 3) × silah min-yükseklik + aux + boşluklar,
 * navigasyon = düğme yüksekliği + 28, gövde = 18×90, gaz = 40 genişlik.
 */
import { readFileSync } from 'node:fs';

const TRACK = new Set([
  '.fuel-bar', '.virtual-stick', '.throttle-control', '.radar-block',
  '.weapons-controls', '.weapon', '.weapons-controls .weapon', '.aux-weapons button',
  '.flight-navigation', '.flight-navigation button', '.flight-tools button',
  '.hull-display', '.boost-button', '.vthr-track',
]);

function skipWs(css, i) {
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const e = css.indexOf('*/', i + 2);
      i = e < 0 ? css.length : e + 2;
      continue;
    }
    const c = css[i];
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue; }
    break;
  }
  return i;
}

function readBalanced(css, i) {
  let d = 0;
  const start = i;
  for (; i < css.length; i++) {
    if (css.startsWith('/*', i)) {
      const e = css.indexOf('*/', i + 2);
      i = e < 0 ? css.length - 1 : e + 1;
      continue;
    }
    if (css[i] === '{') d++;
    else if (css[i] === '}') {
      d--;
      if (d === 0) return [css.slice(start + 1, i), i + 1];
    }
  }
  throw new Error('CSS süslü parantez kapanmadı');
}

function collect(css, media, out) {
  let i = 0;
  while (i < css.length) {
    i = skipWs(css, i);
    if (i >= css.length) break;
    if (css[i] === '}') { i++; continue; }
    if (css[i] === '@') {
      const headEnd = css.indexOf('{', i);
      const semi = css.indexOf(';', i);
      if (headEnd < 0 || (semi >= 0 && semi < headEnd)) { i = semi < 0 ? css.length : semi + 1; continue; }
      const head = css.slice(i, headEnd).trim();
      const [body, next] = readBalanced(css, headEnd);
      if (/^@media/i.test(head)) collect(body, head, out);
      i = next;
      continue;
    }
    const brace = css.indexOf('{', i);
    if (brace < 0) break;
    const sel = css.slice(i, brace).trim();
    const [body, next] = readBalanced(css, brace);
    for (const part of sel.split(',')) {
      const p = part.trim();
      if (TRACK.has(p)) out.push({ media, sel: p, body });
    }
    i = next;
  }
}

function mediaMatches(query, v) {
  if (!query) return true;
  const body = query.replace(/^@media/i, '').trim();
  const parts = body.split(/\band\b/i).map((s) => s.trim().replace(/^\(/, '').replace(/\)$/, '').trim());
  return parts.every((p) => {
    let m;
    if ((m = /max-width:\s*(\d+)px/i.exec(p))) return v.w <= +m[1];
    if ((m = /min-width:\s*(\d+)px/i.exec(p))) return v.w >= +m[1];
    if ((m = /max-height:\s*(\d+)px/i.exec(p))) return v.h <= +m[1];
    if ((m = /min-height:\s*(\d+)px/i.exec(p))) return v.h >= +m[1];
    if (/pointer:\s*coarse/i.test(p)) return v.coarse;
    if (/pointer:\s*fine/i.test(p)) return !v.coarse;
    if (/orientation:\s*portrait/i.test(p)) return v.h > v.w;
    if (/orientation:\s*landscape/i.test(p)) return v.w >= v.h;
    return true;
  });
}

function px(v) {
  if (v == null) return null;
  const s = String(v).replace(/!important/g, '').trim();
  if (s === 'auto' || s === '') return null;
  const m = /(-?\d+(?:\.\d+)?)px/.exec(s);
  return m ? +m[1] : null;
}

function apply(rules, view) {
  const box = {};
  for (const r of rules) {
    if (!mediaMatches(r.media, view)) continue;
    const props = box[r.sel] || (box[r.sel] = {});
    for (const decl of r.body.split(';')) {
      const c = decl.indexOf(':');
      if (c < 0) continue;
      const k = decl.slice(0, c).trim();
      const val = decl.slice(c + 1).trim();
      if (k) props[k] = val;
    }
  }
  return box;
}

function num(props, key, fallback) {
  const n = px(props && props[key]);
  return n == null ? fallback : n;
}

function rects(box, v) {
  const boostOn = (box['.boost-button'] || {}).display !== 'none';
  const spec = box['.weapons-controls .weapon'] || {};
  const weaponH = num(spec, 'min-height', num(box['.weapon'], 'min-height', 56));
  const auxH = num(box['.aux-weapons button'], 'min-height', 43);
  const gap = num(box['.weapons-controls'], 'gap', 8);
  const nWep = (boostOn ? 4 : 3);
  const wepStack = nWep * weaponH + auxH + nWep * gap;
  const navBtn = num(box['.flight-navigation button'], 'height', 39);
  const stick = box['.virtual-stick'] || {};
  const stickOn = stick.display === 'flex';
  const items = [];
  const add = (name, left, right, top, bottom, w, h) => {
    let x;
    if (left != null) x = left;
    else if (right != null) x = v.w - right - w;
    else x = (v.w - w) / 2;
    let y;
    if (top != null) y = top;
    else if (bottom != null) y = v.h - bottom - h;
    else return;
    items.push({ name, x1: x, y1: y, x2: x + w, y2: y + h });
  };
  if (stickOn) {
    add('stick', num(stick, 'left', 30), null, px(stick.top), num(stick, 'bottom', 55), num(stick, 'width', 112), num(stick, 'height', 112));
  }
  const radar = box['.radar-block'] || {};
  const rw = num(radar, 'width', 145);
  add('radar', num(radar, 'left', 30), null, px(radar.top), num(radar, 'bottom', 40), rw, rw + 22);
  const thr = box['.throttle-control'] || {};
  const trackH = num(box['.vthr-track'], 'height', 120);
  const thrH = px(thr.height) == null ? trackH + 28 : num(thr, 'height', trackH + 28);
  add('throttle', num(thr, 'left', 34), null, px(thr.top), px(thr.bottom), num(thr, 'width', 40), thrH);
  const wep = box['.weapons-controls'] || {};
  const declaredW = px(wep.width);
  const ww = declaredW == null ? Math.max(num(spec, 'min-width', 56), auxH * 3 + 16, 156) : declaredW;
  add('weapons', null, num(wep, 'right', 30), px(wep.top), num(wep, 'bottom', 55), ww, wepStack);
  const nav = box['.flight-navigation'] || {};
  const nw = Math.max(210, num(nav, 'min-width', 0));
  add('nav', null, null, px(nav.top), px(nav.bottom) == null && px(nav.top) == null ? 47 : px(nav.bottom), nw, navBtn + 28);
  const hull = box['.hull-display'] || {};
  const hullRight = px(hull.left) == null ? num(hull, 'right', 30) : null;
  add('hull', px(hull.left), hullRight, px(hull.top), px(hull.bottom) == null && px(hull.top) == null ? 22 : px(hull.bottom), 90, 18);
  const fuel = box['.fuel-bar'] || {};
  add('fuel', px(fuel.left), px(fuel.left) == null ? num(fuel, 'right', 12) : null, px(fuel.top), px(fuel.top) == null ? num(fuel, 'bottom', 70) : null, num(fuel, 'width', 130), num(fuel, 'height', 7));
  return { items, weaponH, auxH, navBtn, toolsH: num(box['.flight-tools button'], 'height', 36), toolsW: num(box['.flight-tools button'], 'min-width', num(box['.flight-tools button'], 'width', 36)), stickOn };
}

function overlaps(a, b) {
  return a.x1 < b.x2 - 1 && b.x1 < a.x2 - 1 && a.y1 < b.y2 - 1 && b.y1 < a.y2 - 1;
}

export function checkHud(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const sheets = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const rules = [];
  for (const sheet of sheets) collect(sheet, null, rules);
  const views = [
    { name: 'telefon yatay 844×390', w: 844, h: 390, coarse: true, aim: true },
    { name: 'telefon yatay 667×375', w: 667, h: 375, coarse: true, aim: true },
    { name: 'telefon dikey 390×844', w: 390, h: 844, coarse: true, aim: false },
    { name: 'tablet yatay 1024×768', w: 1024, h: 768, coarse: true, aim: true },
    { name: 'masaüstü 1366×768', w: 1366, h: 768, coarse: false, aim: true },
  ];
  let fails = 0;
  const chk = (n, c, d) => {
    console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  -> ' + d}`);
    if (!c) fails++;
  };
  const fire = html.includes('className:"weapon fire-button"')
    && /fire-button"[\s\S]{0,220}setPointerCapture/.test(html)
    && !/fire-button"[\s\S]{0,320}onPointerLeave/.test(html);
  chk('ateş tuşu parmak kayınca bırakmıyor (pointer capture, leave yok)', fire, 'leave veya capture eksik');
  const boost = /boost-button"[\s\S]{0,180}setPointerCapture/.test(html);
  chk('boost tuşu parmak kayınca açık kalmıyor', boost, 'setPointerCapture yok');

  for (const v of views) {
    const { items, weaponH, auxH, navBtn, toolsH, toolsW, stickOn } = rects(apply(rules, v), v);
    console.log(`  ${v.name}: silah ${weaponH}px  aux ${auxH}px  rota ${navBtn}px  araç ${toolsW}×${toolsH}  kol ${stickOn ? 'açık' : 'kapalı'}`);
    if (v.coarse) {
      chk(`${v.name}: kol görünür`, stickOn, 'display flex değil');
      chk(`${v.name}: silah / füze / top en az 44px`, weaponH >= 44, String(weaponH));
      chk(`${v.name}: flare / bomba en az 44px`, auxH >= 44, String(auxH));
      chk(`${v.name}: rota düğmesi en az 44px`, navBtn >= 44, String(navBtn));
      chk(`${v.name}: kamera / duraklat en az 44px`, toolsH >= 44 && toolsW >= 44, `${toolsW}×${toolsH}`);
    }
    const hits = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (overlaps(items[i], items[j])) hits.push(`${items[i].name}+${items[j].name}`);
      }
    }
    chk(`${v.name}: HUD kutuları çakışmıyor`, hits.length === 0, hits.join(', ') || 'ölçülemedi');
    if (v.aim) {
      const aim = { x1: v.w / 2 - 40, y1: v.h / 2 - 30, x2: v.w / 2 + 40, y2: v.h / 2 + 30 };
      const cover = items.filter((it) => overlaps(it, aim)).map((it) => it.name);
      chk(`${v.name}: nişangah açık`, cover.length === 0, cover.join(','));
    }
  }
  console.log(`\nSONUÇ: ${fails === 0 ? 'dokunmatik HUD yerleşimi temiz' : fails + ' kontrol BAŞARISIZ'}`);
  return fails === 0 ? 0 : 1;
}
