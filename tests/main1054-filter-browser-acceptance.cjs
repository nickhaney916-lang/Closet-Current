// Research-only, original-document DOM integration acceptance; no signed-in owner claims.
// Executes the actual built index.html, unmodified app.js and closet-browser.js on pinned refs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };

async function serve(directory) {
  const root = path.resolve(directory);
  const server = http.createServer((request,response) => {
    const relative = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
    if (!file.startsWith(root+path.sep)) { response.writeHead(403);response.end();return; }
    fs.readFile(file,(error, bytes) => {
      if (error) {response.writeHead(404);response.end();return;}
      response.writeHead(200,{ 'content-type': mime[path.extname(file)] || 'application/octet-stream',
        'cache-control':'no-store' });
      response.end(bytes);
    });
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return { url:'http://127.0.0.1:'+server.address().port+'/', close:()=>new Promise(resolve=>server.close(resolve)) };
}

async function runEngine(name,engine,root,expectedBroken) {
  const server=await serve(root);
  const browser=await engine.launch({headless:true});
  const report=[];
  try {
    for(const width of [320,390,430]) {
      const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',err=>errors.push(String(err)));
      await page.route('**/*',route=>{
        const u=new URL(route.request().url());
        if (u.hostname==='127.0.0.1') return route.continue();
        return route.abort();
      });
      try {
        await page.goto(server.url,{waitUntil:'load',timeout:30000});
        await page.waitForFunction(()=>typeof render==='function' &&
          typeof renderClosetBrowser==='function' && typeof normalizeClothing==='function',{timeout:15000});
        // We never sign in or unhide the locked application shell. These are synthetic
        // fixture DOM checks of genuine scripts, not authenticated owner acceptance.
        const init=await page.evaluate(()=>{
          const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
          items=[
            normalizeClothing({id:'winter',name:'Winter shirt',category:'Tops',itemType:'Shirt',image,seasons:['Winter'],sleeveLength:'Long sleeve'}),
            normalizeClothing({id:'summer',name:'Summer shirt',category:'Tops',itemType:'Shirt',image,seasons:['Summer'],sleeveLength:'Short sleeve'}),
            normalizeClothing({id:'all',name:'All-season shirt',category:'Tops',itemType:'Shirt',image,seasons:['All seasons'],sleeveLength:'Long sleeve'}),
          ];
          render();
          return { locked:document.getElementById('appShell').hidden,
            authVisible:!document.getElementById('authGate').hidden };
        });
        assert.equal(init.locked,true,'locked application shell must remain hidden');
        assert.equal(init.authVisible,true,'authentication gate must not be bypassed');
        const cases=[
          {label:'empty',season:'',sleeve:'',ids:[],hidden:true},
          {label:'season',season:'Winter',sleeve:'',ids:['winter','all'],hidden:false},
          {label:'sleeve',season:'',sleeve:'Short sleeve',ids:['summer'],hidden:false},
          {label:'both',season:'Winter',sleeve:'Long sleeve',ids:['winter','all'],hidden:false},
          {label:'no-results',season:'Winter',sleeve:'Short sleeve',ids:[],hidden:false},
          {label:'reset',season:'',sleeve:'',ids:[],hidden:true},
        ];
        const actual=[];
        for(const check of cases) {
          const state=await page.evaluate(({season,sleeve})=>{
            const a=document.querySelector('#seasonFilter'), b=document.querySelector('#sleeveFilter');
            a.value=season;b.value=sleeve;
            b.dispatchEvent(new Event('change',{bubbles:true}));
            return {
              // Read the actual rendered article text, not an isolated extracted filter function.
              ids:[...document.querySelectorAll('#closetGrid article.card h3')].map(n=>n.textContent),
              hidden:document.getElementById('closetCollection').hidden,
              locked:document.getElementById('appShell').hidden,
            };
          },check);
          const expectedNames=check.ids.map(id=>({winter:'Winter shirt',summer:'Summer shirt',all:'All-season shirt'})[id]);
          assert.deepEqual(state.ids,expectedNames,name+' '+width+' '+check.label+' grid');
          assert.equal(state.hidden, expectedBroken && !check.hidden ? true : check.hidden,
            name+' '+width+' '+check.label+' parent collection');
          assert.equal(state.locked,true,'synthetic test must leave real auth gate locked');
          actual.push({case:check.label,shown:state.ids.length,collectionHidden:state.hidden});
        }
        assert.equal(errors.length,0,name+' '+width+' has unexpected page JavaScript errors: '+errors.join('; '));
        report.push({engine:name,width,baselineBroken:expectedBroken,cases:actual.length,status:'PASS'});
      } finally {await context.close();}
    }
  } finally {await browser.close();await server.close();}
  return report;
}

async function main() {
  const old=process.argv[2],current=process.argv[3];
  if(!old||!current) throw Error('Usage: node tests/main1054-filter-browser-acceptance.cjs baseline-dist candidate-dist');
  const matrix=[];
  for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]) {
    matrix.push(...await runEngine(name,engine,old,true));
    matrix.push(...await runEngine(name,engine,current,false));
  }
  console.log(JSON.stringify({status:'PASS',scope:'Synthetic, locked-shell original-document browser filter DOM',
    originalOwnerFlow:false,accountAccess:false,nativeRepair:false,familyAlpha:'HOLD',
    expectedNegativeControl:'#1545 renders matching cards but hides their parent collection',
    matrix},null,2));
}
main().catch(error=>{console.error(error.stack || String(error));process.exitCode=1;});
