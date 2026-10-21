// Synthetic browser check with the exact customer trend-loading source; not a market research freshness check.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const source=fs.readFileSync('public/outfit-board.js','utf8');
const code=source.slice(source.indexOf('const TREND_DATA_URL='),source.indexOf('async function reloadCloudBoard('));
const library=fs.readFileSync('public/trend-library.js','utf8');
const engine=fs.readFileSync('public/outfit-board-engine.js','utf8');
const sourceFunction=engine.match(/function applyLoadedTrendLibrary\(value\)\{[^\n]+\}/)?.[0];
assert.ok(sourceFunction,'The trusted trend adoption function was not found');
const seed=JSON.parse(fs.readFileSync('public/trend-data.json','utf8'));
const fixture=(stamp,title)=>{
 const d=structuredClone(seed);d.updated_at=stamp;d.sources[0].title=title;
 return d;
};
const old=fixture('2026-10-05T12:00:00.000Z','CACHED OLD');
const packaged=fixture('2026-10-19T12:00:00.000Z','PACKAGED NEW');
const newer=fixture('2026-10-20T12:00:00.000Z','CACHED NEWER');
const remote=fixture('2026-10-21T01:00:00.000Z','REMOTE NEWEST');
const cases=[
 {name:'offline bundle replaces older cache',cache:old,bundle:packaged,remote:null,want:'PACKAGED NEW',saved:packaged.updated_at},
 {name:'newer cache survives old bundle',cache:newer,bundle:packaged,remote:null,want:'CACHED NEWER',saved:newer.updated_at},
 {name:'newer remote supersedes cache and bundle',cache:old,bundle:packaged,remote,want:'REMOTE NEWEST',saved:remote.updated_at},
 {name:'same timestamp cannot override data',cache:old,bundle:packaged,remote:fixture(packaged.updated_at,'CONFLICTING SOURCE'),want:'PACKAGED NEW',saved:packaged.updated_at},
 {name:'corrupt cache falls back to bundle',cache:'{garbled',bundle:packaged,remote:null,want:'PACKAGED NEW',saved:packaged.updated_at},
 {name:'missing bundled file retains newer cache',cache:newer,bundle:null,remote:null,want:'CACHED NEWER',saved:newer.updated_at}
];
const bootstrap=[
 'let activeTrendLibrary=null,outfitTrendSources=[],outfitProductExamples=[];',
 'let boardInitialized=true;const $=id=>document.getElementById(id);',
 'function renderTrendReferences(){window.__trendMock.renderCalls++;}',
 'function renderBoardSuggestions(){window.__trendMock.renderCalls++;}',
 sourceFunction,
 library,
 code,
 "window.__trendSnapshot=()=>({title:activeTrendLibrary?.sources?.[0]?.title,stored:JSON.parse(localStorage.getItem('closet-current-trend-library-v1')).updated_at,rendered:window.__trendMock.renderCalls,urls:window.__trendMock.urls,freshness:document.getElementById('trendFreshness').textContent});"
].join('\n');
const outcomes=[];
for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  for(const c of cases){
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{
    if(route.request().url()==='https://closet-current.example.test/')
     return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Verified trend source test</title><p id="trendFreshness"></p>'});
    requests.push(route.request().url());return route.abort();
   });
   await page.goto('https://closet-current.example.test/');
   const raw=typeof c.cache==='string'?c.cache:JSON.stringify(c.cache);
   await page.evaluate(raw=>localStorage.setItem('closet-current-trend-library-v1',raw),raw);
   await page.evaluate(({bundle,remote})=>{
    window.__trendMock={urls:[],renderCalls:0,bundle,remote};
    window.fetch=async url=>{
     window.__trendMock.urls.push(String(url));
     if(url==='./trend-data.json')
      return bundle?{ok:true,json:async()=>bundle}:{ok:false};
     if(!remote)throw Error('Offline remote refresh');
     return {ok:true,json:async()=>remote};
    };
    window.setInterval=()=>0;
   },{bundle:c.bundle,remote:c.remote});
   await page.addScriptTag({content:bootstrap});
   await page.waitForFunction(()=>window.__trendSnapshot&&
    window.__trendSnapshot().urls.some(x=>x.startsWith('https://raw.githubusercontent.com/')));
   await page.waitForFunction(()=>document.querySelector('#trendFreshness').textContent.length>1);
   const got=await page.evaluate(()=>window.__trendSnapshot());
   assert.equal(got.title,c.want,name+': '+c.name);
   assert.equal(got.stored,c.saved,name+': cache should preserve freshest verified source');
   assert.ok(got.urls.includes('./trend-data.json'));
   assert.ok(got.rendered>0);
   assert.deepEqual(requests,[],'Unexpected network request');
   assert.deepEqual(errors,[],name+': '+c.name);
   await page.close();
  }
  outcomes.push({emulatedBrowser:name,scenarios:cases.length,existingCustomerTrendCode:true,realTrendSourcesRefreshed:false,
   networkRequests:0,physicalPhoneVerified:false,personalWardrobeDataRead:false});
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'PASS',results:outcomes,realGarmentAccuracy:null,productionApproval:false}));
