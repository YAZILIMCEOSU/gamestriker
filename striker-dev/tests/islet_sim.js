// usage: node islet_sim.js <url> <missionIdx> <simSecs>
// Deterministic: drives sim.update(dt, input) synchronously. Assist ON, no input. Player starts on islet 91 (or nearest peak).
const puppeteer = require('/home/user/.pptr/node_modules/puppeteer'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [url, idxS, secsS] = process.argv.slice(2); const idx = +idxS, secs = +(secsS || 60);
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
  const state = JSON.stringify({ version: 2, seenIntro: true, callsign: 'TEST', aircraft: 'striker', credits: 5000, owned: ['striker','spectre'], upgrades: {}, records: {}, preferences: { language: 'en', sound: false, assisted: true, seenIntro: true } });
  const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('idea-game.striker.v2', s); } catch (e) {} }, state);
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(5000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find(x => x.textContent.trim().toUpperCase()==='MISSIONS'); el && el.click(); });
  await sleep(1500);
  await p.evaluate(i => { const c = document.querySelectorAll('.mission-card')[i]; c && c.click(); }, idx);
  await sleep(1500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => /^(DEPLOY|START MISSION)$/i.test(x.textContent.trim())); el && el.click(); });
  await sleep(4000);
  const out = await p.evaluate((secs) => {
    const s = window.__sim; if (!s) return { err: 'no __sim' };
    s.terr(0, 0); const pk = s.peaks || [];
    const isl = pk.find(q => q[4] === 91) || pk.find(q => q[4] >= 92) || pk[0];
    s.player.x = isl[0]; s.player.z = isl[1]; s.player.y = 60; s.speed = 150; s.phase = 'combat'; s.catT = 9; s.assisted = true;
    const inp = { yaw: 0, pitch: 0, throttle: .42, fire: false, boost: false };
    const cx = isl[0], cz = isl[1]; const samples = []; let landSteps = 0, steps = 0, maxDist = 0, minAlt = 1e9, maxAlt = -1e9;
    const N = Math.round(secs / 0.04);
    for (let i = 0; i < N && !s.result; i++) {
      s.update(0.04, inp); steps++;
      const ter = s.terr(s.player.x, s.player.z); if (ter > 0) landSteps++;
      const d = Math.hypot(s.player.x - cx, s.player.z - cz); maxDist = Math.max(maxDist, d);
      minAlt = Math.min(minAlt, s.player.y); maxAlt = Math.max(maxAlt, s.player.y);
      if (i % 125 === 0) samples.push({ t: +s.time.toFixed(1), ph: s.phase, x: Math.round(s.player.x), z: Math.round(s.player.z), y: Math.round(s.player.y), ter: Math.round(ter), spd: Math.round(s.speed), hp: Math.round(s.health), tk: s.target ? s.target.kind : null, td: Math.round(s.targetDistance || 0), res: s.result ? String(s.result.outcome || s.result.ok || 'end') : null });
    }
    return { islet: [Math.round(cx), Math.round(cz), isl[2], isl[3], isl[4]], steps, landFracPct: Math.round(100 * landSteps / Math.max(1, steps)), maxDistFromIsletM: Math.round(maxDist), altRange: [Math.round(minAlt), Math.round(maxAlt)], endPos: [Math.round(s.player.x), Math.round(s.player.z)], endHp: Math.round(s.health), samples };
  }, secs);
  console.log(JSON.stringify({ url, idx, errs: errs.slice(0, 2), out }));
  await b.close(); process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
