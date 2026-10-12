import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const dimension of [192,512]){
 const icon=manifest.icons.find(i=>i.sizes===`${dimension}x${dimension}`&&i.purpose==='any');assert.ok(icon);
 const buffer=fs.readFileSync('dist/'+icon.src);assert.equal(buffer.readUInt32BE(16),dimension);assert.equal(buffer.readUInt32BE(20),dimension);
}
const source=fs.readFileSync('dist/sw.js','utf8');assert.ok(!source.includes('__VERSION__'));assert.ok(!source.includes('__ASSETS__'));
const events={},saved=new Map();const cache={async addAll(urls){for(const url of urls)saved.set(url,new Response('cached'));},async put(key,value){saved.set(typeof key==='string'?key:key.url,value);},async match(key){return saved.get(typeof key==='string'?key:key.url);}};
const self={registration:{scope:'https://example.com/Closet-Current/'},location:{origin:'https://example.com'},clients:{claim:async()=>{}},addEventListener(name,handler){events[name]=handler;}};
const context={self,URL,Response,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async()=>{throw Error('offline');}};
vm.createContext(context);vm.runInContext(source,context);
let job;events.install({waitUntil(promise){job=promise;}});await job;
assert.ok(saved.has('https://example.com/Closet-Current/index.html'));
let result;events.fetch({request:{method:'GET',url:'https://example.com/Closet-Current/',mode:'navigate'},respondWith(promise){result=promise;}});assert.equal((await result).status,200);
let intercepted=false;
events.fetch({request:{method:'GET',url:'https://example.com/Closet-Current/api/private'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
events.fetch({request:{method:'GET',url:'https://external.example/photo.jpg'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
events.fetch({request:{method:'POST',url:'https://example.com/Closet-Current/index.html'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
assert.ok(fs.readFileSync('public/pwa.js','utf8').includes("!location.hostname.endsWith('.chatgpt.site')"));
console.log('Install manifest, icon dimensions, subpath offline fallback, restricted caching and private-test-host exclusion checks passed.');
