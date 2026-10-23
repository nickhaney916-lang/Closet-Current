import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyAlphaAuthUser,renderAlphaAuthenticatedBoard} from '../public/family-alpha-2d-auth-preflight.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment} from '../public/family-alpha-2d-saved-board.mjs';

const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222',SECRET='synthetic-never-log-token';
const original=n=>{const raw=new Uint8Array(128).fill(n);raw[0]=255;raw[1]=216;raw[126]=255;raw[127]=217;return 'data:image/jpeg;base64,'+btoa(String.fromCharCode(...raw));};
const items=[['shirt','Tops',11],['pants','Bottoms',21],['shoes','Shoes',31]].map(([id,category,n])=>({id,category,image:original(n),originalPhoto:{image:original(n+6)}}));
const board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
class Elem{constructor(){this.style={};this.dataset={};this.children=[];this.attr={};}replaceChildren(...a){this.children=a;}append(x){this.children.push(x);}setAttribute(k,v){this.attr[k]=v;}}
class Img extends Elem{constructor(){super();this.naturalWidth=120;this.naturalHeight=200;this.complete=true;}cloneNode(){return new Img();}}
const withDOM=async fn=>{const doc=globalThis.document,img=globalThis.HTMLImageElement;globalThis.document={createElement:()=>new Elem()};globalThis.HTMLImageElement=Img;try{return await fn();}finally{globalThis.document=doc;globalThis.HTMLImageElement=img;}};
async function prepared(garments=items,owner=A){const out={};for(const item of garments)out[item.id]={itemId:item.id,ownerId:owner,sourceIdentity:identityForSavedGarment(item),sourceVersion:await fingerprintAlphaRetainedOriginal(item.originalPhoto?.image||item.image,webcrypto),approved:true,image:new Img()};return out;}
function fixture(){
 const state={user:A,cloud:A,epoch:1};let calls=0,reads=0;
 const options={auth:{user:{id:A},getAccessToken:async()=>SECRET},
  database:{name:'closet-current-user-'+A},getCloudOwnerId:()=>state.cloud,getSessionGeneration:()=>state.epoch,
  publicKey:'synthetic-publishable-key',cryptoProvider:webcrypto,
  fetchFn:async(url,params)=>{calls++;assert.equal(url,'https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user');assert.equal(params.method,'GET');assert.equal(params.headers.Authorization,'Bearer '+SECRET);assert.equal(params.headers.apikey,options.publicKey);return {ok:true,status:200,json:async()=>({id:state.user})};},
  loadScopedWardrobe:async()=>{reads++;return {ownerId:A,indexedDbName:'closet-current-user-'+A,items,board};},
  preparePresentations:async()=>prepared()
 };
 return {state,options,metrics:()=>({calls,reads})};
}
test('authenticated user is checked through Supabase user endpoint, not unsigned JWT fields',async()=>{const f=fixture(),result=await verifyAlphaAuthUser(f.options);assert.equal(result.ownerId,A);assert.equal(result.serverChecked,true);assert.equal(result.upstreamRlsUnverified,true);assert.equal(JSON.stringify(result).includes(SECRET),false);assert.deepEqual(f.metrics(),{calls:1,reads:0});});
test('wrong authenticated server user, 401, 403, malformed JSON, redirect and network failure deny',async()=>{
 const cases=[async()=>({ok:true,status:200,json:async()=>({id:B})}),async()=>({ok:false,status:401}),async()=>({ok:false,status:403}),async()=>({ok:true,status:200,json:async()=>{throw Error(SECRET);}}),async()=>({ok:true,status:302,json:async()=>({id:A})}),async()=>{throw Error(SECRET);}];
 for(const fetchFn of cases){const f=fixture();f.options.fetchFn=fetchFn;await assert.rejects(verifyAlphaAuthUser(f.options),err=>/account verification/.test(err.message)&&!err.message.includes(SECRET));assert.equal(f.metrics().reads,0);}
});
test('token errors cannot expose credentials',async()=>{const f=fixture();f.options.auth.getAccessToken=async()=>{throw Error(SECRET);};await assert.rejects(verifyAlphaAuthUser(f.options),err=>!err.message.includes(SECRET));f.options.auth.getAccessToken=async()=>'';await assert.rejects(verifyAlphaAuthUser(f.options),/account verification/);});
test('local storage name, cloud user, Auth ID and session generation must agree before network',async()=>{
 for(const change of [f=>f.options.database.name='closet-current-user-'+B,f=>f.state.cloud=B,f=>f.options.auth.user.id='invalid',f=>f.state.epoch=null,f=>f.state.epoch=-1]){const f=fixture();change(f);await assert.rejects(verifyAlphaAuthUser(f.options),/account verification/);assert.equal(f.metrics().calls,0);}
});
test('account changes while token or verified response are pending fail closed',async()=>{
 for(const phase of ['token','user']){const f=fixture();let ready,release;const entered=new Promise(r=>ready=r),pending=new Promise(r=>release=r);
  if(phase==='token')f.options.auth.getAccessToken=async()=>{ready();await pending;return SECRET;};
  else f.options.fetchFn=async()=>{ready();await pending;return {ok:true,status:200,json:async()=>({id:A})};};
  const result=verifyAlphaAuthUser(f.options);await entered;f.options.auth.user.id=B;f.state.epoch=2;release();await assert.rejects(result,/account changed|account verification/);
 }
});
test('verified read of actual saved outfit returns photo layers without sending token to renderer',()=>withDOM(async()=>{const f=fixture(),container=new Elem(),result=await renderAlphaAuthenticatedBoard(container,f.options);assert.equal(result.renderedLayers,3);assert.equal(result.serverAuthChecked,true);assert.equal(result.sourceMaskProofPending,true);assert.deepEqual(container.children[0].children.slice(1).map(x=>x.dataset.slot),['shoes','bottom','top']);assert.deepEqual(f.metrics(),{calls:1,reads:1});assert.equal(JSON.stringify(result).includes(SECRET),false);}));
test('401 erases old avatar before loading any saved wardrobe',()=>withDOM(async()=>{const f=fixture(),container=new Elem();container.replaceChildren(new Img());f.options.fetchFn=async()=>({ok:false,status:401});await assert.rejects(renderAlphaAuthenticatedBoard(container,f.options));assert.equal(container.children.length,0);assert.equal(f.metrics().reads,0);}));
test('foreign snapshot or mismatched db name never prepares garment masks',()=>withDOM(async()=>{for(const wrong of [{ownerId:B,indexedDbName:'closet-current-user-'+A},{ownerId:A,indexedDbName:'closet-current-user-'+B}]){const f=fixture(),container=new Elem();f.options.loadScopedWardrobe=async()=>({...wrong,board,items});f.options.preparePresentations=async()=>{throw Error('must never prepare');};await assert.rejects(renderAlphaAuthenticatedBoard(container,f.options),/different or unavailable account/);assert.equal(container.children.length,0);}}));
test('valid Auth cannot make wrong-owner, stale or self-unapproved mask display',()=>withDOM(async()=>{for(const change of [p=>p.shirt.ownerId=B,p=>p.shirt.approved=false,p=>p.shirt.sourceVersion='sha256:stale',p=>p.shirt.sourceIdentity='unrelated']){const f=fixture(),container=new Elem();f.options.preparePresentations=async()=>{const p=await prepared();change(p);return p;};await assert.rejects(renderAlphaAuthenticatedBoard(container,f.options),/Unapproved|foreign|stale/);assert.equal(container.children.length,0);}}));
test('changing retained original invalidates a mask when the saved crop remains the same',()=>withDOM(async()=>{const f=fixture(),container=new Elem(),existing=await prepared();f.options.preparePresentations=async()=>existing;f.options.loadScopedWardrobe=async()=>({ownerId:A,indexedDbName:'closet-current-user-'+A,board,items:items.map(x=>x.id==='shirt'?{...x,originalPhoto:{image:original(87)}}:x)});await assert.rejects(renderAlphaAuthenticatedBoard(container,f.options),/stale/);assert.equal(container.children.length,0);}));
test('account switch while local wardrobe read or mask preparation is pending erases stale avatar',()=>withDOM(async()=>{for(const phase of ['read','mask']){const f=fixture(),container=new Elem();let entered,release;const signal=new Promise(r=>entered=r),hold=new Promise(r=>release=r);if(phase==='read')f.options.loadScopedWardrobe=async()=>{entered();await hold;return {ownerId:A,indexedDbName:'closet-current-user-'+A,board,items};};else f.options.preparePresentations=async()=>{entered();await hold;return prepared();};const task=renderAlphaAuthenticatedBoard(container,f.options);await signal;f.options.auth.user.id=B;f.state.epoch++;release();await assert.rejects(task,/account changed|account verification/);assert.equal(container.children.length,0);}}));
test('superseded async preflight does not erase a newer avatar',()=>withDOM(async()=>{const f=fixture(),container=new Elem();let entered,release,calls=0;const waiting=new Promise(r=>entered=r),held=new Promise(r=>release=r);f.options.fetchFn=async()=>{calls++;if(calls===1){entered();await held;}return {ok:true,status:200,json:async()=>({id:A})};};const old=renderAlphaAuthenticatedBoard(container,f.options);await waiting;const current=await renderAlphaAuthenticatedBoard(container,f.options);assert.equal(current.renderedLayers,3);release();await assert.rejects(old,/Superseded/);assert.equal(container.children[0].children[1].dataset.slot,'shoes');}));
test('does not log tokens, fetch images, persist photos or use unverified preview fallback',()=>{const source=readFileSync(new URL('../public/family-alpha-2d-auth-preflight.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/console\.|localStorage|new Image\(|\.src\s*=/);assert.match(source,/getAccessToken/);assert.match(source,/renderSavedBoard2D/);});

test('new rejected Auth request invalidates older in-flight source SHA before stale photo can commit',()=>withDOM(async()=>{
 const f=fixture(),container=new Elem();
 let enterDigest,releaseDigest,authCalls=0;
 const entered=new Promise(resolve=>enterDigest=resolve);
 const pending=new Promise(resolve=>releaseDigest=resolve);
 f.options.cryptoProvider={subtle:{digest:async(...args)=>{enterDigest();await pending;return webcrypto.subtle.digest(...args);}}};
 f.options.fetchFn=async()=>++authCalls===1?
  {ok:true,status:200,json:async()=>({id:A})}:
  {ok:false,status:401};
 const old=renderAlphaAuthenticatedBoard(container,f.options);
 await entered; // old Auth has passed and inner saved-board SHA hashing is suspended
 assert.equal(container.children.length,0);
 await assert.rejects(renderAlphaAuthenticatedBoard(container,f.options),/account verification/);
 assert.equal(container.children.length,0);
 releaseDigest();
 await assert.rejects(old,/Superseded avatar request/);
 assert.equal(container.children.length,0,'old user garment cannot reappear after rejected newer Auth request');
}));

test('late inner garment hashing cannot overwrite a newer authenticated owner preview',()=>withDOM(async()=>{
 const first=fixture(),container=new Elem();
 let enterDigest,releaseDigest;
 const entered=new Promise(resolve=>enterDigest=resolve);
 const pending=new Promise(resolve=>releaseDigest=resolve);
 first.options.cryptoProvider={subtle:{digest:async(...args)=>{enterDigest();await pending;return webcrypto.subtle.digest(...args);}}};
 const originalRequest=renderAlphaAuthenticatedBoard(container,first.options);
 await entered;
 // New independent verified request renders first while old digest is outstanding.
 const second=fixture();second.options.cryptoProvider=webcrypto;
 const current=await renderAlphaAuthenticatedBoard(container,second.options);
 assert.equal(current.renderedLayers,3);
 const winningFrame=container.children[0];
 releaseDigest();
 await assert.rejects(originalRequest,/Superseded avatar request/);
 assert.equal(container.children[0],winningFrame,'old renderer never replaces or erases the newer view');
 assert.deepEqual(container.children[0].children.slice(1).map(x=>x.dataset.slot),['shoes','bottom','top']);
}));

test('simultaneous avatar containers invalidate requests independently',()=>withDOM(async()=>{
 const f=fixture(),left=new Elem(),right=new Elem();
 const rendered=await Promise.all([
  renderAlphaAuthenticatedBoard(left,f.options),
  renderAlphaAuthenticatedBoard(right,f.options)
 ]);
 assert.deepEqual(rendered.map(x=>x.renderedLayers),[3,3]);
 const preserved=right.children[0];
 f.options.fetchFn=async()=>({status:401,ok:false});
 await assert.rejects(renderAlphaAuthenticatedBoard(left,f.options),/account verification/);
 assert.equal(left.children.length,0);
 assert.equal(right.children[0],preserved,'one view does not invalidate a separate mounted view');
}));
