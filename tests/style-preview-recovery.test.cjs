'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const engine=require('../public/reusable-figure-engine.js');
const image='data:image/png;base64,'+'A'.repeat(150);
const closet=[{id:'new',category:'Tops',image,color:'Blue',itemType:'T-shirt'}];
const plan=()=>engine.plan({slots:{top:'new'}},closet,'female');
test('reuse only an identical owned outfit, preserving full image identity and placement',()=>{
 const a=plan();assert.equal(engine.samePlan(a,plan()),true);
 for(const field of ['image','itemId','category','primaryColor','slot']){
  const b=plan();b.placements[0][field]+='B';assert.equal(engine.samePlan(a,b),false,field);
 }
 const b=plan();b.placements[0].rect.height++;assert.equal(engine.samePlan(a,b),false);
 assert.equal(engine.samePlan(a,{...plan(),figure:'male'}),false);
 assert.equal(engine.samePlan(a,{...plan(),skipped:['shoes']}),false);
 assert.equal(engine.samePlan(null,a),false);
 assert.equal(closet[0].image,image);
});
function stylist(){
 const el=new Map();const get=id=>{if(!el.has(id))el.set(id,{value:'',disabled:false,textContent:'',hidden:true,removeAttribute(){}});return el.get(id);};
 let release;const ready=new Promise(r=>release=r);let matches=0;
 const c={window:{closetAuth:{user:{id:'owner'}}},items:[{id:'new',category:'Tops',image}],
  closetReady:ready,$:get,Date,styleOwnedCollection(){matches++;return [];},trendFreshnessText(){return '';},
  activeTrendLibrary:null,switchView(){}};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync('public/closet-stylist.js','utf8'),c);
 vm.runInContext('renderStyledCollection=()=>{};stylistAnchorItemId="new"',c);
 get('stylistOccasion').value='Casual';
 return {c,get,release,matches:()=>matches,submit:()=>get('styleCollectionForm').onsubmit({preventDefault(){}})};
}
test('an occasion changed while closet opens cancels old suggestions and enables retry',async()=>{
 const s=stylist(),pending=s.submit();s.get('stylistOccasion').value='Work';s.get('stylistOccasion').onchange();
 const status=s.get('stylistStatus').textContent;s.release();await pending;
 assert.equal(s.matches(),0);assert.equal(s.get('stylistStatus').textContent,status);
 assert.equal(s.get('createCollectionOutfits').disabled,false);
});
test('clearing the chosen garment while waiting cannot resurrect its recommendations',async()=>{
 const s=stylist(),pending=s.submit();s.get('stylistClearAnchor').onclick();
 const status=s.get('stylistStatus').textContent;s.release();await pending;
 assert.equal(s.matches(),0);assert.equal(s.get('stylistStatus').textContent,status);
});
test('an account changed during wardrobe loading cannot publish suggestions for previous owner',async()=>{
 const s=stylist(),pending=s.submit();s.c.window.closetAuth.user.id='other';s.release();await pending;
 assert.equal(s.matches(),0);assert.equal(s.get('createCollectionOutfits').disabled,false);
});
test('newest request alone completes and releases its button',async()=>{
 const s=stylist(),old=s.submit();s.get('stylistOccasion').value='Work';const fresh=s.submit();s.release();
 await Promise.all([old,fresh]);assert.equal(s.matches(),1);
 assert.equal(s.get('createCollectionOutfits').disabled,false);
});
test('decoding timeout settles even if browser decoder hangs and always clears timer',async()=>{
 const source=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const fn=source.slice(source.indexOf(' async function decodeImage('),source.indexOf(' if(retry)retry.addEventListener'));
 let callback,cleared=0;
 const c={setTimeout(fn,delay){assert.equal(delay,5000);callback=fn;return 12;},clearTimeout(id){assert.equal(id,12);cleared++;},Promise,Error};
 vm.createContext(c);vm.runInContext(fn,c);
 const pending=c.decodeImage({decode:()=>new Promise(()=>{})});callback();
 await assert.rejects(pending,/timed out/);assert.equal(cleared,1);
 await c.decodeImage({decode:()=>Promise.resolve()});assert.equal(cleared,2);
});
