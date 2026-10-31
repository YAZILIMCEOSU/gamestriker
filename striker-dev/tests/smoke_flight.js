// usage: node smoke_flight.js <url> <missionIdx> <secs>  -> page errors + flight state after deploy
const puppeteer = require('/home/user/.pptr/node_modules/puppeteer'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [url, idxS, secsS] = process.argv.slice(2); const idx = +idxS, secs = +(secsS || 15);
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
  const deployed = await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => x.textContent.trim()==='DEPLOY'); if (el) { el.click(); return true; } return false; });
  await sleep(secs * 1000);
  const hud = await p.evaluate(() => ({ canvas: !!document.querySelector('canvas'), text: (document.body.innerText || '').slice(0, 160).replace(/\n/g, ' | ') }));
  console.log(JSON.stringify({ url, idx, deployed, errs: errs.slice(0, 3), errCount: errs.length, hud }));
  await b.close(); process.exit(0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
