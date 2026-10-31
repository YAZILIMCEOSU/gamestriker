const puppeteer = require('/home/user/.pptr/node_modules/puppeteer'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [url, idxS] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
  const state = JSON.stringify({ version: 2, seenIntro: true, callsign: 'TEST', aircraft: 'striker', credits: 5000, owned: ['striker','spectre'], upgrades: {}, records: {}, preferences: { language: 'en', sound: false, assisted: true, seenIntro: true } });
  const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 });
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('idea-game.striker.v2', s); } catch (e) {} }, state);
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(5000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find(x => x.textContent.trim().toUpperCase()==='MISSIONS'); el && el.click(); });
  await sleep(1500);
  await p.evaluate(i => { const c = document.querySelectorAll('.mission-card')[i]; c && c.click(); }, +idxS);
  await sleep(1500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => /^(DEPLOY|START MISSION)$/i.test(x.textContent.trim())); el && el.click(); });
  await sleep(4000);
  const r = await p.evaluate(() => { const s = window.__sim; return s.entities.filter(e => e.hp > 0 && !e.friendly).map(e => ({ k: e.kind, x: Math.round(e.position.x), z: Math.round(e.position.z), t: Math.round(s.terr(e.position.x, e.position.z)), g: e.grounded, air: e.airborne })); });
  console.log(JSON.stringify(r));
  await b.close(); process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
