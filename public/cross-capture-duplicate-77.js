'use strict';
/* Parallel #77: review-only cross-capture identity research. OFF by default.
 * Scores are retrieval hints, NEVER physical-item identity or authority to save.
 * No network, persistence, automatic merge, delete, or owner-decision transfer. */
(function(root){
 const VERSION='cross-capture77-v1', SHA=/^[a-f0-9]{64}$/, JPEG=/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;
 const MAX_BYTES=8*1024*1024, MAX_SCAN=1200, MAX_K=3;
 const sessions=new WeakSet(), proposals=new WeakMap();
 const fail=(message)=>{throw Error('P77_'+message);};
 function open({ownerId,sessionId,live,hasOwned,hasDraft}={}){
  if(typeof ownerId!=='string'||!ownerId||typeof sessionId!=='string'||sessionId.length<8||typeof live!=='function'||
   (hasOwned!==undefined&&typeof hasOwned!=='function')||(hasDraft!==undefined&&typeof hasDraft!=='function'))fail('SCOPE_REQUIRED');
  const scope={ownerId,sessionId,live,hasOwned,hasDraft,active:true};sessions.add(scope);return scope;
 }
 function close(scope){if(sessions.has(scope))scope.active=false;}
 function valid(scope){try{return !!(sessions.has(scope)&&scope.active&&scope.live()===scope.ownerId);}catch{return false;}}
 async function sha(bytes){
  if(!root.crypto?.subtle)fail('CRYPTO_UNAVAILABLE');
  const d=await root.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
 }
 const textHash=str=>sha(new TextEncoder().encode(str));
 function jpegBytes(value){
  if(typeof value!=='string'||value.length>MAX_BYTES*1.5)fail('JPEG_REQUIRED');
  const match=JPEG.exec(value);if(!match)fail('JPEG_REQUIRED');
  const binary=root.atob(match[1]);
  if(!binary.length||binary.length>MAX_BYTES||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216)fail('JPEG_REQUIRED');
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
 }
 const original=item=>item?.originalPhoto?.image||item?.recognitionPhoto?.image||item?.image;
 function unitIdentity(item){
  return item?.reconciliation70?{
   sourceSha256:item.reconciliation70.sourceSha256||null,
   maskSha256:item.reconciliation70.maskSha256||null,
   status:item.reconciliation70Status||null,
   companionMask:item.shoePair?.companion?.reconciliation70?.maskSha256||
    item.combinedFragments70?.companion?.reconciliation70?.maskSha256||null
  }:null;
 }
 async function evidence(item,scope){
  if(!valid(scope)||!item||typeof item.id!=='string'||!item.id||item.ownerId&&item.ownerId!==scope.ownerId)fail('OWNER_OR_ITEM_CHANGED');
  // No file-name, photo contents, or account identifier ever enters a shortlist.
  const before=JSON.stringify(item);
  const photo=jpegBytes(original(item));
  const [sourceSha256,cropSha256,maskSha256,revisionSha256]=await Promise.all([
   sha(photo),textHash(String(item.image||'')),textHash(JSON.stringify(item.segmentHint||null)),
   textHash(before)
  ]);
  if(!valid(scope)||JSON.stringify(item)!==before)fail('STALE_SOURCE');
  return Object.freeze({ownerId:scope.ownerId,sessionId:scope.sessionId,
   itemId:item.id,sourceSha256,cropSha256,maskSha256,revisionSha256,
   unit:unitIdentity(item),sourceVersion:VERSION});
 }
 function normFeatures(memory){
  const f=memory?.features;
  if(typeof memory?.modelKey!=='string'||!Array.isArray(f)||f.length!==512)return null;
  let sum=0;
  for(const v of f){if(typeof v!=='number'||!Number.isFinite(v))return null;sum+=v*v;}
  return sum>.0001?{modelKey:memory.modelKey,values:f,norm:Math.sqrt(sum)}:null;
 }
 function cosine(a,b){
  if(!a||!b||a.modelKey!==b.modelKey)return null;
  let dot=0;for(let i=0;i<512;i++)dot+=a.values[i]*b.values[i];
  return dot/a.norm/b.norm;
 }
 function baseline(a,b){
  if(!Array.isArray(a?.visualSignature)||!Array.isArray(b?.visualSignature)||
   a.visualSignature.length!==768||b.visualSignature.length!==768||
   !Number.isFinite(a.visualAspect)||!Number.isFinite(b.visualAspect)||
   Math.abs(a.visualAspect-b.visualAspect)>=.02)return false;
  let total=0;for(let i=0;i<768;i++)total+=Math.abs(a.visualSignature[i]-b.visualSignature[i]);
  return total/768<=2.5;
 }
 // Bounded raster descriptor. Callers decode at most k candidates, not an entire closet.
 // Local contrast ordering withstands uniform exposure changes better than RGB.
 function describe(pixels,width,height){
  if(width!==64||height!==64||pixels?.length!==64*64*4)fail('BOUNDED_PIXELS_REQUIRED');
  const gray=new Float32Array(4096);let avg=0,min=255,max=0;
  for(let i=0;i<4096;i++){
   const x=i*4,y=.2126*pixels[x]+.7152*pixels[x+1]+.0722*pixels[x+2];
   gray[i]=y;avg+=y;min=Math.min(min,y);max=Math.max(max,y);
  }
  avg/=4096;if(max-min<9)return null; // flat/background-only/low information: abstain
  const cells=[];
  for(let by=0;by<4;by++)for(let bx=0;bx<4;bx++){
   let value=0;for(let y=0;y<16;y++)for(let x=0;x<16;x++)value+=gray[(by*16+y)*64+bx*16+x];
   cells.push(Math.round(255*(value/256-min)/(max-min)));
  }
  const edge=[];
  for(let by=0;by<4;by++)for(let bx=0;bx<4;bx++){
   let gradients=0;for(let y=0;y<16;y+=2)for(let x=0;x<16;x+=2){
    const px=bx*16+x,py=by*16+y;
    gradients+=Math.abs(gray[py*64+Math.min(px+1,63)]-gray[py*64+px])+
     Math.abs(gray[Math.min(py+1,63)*64+px]-gray[py*64+px]);
   }
   edge.push(Math.round(Math.min(255,gradients/64)));
  }
  return Object.freeze({version:1,cells,edge,contrast:Math.round(max-min)});
 }
 function structural(a,b){
  if(a?.version!==1||b?.version!==1||a.cells?.length!==16||b.cells?.length!==16||
   a.edge?.length!==16||b.edge?.length!==16)return null;
  let order=0,edges=0;
  for(let i=0;i<16;i++){order+=Math.abs(a.cells[i]-b.cells[i]);edges+=Math.abs(a.edge[i]-b.edge[i]);}
  return Math.max(0,1- .8*order/(16*255)-.2*edges/(16*255));
 }
 function candidateRank(incoming,closet,{maxScan=MAX_SCAN,topK=MAX_K}={}){
  if(!Array.isArray(closet)||closet.length>maxScan||maxScan>MAX_SCAN||topK>MAX_K||topK<1)fail('UNBOUNDED_INDEX');
  const embedding=normFeatures(incoming?.recognitionMemory),out=[],seen=new Set();
  for(const saved of closet){
   if(!saved||typeof saved.id!=='string')continue;
   if(seen.has(saved.id))fail('AMBIGUOUS_WARDROBE_ID');
   seen.add(saved.id);
   if(saved.id===incoming?.id)continue;
   // Same capture's multiple masks must remain under #70, never cross-capture link.
   if(incoming?.outfitSourceId&&incoming.outfitSourceId===saved.outfitSourceId)continue;
   if(incoming?.category&&saved.category&&incoming.category!=='Uncategorized'&&saved.category!=='Uncategorized'&&incoming.category!==saved.category)continue;
   const sim=cosine(embedding,normFeatures(saved.recognitionMemory));
   const old=baseline(incoming,saved);
   const shape=structural(incoming.duplicateDescriptor77,saved.duplicateDescriptor77);
   const range=signature=>Array.isArray(signature)&&signature.length===768?
    Math.max(...signature)-Math.min(...signature):0;
   // Flat/featureless RGB matches are cheap but unsafe. A contrary compatible
   // embedding also suppresses RGB-only matching (lookalike clothes).
   const supportedLegacy=old&&sim===null&&range(incoming.visualSignature)>=12&&range(saved.visualSignature)>=12;
   if(!(sim!==null&&sim>=.88)&&!supportedLegacy&&!(shape!==null&&shape>=.90))continue;
   const score=Math.max(sim!==null&&sim>=.88?sim:0,supportedLegacy?.87:0,
    shape!==null&&shape>=.90?shape*.95:0);
   out.push({id:saved.id,score:Number(score.toFixed(5)),
    signal:sim!==null&&sim>=.88?'same-model-embedding':shape!==null&&shape>=.90?'structural':'legacy-rgb-review-only'});
  }
  out.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return {scanned:closet.length,top:out.slice(0,topK),totalCandidates:out.length,abstained:out.length===0,
   evidenceType:'unverified-shortlist-not-physical-identity'};
 }
 async function propose(incoming,closet,scope,{topK=MAX_K}={}){
  if(!valid(scope))fail('OWNER_CHANGED');
  if(!Array.isArray(closet)||closet.length>MAX_SCAN)fail('UNBOUNDED_INDEX');
  // The pure ranker has no authority over account ownership. Restrict records
  // BEFORE ranking/top-k so foreign scores cannot displace a real owned match.
  const ownedCloset=closet.filter(x=>x&&!x.ownerId||x?.ownerId===scope.ownerId);
  if(scope.hasDraft&&scope.hasDraft(incoming)!==true)fail('STALE_SOURCE');
  const snapshot=await evidence(incoming,scope),rank=candidateRank(incoming,ownedCloset,{topK});
  const found=[];
  for(const row of rank.top){
   if(!valid(scope))fail('OWNER_CHANGED');
   const target=ownedCloset.find(x=>x.id===row.id);
   if(!target||(scope.hasOwned&&scope.hasOwned(target)!==true))continue;
   let proof;try{proof=await evidence(target,scope);}catch{continue;}
   if(proof.sourceSha256===snapshot.sourceSha256 &&
      proof.maskSha256!==snapshot.maskSha256)continue; // distinct regions of one outfit
   found.push({item:target,proof,score:row.score,signal:row.signal,
    exactSameSource:proof.sourceSha256===snapshot.sourceSha256});
  }
  if(!valid(scope)||(scope.hasDraft&&scope.hasDraft(incoming)!==true)||
   (await evidence(incoming,scope)).revisionSha256!==snapshot.revisionSha256)fail('STALE_SOURCE');
  const proposal=Object.freeze({kind:'cross-capture-review',version:1,
   incomingId:incoming.id,candidates:found.map(x=>({id:x.item.id,score:x.score,signal:x.signal,
    exactSameSource:x.exactSameSource})),abstained:found.length===0,scanned:rank.scanned});
  proposals.set(proposal,{scope,incoming,snapshot,found,used:false});
  return proposal;
 }
 async function decide(proposal,scope,{action,candidateId,acknowledged=false}={}){
  const state=proposals.get(proposal);
  if(!state||state.used||state.scope!==scope||!valid(scope))fail('STALE_PROPOSAL');
  if(!['same-pending','different','later','remove-unsaved'].includes(action))fail('INVALID_ACTION');
  const selected=state.found.find(x=>x.item.id===candidateId);
  if(!selected||!acknowledged)fail('EXPLICIT_ITEM_ACK_REQUIRED');
  if((scope.hasOwned&&scope.hasOwned(selected.item)!==true)||
   (scope.hasDraft&&scope.hasDraft(state.incoming)!==true))fail('STALE_PROPOSAL');
  const now=await evidence(state.incoming,scope),targetNow=await evidence(selected.item,scope);
  if(now.revisionSha256!==state.snapshot.revisionSha256||
   targetNow.revisionSha256!==selected.proof.revisionSha256||!valid(scope)||
   (scope.hasOwned&&scope.hasOwned(selected.item)!==true)||
   (scope.hasDraft&&scope.hasDraft(state.incoming)!==true))fail('STALE_PROPOSAL');
  state.used=true;
  // Intent is ephemeral. In particular 'same-pending' MUST NOT write any record:
  // cross-tab owner-locked atomic alternate-view persistence is not yet proven.
  return Object.freeze({version:1,action,candidateItemId:selected.item.id,
   sourceVersion:VERSION,incomingItemId:state.incoming.id,incomingSourceSha256:now.sourceSha256,
   incomingRevisionSha256:now.revisionSha256,incomingCropSha256:now.cropSha256,
   candidateSourceSha256:targetNow.sourceSha256,candidateRevisionSha256:targetNow.revisionSha256,
   ownerId:scope.ownerId,sessionId:scope.sessionId,maskSha256:now.maskSha256,
   linked:false,persisted:false,needsAtomicAdapter:action==='same-pending'});
 }
 function render(rootElement,proposal,{scope,onDecision}={}){
  const state=proposals.get(proposal);
  if(!rootElement||!state||state.scope!==scope||!valid(scope))return false;
  const doc=rootElement.ownerDocument;
  rootElement.replaceChildren();if(!state.found.length){rootElement.hidden=true;return true;}
  rootElement.hidden=false;
  function el(tag,title){const n=doc.createElement(tag);if(title)n.textContent=title;return n;}
  rootElement.append(el('h3','Possible previously owned garment'),
   el('p','Similarity is only a suggestion. Compare each original photo; no clothing is merged automatically.'));
  for(const found of state.found){
   const section=el('section'),images=el('div'),first=el('img'),second=el('img');
   images.className='unit70-photo-row';first.src=original(state.incoming);first.alt='New unsaved original clothing photograph';
   second.src=original(found.item);second.alt='Existing owned original item: '+(found.item.name||'Closet piece');
   images.append(first,second);
   const name=el('p','Existing owned item: '+(found.item.name||'Closet piece'));
   const check=el('input');check.type='checkbox';check.setAttribute('aria-label','I compared both photos and identified '+(found.item.name||'this owned item'));
   const label=el('label');label.append(check,doc.createTextNode(' I compared both original photographs and identified this specific owned item.'));
   const note=el('p');note.setAttribute('role','status');
   section.append(name,images,label);
   for(const [action,title] of [['same-pending','Same owned garment — request extra view'],
    ['different','Different garment — keep both'],['later','Review later'],
    ['remove-unsaved','Remove unsaved photo']]){
    const button=el('button',title);button.type='button';button.className='secondary';
    button.onclick=async()=>{
     button.disabled=true;
     try{const receipt=await decide(proposal,scope,{action,candidateId:found.item.id,acknowledged:check.checked});
      note.textContent=action==='same-pending'?
       'Extra-view link is NOT saved. Keep this draft until safe atomic storage is available.':
       action==='different'?'Different item selected. Normal photo and category approval is still required.':
       action==='later'?'Review deferred. New photo remains unsaved.':
       'Remove was requested; only the existing owner-controlled draft removal may perform it.';
      if(onDecision)await onDecision(receipt);
     }catch{button.disabled=false;note.textContent='Decision not accepted. Recheck the photos, source and signed-in account.';}
    };
    section.append(button);
   }
   section.append(note);rootElement.append(section);
  }
  return true;
 }
 const api={VERSION,open,close,valid,evidence,describe,structural,baseline,candidateRank,propose,decide,render};
 root.CrossCaptureDuplicate77=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
