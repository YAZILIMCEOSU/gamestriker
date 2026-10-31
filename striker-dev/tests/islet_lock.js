// usage: node islet_lock.js <url> <missionIdx> <secs>
// Places player on secondary islet centre (or nearest peak), assist ON, no input, samples flight state.
const puppeteer = require('/home/user/.pptr/node_modules/puppeteer'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [url, idxS, secsS] = process.argv.slice(2); const idx = +idxS, secs = +(secsS || 40);
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
  const state = JSON.stringify({ version: 2, seenIntro: true, callsign: 'TEST', aircraft: 'striker', credits: 5000, owned: ['striker','spectre'], upgrades: {}, records: {}, preferences: { language: 'en', sound: false, assisted: true, seenIntro: true } });
  const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('idea-game.striker.v2', s); } catch (e) {} }, state);
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(6000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find(x => x.textContent.trim().toUpperCase()==='MISSIONS'); el && el.click(); });
  await sleep(2000);
  await p.evaluate(i => { const c = document.querySelectorAll('.mission-card')[i]; c && c.click(); }, idx);
  await sleep(2000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => /^(DEPLOY|START MISSION)$/i.test(x.textContent.trim())); el && el.click(); });
  await sleep(5000);
  const start = await p.evaluate(() => {
    const s = window.__sim; if (!s) return { err: 'no __sim' };
    s.terr(0, 0); const pk = s.peaks || [];
    const isl = pk.find(q => q[4] === 91) || pk.find(q => q[4] >= 92) || pk[0];
    s.player.x = isl[0]; s.player.z = isl[1]; s.player.y = 60; s.speed = 150; s.phase = 'combat'; s.catT = 9; s.assisted = true;
    return { islet: [Math.round(isl[0]), Math.round(isl[1]), isl[2], isl[3], isl[4]], mission: s.mission && s.mission.id };
  });
  if (start.err) { console.log(JSON.stringify({ idx, start, errs })); await b.close(); process.exit(0); }
  const samples = [];
  for (let t = 0; t < secs; t += 2) {
    await sleep(2000);
    samples.push(await p.evaluate(() => { const s = window.__sim, t = s.target; return { t: Math.round(s.time), ph: s.phase, x: Math.round(s.player.x), y: Math.round(s.player.y), z: Math.round(s.player.z), ter: Math.round(s.terr(s.player.x, s.player.z)), spd: Math.round(s.speed), tk: t ? t.kind : null, td: Math.round(s.targetDistance || 0), tb: +(s.targetBearing || 0).toFixed(2), hp: Math.round(s.health), ast: s.assisted, rej: !!s.rejoinPoint }; }));
  }
  const last = samples[samples.length - 1];
  const dIsl = Math.round(Math.hypot(last.x - start.islet[0], last.z - start.islet[1]));
  console.log(JSON.stringify({ idx, start, errs: errs.slice(0, 2), distFromIsletEnd: dIsl, first: samples[0], last, samples: samples.filter((_, i) => i % 3 === 0) }));
  await b.close(); process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
