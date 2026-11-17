/**
 * M192 — same-owner re-login, DB-connection and generation rollover MUST
 * invalidate opt-in My Closet index results, not just account ID changes.
 * Synthetic owners and rows only. Original app index remains opt-in.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMobileWardrobeIndex02} from '../research/wardrobe-index-02/mobile-index-app.mjs';

class Elem {
 constructor(doc,tag){this.doc=doc;this.tag=tag;this.children=[];this.parent=null;
  this.id='';this.className='';this.value='';this.textContent='';this.checked=false;
  this.attributes={};this.listeners={};}
 append(...children){for(const child of children){this.children.push(child);child.parent=this;}return this;}
 replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];return this.append(...children);}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
 fire(k){for(const fn of this.listeners[k]||[])fn({target:this});}
 find(fn){if(fn(this))return this;for(const c of this.children){const x=c.find(fn);if(x)return x;}return null;}
 querySelector(query){
  if(query[0]==='#')return this.find(x=>x.id===query.slice(1));
  if(query[0]==='.')return this.find(x=>x.className.split(/\s+/).includes(query.slice(1)));
  return null;
 }
 insertAdjacentElement(where,element){
  assert.equal(where,'afterend');const p=this.parent,i=p.children.indexOf(this);
  p.children.splice(i+1,0,element);element.parent=p;return element;
 }
 remove(){if(!this.parent)return;const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);this.parent=null;}
 get options(){return this.children;}
}
function makeDoc(){
 const doc={defaultView:{}};
 doc.createElement=tag=>new Elem(doc,tag);
 doc.body=doc.createElement('body');doc.head=doc.createElement('head');
 const closet=doc.createElement('section');closet.id='closet';doc.body.append(closet);
 const search=doc.createElement('div');search.className='closet-search';closet.append(search);
 for(const id of ['filter','search','seasonFilter','sleeveFilter']){
  const el=doc.createElement(id==='search'?'input':'select');el.id=id;
  el.value=id==='filter'?'All categories':'';closet.append(el);
 }
 doc.getElementById=id=>doc.body.find(e=>e.id===id)||doc.head.find(e=>e.id===id);
 return {doc,closet,get:id=>doc.getElementById(id)};
}
const OWNER='index02-synthetic-owner';
const item=(id,color='Navy')=>({id,ownerId:OWNER,category:'Bottoms',
 itemType:'Jeans',color,sourceHashVerified:false,notes:'synthetic saved record'});
function setup(){
 const {doc,closet,get}=makeDoc();
 let owner=OWNER,authRef,privateDbRef,epoch=1,records=[item('old-jeans')],pending=null;
 const auth=()=>({user:{id:OWNER},assertCurrent(){if(this.revoked)throw Error('revoked');}});
 authRef=auth();privateDbRef={name:'closet-current-user-'+OWNER};
 const getOwnerSession=()=>({authRef,privateDbRef,operationEpoch:epoch});
 const ui=createMobileWardrobeIndex02({
  document:doc,closetElement:closet,
  authenticatedOwner:()=>owner,
  getOwnerSession,
  readSavedItems:()=>pending?new Promise(resolve=>pending.push(resolve)):records,
  onRerender:()=>{}
 });
 return {ui,get,OWNER,getOwnerSession,
  replaceAuth(){authRef=auth();epoch++;},
  replaceDB(){privateDbRef={name:'closet-current-user-'+OWNER};epoch++;},
  bumpEpoch(){epoch++;},
  revoke(){authRef.revoked=true;},
  pending(p){pending=p;},
  setRows(rows){records=rows;},
  setOwner(x){owner=x;}
 };
}
async function filtered(f){
 await f.ui.refresh();
 f.get('index02Category').value='Bottoms';
 f.get('index02Category').fire('change');
 assert.equal(f.ui.state().ready,true);
 assert.equal(f.ui.includes('old-jeans'),true);
}
test('M192 baseline current signed private index is queryable and no photos are retained',async()=>{
 const f=setup();try{
  await filtered(f);
  assert.equal(f.ui.state().total,1);
  assert.equal(f.ui.state().matched,1);
  assert.equal(JSON.stringify(f.ui.state()).includes('authRef'),false);
 }finally{f.ui.destroy();}
});
for(const [kind,mutate] of [
 ['same owner re-login','replaceAuth'],
 ['same owner private DB replacement','replaceDB'],
 ['unchanged owner operation epoch rollover','bumpEpoch'],
 ['same refs but revoked signed lease','revoke']
]){
 test('M192 '+kind+' revokes cached index before another refresh',async()=>{
  const f=setup();try{
   await filtered(f);
   f[mutate]();
   assert.equal(f.ui.state().ready,false,'old signed lease must no longer authorize cached index');
   assert.equal(f.ui.state().total,0);
   assert.equal(f.ui.includes('old-jeans'),false,'stale garment cannot be included');
  }finally{f.ui.destroy();}
 });
}
test('M192 same-owner re-login while read is in flight cannot publish stale private rows',async()=>{
 const f=setup();try{
  const queue=[];f.pending(queue);
  const running=f.ui.refresh();
  for(let i=0;i<12&&queue.length===0;i++)await new Promise(r=>setImmediate(r));
  assert.equal(queue.length,1,'actual queued private saved read must begin');
  f.replaceAuth();
  queue.shift()([item('old-jeans')]);
  const result=await running;
  assert.equal(result,null);
  assert.equal(f.ui.state().ready,false);
  assert.equal(f.ui.state().total,0);
 }finally{f.ui.destroy();}
});
test('M192 refresh under new same-owner signed lease shows only newly read rows',async()=>{
 const f=setup();try{
  await filtered(f);
  f.replaceAuth();f.setRows([item('new-jeans','Black')]);
  assert.equal(f.ui.state().ready,false);
  await f.ui.refresh();
  assert.equal(f.ui.state().ready,true);
  assert.equal(f.ui.state().total,1);
  f.get('index02Category').value='Bottoms';f.get('index02Category').fire('change');
  assert.equal(f.ui.includes('new-jeans'),true);
  assert.equal(f.ui.includes('old-jeans'),false);
 }finally{f.ui.destroy();}
});
test('M192 actual optional app index provides signed auth/DB/epoch lease and validates async read',()=>{
 const source=readFileSync('public/app.js','utf8');
 const start=source.indexOf("if(new URLSearchParams(location.search).get('index02')==='after'){");
 assert.ok(start>=0,'must inspect actual opt-in native app bridge');
 const section=source.slice(start,start+1900);
 assert.match(section,/getOwnerSession:\s*\(\)=>/);
 assert.match(section,/authRef:\s*window\.closetAuth/);
 assert.match(section,/privateDbRef:\s*db/);
 assert.match(section,/operationEpoch:\s*captureOperationEpoch/);
 assert.match(section,/window\.closetAuth===authRef/);
 assert.match(section,/db===privateDbRef/);
});
