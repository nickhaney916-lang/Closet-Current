/** Extend the accepted ordinary browser journey without changing its shared source. */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const original = new URL('../test-parallel99-normal-app-browser.mjs', import.meta.url);
const runner = new URL('../.assignment-16-' + randomUUID() + '.mjs', import.meta.url);
let source = await readFile(original, 'utf8');
function insert(anchor, code) {
  if (source.split(anchor).length !== 2) throw Error('Ordinary journey anchor changed');
  source = source.replace(anchor, () => code + '\n' + anchor);
}
insert("const engine=process.env.P99_ENGINE||'chromium';", `
import { activeTrends, openStore, rollback, tick } from './maintenance/store.mjs';
import { documentFor, feeds } from './maintenance/test-data.mjs';
import { week } from './maintenance/trends.mjs';

const trendDb = openStore(':memory:');
const firstDate = Date.now() - week;
const publish = (now, label) => tick(trendDb, feeds, {
  clock: () => now, load: feed => documentFor(feed, now, label)
});
const initialVersion = (await publish(firstDate, 'Assignment 16 baseline')).version;
let releaseFailed = false;
`);
insert("  if(audit&&pathname.startsWith('/auth/v1/')){", `
  if (req.method === 'GET' && pathname === '/maintenance/trends') {
    res.writeHead(releaseFailed ? 503 : 200, {'content-type':'application/json','cache-control':'no-store'});
    res.end(JSON.stringify(releaseFailed ? {} : activeTrends(trendDb)));
    return;
  }
`);
insert(" const firstStorage=await audit?.storage(page);", `
 advance('managed-trend-update-and-rollback');
 const wardrobeSnapshot = () => page.evaluate(async () => {
   const rows = await new Promise((resolve, reject) => {
     const request = db.transaction('items').objectStore('items').getAll();
     request.onsuccess = () => resolve(request.result);
     request.onerror = () => reject(request.error);
   });
   const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows)));
   return { hash: Array.from(new Uint8Array(hash)), saved: document.querySelector('#savedBoards').textContent };
 });
 const wardrobeBefore = await wardrobeSnapshot();
 await page.locator('nav.main-nav button.tab[data-view="stylist"]').click();
 await page.locator('#styleCollectionForm details summary').click();
 await page.locator('#stylistOccasion').selectOption('Casual');
 async function verifyTrend(label) {
   await page.evaluate(() => refreshTrendLibrary(true));
   await page.waitForFunction(label => activeTrendLibrary?.sources.some(source => source.title.startsWith(label)), label);
   await page.locator('#createCollectionOutfits').click();
   const trend = page.locator('#styledCollectionResults .styled-outfit details').filter({hasText: label}).first();
   await trend.locator('summary').click();
   assert.equal(await trend.getByRole('link', { name: label + ' Fixture One' }).first().isVisible(), true);
 }
 await verifyTrend('Assignment 16 baseline');
 const second = await publish(firstDate + week, 'Assignment 16 update');
 assert.equal(second.result, 'activated');
 await verifyTrend('Assignment 16 update');
 releaseFailed = true;
 await page.evaluate(() => refreshTrendLibrary(true));
 assert.match(await page.locator('#stylistFreshness').innerText(), /keeping the last verified/);
 assert.match(await page.locator('#styledCollectionResults').innerText(), /Assignment 16 update/);
 releaseFailed = false;
 assert.equal((await rollback(trendDb)).version, initialVersion);
 await verifyTrend('Assignment 16 baseline');
 assert.deepEqual(await wardrobeSnapshot(), wardrobeBefore, 'trend activation must leave owner rows and saved outfit alone');
 console.log('ASSIGNMENT_16_TRENDS', JSON.stringify({engine,width,update:second.version,rollback:initialVersion,ownerRowsAndSavedOutfitUnchanged:true}));
`);
source = source.replace("benchmark/parallel99-normal-journey", "benchmark/assignment-16-maintenance");
try {
  await writeFile(runner, source, { flag: 'wx' });
  const child = spawn(process.execPath, [runner.pathname], {
    stdio: 'inherit', env: { ...process.env, P1607_AUDIT: '1', P1607_CACHE_ONLY: '0' }
  });
  const [status] = await once(child, 'exit');
  process.exitCode = status ?? 1;
} finally {
  await rm(runner, { force: true });
}
