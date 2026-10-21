'use strict';
let inspirationLooks=[],lookPieces=[],lookImage='',activeLookId=null;
// Preview JPEG belongs to inspiration; original File exists in memory only for
// explicit single-item Add to Closet. Never persist original private bytes as a look.
let lookOriginalFile=null,lookOriginalOwner=null,lookPhotoSelection=0,lookTransferBusy=false;
function clearLookOriginal(){lookPhotoSelection++;lookOriginalFile=null;lookOriginalOwner=null;$('referenceToCloset').hidden=true;}

function trendSelect(body,label,value,options,change){const wrapper=node('label',label),select=node('select');for(const option of options)select.append(node('option',option));select.value=options.includes(value)?value:options[0];select.onchange=()=>change(select.value);wrapper.append(select);body.append(wrapper);return select;}
function renderLookPieces(){
 const grid=$('lookPieces');grid.replaceChildren();
 if(!lookPieces.length)empty(grid,'What makes up this look?','Describe one piece per line, then tap Find the pieces.');
 for(const component of lookPieces){const card=node('article',null,'look-piece'),label=node('input');label.value=component.label;label.maxLength=120;label.setAttribute('aria-label','Piece description');label.oninput=()=>{component.label=label.value;};card.append(label);
 trendSelect(card,'Category',component.category,categories,value=>{component.category=value;component.itemType='Unknown';renderLookPieces();});
 trendSelect(card,'Item type',component.itemType,['Unknown',...(clothingSchema.types[component.category]||[])],value=>{component.itemType=value;});
 const color=field(card,'Color',component.color);color.oninput=()=>component.color=color.value;
 trendSelect(card,'Sleeves',component.sleeveLength,clothingSchema.sleeve,value=>component.sleeveLength=value);
 trendSelect(card,'Pattern',component.pattern,clothingSchema.pattern,value=>component.pattern=value);
 trendSelect(card,'Fit',component.fit||'Unknown',clothingSchema.fit,value=>component.fit=value);
 const remove=node('button','Remove piece','secondary');remove.type='button';remove.onclick=()=>{lookPieces=lookPieces.filter(x=>x.id!==component.id);renderLookPieces();};card.append(remove);grid.append(card);
 }
}
function currentLook(){return {id:activeLookId||crypto.randomUUID(),title:$('lookTitle').value.trim().slice(0,120)||'My inspiration look',sourceUrl:safeInspirationUrl($('lookUrl').value),description:$('lookDescription').value.slice(0,2000),image:lookImage,season:$('lookSeason').value,size:$('shopSize').value.slice(0,40),budget:Math.max(0,Math.min(10000,Number($('shopBudget').value)||0)),pieces:structuredClone(lookPieces)};}
function validLook(value){
 if(!value||typeof value.id!=='string'||!Array.isArray(value.pieces)||value.pieces.length>12)throw Error('Invalid inspiration look.');
 const image=typeof value.image==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value.image)&&value.image.length<3000000?value.image:'';
 return {id:value.id.slice(0,100),title:String(value.title||'My inspiration look').slice(0,120),sourceUrl:safeInspirationUrl(value.sourceUrl),description:String(value.description||'').slice(0,2000),image,season:clothingSchema.seasons.includes(value.season)?value.season:'',size:String(value.size||'').slice(0,40),budget:Math.max(0,Math.min(10000,Number(value.budget)||0)),pieces:value.pieces.map(p=>({id:typeof p.id==='string'?p.id.slice(0,100):crypto.randomUUID(),label:String(p.label||'Clothing piece').slice(0,120),category:categories.includes(p.category)?p.category:'Uncategorized',itemType:clothingSchema.types[p.category]?.includes(p.itemType)?p.itemType:'Unknown',color:String(p.color||'').slice(0,120),sleeveLength:clothingSchema.sleeve.includes(p.sleeveLength)?p.sleeveLength:'Unknown',pattern:clothingSchema.pattern.includes(p.pattern)?p.pattern:'Unknown',fit:clothingSchema.fit.includes(p.fit)?p.fit:'Unknown'}))};
}
function storeLooks(looks){if(!db)return Promise.reject(Error('Browser storage is unavailable.'));return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'looks',looks});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));}
async function importLooks(values){if(!Array.isArray(values)||values.length>100)throw Error('Invalid inspiration backup.');const merged=new Map(inspirationLooks.map(x=>[x.id,x]));for(const value of values){const look=validLook(value);merged.set(look.id,look);}const looks=[...merged.values()];await storeLooks(looks);inspirationLooks=looks;renderSavedLooks();}
function loadLook(look){clearLookOriginal();activeLookId=look.id;$('lookTitle').value=look.title;$('lookUrl').value=look.sourceUrl;$('lookDescription').value=look.description;$('lookSeason').value=look.season;$('shopSize').value=look.size;$('shopBudget').value=look.budget||'';lookPieces=structuredClone(look.pieces);lookImage=look.image;$('inspirationPreview').src=lookImage;$('inspirationPreview').hidden=!lookImage;$('referenceToCloset').hidden=!lookImage;renderLookPieces();renderTrendMatches();}
function renderSavedLooks(){
 const grid=$('savedLooks');grid.replaceChildren();
 if(!inspirationLooks.length){grid.append(node('p','Save a look to build your inspiration collection.'));return;}
 for(const look of inspirationLooks){const card=node('article',null,'saved-look');if(look.image){const im=node('img');im.src=look.image;im.alt=look.title;card.append(im);}card.append(node('h3',look.title),node('p',`${look.pieces.length} pieces${look.season?' · '+look.season:''}`));if(look.sourceUrl){const link=node('a','Open inspiration source','textlink');link.href=look.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}const actions=node('div',null,'actions'),open=node('button','Recreate this look','secondary'),remove=node('button','Delete','secondary');open.onclick=()=>{loadLook(look);$('trendResults').scrollIntoView({behavior:'smooth',block:'start'});};remove.onclick=async()=>{if(!confirm('Delete this saved inspiration look?'))return;try{const next=inspirationLooks.filter(x=>x.id!==look.id);await storeLooks(next);inspirationLooks=next;if(activeLookId===look.id)activeLookId=null;renderSavedLooks();}catch{message('Could not delete this look.');}};actions.append(open,remove);card.append(actions);grid.append(card);}
}
function renderTrendMatches(){
 const grid=$('trendResults');if(!grid)return;grid.replaceChildren();
 if(!lookPieces.length){$('matchSummary').textContent='Add the pieces in your inspiration look to match them with your closet.';return;}
 const result=matchOutfit(lookPieces,items,$('lookSeason').value==='All seasons'?'':$('lookSeason').value),close=result.filter(x=>x.status==='match').length,substitutes=result.filter(x=>x.status==='substitute').length;
 $('matchSummary').textContent=`${close} of ${result.length} close matches · ${substitutes} possible substitutes · ${result.filter(x=>x.status==='gap').length} gaps`;
 for(const match of result){const card=node('article',null,'match-card'),{component,best,status}=match;card.append(node('span',status==='match'?'FROM YOUR CLOSET':status==='substitute'?'POSSIBLE SUBSTITUTE':'FILL A GAP','match-tag '+status),node('h3',component.label||component.itemType));
 if(best){const image=node('img');image.src=best.item.image;image.alt=best.item.name;card.append(image,node('h4',best.item.name),node('p',best.reasons.join(' · ')),node('p',best.missing.join(' · '),'match-differences'));}
 else card.append(node('p',component.category==='Uncategorized'||component.itemType==='Unknown'?'Choose a category and item type above to match this piece.':'No saved item in this category.'));
 if(status!=='match'&&component.category!=='Uncategorized'&&component.itemType!=='Unknown'){
  const reuse=inspirationLooks.filter(look=>look.pieces.some(p=>p.category===component.category&&p.itemType===component.itemType)).length;
  if(reuse>1)card.append(node('p',`This item type appears in ${reuse} saved looks. A matching purchase may serve several outfits.`));
  const link=node('a','Search online for this piece','shop-link');link.href=shopSearch(component,$('shopSize').value,Number($('shopBudget').value));link.target='_blank';link.rel='noopener noreferrer';card.append(link,node('p','Search results need checking for size, price, and availability.','fine'));
 }
 if(match.alternatives.length){const details=node('details');details.append(node('summary','Other closet options'));for(const alternative of match.alternatives)details.append(node('p',alternative.item.name+' · '+[...alternative.reasons,...alternative.missing].join(' · ')));card.append(details);}
 grid.append(card);}
 if(!items.length)message('Save your clothing in My closet first. Inspiration looks can still be saved while you build the inventory.');
}
$('parseLook').onclick=()=>{const parsed=parseOutfit($('lookDescription').value);if(!parsed.length)return message('Describe the clothing pieces, one per line.');lookPieces=parsed;renderLookPieces();renderTrendMatches();message('Check the categories, colors and sleeves, then match your closet.');};
$('addLookPiece').onclick=()=>{if(lookPieces.length>=12)return message('A look can contain up to 12 pieces.');lookPieces.push({id:crypto.randomUUID(),label:'Clothing piece',category:'Uncategorized',itemType:'Unknown',color:'',sleeveLength:'Unknown',pattern:'Unknown',fit:'Unknown'});renderLookPieces();};
$('matchLook').onclick=renderTrendMatches;
$('saveLook').onclick=async()=>{if(!lookPieces.length)return message('Add at least one clothing piece before saving.');if(inspirationLooks.length>=100&&!activeLookId)return message('You can save up to 100 inspiration looks.');if($('lookUrl').value&&!safeInspirationUrl($('lookUrl').value))return message('Use a valid http or https inspiration link.');$('saveLook').disabled=true;try{const look=currentLook();const next=inspirationLooks.filter(x=>x.id!==look.id);next.push(look);await storeLooks(next);inspirationLooks=next;activeLookId=look.id;renderSavedLooks();renderTrendMatches();message('Inspiration look saved.');}catch{message('Could not save this look.');}finally{$('saveLook').disabled=false;}};
$('newLook').onclick=()=>{clearLookOriginal();activeLookId=null;lookImage='';lookPieces=[];for(const id of ['lookTitle','lookUrl','lookDescription','shopSize','shopBudget'])$(id).value='';$('lookSeason').value='';$('inspirationPreview').hidden=true;$('referenceToCloset').hidden=true;renderLookPieces();renderTrendMatches();};
$('exampleLook').onclick=()=>{clearLookOriginal();activeLookId=null;lookImage='';$('inspirationPreview').hidden=true;$('referenceToCloset').hidden=true;$('lookTitle').value='Casual layers — example';$('lookUrl').value='';$('lookDescription').value='Cream long sleeve sweater\nBlue jeans\nBrown ankle boots';lookPieces=parseOutfit($('lookDescription').value);renderLookPieces();renderTrendMatches();};
$('lookImage').onchange=async event=>{
 const file=event.target.files[0];event.target.value='';
 clearLookOriginal();const selected=lookPhotoSelection,selectedOwner=window.closetAuth?.user?.id;
 if(!file)return;
 lookImage='';$('inspirationPreview').hidden=true;
 if(file.size>10*1024*1024)return message('Choose an inspiration image smaller than 10 MB.');
 let url,timeout;
 try{
  url=URL.createObjectURL(file);const image=new Image();image.src=url;
  await Promise.race([image.decode(),new Promise((_,reject)=>{
   timeout=setTimeout(()=>reject(Error('Image decode timed out')),15000);
  })]);
  if(selected!==lookPhotoSelection)return;
  if(!image.width||!image.height)throw Error('Empty inspiration image');
  const canvas=document.createElement('canvas'),scale=Math.min(1,900/Math.max(image.width,image.height));
  canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const preview=canvas.toDataURL('image/jpeg',.8);
  if(!preview||preview==='data:,')throw Error('Cannot encode inspiration preview');
  if(selected!==lookPhotoSelection||selectedOwner!==window.closetAuth?.user?.id)return;
  lookImage=preview;lookOriginalFile=file;lookOriginalOwner=selectedOwner;
  $('inspirationPreview').src=lookImage;$('inspirationPreview').hidden=false;
  $('referenceToCloset').hidden=false;
  if(!lookPieces.length){lookPieces.push({id:crypto.randomUUID(),label:'Piece from inspiration image',category:'Uncategorized',itemType:'Unknown',color:'',sleeveLength:'Unknown',pattern:'Unknown',fit:'Unknown'});renderLookPieces();}
  message('Reference preview added. For clothing you own, Add this single-item photo uses the higher-resolution original for recognition.');
 }catch{
  if(selected===lookPhotoSelection)message('Could not open that image. Try a JPEG or PNG screenshot.');
 }finally{clearTimeout(timeout);if(url)URL.revokeObjectURL(url);}
};
for(const season of clothingSchema.seasons.slice(0,4))$('lookSeason').append(node('option',season));
for(const id of ['lookSeason','shopSize','shopBudget'])$(id).onchange=renderTrendMatches;
const inspirationReady=(async()=>{await closetReady;if(db){try{const state=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('looks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});inspirationLooks=(state?.looks||[]).map(validLook);}catch{message('Saved inspiration could not be loaded.');}}renderLookPieces();renderSavedLooks();renderTrendMatches();})();

$('referenceToCloset').onclick=async()=>{
 if(lookTransferBusy||busy)return;
 if(!lookOriginalFile){message('Choose the original clothing photo again to add it to My closet. A saved inspiration preview is not suitable for recognition.');return;}
 const selected=lookPhotoSelection,file=lookOriginalFile,owner=window.closetAuth?.user?.id;
 if(!owner||owner!==lookOriginalOwner){clearLookOriginal();message('Select your clothing photo again after signing in to this account.');return;}
 lookTransferBusy=true;$('referenceToCloset').disabled=true;
 try{
  // Use the standard original-first import encoder, not the 900px inspiration
  // thumbnail. The queued garment is then classified before masking/cropping.
  const image=await photoToJPEG(file);
  if(selected!==lookPhotoSelection||owner!==window.closetAuth?.user?.id||busy)return;
  if(candidate(image)){switchView('review');message('Original-resolution garment photo added to Review. Check its type and color.');}
 }catch{
  if(selected===lookPhotoSelection)message('Could not open the original photo for clothing recognition. Choose a JPEG or PNG and try again.');
 }finally{lookTransferBusy=false;$('referenceToCloset').disabled=false;}
};

async function reloadCloudLooks(){const state=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('looks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});inspirationLooks=(state?.looks||[]).map(validLook);renderSavedLooks();}
