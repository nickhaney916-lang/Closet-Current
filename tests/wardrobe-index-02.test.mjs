import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMobileWardrobeIndex02} from '../research/wardrobe-index-02/mobile-index-app.mjs';

class FakeElement {
 constructor(doc,tag){this.doc=doc;this.tag=tag;this.children=[];this.parent=null;this.className='';
  this.id='';this.value='';this.textContent='';this.attributes={};this.listeners={};this.checked=false;}
 append(...children){for(const c of children){this.children.push(c);c.parent=this;}return this;}
 replaceChildren(...children){for(const c of this.children)c.parent=null;this.children=[];return this.append(...children);}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 fire(type){for(const fn of this.listeners[type]||[])fn({target:this});}
 getAttribute(k){return this.attributes[k];}
 insertAdjacentElement(position,element){
  assert.equal(position,'afterend');const p=this.parent,i=p.children.indexOf(this);
  p.children.splice(i+1,0,element);element.parent=p;return element;
 }
 remove(){if(!this.parent)return;const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);this.parent=null;}
 find(predicate){if(predicate(this))return this;for(const child of this.children){const r=child.find(predicate);if(r)return r;}return null;}
 querySelector(selector){
  if(selector.startsWith('#'))return this.find(x=>x.id===selector.slice(1));
  if(selector.startsWith('.'))return this.find(x=>x.className.split(/\s+/).includes(selector.slice(1)));
  throw Error('unsupported fixture selector '+selector);
 }
 get options(){return this.children;}
}
function setup(){
 const doc={defaultView:{closetBrowseAll:false,closetSlotFilter:'bottom',closetTargetSlot:'bottom',
  closetItemType:'Jeans',closetSleeves:['Long sleeve']}};
 doc.createElement=tag=>new FakeElement(doc,tag);
 doc.body=doc.createElement('body');doc.head=doc.createElement('head');
 const closet=doc.createElement('section');closet.id='closet';doc.body.append(closet);
 const old=doc.createElement('div');old.className='closet-search';closet.append(old);
 for(const id of ['filter','search','seasonFilter','sleeveFilter']){
  const el=doc.createElement(id==='search'?'input':'select');el.id=id;
  el.value=id==='filter'?'All categories':'';
  closet.append(el);
 }
 doc.getElementById=id=>doc.body.find(el=>el.id===id)||doc.head.find(el=>el.id===id);
 return {doc,closet,get:id=>doc.getElementById(id)};
}
const piece=(id,category,itemType,color,extras={})=>({id,category,itemType,color,
 name:color+' '+itemType,notes:'',seasons:['Fall'],...extras});
const fixtures=()=>[
 piece('red-shirt','Tops','T-shirt','Red',{sleeveLength:'Short sleeve',notes:'school'}),
 piece('blue-skirt','Bottoms','Skirt','Blue',{userAdjusted:true,localChoices:[{category:'Dresses',itemType:'Casual dress',score:.99}]}),
 piece('blue-jeans','Bottoms','Jeans','Blue'),
 piece('black-boots','Shoes','Ankle boots','Black'),
 piece('white-shoes','Shoes','Sneakers','White'),
 piece('pink-dress','Dresses','Casual dress','Pink'),
 piece('red-unknown','Tops','Unknown','Red'),
 piece('coat','Outerwear','Coat','Black'),
 piece('bag','Accessories','Bag','Black'),
 piece('estimate','Tops','T-shirt','Green',{colorSource:'photo-estimate'})
];

test('INDEX-02 mobile My Closet controls use the actual saved category/type/color and show review state',async()=>{
 const {doc,closet,get}=setup();let owner='account-A',records=fixtures(),paints=0;
 const ui=createMobileWardrobeIndex02({
  document:doc,closetElement:closet,
  authenticatedOwner:()=>owner,readSavedItems:async()=>records,
  onRerender:()=>paints++
 });
 assert.equal(get('closetIndex02').open,true);
 assert.equal(get('index02Category').getAttribute('aria-label'),'Indexed garment category');
 await ui.refresh();
 assert.equal(ui.state().total,10);
 assert.equal(ui.state().reviewCount,2);
 assert.equal(ui.state().active,false);
 assert.equal(ui.includes('pink-dress'),true);
 assert.ok(get('index02Status').textContent.includes('10 saved pieces'));
 const options=get('index02Category').options.map(x=>x.value);
 assert.ok(options.includes('Dresses')&&options.includes('Shoes'));
 assert.ok(get('index02Clear'));
 assert.ok(paints>0);
 ui.destroy();
 assert.equal(get('closetIndex02'),null);
 assert.equal(get('index02ResearchStyles'),null);
});

test('INDEX-02 changing category and item type filters real owned garments, not model guesses',async()=>{
 const {doc,closet,get}=setup(),owner='account-A';
 const ui=createMobileWardrobeIndex02({document:doc,closetElement:closet,
  authenticatedOwner:()=>owner,readSavedItems:async()=>fixtures()});
 await ui.refresh();
 get('index02Category').value='Bottoms';get('index02Category').fire('change');
 assert.equal(ui.state().matched,2);
 assert.equal(ui.includes('blue-skirt'),true);
 assert.equal(ui.includes('pink-dress'),false);
 assert.equal(doc.defaultView.closetSlotFilter,null);
 assert.equal(doc.defaultView.closetBrowseAll,true);
 assert.equal(get('index02Type').options.some(x=>x.value==='Skirt'),true);
 assert.equal(get('index02Type').options.some(x=>x.value==='Sneakers'),false);
 get('index02Type').value='Skirt';get('index02Type').fire('change');
 assert.equal(ui.state().matched,1);
 assert.equal(ui.includes('blue-skirt'),true,'user corrected skirt must be preserved');
 assert.equal(ui.includes('pink-dress'),false,'stale dress model label must never override human');
 get('index02Category').value='Shoes';get('index02Category').fire('change');
 assert.equal(ui.state().matched,2);
 assert.equal(get('index02Type').value,'','old skirt subtype must clear when category changes');
 get('index02Type').value='Ankle boots';get('index02Type').fire('change');
 assert.equal(ui.state().matched,1);
 assert.ok(ui.includes('black-boots'));
 get('index02Color').value='Black';get('index02Color').fire('change');
 assert.equal(ui.state().matched,1);
 get('index02Clear').fire('click');
 assert.equal(ui.state().active,false);
 assert.equal(ui.includes('pink-dress'),true);
 ui.destroy();
});

test('INDEX-02 search and needs-review filter work on saved corrections, not unsaved candidate images',async()=>{
 const {doc,closet,get}=setup(),rows=fixtures();
 rows[0].image='data:image/jpeg;base64,SENSITIVE-PRIVATE-IMAGE';
 let snapshot=rows;
 const ui=createMobileWardrobeIndex02({document:doc,closetElement:closet,
  authenticatedOwner:()=> 'account-A',readSavedItems:async()=>snapshot});
 await ui.refresh();
 get('index02Search').value='red school';get('index02Search').fire('input');
 assert.deepEqual(ui.state().matched,1);
 assert.ok(ui.includes('red-shirt'));
 assert.ok(!ui.includes('blue-skirt'));
 assert.ok(!get('index02Status').textContent.includes('SENSITIVE-PRIVATE-IMAGE'));
 get('index02Clear').fire('click');
 get('index02NeedsReview').checked=true;get('index02NeedsReview').fire('change');
 assert.equal(ui.state().matched,2);
 assert.ok(ui.includes('red-unknown'));
 assert.ok(ui.includes('estimate'));
 assert.ok(!ui.includes('red-shirt'));
 // The optical classification result was a separate unsaved object; it is
 // never in the DB snapshot and must never appear in My Closet.
 assert.ok(!ui.includes('unsaved-review-batch'));
 ui.destroy();
});

test('INDEX-02 refresh after saved edit, save, delete and restore reflects persisted DB snapshot',async()=>{
 const {doc,closet,get}=setup();let persisted=fixtures(),owner='account-A';
 const ui=createMobileWardrobeIndex02({document:doc,closetElement:closet,
  authenticatedOwner:()=>owner,readSavedItems:async()=>persisted});
 await ui.refresh();
 get('index02Category').value='Bottoms';get('index02Category').fire('change');
 assert.equal(ui.state().matched,2);
 // The real app calls the integration refresh only after an IndexedDB commit.
 persisted=persisted.map(x=>x.id==='blue-skirt'?{...x,category:'Dresses',itemType:'Casual dress'}:x);
 await ui.refresh();assert.equal(ui.state().matched,1);
 persisted=[...persisted,piece('new-shorts','Bottoms','Shorts','Yellow')];
 await ui.refresh();assert.equal(ui.state().matched,2);
 persisted=persisted.filter(x=>x.id!=='blue-jeans');
 await ui.refresh();assert.equal(ui.state().matched,1);
 persisted=[piece('backup-jeans','Bottoms','Jeans','Navy')];
 await ui.refresh();assert.equal(ui.state().total,1);
 assert.equal(ui.state().matched,1);
 assert.ok(ui.includes('backup-jeans'));
 assert.ok(!ui.includes('new-shorts'));
 ui.destroy();
});

test('INDEX-02 pagination never drops saved pieces above 200',async()=>{
 const {doc,closet,get}=setup();
 const rows=Array.from({length:1001},(_,i)=>piece('owned-'+i,'Bottoms','Jeans',i%2?'Black':'Blue'));
 const ui=createMobileWardrobeIndex02({document:doc,closetElement:closet,
  authenticatedOwner:()=> 'account-A',readSavedItems:async()=>rows});
 await ui.refresh();
 get('index02Category').value='Bottoms';get('index02Category').fire('change');
 assert.equal(ui.state().matched,1001);
 assert.equal(ui.includes('owned-999'),true);
 assert.equal(ui.includes('owned-1000'),true);
 ui.destroy();
});

test('INDEX-02 logout, cross-account switch and stale async DB reads clear private views',async()=>{
 const {doc,closet,get}=setup();let owner='account-A',rows=fixtures(),release;
 const ui=createMobileWardrobeIndex02({document:doc,closetElement:closet,
  authenticatedOwner:()=>owner,readSavedItems:async()=>{
   if(release)return await new Promise(r=>release=r);
   return rows;
  }});
 await ui.refresh();
 get('index02Category').value='Tops';get('index02Category').fire('change');
 assert.ok(ui.includes('red-shirt'));
 owner='account-B';
 assert.equal(ui.includes('red-shirt'),false);
 assert.equal(ui.state().ready,false);
 rows=[piece('other-shirt','Tops','T-shirt','White',{ownerId:'account-B'})];
 await ui.refresh();
 assert.equal(ui.state().matched,1);
 assert.equal(ui.includes('other-shirt'),true);
 assert.equal(ui.includes('red-shirt'),false);
 owner=null;
 await ui.refresh();
 assert.equal(ui.state().ready,false);
 assert.equal(ui.state().total,0);
 assert.equal(ui.includes('other-shirt'),false);
 owner='account-B';
 release=true;
 const pending=ui.refresh();
 // After queued read begins, change user before releasing the snapshot.
 await new Promise(r=>setImmediate(r));
 const resolve=release;
 owner='account-A';
 resolve(rows);
 await pending;
 assert.equal(ui.state().ready,false);
 assert.equal(ui.includes('other-shirt'),false);
 ui.destroy();
});

test('INDEX-02 is opt-in, does not change database schemas, source photo, model, or deploy',()=>{
 const app=readFileSync('public/app.js','utf8');
 const backup=readFileSync('public/cloud-backup-bridge.js','utf8');
 const module=readFileSync('research/wardrobe-index-02/mobile-index-app.mjs','utf8');
 assert.ok(app.includes("get('index02')==='after'"));
 assert.ok(app.includes("db?.name!=='closet-current-user-'+owner"));
 assert.ok(app.includes('result.then(()=>window.closetIndex02?.refresh()).catch(()=>{})'));
 assert.ok(app.includes('window.closetIndex02.includes(x.id)'));
 assert.ok(backup.includes('window.closetIndex02?.refresh().catch(()=>{})'));
 assert.ok(!/source\.image\s*=|\.image\s*=\s*|\.category\s*=\s*.*recognition/i.test(module));
 assert.ok(!/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB\.open|new Worker|postMessage/i.test(module));
});
