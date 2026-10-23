// Offline record/selection benchmark. Never performs recognition or inference.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {dirname} from 'node:path';
import {wardrobe,validateSynthetic,hash} from '../benchmark/issue201-synthetic-wardrobes.mjs';
const require=createRequire(import.meta.url),backup=require('../public/wardrobe-backup-engine.js');
export const BASE='93252a3b6f570b7e38473bd1683ed3468aad84d1';
export function engine(){
 const c={URL,encodeURIComponent,structuredClone,Date};vm.createContext(c);
 for(const f of ['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(readFileSync('public/'+f,'utf8'),c,{filename:f});
 return c;
}
const plain=x=>JSON.parse(JSON.stringify(x));
const signature=board=>Object.entries(board.slots).sort().map(([slot,id])=>slot+':'+id).join('|');
export function oracle(result,fixture,anchor=null){
 const entries=Object.entries(result.board.slots),ids=entries.map(([,id])=>id);
 assert.equal(ids.length,new Set(ids).size,'one record cannot occupy multiple slots');
 assert.ok(ids.every(id=>fixture.items.some(x=>x.id===id)),'only fixture-owned records allowed');
 for(const id of ids){
  const item=fixture.items.find(x=>x.id===id),p=fixture.ledger[id];
  assert.equal(p.owner,fixture.owner,'provenance belongs to owner');
  assert.equal(hash(item.originalPhoto.image),p.originalHash,'original unchanged');
  assert.equal(hash(item.recognitionPhoto.image),p.recognitionHash,'recognition crop unchanged');
  assert.equal(hash(item.image),p.displayHash,'display unchanged');
  assert.equal(item.itemType,p.itemType);assert.equal(item.color,p.color);
 }
 assert.equal(Object.keys(result.board.ideas).length,0,'no shopping placeholders');
 if(anchor){assert.ok(ids.includes(anchor),'selected item remains pinned');assert.equal(result.board.anchorItemId,anchor);}
 const top=fixture.items.find(x=>x.id===result.board.slots.top);
 const expectedMissing=[];
 if(!result.board.slots.top)expectedMissing.push('top');
 if(top?.category!=='Dresses'&&!result.board.slots.bottom)expectedMissing.push('bottom');
 if(!result.board.slots.shoes)expectedMissing.push('shoes');
 assert.deepEqual(Array.from(result.missing).sort(),expectedMissing.sort(),'missing required slots must match independent inventory oracle');
 if(top?.category==='Dresses')assert.ok(!entries.some(([s])=>s==='bottom'||s.startsWith('layer')),'dress cannot carry incompatible bottoms/layers');
 for(const [slot,id]of entries){
  const item=fixture.items.find(x=>x.id===id);
  if(slot==='top')assert.ok(['Tops','Dresses'].includes(item.category));
  if(slot==='bottom')assert.equal(item.category,'Bottoms');
  if(slot==='shoes')assert.equal(item.category,'Shoes');
  if(slot==='layer2')assert.ok(item.category==='Outerwear'&&['Jacket','Blazer','Unknown'].includes(item.itemType));
  if(slot==='layer3')assert.ok(item.category==='Outerwear'&&['Coat','Raincoat'].includes(item.itemType));
 }
 return signature(result.board);
}
export function sourceGuard(items,owner='synthetic-a'){
 const c={items:structuredClone(items),db:{name:'closet-current-user-'+owner},window:{closetAuth:{user:{id:owner}}}};
 vm.createContext(c);
 const ui=readFileSync('public/closet-stylist.js','utf8'),board=readFileSync('public/outfit-board.js','utf8');
 vm.runInContext(board.slice(board.indexOf('function boardWriteContext('),board.indexOf('async function persistBoardState(')),c);
 vm.runInContext(ui.slice(ui.indexOf('function stylistSelectedSources('),ui.indexOf('function renderStylistAnchor(')),c);
 vm.runInContext(ui.slice(ui.indexOf('function stylistOwnsCloset('),ui.indexOf('function refuseStylistAccount(')),c);
 return c;
}
export function runBenchmark(){
 const c=engine(),fixture=wardrobe(),before=JSON.stringify(fixture),checks=[];
 const check=(name,fn)=>{
  try{fn();checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',reason:String(e.message).split('\n')[0].slice(0,160)});}
 };
 validateSynthetic(fixture);
 const style=(f,anchor)=>c.styleOwnedCollection(f.items,{request:'Casual',audience:'All',season:'Fall',anchorItemId:anchor});
 const rich=style(fixture,'new-top');
 check('three-distinct-complete-owned-outfits',()=>{
  assert.equal(rich.length,3);assert.equal(new Set(rich.map(r=>oracle(r,fixture,'new-top'))).size,3);
  assert.equal(new Set(rich.map(r=>r.board.slots.bottom)).size,3,'prefer differing core garments before shoe-only differences');
  assert.ok(rich.every(r=>r.missing.length===0));
 });
 for(const anchor of ['new-top','long-top','pants','shorts','skirt','shoe-1','dress','jacket','coat'])check('pinned-'+anchor,()=>{
  const result=style(fixture,anchor);assert.equal(result.length,3);
  for(const r of result)oracle(r,fixture,anchor);
 });
 for(const n of [0,1,2])check('truthful-'+n+'-options',()=>{
  const ids=n===0?[]:['new-top','pants',...Array.from({length:n},(_,i)=>'shoe-'+(i+1))];
  const f={...fixture,items:fixture.items.filter(x=>ids.includes(x.id))},r=style(f,n?'new-top':null);
  assert.equal(r.length,n);for(const x of r){oracle(x,f,'new-top');assert.equal(x.missing.length,0);}
 });
 check('one-incomplete-outfit-does-not-invent-shoes',()=>{
  const f={...fixture,items:fixture.items.filter(x=>x.id==='new-top')},r=style(f,'new-top');
  assert.equal(r.length,1);assert.deepEqual(Array.from(r[0].missing),['bottom','shoes']);assert.equal(r[0].board.slots.shoes,undefined);
 });
 check('one-piece-swap-and-persisted-pin',()=>{
  const r=plain(rich[0]),slots={...r.board.slots},swapped=c.stylistSwapOne(r,'shoes',fixture.items);
  assert.ok(swapped);assert.equal(Object.keys(slots).filter(k=>slots[k]!==swapped.board.slots[k]).length,1);
  assert.equal(swapped.board.anchorItemId,'new-top');oracle({...r,board:swapped.board},fixture,'new-top');
  assert.equal(c.stylistSwapChoices({...r,board:plain(swapped.board)},'top',fixture.items).length,0);
 });
 check('backup-conflict-remaps-source-linked-pin',()=>{
  const input={format:'closet-current',version:4,ownerId:fixture.owner,items:fixture.items,looks:[],outfitBoard:{current:plain(rich[0].board),saved:[plain(rich[0].board)]}};
  const parsed=backup.validate(input,fixture.owner,{normalizeItem:c.normalizeClothing,normalizeLook:x=>x,cleanBoard:c.cleanOutfitBoard});
  const conflict={...structuredClone(fixture.items[0]),color:'Red',image:wardrobe('synthetic-b').items[0].image};
  let i=0;const restored=backup.merge({items:[conflict],looks:[],outfitBoard:{current:{slots:{}},saved:[]}},parsed,{makeId:()=> 'restored-'+(++i),cleanBoard:c.cleanOutfitBoard});
  const board=restored.outfitBoard.saved[0],pin=restored.items.find(x=>x.id===board.anchorItemId);
  assert.notEqual(pin.id,'new-top');assert.equal(board.slots.top,pin.id);
  assert.equal(pin.color,'Blue');assert.equal(pin.originalPhoto.image,fixture.items[0].originalPhoto.image);
  assert.equal(pin.recognitionPhoto.image,fixture.items[0].recognitionPhoto.image);assert.equal(pin.outfitSourceId,fixture.items[0].outfitSourceId);
  assert.throws(()=>backup.validate(input,'synthetic-b',{normalizeItem:c.normalizeClothing,normalizeLook:x=>x,cleanBoard:c.cleanOutfitBoard}),/another account/);
 });
 check('same-id-two-owner-inputs-remain-independent',()=>{
  const b=wardrobe('synthetic-b'),r=style(b,'new-top');validateSynthetic(b);
  for(const x of r)oracle(x,b,'new-top');
  assert.notEqual(b.ledger['new-top'].originalHash,fixture.ledger['new-top'].originalHash);
  const guard=sourceGuard(fixture.items),sources=guard.stylistSelectedSources(rich[0].board);
  guard.window.closetAuth.user.id='synthetic-b';assert.equal(guard.stylistSourcesCurrent(sources),false);
 });
 check('unknown-confidence-remains-disclosed',()=>{
  const input=fixture.items.filter(x=>['new-top','pants','shoe-1'].includes(x.id)).map(x=>({...x}));
  input[0].itemType='Unknown';input[0].colorSource='photo-estimate';
  let r=c.styleOwnedCollection(input,{anchorItemId:'new-top'})[0];
  assert.ok(r.notices.some(x=>x.includes('types are unconfirmed')));assert.ok(r.notices.some(x=>x.includes('colors are estimated')));
  input[0].color='';r=c.styleOwnedCollection(input,{anchorItemId:'new-top'})[0];assert.ok(r.notices.some(x=>x.includes('colors are unknown')));
 });
 check('all-source-records-and-rgb-strings-unchanged',()=>assert.equal(JSON.stringify(fixture),before));
 check('synthetic-fixture-ingress-rejects-blank-remote-duplicate-foreign',()=>{
  for(const change of [f=>{f.items[0].image='';},f=>{f.items[0].image='https://example.invalid/photo';},f=>{f.items.push(f.items[0]);},f=>{f.ledger['new-top'].owner='synthetic-b';}]){
   const f=wardrobe();change(f);assert.throws(()=>validateSynthetic(f));
  }
 });
 // Preserve the independent original-change and no-photo rejection assertions.
 check('original-only-change-invalidates-prepared-source',()=>{
  const g=sourceGuard(fixture.items),sources=g.stylistSelectedSources(rich[0].board);
  g.items[0].originalPhoto.image=wardrobe('synthetic-b').items[0].originalPhoto.image;
  assert.equal(g.stylistSourcesCurrent(sources),false,'original-only change is not captured by current source guard');
 });
 check('raw-engine-refuses-blank-photo-record',()=>{
  const f=wardrobe();f.items[0].image='';
  // #204 contract: valid local originals are legitimate fallbacks. Keep the
  // original zero-recommendation oracle, but make this a NO-PHOTO fixture.
  delete f.items[0].originalPhoto;delete f.items[0].recognitionPhoto;
  assert.equal(style(f,'new-top').length,0,'raw scorer assumes validated records and can select a blank-photo anchor');
 });
 return {format:'closet-current-issue201-offline-benchmark',version:1,applicationBase:BASE,
  syntheticOnly:true,generatedOwners:2,sourceImages:'2x2 synthetic JPEG swatches, not garment or human photos',
  checks,passed:checks.filter(x=>x.status==='PASS').length,failed:checks.filter(x=>x.status==='FAIL').length,
  productAcceptance:checks.every(x=>x.status==='PASS'),physicalPhones:0,recognitionAccuracyMeasured:false,
  realisticRenderingEvaluated:false,paidInferenceActivated:false,hostedIsolationVerified:false,
  notes:['Engine ownership is supplied by caller-scoped closet; UI/database tenant checks are separately tested.',
   'Valid local original-photo fallbacks are tested separately; the blank rejection fixture has no usable source.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=runBenchmark();const output=process.argv[2];
 if(output){mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));
 // An unmet product gate is intentionally nonzero; baseline-characterization
 // tests must explicitly verify the expected failures rather than hide them.
 if(!report.productAcceptance)process.exitCode=2;
}
