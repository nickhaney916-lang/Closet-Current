/**
 * E2E-INTEGRATION-01 isolated opt-in research adapter:
 * PR #545 ACTUAL app + PR #541 pinned verified 3D module from a read-only
 * donor checkout. Nothing ships in dist, nothing overrides production auth.
 *
 * Requires auth.getSessionGeneration(). The current PR #545 PUBLIC auth has
 * no such API: fail closed. CI's explicit fixture-auth implementation supplies
 * a proper monotonic generation and executes logout/cross-account invalidation.
 */
import {suggestThreeOwnedOutfits,applyOwnedCombination} from './three-owned-looks.mjs';
export const DONOR_PR541_SHA='df6885d6011cb33fb22dceb81a08f35a0ac4dd61';
export const CAPTURE_PR545_SHA='dbc3a75e508d006d6d87ffce69832246c2087890';
export const DENIM_PR544_SHA='eaccc4d7f945e2ea5af746f9486c5cccf03047e0';
export function diagnoseLiveIntegration(auth=globalThis.window?.closetAuth){
 const epoch=typeof auth?.getSessionGeneration==='function';
 const owner=typeof auth?.user?.id==='string'&&auth.user.id.length>0;
 return Object.freeze({accountOwnerPresent:owner,sessionEpochContract:epoch,
  captureSourceProofContract:'CAPTURE-PROOF-01 actual SHA256 originalPhoto.image',
  indexResearch:'INDEX-02/04 separate opt-in source gate',
  outfit3DDonor:DONOR_PR541_SHA,denimVisualAuditor:DENIM_PR544_SHA,
  status:!epoch?'HOLD: authenticated session generation contract missing':!owner?'HOLD: sign in required':'research-adapter-compatible',
  productionReady:false,physicalPhonesApproved:false,familyAlpha:'HOLD'});
}
export async function mountE2EIntegration01({doc=document,auth=window.closetAuth}={}){
 const contract=diagnoseLiveIntegration(auth);
 if(contract.status!=='research-adapter-compatible')
  throw Error(contract.status);
 if(!doc.getElementById('closet')||!doc.getElementById('scan'))
  throw Error('Existing Closet Current Add Clothes and My Closet must be mounted');
 if(!window.location.search.includes('captureProof01=after')||
   !window.location.search.includes('index04=after'))
  throw Error('Research requires actual CAPTURE-PROOF-01 plus INDEX-04');
 const donor=await import('/donor/research/outfit-3d-01/research-panel.mjs');
 const ui=await donor.mountOutfit3D01Research({doc,auth});
 const control=ui.controller;
 const body=doc.querySelector('#outfit3D01Dialog .cc3d-body section');
 if(!body)throw Error('Original 3D research UI changed');
 const group=doc.createElement('section');group.id='e2e01Suggestions';
 group.setAttribute('aria-label','Three saved-closet outfit ideas');
 const heading=doc.createElement('h3');heading.textContent='Three looks with your saved item';
 const source=doc.createElement('select');source.id='e2e01Pinned';
 source.setAttribute('aria-label','Choose new saved clothing item');
 const generate=doc.createElement('button');generate.id='e2e01Generate';generate.type='button';
 generate.textContent='Generate 3 owned outfits';
 const choose=doc.createElement('select');choose.id='e2e01Choice';
 choose.setAttribute('aria-label','Choose suggested owned outfit');
 const apply=doc.createElement('button');apply.id='e2e01Apply';apply.type='button';
 apply.textContent='Preview selected outfit on figure';
 const status=doc.createElement('p');status.id='e2e01Status';status.setAttribute('role','status');
 status.textContent='Suggestions only use confirmed clothing saved to this account.';
 group.append(heading,source,generate,choose,apply,status);
 body.prepend(group);
 let suggestions=null,current=null,serial=0;
 const lease=()=>{
  const ownerId=auth?.user?.id,generation=auth?.getSessionGeneration?.();
  if(!ownerId||!Number.isSafeInteger(generation)||generation<0)
   throw Error('Authenticated session expired');
  return {ownerId,generation};
 };
 function ensure(){
  const now=lease();
  if(!current||now.ownerId!==current.ownerId||now.generation!==current.generation)
   throw Error('Owner changed; private suggestions invalidated');
  return now;
 }
 async function refresh(){
  suggestions=null;choose.replaceChildren();
  const started=lease(),proof=await control.refresh(),after=lease();
  if(started.ownerId!==after.ownerId||started.generation!==after.generation)
   throw Error('Owner changed during saved closet review');
  current=after;source.replaceChildren();
  const byId=new Map();
  for(const slot of ['top','bottom','shoes','layer','layer2','layer3','bag','accessory','finish']){
   for(const row of control.available(slot))if(!byId.has(row.id))byId.set(row.id,row);
  }
  for(const item of [...byId.values()].sort((a,b)=>a.id.localeCompare(b.id))){
   const opt=doc.createElement('option');opt.value=item.id;
   opt.textContent=control.labelFor(item.id)+' · '+item.itemType;
   source.append(opt);
  }
  status.textContent=proof.verifiedSavedPieces+' verified saved garment(s) in this authenticated account.';
  return Object.freeze({...proof,availableIdCount:byId.size});
 }
 async function suggest(pinnedId=source.value){
  ensure();suggestions=suggestThreeOwnedOutfits(control,{pinnedId});
  choose.replaceChildren();
  for(const [i,proposal]of suggestions.combinations.entries()){
   const opt=doc.createElement('option');opt.value=String(i);
   opt.textContent=proposal.name+' · '+Object.keys(proposal.slots).join(', ');
   choose.append(opt);
  }
  status.textContent=suggestions.status==='three-owned-outfits'
   ?'Three distinct combinations of real saved garments. Choose one to preview.'
   :suggestions.reason;
  return suggestions;
 }
 async function preview(index=Number(choose.value)){
  ensure();
  if(!suggestions?.combinations?.[index])throw Error('No verified proposed outfit');
  const proposal=suggestions.combinations[index];
  const before=lease(),plan=await applyOwnedCombination(control,proposal);
  const after=lease();
  if(before.ownerId!==after.ownerId||before.generation!==after.generation)
   throw Error('Owner changed during suggested look preview');
  // Reuse the genuine donor panel's preexisting update/render path, rather
  // than replacing its anatomical viewer with a mocked drawing.
  const picker=doc.getElementById('outfit3D01Slot-top');
  picker.value=proposal.slots.top;
  picker.dispatchEvent(new Event('change',{bubbles:true}));
  status.textContent='Previewed real owned garment IDs; use Save outfit to persist.';
  return plan;
 }
 const task=fn=>async()=>{
  const token=++serial;
  try{await fn();if(token!==serial)return;}
  catch(e){if(token===serial)status.textContent=String(e.message||e);}
 };
 generate.onclick=task(()=>suggest(source.value));
 apply.onclick=task(()=>preview(Number(choose.value)));
 const onPrivate=()=>{
  serial++;suggestions=null;current=null;source.replaceChildren();choose.replaceChildren();
  status.textContent='Session changed. Private outfit suggestions cleared.';
 };
 window.addEventListener('closet:alpha-session-changed',onPrivate);
 window.addEventListener('pagehide',onPrivate);
 return Object.freeze({ui,controller:control,refresh,suggest,preview,
  get state(){return {contract,ownerId:current?.ownerId||null,
   available:source.options.length,suggestions:suggestions?.combinations?.length||0,
   decision:suggestions?.status||null,privateOwnerStable:!!current&&current.ownerId===auth.user?.id&&
    current.generation===auth.getSessionGeneration(),productionReady:false};},
  destroy(){onPrivate();ui.destroy();group.remove();
   window.removeEventListener('closet:alpha-session-changed',onPrivate);
   window.removeEventListener('pagehide',onPrivate);}
 });
}
