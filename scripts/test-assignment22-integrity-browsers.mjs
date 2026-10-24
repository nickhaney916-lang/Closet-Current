import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('public/app.js','utf8');
const part=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
const source=['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js','wardrobe-backup-engine.js'].map(f=>fs.readFileSync('public/'+f,'utf8')).join('\n')+
 part('function savePiece(','function node(')+part('async function saveIndexed(','async function recognizeItem(');
const reports=[];
for(const [engine,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch({headless:true});
 try{for(const width of [320,390,430]){
 const page=await browser.newPage({viewport:{width,height:844}});let external=0;
 await page.route('**/*',route=>{if(route.request().url()==='http://integrity.test/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic offline integrity test</title>'});external++;return route.abort();});
 await page.goto('http://integrity.test/');
 const result=await page.evaluate(async source=>{
  const run=new Function(source+`\nreturn async function(){
   const database=await new Promise((resolve,reject)=>{const r=indexedDB.open('assignment22',1);r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   let db=database,items=[],batch=[],release;
   const queued=work=>Promise.resolve().then(work),persistDraft=()=>{},similarPhotos=()=>false,independentlyDistinctOutfitRegions=()=>true,segmentationAllows=()=>true,ClothingDetails={validColor:x=>!!x};
   // Function declarations above close over this factory scope; globals below
   // are the actual app bindings used by the extracted functions.
   Object.assign(window,{db,items,batch,queued,persistDraft,similarPhotos,independentlyDistinctOutfitRegions,segmentationAllows,ClothingDetails});
   const canvas=document.createElement('canvas');canvas.width=60;canvas.height=90;const ctx=canvas.getContext('2d');ctx.fillStyle='navy';ctx.fillRect(0,0,60,90);const jpeg=canvas.toDataURL('image/jpeg');
   const p={id:'top',name:'Confirmed navy top',category:'Tops',itemType:'T-shirt',color:'Navy',colorSource:'user',image:jpeg,outfitSourceId:'scene',originalPhoto:{image:jpeg,sourceId:'scene'},recognitionPhoto:{image:jpeg,crop:{x:0,y:0,width:60,height:90}},segmentHint:{categories:['Tops'],types:['T-shirt']},userAdjusted:false};
   window.batch=[p];const saving=saveIndexed(p,()=>true);await Promise.resolve();p.originalPhoto.sourceId='changed-draft';p.recognitionPhoto.crop.x=99;await saving;
   const get=(store)=>new Promise((resolve,reject)=>{const r=database.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   const disk=await get('items');if(JSON.stringify(window.items)!==JSON.stringify(disk))throw Error('Published original differs from IndexedDB');
   if(disk[0].originalPhoto.sourceId!=='scene'||disk[0].recognitionPhoto.crop.x!==0)throw Error('Mutable draft changed saved source');
   const corrected={...disk[0],color:'Blue',colorSource:'user',userAdjusted:true};
   window.batch=[corrected];const manual=savePiece(corrected,()=>window.batch.filter(x=>x.id!==corrected.id),()=>true);window.batch.push({...corrected,id:'next-capture'});await manual;
   const state=await get('state');if(state[0].batch[0]?.id!=='next-capture')throw Error('Queued manual save lost later capture');
   database.close();const reopened=await new Promise(resolve=>{const r=indexedDB.open('assignment22');r.onsuccess=()=>resolve(r.result);});
   const saved=await new Promise(resolve=>{const r=reopened.transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);});
   const incoming=ClosetWardrobeBackup.validate({format:'closet-current',version:4,ownerId:'alice',items:saved,looks:[]},'alice',{normalizeItem:normalizeClothing,normalizeLook:x=>x,cleanBoard:cleanOutfitBoard});
   if(incoming.items[0].color!=='Blue'||!incoming.items[0].userAdjusted||incoming.items[0].recognitionPhoto.image!==jpeg)throw Error('Correction/source lost through reopen/backup');
   const before=JSON.stringify(incoming.items);cleanOutfitBoard({slots:{top:'top'}},incoming.items);if(JSON.stringify(incoming.items)!==before)throw Error('Selection mutated garment');
   reopened.close();await new Promise(resolve=>{const r=indexedDB.deleteDatabase('assignment22');r.onsuccess=resolve;});return {sourcePreserved:true,correctionPreserved:true,laterCapturePreserved:true,reopened:true};
  }`);
  return run()();
 },source);
 assert.equal(external,0);reports.push({engine,width,...result,externalRequests:external});await page.close();
 }}finally{await browser.close();}
}
fs.mkdirSync('artifacts/assignment22',{recursive:true});fs.writeFileSync('artifacts/assignment22/browser-integrity.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
