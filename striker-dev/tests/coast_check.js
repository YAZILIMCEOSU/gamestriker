// usage: node coast_check.js <url> <missionIdx> <shotPath>
const puppeteer = require('/home/user/.pptr/node_modules/puppeteer'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [url, idxS, shot] = process.argv.slice(2); const idx = +idxS;
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
  const state = JSON.stringify({ version: 2, seenIntro: true, callsign: 'TEST', aircraft: 'striker', credits: 5000, owned: ['striker','spectre'], upgrades: {}, records: {}, preferences: { language: 'en', sound: false, assisted: true, seenIntro: true } });
  const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('idea-game.striker.v2', s); } catch (e) {} }, state);
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(5000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find(x => x.textContent.trim().toUpperCase()==='MISSIONS'); el && el.click(); });
  await sleep(1500);
  await p.evaluate(i => { const c = document.querySelectorAll('.mission-card')[i]; c && c.click(); }, idx);
  await sleep(1500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => /^(DEPLOY|START MISSION)$/i.test(x.textContent.trim())); el && el.click(); });
  await sleep(6000);
  const r = await p.evaluate(() => {
    const s = window.__sim; if (!s) return { err: 'no __sim' };
    const pts = { center_land: [-1800, 600], bay_mid_sea: [1750, -750], open_sea: [9000, 9000], bay_head_sea: [-1500, -1200], east_coast_land: [3000, 900] };
    const out = {}; for (const k in pts) out[k] = Math.round(s.terr(pts[k][0], pts[k][1]));
    let land = 0, n = 0; for (let x = -9000; x <= 9000; x += 300) for (let z = -9000; z <= 9000; z += 300) { n++; if (s.terr(x, z) > 0) land++; }
    const ents = (window.__ents || s.entities || []).filter(e => e.hp > 0 && !e.friendly).length;
    return { pts: out, landPct: Math.round(100 * land / n), ents, phase: s.phase, pos: [Math.round(s.player.x), Math.round(s.player.y), Math.round(s.player.z)] };
  });
  if (shot) await p.screenshot({ path: shot });
  console.log(JSON.stringify({ idx, r, errs: errs.slice(0, 3) }));
  await b.close(); process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
