/** Offline synthetic-only acceptance lab, not included by the customer app. */
import {createDetailedHumanoid3D} from './humanoid-3d-detailed-renderer.mjs';
import {bridgeSavedOutfit,recommendOwnedOutfits,swapOwnedGarment,snapshotOwnedOutfit,restoreOwnedOutfit,prepareWardrobeFor3D} from './humanoid-3d-saved-bridge.mjs';
const $=id=>document.getElementById(id);
const canvas=$('humanoidCanvas'),engine=createDetailedHumanoid3D(canvas);
const testOwners=['synthetic-wardrobe-a','synthetic-wardrobe-b'];
let ownerIndex=0,accountId=testOwners[ownerIndex],wardrobe=[],recommendations=[],selection=0,pinned=null,current=null,saved=null,angle=0;
const palette=['#3164b0','#b64b64','#27877a','#d3a55a','#332f38','#eeeeee','#684a89','#998176'];
function syntheticPhoto(tone,pattern='Solid'){
 const c=document.createElement('canvas');c.width=120;c.height=150;
 const x=c.getContext('2d',{willReadFrequently:true});
 x.fillStyle='#f6f0ea';x.fillRect(0,0,c.width,c.height);
 x.fillStyle=tone;x.fillRect(14,10,92,128);
 if(pattern==='Striped'){
  for(let i=0;i<6;i++){x.fillStyle='rgba(245,245,245,.85)';x.fillRect(20+i*14,10,6,128);}
 }else if(pattern==='Checked'){
  for(let i=0;i<6;i++){x.fillStyle='rgba(250,250,250,.62)';x.fillRect(14+i*16,10,4,128);}
  for(let i=0;i<7;i++){x.fillStyle='rgba(250,250,250,.62)';x.fillRect(14,12+i*18,92,4);}
 }
 x.fillStyle='#41384b';x.fillRect(37,17,7,118);
 return c.toDataURL('image/png');
}
function createSyntheticCloset(id){
 const specs=[
  ['navy-top','Tops','T-shirt','#3164b0','Solid'],
  ['striped-top','Tops','T-shirt','#b64b64','Striped'],
  ['new-top','Tops','Blouse','#27877a','Checked'],
  ['jeans','Bottoms','Jeans','#332f38','Solid'],
  ['skirt','Bottoms','Skirt','#684a89','Checked'],
  ['sneakers','Shoes','Sneakers','#eeeeee','Solid'],
  ['boots','Shoes','Ankle boots','#998176','Solid'],
  ['jacket','Outerwear','Jacket','#d3a55a','Solid'],
  ['coat','Outerwear','Coat','#998176','Solid'],
  ['dress','Dresses','Casual dress','#b64b64','Striped']
 ];
 return specs.map(([short,category,itemType,colorHex,pattern],n)=>{
  const photo=syntheticPhoto(id===testOwners[0]?colorHex:palette[(n+4)%palette.length],pattern);
  const part=id+'-'+short;
  return {id:part,name:short.replaceAll('-',' '),ownerId:id,category,itemType,colorHex,pattern,
   originalPhoto:{id:'orig-'+part,ownerId:id,image:photo,blank:false},
   recognitionPhoto:{id:'crop-'+part,ownerId:id},
   image:photo, // A display derivative: bridge reads originalPhoto.image instead.
   cropIdentity:'crop-'+part};
 });
}
function chooseBoard(){
 const selected=recommendations[selection];
 if(selected)current=selected;
 refresh();
}
function selectLooks(looks,which=0){
 recommendations=looks;selection=Math.min(which,Math.max(0,looks.length-1));
 const list=$('lookSelect');list.replaceChildren();
 for(const [index,look] of looks.entries()){
  const option=document.createElement('option');option.value=String(index);
  option.textContent='Look '+(index+1)+' · '+Object.values(look.slots).length+' owned pieces';
  list.append(option);
 }
 list.value=String(selection);
 chooseBoard();
}
function renderReferences(view){
 const section=$('references');section.replaceChildren();
 for(const [slot,ref] of Object.entries(view?.references||{})){
  const div=document.createElement('div');div.className='reference';
  const img=document.createElement('img');img.src=ref.originalPhoto;img.alt='Unmodified synthetic original for '+ref.name;
  const label=document.createElement('small');label.textContent=slot+': '+ref.name+' · '+ref.pattern;
  div.append(img,label);section.append(div);
 }
}
function updateSwaps(){
 const target=$('swapItem');target.replaceChildren();
 const slot=$('swapSlot').value;
 const candidate=prepareWardrobeFor3D(wardrobe,accountId);
 for(const item of candidate.values()){
  const category=slot==='top'?['Tops','Dresses']:slot==='bottom'?['Bottoms']:slot==='shoes'?['Shoes']:['Outerwear'];
  if(!category.includes(item.category))continue;
  const opt=document.createElement('option');opt.value=item.id;opt.textContent=item.name;
  target.append(opt);
 }
 const selected=current?.slots?.[slot];
 if(selected&&[...target.options].some(x=>x.value===selected))target.value=selected;
}
function refresh(){
 $('owner').textContent='Research identity: '+accountId;
 $('lookSelect').disabled=!recommendations.length;
 if(!current){
  $('status').textContent='No complete owned outfits for these synthetic garments. No pieces are invented.';
  renderReferences(null);engine.setOutfit({top:null,bottom:null,layer:null,layer2:null,layer3:null,shoes:null,dress:null});
  return;
 }
 try{
  const view=bridgeSavedOutfit(current,wardrobe,accountId);
  engine.setOutfit({top:null,bottom:null,layer:null,layer2:null,layer3:null,shoes:null,dress:null,...view.colors});
  renderReferences(view);updateSwaps();
  const feature=engine.supported?'3D color proxy ready':'No WebGL. See original references';
  $('status').textContent=feature+'. '+recommendations.length+' actual owned combinations. '+(pinned?'Pinned: '+pinned+'. ':'')+'No garment fit/hidden textures estimated as facts.';
  $('fallback').hidden=engine.supported;
 }catch(err){renderReferences(null);$('status').textContent='Preview held: '+err.message;engine.setOutfit({top:null,bottom:null,layer:null,layer2:null,layer3:null,shoes:null,dress:null});}
}
function loadAccount(index){
 ownerIndex=index;accountId=testOwners[index];wardrobe=createSyntheticCloset(accountId);pinned=null;
 saved=null;const key='closet-humanoid-synthetic-snapshot-'+accountId;
 try{const candidate=JSON.parse(sessionStorage.getItem(key)||'null');if(candidate?.ownerId===accountId)saved=candidate;}catch{/* no saved synthetic session */}
 selectLooks(recommendOwnedOutfits(wardrobe,accountId));
}
function save(){
 if(!current)return false;
 saved=snapshotOwnedOutfit(current,wardrobe,accountId);
 sessionStorage.setItem('closet-humanoid-synthetic-snapshot-'+accountId,JSON.stringify(saved));
 $('status').textContent='Synthetic outfit saved without photos or passwords. Reload and select Restore saved.';return true;
}
function restore(){
 if(!saved)throw Error('No saved synthetic outfit for this account');
 const view=restoreOwnedOutfit(saved,wardrobe,accountId);
 const slots={...view.slots};
 recommendations=[{name:'Restored synthetic outfit',slots,ownerId:accountId},...recommendations.filter(x=>JSON.stringify(x.slots)!==JSON.stringify(slots))].slice(0,3);
 selection=0;current=recommendations[0];selectLooks(recommendations);
 $('status').textContent='Saved synthetic outfit restored from original-photo signatures.';return true;
}
const rotation=delta=>{
 if(engine.supported)engine.rotate(delta);
 angle=(((angle+delta*180/Math.PI+180)%360)+360)%360-180;
 $('angle').value=String(Math.round(angle/15)*15);$('degrees').textContent=Math.round(angle)+'°';
};
$('turnLeft').onclick=()=>rotation(-Math.PI/8);
$('turnRight').onclick=()=>rotation(Math.PI/8);
$('front').onclick=()=>rotation(-angle*Math.PI/180);
$('angle').addEventListener('input',e=>rotation((Number(e.target.value)-angle)*Math.PI/180));
let pointer=null;
canvas.addEventListener('pointerdown',event=>{pointer=event.clientX;canvas.setPointerCapture?.(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(pointer===null)return;const diff=event.clientX-pointer;pointer=event.clientX;rotation(diff/180*Math.PI);});
for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{pointer=null;});
$('lookSelect').onchange=e=>{selection=Number(e.target.value);chooseBoard();};
$('swapSlot').onchange=updateSwaps;
$('pin').onclick=()=>{
 const slot=$('pinSlot').value;
 const id=current?.slots?.[slot];
 if(!id){$('status').textContent='Select a present garment to pin.';return;}
 pinned=id;
 const looks=recommendOwnedOutfits(wardrobe,accountId,{pinId:id});
 selectLooks(looks);
};
$('swap').onclick=()=>{
 try{
  if(!current)throw Error('Select an owned outfit first');
  const slot=$('swapSlot').value;
  current=swapOwnedGarment(current,slot,$('swapItem').value,wardrobe,accountId,{pinnedId:pinned});
  const options=[current,...recommendations.filter(x=>JSON.stringify(x.slots)!==JSON.stringify(current.slots))].slice(0,3);
  selectLooks(options);$('status').textContent='One saved-wardrobe piece swapped; original reference and garment identity still checked.';
 }catch(e){$('status').textContent='Swap refused: '+e.message;}
};
$('styleNew').onclick=()=>{
 pinned=accountId+'-new-top';
 selectLooks(recommendOwnedOutfits(wardrobe,accountId,{pinId:pinned}));
};
$('save').onclick=()=>{try{save();}catch(e){$('status').textContent='Save refused: '+e.message;}};
$('restore').onclick=()=>{try{restore();}catch(e){$('status').textContent='Restore refused: '+e.message;}};
$('switchAccount').onclick=()=>loadAccount(1-ownerIndex);
window.addEventListener('resize',()=>engine.render(),{passive:true});
window.addEventListener('pagehide',()=>engine.dispose(),{once:true});
// Only synthetic lab API is exposed, no production sources or private credentials.
window.__humanoidLab={get accountId(){return accountId;},get wardrobe(){return wardrobe;},get current(){return current;},
 get recommendations(){return recommendations;},get renderer(){return engine;},get pinned(){return pinned;},save,restore,selectLooks,loadAccount};
loadAccount(0);
