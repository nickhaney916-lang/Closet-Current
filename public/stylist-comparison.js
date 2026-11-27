'use strict';

let stylistComparisonDraft=null;

function startStylistComparison(){
 const session=ownerStylistSession();
 if(!session||!styledCollectionResults.length||!styledCollectionResultLease?.current())return;
 const results=styledCollectionResults,serial=styledCollectionRequestSerial;
 const wardrobe=new Map(items.map(item=>[item.id,item]));
 const provenance=new Map(items.map(item=>[item.id,{original:item.originalPhoto,ownerId:item.ownerId,sourceSHA256:item.sourceSHA256,originalSHA256:item.originalPhoto?.sha256,originalOwnerId:item.originalPhoto?.ownerId,originalImage:item.originalPhoto?.image,ready:stylistPieceReady(item)}]));
 const current=()=>session.ownsSession()&&styledCollectionResultLease?.current()&&results===styledCollectionResults&&
  serial===styledCollectionRequestSerial&&items.length===wardrobe.size&&
  items.every(item=>wardrobe.get(item.id)===item&&provenance.get(item.id).original===item.originalPhoto&&
   provenance.get(item.id).ownerId===item.ownerId&&provenance.get(item.id).sourceSHA256===item.sourceSHA256&&
   provenance.get(item.id).originalSHA256===item.originalPhoto?.sha256&&provenance.get(item.id).originalOwnerId===item.originalPhoto?.ownerId&&
   provenance.get(item.id).originalImage===item.originalPhoto?.image&&provenance.get(item.id).ready===stylistPieceReady(item));
 const closet=items.filter(item=>!item.ownerId||item.ownerId===session.owner);
 const choices=results.slice(0,3).filter(result=>Object.values(result.board.slots).every(id=>
  stylistPieceReady(wardrobe.get(id))&&(!wardrobe.get(id).ownerId||wardrobe.get(id).ownerId===session.owner)));
 if(!choices.length)return;
 stylistComparisonDraft={current,wardrobe,closet,choices,owner:session.owner,
  library:activeTrendLibrary,index:0,board:choices[0].board,locks:new Set(),history:[],status:'',saving:false,saved:false};
 renderStylistComparison('comparisonChoice');
}

function comparisonPieceLabel(item){
 return [item.name||item.itemType||item.category,
  item.color&&item.color!=='Unknown'?item.color:null].filter(Boolean).join(' · ');
}

function comparisonPhoto(item,owner){
 const original=item.originalPhoto;
 if(original?.ownerId&&original.ownerId!==owner)return null;
 if(item.sourceSHA256&&item.sourceSHA256!==original?.sha256)return null;
 return typeof original?.image==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/i.test(original.image)?
  original.image:null;
}

function renderStylistComparison(focusId){
 const panel=$('stylistComparison');
 const wasOpen=stylistComparisonDraft!==null;
 if(stylistComparisonDraft&&!stylistComparisonDraft.current())stylistComparisonDraft=null;
 const draft=stylistComparisonDraft;
 panel.replaceChildren();
 panel.hidden=!styledCollectionResults.length||!styledCollectionResultLease?.current();
 if(panel.hidden)return;
 const heading=node('h3','Compare and customize');
 heading.id='comparisonHeading';panel.append(heading);
 const button=(text,action,id,disabled=false)=>{
  const control=node('button',text,'secondary');
  control.id=id;control.type='button';control.disabled=disabled;control.onclick=action;
  return control;
 };
 if(!draft){
  const start=button(styledCollectionResults.length>1?'Compare outfits':'Customize outfit',
   startStylistComparison,'comparisonStart');
  panel.append(start);
  if(wasOpen){
   const notice=node('p','Your comparison expired. Create fresh outfits to continue.','fine');
   notice.setAttribute('role','status');panel.append(notice);
  }
  if(focusId===start.id)start.focus({preventScroll:true});
  return;
 }
 const result=draft.choices[draft.index];
 const availableSlots=outfitSlots.filter(slot=>draft.board.slots[slot.id]);
 const describeSlot=slot=>slot.id==='top'?'Top or dress':slot.label;
 const busy=draft.saving;
 const locked=result.focusItemId;
 const choices=node('label','Outfit to preview','comparison-choice');
 const select=node('select');select.id='comparisonChoice';select.disabled=busy;
 for(let i=0;i<draft.choices.length;i++)select.add(new Option(result.context.request+' · option '+(i+1),String(i)));
 select.value=String(draft.index);
 select.onchange=()=>{
  if(!draft.current()||draft.saving)return renderStylistComparison();
  draft.index=Number(select.value);
  draft.board=draft.choices[draft.index].board;
  draft.locks.clear();draft.history=[];draft.saved=false;draft.status='';
  renderStylistComparison('comparisonChoice');
 };
 choices.append(select);panel.append(choices);
 panel.append(node('p',[result.context.season,result.context.audience==='All'?'All styles':result.context.audience+'’s styles',
  result.context.weather?'Manual weather':null].filter(Boolean).join(' · '),'fine'));
 const baseline=draft.choices[0].board.slots;
 const differences=outfitSlots.filter(slot=>baseline[slot.id]!==draft.board.slots[slot.id]).map(describeSlot);
 if(draft.choices.length>1||differences.length){
  panel.append(node('p',differences.length?'Differs from option 1 in '+differences.join(', ')+'.':
   'Same pieces as option 1.','fine'));
 }
 const missing=boardGaps(draft.board,draft.closet).filter(slot=>!slot.optional).map(describeSlot);
 if(missing.length)panel.append(node('p','Still needed: '+missing.join(', ')+'.','fine'));

 const list=node('ul',null,'comparison-pieces');
 for(const slot of availableSlots){
  const item=draft.wardrobe.get(draft.board.slots[slot.id]);
  const entry=node('li',null,'comparison-piece');
  const photo=comparisonPhoto(item,draft.owner);
  const label=comparisonPieceLabel(item);
  entry.append(node('strong',describeSlot(slot)),node('span',label));
  if(photo){
   const img=node('img');
   img.alt='Original photo of '+label;img.loading='lazy';img.src=photo;entry.append(img);
  }else entry.append(node('span','Original photo unavailable','fine'));
  const actions=node('div',null,'actions');
  const focused=item.id===locked,kept=focused||draft.locks.has(slot.id);
  const keep=button(focused?'Focus piece kept':'Keep '+describeSlot(slot),()=>{
   if(!draft.current()||draft.saving)return renderStylistComparison();
   if(kept)draft.locks.delete(slot.id);else draft.locks.add(slot.id);
   renderStylistComparison('comparisonKeep-'+slot.id);
  },'comparisonKeep-'+slot.id,busy||focused);
  keep.setAttribute('aria-pressed',String(kept));
  const swap=button('Swap '+describeSlot(slot),()=>{
   if(!draft.current()||draft.saving||draft.locks.has(slot.id))return renderStylistComparison();
   const tried=new Set(draft.history.map(board=>board.slots[slot.id]));
   const next=stylistOwnedSubstitute(draft.closet,draft.board,slot.id,
    {...result.context,focusItemId:locked},draft.library,tried);
   if(next){
    draft.history.push(draft.board);draft.board=next;draft.saved=false;
    draft.status='Swapped '+describeSlot(slot).toLowerCase()+' for '+comparisonPieceLabel(draft.wardrobe.get(next.slots[slot.id]))+'.';
   }else draft.status='No other available owned piece fits this slot and styling request. Your look is unchanged.';
   renderStylistComparison('comparisonSwap-'+slot.id);
  },'comparisonSwap-'+slot.id,busy||kept);
  actions.append(keep,swap);entry.append(actions);list.append(entry);
 }
 panel.append(list);
 const actions=node('div',null,'actions');
 actions.append(
  button('Undo swap',()=>{
   if(!draft.current()||draft.saving||!draft.history.length)return renderStylistComparison();
   const previous=draft.history.at(-1);
   const changed=availableSlots.find(slot=>draft.board.slots[slot.id]!==previous.slots[slot.id]);
   draft.board=draft.history.pop();draft.saved=false;draft.status='Last swap undone.';
   renderStylistComparison(draft.history.length?'comparisonUndo':'comparisonSwap-'+changed?.id);
  },'comparisonUndo',busy||!draft.history.length),
  button('Cancel comparison',()=>{
   stylistComparisonDraft=null;renderStylistComparison('comparisonStart');
  },'comparisonCancel',busy),
  button(draft.saved?'Saved as new outfit':'Save as new outfit',async()=>{
   if(!draft.current()||draft.saving||draft.saved)return renderStylistComparison();
   const assertCurrent=()=>{
    if(stylistComparisonDraft!==draft||!draft.current())throw outfitWardrobeChanged();
   };
   draft.saving=true;draft.status='Saving outfit…';renderStylistComparison();
   try{
    await outfitBoardReady;
    assertCurrent();
    const board={...draft.board,name:result.context.request+' · option '+(draft.index+1)};
    await saveOwnedOutfit(board,{comparison:{assertCurrent,ids:new Set(draft.wardrobe.keys())}});
    if(stylistComparisonDraft!==draft||!draft.current())return;
    draft.saved=true;draft.status='Saved. Find it in Outfit Builder → Saved outfits.';
    renderSavedOutfitBoards();
   }catch(error){
    if(stylistComparisonDraft!==draft)return;
    draft.status=error?.code==='OUTFIT_WARDROBE_CHANGED'?
     'Your wardrobe changed. Refresh My Closet and create outfits again.':
     (error?.message==='You can save up to 50 outfits.'?error.message:'Could not save this outfit. Try again.');
   }finally{
    if(stylistComparisonDraft===draft){
     draft.saving=false;renderStylistComparison(draft.saved?'comparisonCancel':'comparisonSave');
    }
   }
  },'comparisonSave',busy||draft.saved)
 );
 panel.append(actions);
 const status=node('p',draft.status,'fine');status.setAttribute('role','status');panel.append(status);
 if(focusId)$(focusId)?.focus({preventScroll:true});
}
