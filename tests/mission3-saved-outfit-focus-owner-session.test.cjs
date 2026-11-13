'use strict';
// Source-execute production general outfit-focus callback and owner/session lease.
// Only synthetic owner IDs and garment IDs; no private wardrobe credentials.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const src=readFileSync('public/app.js','utf8');
const start=src.indexOf('function ownerStyleCardActionLease(item){');
const end=src.indexOf('function ownerWardrobeMutationLease(){',start);
assert.ok(start>=0&&end>start,'Actual signed owner Style functions required');
const production=src.slice(start,end);
function fixture(){
 const item={id:'same-id',ownerId:'owner-a',sourceSHA256:'a'.repeat(64),
  image:'synthetic-JPEG-A'};
 const events=[],button={isConnected:true};
 let revoked=false;
 const originalAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const nodes={authGate:{hidden:true},appShell:{hidden:false},
  stylistFocusItem:{options:[{value:'same-id'},{value:'other-id'}],value:''},
  styleCollectionForm:{requestSubmit(){events.push('submit:'+nodes.stylistFocusItem.value);}}};
 const ctx={window:{closetAuth:originalAuth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:7,items:[item],$(id){return nodes[id];},
  refreshStylistFocusItems(){events.push('refresh');},
  switchView(view){events.push('switch:'+view);},
  message(value){events.push('message:'+value);}
 };
 vm.createContext(ctx);vm.runInContext(production,ctx);
 return {ctx,item,button,nodes,events,
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.items=[{...item,ownerId:'owner-b',image:'synthetic-JPEG-B'}];
   ctx.captureOperationEpoch++;
  },
  relogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.items=[{...item,image:'same-ID new login JPEG'}];
   ctx.captureOperationEpoch++;
  },
  hydrate(){ctx.items=[{...item,name:'same-ID newer garment'}];},
  revoke(){revoked=true;}
 };
}
test('currently signed original card selects exact saved item and submits one outfit request',()=>{
 const f=fixture();f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh','switch:stylist','submit:same-id']);
 assert.equal(f.nodes.stylistFocusItem.value,'same-id');
});
test('old saved card cannot focus a second account with coincidentally same ID',()=>{
 const f=fixture();f.switchOwner();
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
 assert.equal(f.nodes.stylistFocusItem.value,'');
});
test('same-ID owner re-login cannot replay previous session Style card click',()=>{
 const f=fixture();f.relogin();
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('same-owner rehydration of same-ID garment invalidates original card identity',()=>{
 const f=fixture();f.hydrate();
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('detached old card control never modifies outfit selection',()=>{
 const f=fixture();f.button.isConnected=false;
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('signed out hidden shell never starts a saved-card outfit',()=>{
 const f=fixture();f.nodes.appShell.hidden=true;
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('wrong owner IndexedDB never starts matching ID outfit',()=>{
 const f=fixture();f.ctx.db={name:'closet-current-user-owner-x'};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('revoked exact auth assertion refuses Style card',()=>{
 const f=fixture();f.revoke();
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[]);
});
test('missing eligible outfit option never submits the item',()=>{
 const f=fixture();f.nodes.stylistFocusItem.options=[{value:'other-id'}];
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,[
  'refresh',
  'message:Could not safely style this saved piece. Reopen My Closet and review its garment details. Your saved clothing and outfits are unchanged.'
 ]);
});
test('failed style refresh cannot interpolate private garment metadata into UI',()=>{
 const f=fixture();f.ctx.refreshStylistFocusItems=()=>{
  throw Error('PRIVATE-JPEG-A original metadata leak');
 };
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.equal(f.events.length,1);
 assert.match(f.events[0],/Could not safely style this saved piece/);
 assert.doesNotMatch(f.events[0],/PRIVATE|JPEG|metadata/);
});
test('account switch during refreshed outfit choices aborts before opening Stylist tab',()=>{
 const f=fixture();f.ctx.refreshStylistFocusItems=()=>{f.events.push('refresh');f.switchOwner();};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh']);
 assert.equal(f.nodes.stylistFocusItem.value,'');
});
test('same-ID relogin during refreshed outfit choices aborts before selection',()=>{
 const f=fixture();f.ctx.refreshStylistFocusItems=()=>{f.events.push('refresh');f.relogin();};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh']);
});
test('account switch within switchView cannot submit under new account',()=>{
 const f=fixture();f.ctx.switchView=view=>{f.events.push('switch:'+view);f.switchOwner();};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh','switch:stylist']);
 assert.equal(f.nodes.stylistFocusItem.value,'');
});
test('same account new login during switchView cannot submit stale garment',()=>{
 const f=fixture();f.ctx.switchView=view=>{f.events.push('switch:'+view);f.relogin();};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh','switch:stylist']);
});
test('account switch from selection value setter cannot submit old garment',()=>{
 const f=fixture();let value='';
 Object.defineProperty(f.nodes.stylistFocusItem,'value',{
  get(){return value;},
  set(next){value=next;f.switchOwner();}
 });
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh','switch:stylist']);
 assert.equal(value,'same-id');
});
test('missing form never sends a request and errors remain generic',()=>{
 const f=fixture();delete f.nodes.styleCollectionForm;
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.equal(f.events[0],'refresh');
 assert.equal(f.events.length,2);
 assert.match(f.events[1],/Reopen My Closet/);
});
test('detached card while refreshing loses permission to style',()=>{
 const f=fixture();f.ctx.refreshStylistFocusItems=()=>{f.events.push('refresh');f.button.isConnected=false;};
 f.ctx.focusSavedClosetCardOwnerSafe(f.item,f.button);
 assert.deepEqual(f.events,['refresh']);
});
test('source no longer uses id-only ownership guard or raw private error',()=>{
 assert.match(src,/styleFocus\.onclick=\(\)=>focusSavedClosetCardOwnerSafe\(item,styleFocus\);/);
 assert.match(production,/function focusSavedClosetCardOwnerSafe\(item,button\)/);
 assert.match(production,/ownerStyleCardActionLease\(item\)/);
 assert.match(production,/!items\.includes\(item\)/);
 assert.match(production,/captureOperationEpoch!==epoch/);
 assert.match(production,/form\.requestSubmit\(\)/);
 assert.doesNotMatch(src,/styleFocus\.onclick=\(\)=>\{try\{const auth=/);
 assert.doesNotMatch(production,/message\(error\.message/);
});
