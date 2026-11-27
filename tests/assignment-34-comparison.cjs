const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const engine=vm.createContext({});
for(const name of ['outfit-matcher.js','outfit-board-engine.js','daily-weather-context.js','closet-stylist-engine.js']){
 vm.runInContext(readFileSync('public/'+name,'utf8'),engine);
}
const row=(id,category,itemType,fields={})=>({id,category,itemType,name:'Same label',color:'Black',seasons:['All seasons'],...fields});
const rows=[
 row('tee','Tops','T-shirt'),row('twin','Tops','T-shirt'),row('sweater','Tops','Sweater'),
 row('dress','Dresses','Casual dress'),row('jeans','Bottoms','Jeans'),
 row('boots','Shoes','Ankle boots'),row('sneakers','Shoes','Sneakers'),
 row('laundry','Shoes','Sneakers',{availability:'laundry'}),row('layer','Outerwear','Jacket')
];
const context={request:'Casual',occasion:'Casual',audience:'All',season:'Fall'};
const board=slots=>engine.cleanOutfitBoard({...context,slots},rows);
test('new recommendations exclude explicitly unavailable and revoked pieces',()=>{
 const blocked=[rows[7],row('revoked','Tops','T-shirt',{sourceRevoked:true})];
 assert.equal(engine.styleOwnedCollection(blocked,context).length,0);
 assert.equal(engine.styleOwnedCollection(rows,{...context,focusItemId:'laundry'}).length,0);
});
test('same-label pieces are distinct and a swap preserves every other slot',()=>{
 const current=board({top:'tee',bottom:'jeans',shoes:'boots',layer:'layer'});
 const before=JSON.stringify(current);
 const next=engine.stylistOwnedSubstitute(rows,current,'top',context,null);
 assert.equal(next.slots.top,'twin');
 assert.equal(next.slots.bottom,'jeans');
 assert.equal(next.slots.shoes,'boots');
 assert.equal(next.slots.layer,'layer');
 assert.equal(JSON.stringify(current),before);
 assert.equal(engine.stylistOwnedSubstitute(rows,current,'top',context,null,new Set(['twin'])).slots.top,'sweater');
 assert.equal(engine.stylistOwnedSubstitute(rows,current,'layer',context,null,new Set(['sweater'])),null);
});
test('focus, season, audience, footwear and dress structure are hard constraints',()=>{
 const separates=board({top:'tee',bottom:'jeans',shoes:'sneakers'});
 const dress=board({top:'dress',shoes:'sneakers'});
 assert.equal(engine.stylistOwnedSubstitute(rows,dress,'top',context,null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'top',context,null,new Set(['twin','sweater'])),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'top',{...context,focusItemId:'tee'},null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,separates,'shoes',{...context,request:'Activewear'},null),null);
 const restrictions=[...rows,row('winter','Shoes','Sneakers',{seasons:['Winter']}),row('heels','Shoes','Heels')];
 const work={...context,request:'Work',audience:'Men'};
 assert.equal(engine.stylistOwnedSubstitute(restrictions,board({top:'tee',shoes:'boots'}),'shoes',work,null),null);
 assert.equal(engine.stylistOwnedSubstitute(rows,board({top:'tee',bottom:'jeans',shoes:'laundry'}),'top',context,null),null);
});


// Exercise the actual controller using synthetic rows and simulated DOM controls.
// These are unit regressions, not native browser proof.
const comparisonControllerSource=readFileSync('public/stylist-comparison.js','utf8');
const comparisonHarness=`
let lease=true,owner=true;
const item={id:'a',ownerId:'owner',category:'Tops',itemType:'T-shirt',sourceSHA256:'sha1',
 originalPhoto:{ownerId:'owner',sha256:'sha1',image:'data:image/jpeg;base64,AAAA'}};
const items=[item],styledCollectionResults=[0,1].map(()=>({
 board:{slots:{top:'a'}},context:{request:'Casual',audience:'All',season:'Fall'}}));
const styledCollectionRequestSerial=1,activeTrendLibrary={};
const styledCollectionResultLease={current:()=>lease};
const ownerStylistSession=()=>({owner:'owner',ownsSession:()=>owner});
const stylistPieceReady=x=>!!x?.id&&!x.deleted&&!x.sourceRevoked;
const outfitSlots=[],boardGaps=()=>[];
function node(tag,text){return {tag,text,children:[],append(...x){this.children.push(...x)},
 replaceChildren(){this.children=[]},add(x){this.children.push(x)},setAttribute(){},focus(){}};}
const panel=node('section');
const find=(n,id)=>n.id===id?n:n.children.map(c=>find(c,id)).find(Boolean);
const $=id=>id==='stylistComparison'?panel:find(panel,id);
function Option(text,value){this.text=text;this.value=value;this.children=[];}
`;
const runComparison=(scenario)=>new Function(comparisonHarness+comparisonControllerSource+String.fromCharCode(10)+scenario)();
test('comparison lease expires on request, owner, classification or original-source mutation',()=>{
 for(const mutation of ['lease=false','owner=false',"item.ownerId='other'",
  "item.category='Dresses'","item.itemType='Sweater'","item.sourceSHA256='sha2'",
  "item.originalPhoto.sha256='sha2'","item.originalPhoto.ownerId='other'",
  "item.originalPhoto.image='data:image/jpeg;base64,BBBB'",'item.sourceRevoked=true']){
  assert.equal(runComparison('startStylistComparison();'+mutation+';return !!stylistComparisonDraft.current();'),false,mutation);
 }
 assert.equal(runComparison('startStylistComparison();return !!stylistComparisonDraft.current();'),true);
});
test('cancelled comparison and stale cancel cannot affect a replacement draft',()=>{
 assert.equal(runComparison(`startStylistComparison();const old=stylistComparisonDraft;
  const cancel=$('comparisonCancel').onclick;cancel();
  if(old.current())return false;
  startStylistComparison();const fresh=stylistComparisonDraft;
  cancel();return stylistComparisonDraft===fresh&&!!fresh.current();`),true);
});
test('obsolete rendered controls cannot change a live comparison after refresh',()=>{
 assert.equal(runComparison(`startStylistComparison();const select=$('comparisonChoice');
  const cancel=$('comparisonCancel');select.value='1';select.onchange();
  if(stylistComparisonDraft.index!==1)return false;
  select.value='0';select.onchange();cancel.onclick();
  if(stylistComparisonDraft?.index!==1)return false;
  $('comparisonChoice').value='0';$('comparisonChoice').onchange();
  if(stylistComparisonDraft.index!==0)return false;
  $('comparisonCancel').onclick();return stylistComparisonDraft===null;`),true);
});

test('owner styling metadata changes invalidate comparison, including in-place season edits',()=>{
 const initial="startStylistComparison();";
 for(const mutation of ["item.color='Red'","item.pattern='Striped'","item.sleeveLength='Long sleeve'","item.seasons=['Winter']"]){
  assert.equal(runComparison(initial+mutation+';return !!stylistComparisonDraft.current();'),false,mutation);
 }
 assert.equal(runComparison("item.seasons=['Summer'];"+initial+"item.seasons.push('Winter');return !!stylistComparisonDraft.current();"),false);
 assert.equal(runComparison("item.seasons=['Summer'];"+initial+"item.seasons=['Summer'];return !!stylistComparisonDraft.current();"),true);
});

test('atomic outfit save fingerprint includes original photograph ownership',()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 const facts=source.slice(source.indexOf('function outfitSavedItemFacts'),source.indexOf('function outfitWardrobeChanged'));
 const fingerprint=new Function(readFileSync('public/taxonomy.js','utf8')+String.fromCharCode(10)+facts+String.fromCharCode(10)+'return outfitSavedItemFacts;')();
 const row={id:'garment',ownerId:'owner-a',category:'Tops',itemType:'T-shirt',
  originalPhoto:{image:'data:image/jpeg;base64,AAAA',sha256:'same',ownerId:'owner-a'}};
 const expected=fingerprint(row);
 const same=other=>{const actual=fingerprint(other);return expected.length===actual.length&&expected.every((v,i)=>v===actual[i]);};
 assert.equal(same({...row,originalPhoto:{...row.originalPhoto}}),true);
 assert.equal(same({...row,originalPhoto:{...row.originalPhoto,ownerId:'owner-b'}}),false);
 const removed={...row,originalPhoto:{...row.originalPhoto}};delete removed.originalPhoto.ownerId;
 assert.equal(same(removed),false);
 assert.equal(same({...row,originalPhoto:{...row.originalPhoto,sha256:'different'}}),false);
 assert.equal(same({...row,ownerId:'owner-b'}),false);
});

test('atomic outfit save fingerprint detects source identity and revocation changes',()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 const facts=source.slice(source.indexOf('function outfitSavedItemFacts'),source.indexOf('function outfitWardrobeChanged'));
 const fingerprint=new Function(readFileSync('public/taxonomy.js','utf8')+String.fromCharCode(10)+facts+String.fromCharCode(10)+'return outfitSavedItemFacts;')();
 const row={id:'garment',ownerId:'owner-a',category:'Tops',itemType:'T-shirt',
  outfitSourceId:'source-a',sourceRevoked:false,originalPhoto:{image:'data:image/jpeg;base64,AAAA',sha256:'same',ownerId:'owner-a'}};
 const expected=fingerprint(row);
 const same=other=>{const actual=fingerprint(other);return expected.length===actual.length&&expected.every((v,i)=>v===actual[i]);};
 assert.equal(same({...row}),true);
 assert.equal(same({...row,sourceRevoked:true}),false);
 assert.equal(same({...row,outfitSourceId:'source-b'}),false);
 assert.equal(same({...row,outfitSourceId:undefined}),false);
 assert.equal(same({...row,originalPhoto:{...row.originalPhoto,sha256:'different'}}),false);
});

test('atomic outfit save fingerprint detects concurrent garment lifecycle changes',()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 const facts=source.slice(source.indexOf('function outfitSavedItemFacts'),source.indexOf('function outfitWardrobeChanged'));
 const fingerprint=new Function(readFileSync('public/taxonomy.js','utf8')+String.fromCharCode(10)+facts+String.fromCharCode(10)+'return outfitSavedItemFacts;')();
 const row={id:'garment',ownerId:'owner-a',category:'Tops',itemType:'T-shirt',availability:'ready'};
 const expected=fingerprint(row);
 const same=other=>{const actual=fingerprint(other);return expected.length===actual.length&&expected.every((v,i)=>v===actual[i]);};
 assert.equal(same({...row}),true);
 assert.equal(same({...row,deleted:true}),false);
 assert.equal(same({...row,availability:'laundry'}),false);
 assert.equal(same({...row,availability:'unavailable'}),false);
 assert.equal(same({...row,availability:undefined}),true);
 assert.equal(same({...row,deleted:false,sourceRevoked:false}),true);
});

test('outfit persistence rejects explicitly foreign original photograph owners',async()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 const part=source.slice(source.indexOf('async function persistBoardState'),source.indexOf('async function saveOwnedOutfit'));
 // Simulate IDB request ordering and rollback; no native database claim.
 const harness=`
 const structuredClone=x=>JSON.parse(JSON.stringify(x));
 const row={id:'a',ownerId:'owner',category:'Tops',itemType:'T-shirt',originalPhoto:{ownerId:photoOwner}};
 const currentBoard={slots:{top:'a'}},outfitSlots=[{id:'top'}];
 let boardPendingWrites=0,boardExpectedStoredDraft='null',boardCommittedDraft=null,boardConflictDraft=null,savedOutfitBoards=[],stored=null;
 const nativeLossless04Active=false,normalizeClothing=x=>({...x,seasons:[]}),slotAllows=()=>true,stylistPieceReady=()=>true,queued=fn=>fn();
 const window={closetAuth:{user:{id:'owner'}}};
 const db={name:'closet-current-user-owner',transaction(){
  const requests=[];let aborted=false,staged=null;
  const req=result=>{const r={result};requests.push(r);return r;};
  const tx={objectStore(name){return name==='items'?{get:()=>req(row)}:{get:()=>req(undefined),put:value=>{staged=value;}};},
   abort(){aborted=true;}};
  Promise.resolve().then(()=>{while(requests.length&&!aborted)requests.shift().onsuccess?.();
   if(aborted)tx.onabort?.();else{stored=staged;tx.oncomplete?.();}});
  return tx;
 }};
 `;
 const scenario=`
 return (async()=>{try{
  await persistBoardState(mode==='saved'?{appendSaved:currentBoard,expectedClothing:{a:outfitSavedItemFacts(row)}}:{});
  return {accepted:true,written:!!stored};
 }catch(e){return {accepted:false,written:!!stored,code:e.code};}})();
 `;
 for(const mode of ['saved','draft'])for(const [owner,expected] of [['owner',true],['other',false],[undefined,true]]){
  const result=await new Function('photoOwner','mode',harness+part+scenario)(owner,mode);
  assert.equal(result.accepted,expected);
  assert.equal(result.written,expected);
  if(!expected)assert.equal(result.code,'OUTFIT_WARDROBE_CHANGED');
 }
});

test('comparison rejects foreign original photo owners before choices or substitutions',()=>{
 assert.equal(runComparison('startStylistComparison();return !!stylistComparisonDraft;'),true);
 assert.equal(runComparison("item.originalPhoto.ownerId='other';startStylistComparison();return !!stylistComparisonDraft;"),false);
 assert.equal(runComparison("item.ownerId='other';startStylistComparison();return !!stylistComparisonDraft;"),false);
 assert.equal(runComparison('delete item.originalPhoto.ownerId;startStylistComparison();return !!stylistComparisonDraft;'),true);
 assert.equal(runComparison("items.push({...item,id:'b',originalPhoto:{...item.originalPhoto,ownerId:'other'}});startStylistComparison();return stylistComparisonDraft.closet.some(x=>x.id==='b');"),false);
 assert.equal(runComparison("items.push({...item,id:'b'});startStylistComparison();return stylistComparisonDraft.closet.some(x=>x.id==='b');"),true);
});

test('comparison lease expires on original source and garment piece identity changes',()=>{
 const initial="item.outfitSourceId='source-a';item.sourcePieceKey='piece-a';startStylistComparison();";
 for(const mutation of ["item.outfitSourceId='source-b';","delete item.outfitSourceId;","item.sourcePieceKey='piece-b';","delete item.sourcePieceKey;"]){
  assert.equal(runComparison(initial+mutation+'return !!stylistComparisonDraft.current();'),false,mutation);
 }
 assert.equal(runComparison(initial+'return !!stylistComparisonDraft.current();'),true);
 assert.equal(runComparison(initial+"item.outfitSourceId='source-a';item.sourcePieceKey='piece-a';return !!stylistComparisonDraft.current();"),true);
});

test('comparison outfit persistence rejects same-ID durable wardrobe edits',async()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 const part=source.slice(source.indexOf('async function persistBoardState'),source.indexOf('async function saveOwnedOutfit'));
 // Simulated IDB ordering and rollback; native transaction acceptance is separate.
 const harness=`
 const structuredClone=x=>JSON.parse(JSON.stringify(x));
 const items=[{id:'a',ownerId:'owner',category:'Tops',itemType:'T-shirt',color:'Black'},
  {id:'b',ownerId:'owner',category:'Shoes',itemType:'Sneakers',color:'White',availability:'ready'}];
 const durable=structuredClone(items);
 if(change==='color')durable[1].color='Red';
 if(change==='availability')durable[1].availability='laundry';
 if(change==='owner')durable[1].ownerId='other';
 if(change==='removed')durable.pop();
 if(change==='added')durable.push({...durable[1],id:'c'});
 const currentBoard={slots:{top:'a'}},outfitSlots=[{id:'top'}];
 let boardPendingWrites=0,boardExpectedStoredDraft='null',boardCommittedDraft=null,boardConflictDraft=null,savedOutfitBoards=[],stored=null;
 const nativeLossless04Active=false,normalizeClothing=x=>({...x,seasons:[]}),slotAllows=()=>true,stylistPieceReady=()=>true,queued=fn=>fn();
 const window={closetAuth:{user:{id:'owner'}}};
 const db={name:'closet-current-user-owner',transaction(){
  const requests=[];let aborted=false,staged=null;
  const req=result=>{const r={result};requests.push(r);return r;};
  const tx={objectStore(name){return name==='items'?{
   get:id=>req(durable.find(row=>row.id===id)),getAllKeys:()=>req(durable.map(row=>row.id)),getAll:()=>req(durable)
  }:{get:()=>req(undefined),put:value=>{staged=value;}};},abort(){aborted=true;}};
  Promise.resolve().then(()=>{while(requests.length&&!aborted)requests.shift().onsuccess?.();
   if(aborted)tx.onabort?.();else{stored=staged;tx.oncomplete?.();}});
  return tx;
 }};
 `;
 const scenario=`
 return (async()=>{try{
  await persistBoardState({appendSaved:currentBoard,expectedClothing:{a:outfitSavedItemFacts(items[0])},
   comparison:{ids:new Set(items.map(x=>x.id)),assertCurrent(){}}});
  return {accepted:true,written:!!stored};
 }catch(e){return {accepted:false,written:!!stored,code:e.code};}})();
 `;
 for(const change of ['none','color','availability','owner','removed','added']){
  const result=await new Function('change',harness+part+scenario)(change);
  const expected=change==='none';
  assert.equal(result.accepted,expected,change);
  assert.equal(result.written,expected,change);
  if(!expected)assert.equal(result.code,'OUTFIT_WARDROBE_CHANGED',change);
 }
});
