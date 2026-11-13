'use strict';
// Executes the actual production styled-collection lease and form submit.
// All owner IDs, garments and trend evidence are synthetic; no hosted access.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/closet-stylist.js','utf8');
const start=source.indexOf('function beginOwnerStyledCollectionRequest(){');
const end=source.indexOf("for(const id of ['stylistOccasion'",start);
assert.ok(start>0&&end>start,'Actual production request lease and submit required');
const code=source.slice(start,end);
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture(){
 const item={id:'same-id',ownerId:'owner-a',image:'synthetic-original-JPEG-A'};
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 let revoked=false;
 const events=[];
 const dom={
  styleCollectionForm:{onsubmit:null},createCollectionOutfits:{disabled:false},
  stylistStatus:{textContent:'Idle'},
  stylistOccasion:{value:'Everyday'},
  stylistAudience:{value:'Women'},
  stylistSeason:{value:'Fall'},
  stylistFocusItem:{value:'same-id'},
  authGate:{hidden:true},appShell:{hidden:false}
 };
 const ctx={
  window:{closetAuth:auth},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:11,items:[item],
  styledCollectionRequestSerial:0,styledCollectionResults:[],
  activeTrendLibrary:{updatedAt:'synthetic'},
  closetReady:Promise.resolve(),$(id){return dom[id]},
  refreshStylistFocusItems(){events.push('refresh');},
  refreshTrendLibrary:async()=>{events.push('trend');},
  styleOwnedCollection(rows,request){
   events.push('style:'+request.focusItemId);
   return [{focusItemId:request.focusItemId,board:{slots:{top:rows[0].id}},request}];
  },
  renderStyledCollection(){events.push('render');}
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const submit=()=>dom.styleCollectionForm.onsubmit({preventDefault(){events.push('prevent')}});
 return {ctx,item,auth,dom,events,submit,
  switchOwner(){
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.items=[{...item,ownerId:'owner-b',image:'synthetic-JPEG-B'}];
   ctx.captureOperationEpoch++;
  },
  relogin(){
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.items=[{...item,image:'new-login-JPEG'}];
   ctx.captureOperationEpoch++;
  },
  rotateEpoch(){ctx.captureOperationEpoch++;},
  revoke(){revoked=true;},
  rehydrate(){ctx.items=[{...item,ownerId:'owner-a',name:'new version'}];},
  changePrefs(id,value){dom[id].value=value;ctx.styledCollectionRequestSerial++;},
  deferTrend(){
   const gate=deferred(),begun=deferred();
   ctx.refreshTrendLibrary=()=>{events.push('trend');begun.resolve();return gate.promise;};
   return {...gate,begun:begun.promise};
  },
  deferClosetReady(){const gate=deferred();ctx.closetReady=gate.promise;return gate;}
 };
}
test('same owner publishes 1 focus-specific result and reenables button',async()=>{
 const f=fixture();await f.submit();
 assert.deepEqual(f.events,['prevent','refresh','trend','style:same-id','render']);
 assert.equal(f.dom.createCollectionOutfits.disabled,false);
 assert.match(f.dom.stylistStatus.textContent,/Here are 1 outfit option/);
 assert.equal(f.ctx.styledCollectionResults[0].focusItemId,'same-id');
});
test('other account during slow trends sees no old outfits, status or button change',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 const oldStatus=f.dom.stylistStatus.textContent;
 f.switchOwner();f.dom.stylistStatus.textContent='owner-b screen';
 f.dom.createCollectionOutfits.disabled=true;
 p.resolve();await op;
 assert.deepEqual(f.events,['prevent','refresh','trend']);
 assert.equal(f.dom.stylistStatus.textContent,'owner-b screen');
 assert.equal(f.dom.createCollectionOutfits.disabled,true);
 assert.equal(f.ctx.styledCollectionResults.length,0);
});
test('same-ID re-login during trends is a new session, never gets old results',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.relogin();f.dom.stylistStatus.textContent='fresh login';
 p.resolve();await op;
 assert.deepEqual(f.events,['prevent','refresh','trend']);
 assert.equal(f.dom.stylistStatus.textContent,'fresh login');
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
});
test('auth assertion revocation after trends cancels old request',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.revoke();p.resolve();await op;assert.deepEqual(f.events,['prevent','refresh','trend']);
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
});
test('silent capture epoch rotation invalidates same-ID owner request',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.rotateEpoch();p.resolve();await op;assert.equal(f.events.filter(e=>e.startsWith('style')).length,0);
});
test('same-ID wardrobe hydration rejects old photo result',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.rehydrate();p.resolve();await op;
 assert.equal(f.events.filter(e=>e.startsWith('style')).length,0);
});
test('adding a garment while trend fetch pending rejects stale closet snapshot',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.ctx.items.push({id:'fresh-boot',ownerId:'owner-a'});
 p.resolve();await op;
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
});
test('requested focus change during trend fetch cancels old selection',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.dom.stylistFocusItem.value='other-garment';
 p.resolve();await op;
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
 assert.equal(f.events.filter(e=>e==='render').length,0);
});
test('other form value edited while fetch pending cannot publish wrong preferences',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.dom.stylistSeason.value='Spring';p.resolve();await op;
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
});
test('return to prior preference after explicit replacement invalidates first request',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.changePrefs('stylistSeason','Spring');f.changePrefs('stylistSeason','Fall');
 p.resolve();await op;
 assert.deepEqual(f.ctx.styledCollectionResults,[]);
});
test('old failed trend request cannot show raw private error to next login',async()=>{
 const f=fixture(),p=f.deferTrend(),op=f.submit();await p.begun;
 f.switchOwner();f.dom.stylistStatus.textContent='new owner idle';
 p.reject(Error('owner-a secret photo name'));await op;
 assert.equal(f.dom.stylistStatus.textContent,'new owner idle');
 assert.equal(f.ctx.styledCollectionResults.length,0);
});
test('current trend failure shows safe fallback and reenables same-owner button',async()=>{
 const f=fixture();
 f.ctx.refreshTrendLibrary=async()=>{throw Error('private original JPEG-A path');};
 await f.submit();
 assert.equal(f.dom.stylistStatus.textContent,
  'Could not create outfits. Your closet is unchanged; try again.');
 assert.equal(f.dom.createCollectionOutfits.disabled,false);
});
test('newer request wins; first request completion cannot clear its loading state',async()=>{
 const f=fixture(),p1=deferred(),p2=deferred(),started1=deferred(),started2=deferred();let count=0;
 f.ctx.refreshTrendLibrary=()=>{count++;f.events.push('trend:'+count);
  if(count===1){started1.resolve();return p1.promise;}
  started2.resolve();return p2.promise;};
 const first=f.submit();await started1.promise;
 const second=f.submit();await started2.promise;
 p1.resolve();await first;
 assert.equal(f.dom.createCollectionOutfits.disabled,true);
 assert.equal(f.ctx.styledCollectionResults.length,0);
 p2.resolve();await second;
 assert.equal(f.dom.createCollectionOutfits.disabled,false);
 assert.equal(f.ctx.styledCollectionResults.length,1);
 assert.equal(f.events.filter(e=>e==='render').length,1);
});
test('newer request failure is not overwritten by older request completion',async()=>{
 const f=fixture(),p1=deferred(),p2=deferred(),started1=deferred(),started2=deferred();let count=0;
 f.ctx.refreshTrendLibrary=()=>{count++;(count===1?started1:started2).resolve();return count===1?p1.promise:p2.promise;};
 const first=f.submit();await started1.promise;
 const second=f.submit();await started2.promise;
 p2.reject(Error('timeout'));await second;
 const expected=f.dom.stylistStatus.textContent;
 p1.resolve();await first;
 assert.equal(f.dom.stylistStatus.textContent,expected);
 assert.equal(f.ctx.styledCollectionResults.length,0);
});
test('owner change while awaiting closetReady does not invoke trend refresh',async()=>{
 const f=fixture(),gate=f.deferClosetReady(),op=f.submit();
 f.switchOwner();gate.resolve();await op;
 assert.deepEqual(f.events,['prevent']);
 assert.equal(f.ctx.styledCollectionResults.length,0);
});
test('locked or wrong private database rejects submit at start',async()=>{
 const f=fixture();f.dom.authGate.hidden=false;await f.submit();
 assert.deepEqual(f.events,['prevent']);
 f.dom.authGate.hidden=true;f.ctx.db={name:'closet-current-user-owner-x'};
 await f.submit();assert.deepEqual(f.events,['prevent','prevent']);
});
test('source captures exact original wardrobe object references and four preferences',()=>{
 assert.match(code,/wardrobe=\[\.\.\.items\]/);
 assert.match(code,/wardrobe\.every\(\(item,i\)=>items\[i\]===item\)/);
 assert.match(code,/stylistFocusItem:\$\('stylistFocusItem'\)\?\.value/);
 assert.match(code,/captureOperationEpoch/);
 assert.match(code,/window\.closetAuth!==auth/);
 assert.match(code,/const serial=\+\+styledCollectionRequestSerial/);
 assert.match(code,/if\(!lease\.current\(\)\)return;/);
 assert.match(code,/if\(lease\.ownsSession\(\)&&lease\.serial===styledCollectionRequestSerial\)/);
});
test('session lock and changed preference revoke older submissions in production',()=>{
 assert.match(source,/window\.addEventListener\('closet:session-locked',\(\)=>\{[\s\S]*?styledCollectionRequestSerial\+\+/);
 assert.match(source,/for\(const id of \['stylistOccasion','stylistAudience','stylistSeason'\]\)[\s\S]*?styledCollectionRequestSerial\+\+/);
 assert.doesNotMatch(code,/catch\(error\)\{\$\('stylistStatus'\)\.textContent=error\.message/);
});
