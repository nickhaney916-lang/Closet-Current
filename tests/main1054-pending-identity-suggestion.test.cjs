'use strict';
// Actual editor proposal callbacks with lightweight DOM/storage doubles.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const source=require('node:fs').readFileSync(process.env.SUGGESTION_SOURCE||'public/app.js','utf8');
const schema={types:{Tops:['T-shirt','Sweatshirt'],Shoes:['Sneakers','Ankle boots']}};
const sha='a'.repeat(64);
const row=()=>({id:'one',ownerId:'A',image:'original',originalPhoto:{image:'original',sha256:sha},sourceSHA256:sha,category:'Uncategorized',itemType:'Unknown',color:'Blue',requiresOwnershipConfirmation:true,localChoices:[{kind:'owner-identity-review-v1',recordId:'one',ownerId:'A',sourceSHA256:sha,category:'Tops',itemType:'Sweatshirt'}]});
function fixture(item=row()){
 const a=source.indexOf('function pendingIdentitySuggestion(item){'),b=source.indexOf('function adjustPhoto(item){');
 assert.ok(a>=0&&b>a,'missing structured proposal handoff');
 const draft={category:item.category,itemType:item.itemType,color:item.color},buttons=[];
 const category={value:draft.category,dispatchEvent(){draft.category=this.value;draft.itemType='Unknown';type.value='Unknown';}};
 const type={value:draft.itemType,dispatchEvent(){draft.itemType=this.value;}};
 let active=true,allowed=true;
 const dialog={open:true},batch=[item],localPending=new Set();
 const node=(tag,text)=>{const el={tag,text,isConnected:true,append(){}};if(tag==='button')buttons.push(el);return el;};
 const form={prepend(){},querySelector(sel){return sel.includes('Main category')?category:type;}};
 const editorSession={current:()=>active};
 const api=new Function('clothingSchema','node','batch','localPending','Event',source.slice(a,b)+';return {pendingIdentitySuggestion,mountPendingIdentitySuggestion};')(schema,node,batch,localPending,class Event{});
 return {item,draft,buttons,dialog,batch,localPending,api,mount:()=>api.mountPendingIdentitySuggestion(form,item,editorSession,dialog,()=>allowed),revoke:()=>active=false,disable:()=>allowed=false};
}
test('owner explicitly applies proposed category and type without saving or editing live row',()=>{
 const f=fixture(),before=structuredClone(f.item),use=f.mount();assert.ok(use);assert.equal(use.type,'button');
 assert.equal(f.draft.category,'Uncategorized');use.onclick();assert.deepEqual(f.draft,{category:'Tops',itemType:'Sweatshirt',color:'Blue'});
 assert.deepEqual(f.item,before);assert.equal(use.disabled,true);
});
test('category-only proposal does not replace a specific type in same category',()=>{
 const item=row();item.category='Tops';item.itemType='T-shirt';item.localChoices[0].itemType='Unknown';
 const f=fixture(item);f.mount().onclick();assert.equal(f.draft.itemType,'T-shirt');
});
for(const [name,change] of [
 ['foreign owner',x=>x.ownerId='B'],['wrong row',x=>x.id='two'],
 ['source changed',x=>x.sourceSHA256='b'.repeat(64)],['display changed',x=>x.image='replacement'],
 ['unverified source',x=>x.sourceSHA256=''],['crop',x=>x.cropBounds={x:1}],
 ['invalid category/type',x=>x.localChoices[0].itemType='Sneakers'],
 ['already reviewed',x=>x.requiresOwnershipConfirmation=false],
 ['manual adjustment',x=>x.userAdjusted=true],['scan failed',x=>x.scanFailed=true]
])test('refuses '+name,()=>{const item=row();change(item);assert.equal(fixture(item).mount(),null);});
for(const [name,change] of [
 ['session revoked',f=>f.revoke()],['dialog closed',f=>f.dialog.open=false],
 ['save in progress',f=>f.disable()],['row removed',f=>f.batch.pop()],
 ['new scan',f=>f.localPending.add(f.item.id)],['proposal replaced',f=>f.item.localChoices[0].itemType='T-shirt']
])test('late click refuses '+name,()=>{const f=fixture(),use=f.mount();change(f);use.onclick();assert.equal(f.draft.category,'Uncategorized');});
test('recognition retains a verified proposal but never applies or indexes it',async()=>{
 const item=row();item.requiresOwnershipConfirmation=false;item.localChoices=[];
 const a=source.indexOf('async function recognizeItem(item){'),b=source.indexOf('async function recognizeBatch(){',a);
 let saves=0,applies=0,persists=0;
 const c={item,structuredClone,Date,batch:[item],items:[],captureOperationEpoch:0,categories:['Tops','Shoes'],clothingSchema:schema,
 recognitionState:{activeId:null,phase:'ready'},localPending:new Set([item.id]),recognitionUnavailable:false,localReady:true,render(){},message(){},$:()=>({}),
 checkPhoto:async()=>({blank:false,colorEstimate:'Blue',signature:'sig',aspect:1}),ClothingDetails:{fillColor:()=>({}),fill:()=>({})},similarPhotos:()=>false,
 localRequest:async()=>({strong:true,choices:[{category:'Tops',itemType:'Sweatshirt',score:.99}]}),segmentationAllows:()=>true,applyLocalChoice:()=>applies++,saveIndexed:async()=>{saves++;return true},persistDraft:async()=>{persists++;return true}};
 const h=source.indexOf('function pendingIdentitySuggestion(item){'),i=source.indexOf('function adjustPhoto(item){');assert.ok(h>=0&&i>h);
 await new Function(...Object.keys(c),source.slice(h,i)+'\n'+source.slice(a,b)+'\nreturn recognizeItem(item);')(...Object.values(c));
 assert.equal(saves,0);assert.equal(applies,0);assert.equal(persists,1);assert.equal(item.category,'Uncategorized');assert.equal(item.itemType,'Unknown');
 assert.equal(item.originalPhoto.image,'original');assert.equal(item.localChoices[0]?.itemType,'Sweatshirt');
});
test('normal explicit save strips pending proposal and mount is draft-only',()=>{
 assert.match(source,/if\(batch\.includes\(item\)&&!items\.some\(x=>x\.id===item\.id\)\)\s*mountPendingIdentitySuggestion/);
 assert.match(source,/delete value\.localChoices;\s*if\(typeof ClothingMemory/);
});
