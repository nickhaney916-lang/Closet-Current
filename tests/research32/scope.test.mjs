import {test} from 'node:test';import assert from 'node:assert/strict';
import {renderApprovedFit} from '../../research/family-alpha-32/approved-fit.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment} from '../../public/family-alpha-2d-saved-board.mjs';
const owner='a1111111-1111-4111-8111-111111111111';
const jpg='data:image/jpeg;base64,'+Buffer.from([255,216,...new Array(60).fill(0),255,217]).toString('base64');
const png='data:image/png;base64,c3ludGhldGlj';
const hash=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
async function fixture(){
 let epoch=1,clears=0;const container={replaceChildren(...x){this.children=x;clears++;},children:[]};
 const item={id:'test',ownerId:owner,category:'Tops',originalPhoto:{image:jpg},image:jpg};
 const sourceVersion=await fingerprintAlphaRetainedOriginal(jpg),sourceIdentity=identityForSavedGarment(item);
 const presentation={itemId:'test',ownerId:owner,approved:true,humanPreviewConfirmed:true,sourcePixelAuditPassed:true,sourceVersion,sourceIdentity,image:{src:png,complete:true,naturalWidth:240,naturalHeight:280}};
 const annotation={itemId:'test',ownerId:owner,reviewed:true,sourceIdentity,sourceVersion,pngHash:await hash(png),fit:{anchors:{pair:[{x:70,y:40},{x:170,y:40}]},target:[{x:125,y:140},{x:235,y:140}]}};
 const getContext=()=>({authenticatedUserId:owner,currentUserId:owner,cloudOwnerId:owner,indexedDbName:'closet-current-user-'+owner,sessionGeneration:epoch});
 const document={createElement:()=>({getContext:()=>({drawImage(){}})})},events=new EventTarget();
 return {container,item,presentation,annotation,getContext,document,sessionTarget:events,bump(){epoch++;}};
}
test('stale original/photo context, foreign owner and changed PNG annotations reject before drawing',async()=>{for(const key of ['sourceVersion','ownerId','sourceIdentity','pngHash']){const f=await fixture();f.annotation[key]='invalid';await assert.rejects(renderApprovedFit(f.container,f));assert.equal(f.container.children.length,0);}});
test('logout/session signal and explicit abort immediately remove experimental private pixels',async()=>{const f=await fixture(),controller=new AbortController();await renderApprovedFit(f.container,{...f,signal:controller.signal});assert.equal(f.container.children.length,1);controller.abort();assert.equal(f.container.children.length,0);await renderApprovedFit(f.container,f);f.sessionTarget.dispatchEvent(new Event('closet:alpha-session-changed'));assert.equal(f.container.children.length,0);});
test('account changes during asynchronous source hashing reject the pending fit',async()=>{const f=await fixture();let called=false;const cryptoProvider={subtle:{digest:async(...args)=>{if(!called){called=true;f.bump();}return crypto.subtle.digest(...args);}}};await assert.rejects(renderApprovedFit(f.container,{...f,cryptoProvider}));assert.equal(f.container.children.length,0);});
test('review-required scale does not display deformed pixels',async()=>{const f=await fixture();f.annotation.fit.target=[{x:1,y:140},{x:359,y:140}];const r=await renderApprovedFit(f.container,f);assert.equal(r.displayed,false);assert.equal(r.plan.mode,'approved-preview');assert.equal(f.container.children.length,0);});
