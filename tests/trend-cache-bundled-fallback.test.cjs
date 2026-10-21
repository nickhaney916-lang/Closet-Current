const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-board.js','utf8');
const code=source.slice(source.indexOf('const TREND_DATA_URL='),source.indexOf('async function reloadCloudBoard('));
const normalizeTrendLibrary=require('../public/trend-library.js').normalizeTrendLibrary;
const seed=JSON.parse(fs.readFileSync('public/trend-data.json','utf8'));
const version=(stamp,label)=>{
 const data=structuredClone(seed);data.updated_at=stamp;
 data.next_refresh_at=new Date(Date.parse(stamp)+7*86400000).toISOString();
 data.sources[0].title=label;return data;
};
const cached=version('2026-10-05T12:00:00.000Z','OLDER PHONE CACHE');
const bundled=version('2026-10-19T12:00:00.000Z','NEWER BUNDLED RESEARCH');
const newer=version('2026-10-20T12:00:00.000Z','LATEST VERIFIED CACHE');
const remote=version('2026-10-21T01:00:00.000Z','NEWLY CHECKED REMOTE');
async function run({cache=null,bundle=bundled,live=null,rawCache}={}){
 let stored=rawCache===undefined?(cache?JSON.stringify(cache):null):rawCache;
 const urls=[],applied=[],refs=[],updates=[];
 const c={
  Date,URL,Number,Math,Set,JSON,AbortController,Error,Promise,
  setTimeout(){return 1;},clearTimeout(){},setInterval(){},
  localStorage:{getItem(){return stored;},setItem(k,v){stored=v;}},
  normalizeTrendLibrary,activeTrendLibrary:null,outfitTrendSources:[],
  outfitProductExamples:[],boardInitialized:true,
  applyLoadedTrendLibrary(v){
   const l=normalizeTrendLibrary(v);
   c.activeTrendLibrary=l;c.outfitTrendSources=l.sources;c.outfitProductExamples=l.products;
   applied.push(l.updatedAt);return l;
  },
  $:()=>({textContent:''}),renderTrendReferences(){refs.push('render');},
  renderBoardSuggestions(){updates.push('board');},
  window:{addEventListener(){}},document:{addEventListener(){},hidden:false},
  fetch:async(url)=>{
   urls.push(url);
   if(url==='./trend-data.json'){
    if(bundle instanceof Error)throw bundle;
    return bundle?{ok:true,json:async()=>bundle}:{ok:false};
   }
   if(live instanceof Error||live===null)throw Error('Offline refresh');
   return {ok:true,json:async()=>live};
  }
 };
 vm.createContext(c);vm.runInContext(code,c);
 for(let n=0;n<12;n++)await new Promise(setImmediate);
 return {library:c.activeTrendLibrary,urls,applied,refs,updates,cache:stored};
}
test('offline bundled library replaces stale phone cache, even if GitHub background refresh is unreachable',async()=>{
 const x=await run({cache:cached,bundle:bundled,live:new Error('offline')});
 assert.equal(x.library.sources[0].title,'NEWER BUNDLED RESEARCH');
 assert.ok(x.applied.includes(bundled.updated_at));
 assert.ok(x.urls.some(u=>u==='./trend-data.json'));
 assert.ok(x.urls.some(u=>u.startsWith('https://raw.githubusercontent.com/')));
 assert.equal(JSON.parse(x.cache).updated_at,bundled.updated_at);
 assert.ok(x.updates.length>0);
});
test('newer verified cache not downgraded by older app-bundled research',async()=>{
 const x=await run({cache:newer,bundle:bundled});
 assert.equal(x.library.sources[0].title,'LATEST VERIFIED CACHE');
 assert.equal(JSON.parse(x.cache).updated_at,newer.updated_at);
 assert.deepEqual(x.applied,[newer.updated_at]);
});
test('verified remote freshness wins only if newer than cache and bundle',async()=>{
 const x=await run({cache:cached,bundle:bundled,live:remote});
 assert.equal(x.library.sources[0].title,'NEWLY CHECKED REMOTE');
 assert.deepEqual(x.applied,[cached.updated_at,bundled.updated_at,remote.updated_at]);
 assert.equal(JSON.parse(x.cache).updated_at,remote.updated_at);
});
test('equal-dated remote data does not rewrite verified bundled library',async()=>{
 const equal=version(bundled.updated_at,'DIFFERENT REMOTE AT SAME CHECK TIME');
 const x=await run({cache:cached,bundle:bundled,live:equal});
 assert.equal(x.library.sources[0].title,'NEWER BUNDLED RESEARCH');
 assert.equal(JSON.parse(x.cache).sources[0].title,'NEWER BUNDLED RESEARCH');
});
test('invalid cache is replaced from bundled trusted research without network',async()=>{
 const x=await run({rawCache:'{invalid json',bundle:bundled});
 assert.equal(x.library.sources[0].title,'NEWER BUNDLED RESEARCH');
});
test('bundle outage cannot erase valid cache or expose personal wardrobe data',async()=>{
 const x=await run({cache:newer,bundle:new Error('missing'),live:new Error('offline')});
 assert.equal(x.library.sources[0].title,'LATEST VERIFIED CACHE');
 assert.equal(x.cache,JSON.stringify(newer));
});
test('untrusted bundled schema cannot replace valid previous data',async()=>{
 const fake=structuredClone(bundled);fake.schema_version=404;
 const x=await run({cache:newer,bundle:fake});
 assert.equal(x.library.sources[0].title,'LATEST VERIFIED CACHE');
});
