import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync('public/app.js','utf8');
const section=(begin,end)=>{
 const a=app.indexOf(begin),b=app.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'exact native app.js code anchors are present');
 return app.slice(a,b);
};
const nodeMock=(tag,text='',className='')=>({
 tag,textContent:text||'',className,children:[],attributes:{},
 disabled:false,checked:false,isConnected:true,open:false,
 append(...parts){this.children.push(...parts);return this;},
 prepend(...parts){this.children.unshift(...parts);return this;},
 setAttribute(k,v){this.attributes[k]=String(v);},
 replaceChildren(...parts){this.children=[...parts];},
 remove(){this.isConnected=false;},
 showModal(){this.open=true;},
 close(){this.open=false;this.onclose?.();},
 querySelector(){return null;}
});
const descend=(n,fn)=>{
 if(!n||typeof n!=='object')return null;
 if(fn(n))return n;
 for(const c of n.children||[]){const found=descend(c,fn);if(found)return found;}
 return null;
};
function ownerAdjustHarness({ambiguous=true,original=true,reviewedSave=false}={}){
 const item={id:'private-review-piece',name:'',image:'data:image/jpeg;base64,AABB',
  originalPhoto:original?{image:'data:image/jpeg;base64,AAEE'}:undefined,
  sourceSHA256:'synthetic-hash-not-cryptographic-proof',
  category:'Uncategorized',itemType:'Unknown',color:'',
  userAdjusted:false,requiresOwnershipConfirmation:ambiguous,
  segmentHint:{categories:['Tops','Outerwear'],
   sourceDisconnectedReviewRequired:ambiguous,sourceIslandCount:ambiguous?2:1}};
 const all=[],saved=[],messages=[],global={};
 const node=(tag,text='',className='')=>{
  const el=nodeMock(tag,text,className);all.push(el);return el;
 };
 const document={body:node('body'),createElement:tag=>node(tag),
  createTextNode:t=>nodeMock('#text',t)};
 const c={
  stream:null,cameraOpening:false,document,node,location:{search:''},URLSearchParams,
  reviewedSave120Active:reviewedSave,captureProof01Active:false,
  items:[],batch:[item],localPending:new Set(),structuredClone,
  clothingFields:()=>()=>({ ...item,category:'Tops',itemType:'Shirt',
   color:'Blue',name:'Reviewed shirt'}),
  render:()=>{},scheduleMemoryReview:()=>{},persistDraft:async()=>{},
  savePiece:async row=>{saved.push(structuredClone(row));},
  message:m=>messages.push(m),stopCamera:()=>{throw Error('should not access camera')},
  sessionCapturedIds:new Set([item.id]),
  window:{closetAuth:null},globalThis:{},
  db:null,$:()=>null
 };
 vm.createContext(c);
 vm.runInContext(section('function adjustPhoto(item){','function renderRecognitionNotice(){'),c);
 c.adjustPhoto(item);
 const form=all.find(e=>e.tag==='form'),dialog=all.find(e=>e.tag==='dialog');
 assert.ok(form?.onsubmit&&dialog?.open,'actual Adjust dialog opened');
 const confirm=descend(form,e=>e.attributes?.['aria-label']===
  'I reviewed the original and confirm this edited photo contains one garment');
 return {c,item,all,saved,messages,form,dialog,confirm,
  submit:async()=>form.onsubmit({preventDefault(){}})};
}
test('P820: model-ambiguous Adjust shows full original JPEG, user acknowledgement and rejects unconfirmed save',async()=>{
 const h=ownerAdjustHarness();
 assert.ok(h.confirm,'source-specific checkbox is required');
 assert.equal(h.confirm.required,true);
 assert.equal(h.confirm.checked,false);
 assert.equal(descend(h.form,e=>e.tag==='img'&&
  e.src==='data:image/jpeg;base64,AAEE')?.alt,
 'Original full outfit photograph for garment review');
 await h.submit();
 assert.equal(h.saved.length,0,'no item may reach private storage');
 assert.equal(h.c.batch.length,1,'existing original/candidate remains in review');
 assert.equal(h.c.items.length,0);
 assert.ok(h.messages.some(s=>s.includes('confirm a single garment')));
 assert.equal(h.dialog.open,true,'review dialog remains available for correction');
});
test('P820: explicit original review allows only an owner-CLAIM, not a fabricated independent mask',async()=>{
 const h=ownerAdjustHarness();
 h.confirm.checked=true;
 await h.submit();
 assert.equal(h.saved.length,1);
 const item=h.saved[0];
 assert.equal(item.sourceAmbiguityAcknowledged820,true);
 assert.equal(item.sourceAmbiguityReviewProvenance820,
  'explicit-owner-checkbox-not-independent-human-ground-truth');
 assert.equal(item.category,'Tops');
 assert.equal(item.itemType,'Shirt');
 assert.equal(item.color,'Blue');
 assert.equal(h.c.batch.length,0);
 assert.equal(h.c.items.length,1);
});
test('P820: a missing original source JPEG rejects save even if simulated user checks the box',async()=>{
 const h=ownerAdjustHarness({original:false});
 assert.ok(h.confirm);
 h.confirm.checked=true;
 await h.submit();
 assert.equal(h.saved.length,0,'must not accept a crop as an unchecked original');
 assert.equal(h.c.batch.length,1);
 assert.ok(h.messages.some(m=>m.includes('Review the original')));
});
test('P820: nonambiguous original clothing keeps existing ordinary Save changes path',async()=>{
 const h=ownerAdjustHarness({ambiguous:false,original:false});
 assert.equal(h.confirm,null);
 await h.submit();
 assert.equal(h.saved.length,1);
 assert.equal(h.saved[0].sourceAmbiguityAcknowledged820,undefined);
});
test('P820: real clothingFields never autocolors or auto-classifies flagged merged upper region',async()=>{
 const all=[];let qualityCalls=0,catalogCalls=0,memoryCalls=0;
 const node=(tag,text='',className='')=>{
  const e=nodeMock(tag,text,className);all.push(e);return e;
 };
 const document={createTextNode:t=>nodeMock('#text',t)};
 const c={
  node,document,items:[],
  normalizeClothing:x=>({...x}),
  clothingSchema:{types:{Tops:['Shirt'],Uncategorized:[]},
   sleeve:['Unknown'],pattern:['Unknown'],fit:['Unknown'],seasons:[]},
  field:(parent,title,value)=>{const input=node('input',title);input.value=value;parent.append(input);return input;},
  choice:(parent,title,value,options)=>{const input=node('select',title);input.value=value;input.options=options;parent.append(input);return input;},
  ClothingDetails:{missing:()=>[],fillColor:()=>{throw Error('do not auto estimate mixed garment color');}},
  ClothingMemory:{suggest:()=>{memoryCalls++;return null;},weekly:()=>{memoryCalls++;return null;}},
  checkPhoto:async()=>{qualityCalls++;return {colorEstimate:{color:'Red'}};},
  localReady:true,localRequest:async()=>{catalogCalls++;return {strong:true};},
  categories:['Uncategorized','Tops'],
  URLSearchParams
 };
 const item={image:'data:image/jpeg;base64,AABB',name:'',category:'Tops',
  itemType:'Unknown',color:'',seasons:[],sleeveLength:'Unknown',pattern:'Unknown',
  fit:'Unknown',segmentHint:{sourceDisconnectedReviewRequired:true,sourceIslandCount:2}};
 vm.createContext(c);
 vm.runInContext(section('function clothingFields(','function cropClothingPhoto('),c);
 const body=node('form');
 const collect=c.clothingFields(body,item);
 const fill=descend(body,x=>x.tag==='button'&&x.textContent==='Fill missing details from photo');
 assert.ok(fill);
 assert.equal(fill.disabled,true,'disconnected source disables automatic metadata button');
 await fill.onclick();
 assert.equal(qualityCalls,0,'opening Adjust must not run background photo color sampling');
 assert.equal(catalogCalls,0,'even a scripted click cannot call AI classification');
 assert.equal(memoryCalls,0,'memory suggestions cannot fill an ambiguous item');
 assert.equal(collect().color,'');
});
