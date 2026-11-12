// Parallel #70 opt-in unit reconciliation: decision support only, never an owner approval.
const safeBounds=b=>b&&[b.x,b.y,b.width,b.height].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&b.width>0&&b.height>0;
const supportedColor=r=>r?.color&&r.color!=='Unknown'&&Number.isFinite(r.support)&&r.support>=.75&&!r.secondaryColor;
const shoe=d=>d?.segmentHint?.categories?.includes('Shoes')===true;
const live=d=>d?.reconciliation70?.maskSha256&&/^[a-f0-9]{64}$/.test(d.reconciliation70.maskSha256)&&
 d.reconciliation70.sourceSha256&&/^[a-f0-9]{64}$/.test(d.reconciliation70.sourceSha256);
const rectOverlap=(a,b)=>{const x=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)),y=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return x*y/Math.min(a.width*a.height,b.width*b.height);};
export function canSuggestShoePair70(a,b){
 if(!shoe(a)||!shoe(b)||!live(a)||!live(b)||a.reconciliation70.sourceSha256!==b.reconciliation70.sourceSha256||
 a.reconciliation70.maskSha256===b.reconciliation70.maskSha256||a.outfitSourceId!==b.outfitSourceId||
 a.reconciliation70Status!=='unresolved'||b.reconciliation70Status!=='unresolved')return false;
 if(a.category!=='Uncategorized'&&a.category!=='Shoes'||b.category!=='Uncategorized'&&b.category!=='Shoes')return false;
 const x=a.cropBounds,y=b.cropBounds;
 if(!safeBounds(x)||!safeBounds(y)||a.segmentHint?.clipped||b.segmentHint?.clipped||rectOverlap(x,y)>.08)return false;
 const left=x.x+x.width/2,right=y.x+y.width/2,dy=Math.abs((x.y+x.height/2)-(y.y+y.height/2));
 const w=Math.max(x.width,y.width)/Math.min(x.width,y.width),h=Math.max(x.height,y.height)/Math.min(x.height,y.height);
 if(Math.abs(left-right)<Math.min(x.width,y.width)*.7||Math.abs(left-right)>.65||dy>Math.max(x.height,y.height)*.65||w>1.9||h>1.9)return false;
 const aColor=a.reconciliation70.colorEstimate,bColor=b.reconciliation70.colorEstimate;
 if(!supportedColor(aColor)||!supportedColor(bColor)||aColor.color!==bColor.color)return false;
 if(a.itemType&&b.itemType&&a.itemType!=='Unknown'&&b.itemType!=='Unknown'&&a.itemType!==b.itemType)return false;
 return true;
}
export function reconcileWardrobeUnits70(drafts,existing=[],sourceId=null){
 if(!Array.isArray(drafts)||!Array.isArray(existing))throw Error('Invalid garment units.');
 const current=drafts.filter(d=>d&&d.outfitSourceId&&(sourceId===null||d.outfitSourceId===sourceId));
 const unresolved=current.filter(d=>d.reconciliation70Status==='unresolved'&&!d.shoePair&&!d.combinedFragments70);
 const shoes=unresolved.filter(shoe),duplicates=[],pairs=[];
 const previous=[...existing,...current].filter(x=>x?.reconciliation70?.maskSha256&&x?.reconciliation70?.sourceSha256);
 for(const d of current){
  const m=d.reconciliation70;if(!m?.sourceSha256||!m?.maskSha256)continue;
  if(previous.some(x=>x!==d&&x.reconciliation70?.sourceSha256===m.sourceSha256&&x.reconciliation70?.maskSha256===m.maskSha256))duplicates.push(d.id);
 }
 const edges=new Map(shoes.map(x=>[x.id,[]]));
 for(let i=0;i<shoes.length;i++)for(let j=i+1;j<shoes.length;j++)if(canSuggestShoePair70(shoes[i],shoes[j])){
  edges.get(shoes[i].id).push(shoes[j].id);edges.get(shoes[j].id).push(shoes[i].id);
 }
 const used=new Set();
 for(const a of shoes){
  const neighbors=edges.get(a.id);
  if(neighbors.length!==1||used.has(a.id)||duplicates.includes(a.id))continue;
  const id=neighbors[0],other=shoes.find(x=>x.id===id);
  if(edges.get(id).length!==1||used.has(id)||duplicates.includes(id))continue;
  pairs.push({status:'suggested_pair',ids:[a.id,id],sourceSha256:a.reconciliation70.sourceSha256,requiresOwnerConfirmation:true});
  used.add(a.id);used.add(id);
 }
 return {suggestedPairs:pairs,unresolvedIds:unresolved.map(x=>x.id),unpairedFootwearIds:shoes.filter(x=>!used.has(x.id)).map(x=>x.id),
  suspectedDuplicateIds:[...new Set(duplicates)],statuses:current.map(x=>({id:x.id,status:x.reconciliation70Status||'independent_review'}))};
}
function verifySource70(a,b,ownerId){
 return a&&b&&a!==b&&a.outfitSourceId&&a.outfitSourceId===b.outfitSourceId&&
 a.reconciliation70?.ownerId===ownerId&&b.reconciliation70?.ownerId===ownerId&&
 a.reconciliation70.sourceSha256&&a.reconciliation70.sourceSha256===b.reconciliation70.sourceSha256&&
 a.reconciliation70.maskSha256&&b.reconciliation70.maskSha256&&a.reconciliation70.maskSha256!==b.reconciliation70.maskSha256&&
 a.reconciliation70Status==='unresolved'&&b.reconciliation70Status==='unresolved';
}
export function confirmWardrobePair70(drafts,aId,bId,ownerId,{fragments=false}={}){
 const a=drafts.find(x=>x.id===aId),b=drafts.find(x=>x.id===bId);
 if(!verifySource70(a,b,ownerId))throw Error('Source or owner mismatch. Retake the photo.');
 if(fragments){
  const categories=x=>x.segmentHint?.categories||[];
  if(shoe(a)||shoe(b)||!categories(a).some(c=>categories(b).includes(c)))throw Error('Cannot join different garment categories.');
 }else if(!shoe(a)||!shoe(b))throw Error('Both regions must be footwear.');
 const companion={image:b.image,recognitionPhoto:b.recognitionPhoto||null,cropBounds:b.cropBounds||null,
  colorEstimate:b.reconciliation70.colorEstimate||null,segmentHint:b.segmentHint||null,reconciliation70:b.reconciliation70};
 const first={...a,userAdjusted:true,requiresOwnershipConfirmation:true,localAnalyzed:true,
  reconciliation70Status:fragments?'fragments_confirmed':'paired_confirmed',
  localStatus:fragments?'Two regions combined by owner. Confirm category and color in Adjust.':'Pair confirmed by owner. Confirm type and color in Adjust.'};
 if(fragments)first.combinedFragments70={confirmedByOwner:true,componentIds:[a.id,b.id],companion};
 else first.shoePair={confirmedByOwner:true,componentIds:[a.id,b.id],companion};
 return drafts.filter(x=>x.id!==bId).map(x=>x.id===aId?first:x);
}
export function keepSeparate70(drafts,ids,ownerId){
 const selected=new Set(ids);
 if(!selected.size)throw Error('Choose at least one region.');
 for(const id of selected){const d=drafts.find(x=>x.id===id);
  if(!d||d.reconciliation70Status!=='unresolved'||d.reconciliation70?.ownerId!==ownerId)throw Error('Invalid owner review decision.');
 }
 return drafts.map(d=>selected.has(d.id)?{...d,reconciliation70Status:'separate_confirmed',requiresOwnershipConfirmation:true,
  userAdjusted:true,localStatus:'Separate wardrobe item confirmed. Check type and color in Adjust.'}:d);
}
export function unpairComponents70(drafts,id,ownerId){
 const a=drafts.find(x=>x.id===id),pair=a?.shoePair||a?.combinedFragments70;
 if(!a||!pair?.confirmedByOwner||a.reconciliation70?.ownerId!==ownerId||!pair.companion?.image)throw Error('Pair has no recoverable source.');
 return {first:{...a,shoePair:undefined,combinedFragments70:undefined,reconciliation70Status:'separate_confirmed',requiresOwnershipConfirmation:true,
  localStatus:'Regions separated. Review both items.'},companion:pair.companion};
}
export function ownerMaySaveUnit70(item,closet){
 if(item?.reconciliation70Status==='unresolved')return false;
 const m=item?.reconciliation70;if(!m?.sourceSha256||!m?.maskSha256)return !m;
 return !(closet||[]).some(x=>x.id!==item.id&&x.reconciliation70?.sourceSha256===m.sourceSha256&&
 x.reconciliation70?.maskSha256===m.maskSha256);
}
function el(doc,tag,content,klass){const node=doc.createElement(tag);if(content!==undefined&&content!==null)node.textContent=content;if(klass)node.className=klass;return node;}
export function renderUnitReview70(root,{drafts,existing,sourceId,onPair,onKeep,onDiscard,onUnpair,onCombine}){
 const doc=root.ownerDocument;root.replaceChildren();
 const scope=drafts.filter(x=>x.outfitSourceId===sourceId&&x.reconciliation70);
 if(!scope.length){root.hidden=true;return;}
 root.hidden=false;root.append(el(doc,'h4','Confirm garment groupings'),el(doc,'p','All detected regions stay unsaved until you choose and then confirm category and color in Adjust.','fine'));
 const recon=reconcileWardrobeUnits70(drafts,existing,sourceId);
 for(const suggestion of recon.suggestedPairs){
  const section=el(doc,'section',null,'unit70-proposal'),images=el(doc,'div',null,'unit70-photo-row');
  for(const id of suggestion.ids){const d=scope.find(x=>x.id===id),im=el(doc,'img');im.src=d.image;im.alt='Visible shoe region proposed for pairing';images.append(im);}
  section.append(el(doc,'p','Possible matching shoes — not confirmed. One pair would count as one wardrobe item.','fine'),images);
  const action=el(doc,'button','Confirm matching pair','secondary');action.type='button';action.onclick=()=>onPair(...suggestion.ids);
  const separate=el(doc,'button','Keep as two items','secondary');separate.type='button';separate.onclick=()=>onKeep(suggestion.ids);
  section.append(action,separate);root.append(section);
 }
 const unresolved=scope.filter(x=>x.reconciliation70Status==='unresolved');
 if(unresolved.length){
  const group=el(doc,'fieldset',null,'unit70-choices'),legend=el(doc,'legend','Choose regions to review');
  group.append(legend);
  for(const item of unresolved){
   const label=el(doc,'label',null,'unit70-choice'),check=el(doc,'input');check.type='checkbox';check.value=item.id;
   const im=el(doc,'img');im.src=item.image;im.alt='Detected '+(shoe(item)?'shoe':'garment')+' region';
   label.append(check,im,el(doc,'span',(shoe(item)?'Shoe':'Garment')+' region · '+(item.reconciliation70.colorEstimate?.color||'color uncertain')));
   group.append(label);
  }
  const selected=()=>[...group.querySelectorAll('input:checked')].map(x=>x.value);
  const keep=el(doc,'button','Keep selected as separate items','secondary');keep.type='button';keep.onclick=()=>onKeep(selected());
  const pair=el(doc,'button','Confirm selected two shoes as a pair','secondary');pair.type='button';pair.onclick=()=>{const s=selected();if(s.length===2)onPair(s[0],s[1]);};
  const combine=el(doc,'button','Combine selected garment fragments','secondary');combine.type='button';combine.onclick=()=>{const s=selected();if(s.length===2)onCombine(s[0],s[1]);};
  const discard=el(doc,'button','Discard selected false detections','secondary');discard.type='button';discard.onclick=()=>{const s=selected();if(s.length&&(!doc.defaultView?.confirm||doc.defaultView.confirm('Discard only the selected unsaved detections?')))onDiscard(s);};
  group.append(keep,pair,combine,discard);root.append(group);
 }
 for(const item of scope.filter(x=>x.shoePair?.confirmedByOwner||x.combinedFragments70?.confirmedByOwner)){
  const section=el(doc,'div',null,'unit70-confirmed');
  section.append(el(doc,'p',item.shoePair?'Pair selected: one wardrobe draft, still requires Adjust confirmation.':'Fragments combined: one draft, still requires Adjust confirmation.'));
  const im=el(doc,'img');im.src=item.shoePair?.companion?.image||item.combinedFragments70.companion.image;im.alt='Second source region retained for review';
  const split=el(doc,'button','Separate regions again','secondary');split.type='button';split.onclick=()=>onUnpair(item.id);
  section.append(im,split);root.append(section);
 }
 if(recon.suspectedDuplicateIds.length)root.append(el(doc,'p','Some masks duplicate another proposed or saved source. Compare and discard duplicates before saving.','fine'));
}