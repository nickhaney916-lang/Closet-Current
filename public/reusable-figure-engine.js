'use strict';
// Free, local display-only figure layering. No model/provider calls, photo
// uploads, item mutations, or persistence of user selfies occur here.
(function(root){
 const FIGURES=Object.freeze({
  female:'ai-models/female-preview.webp',
  male:'ai-models/male-preview.webp'
 });
 const RECTS=Object.freeze({
  top:{left:22,top:17,width:56,height:35},
  bottom:{left:27,top:43,width:46,height:41},
  layer:{left:18,top:17,width:64,height:38},
  layer2:{left:16,top:16,width:68,height:44},
  layer3:{left:14,top:14,width:72,height:50},
  shoes:{left:18,top:86,width:64,height:12}
 });
 // Percentages calibrated to the existing fixed preview assets, not customer
 // measurements. These do not create additional bodies or estimate sizing.
 const FIGURE_RECTS=Object.freeze({
  female:Object.freeze({top:{left:29,top:19,width:44,height:29},
   bottom:{left:34,top:44,width:34,height:51},
   layer:{left:27,top:18,width:48,height:34},
   layer2:{left:25,top:18,width:52,height:38},
   layer3:{left:23,top:17,width:56,height:42}}),
  male:Object.freeze({top:{left:22,top:17,width:56,height:32},
   bottom:{left:28,top:47,width:44,height:47},
   layer:{left:20,top:16,width:60,height:37},
   layer2:{left:18,top:16,width:64,height:41},
   layer3:{left:16,top:15,width:68,height:45}})
 });
 function placementRect(slot,item,figure){
  if(item.category==='Dresses')return {left:27,top:18,width:48,height:67};
  const rect={...(FIGURE_RECTS[figure]?.[slot]||RECTS[slot])};
  // Short garments must not be stretched down to the figure's ankles.
  if(slot==='bottom'&&/shorts|skirt/i.test(item.itemType||''))rect.height=25;
  return rect;
 }
 function selfieRect(figure,adjustment={}){
  const bounded=(value,min,max)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):0;
  const zoom=1+bounded(adjustment.zoom,-25,50)/100;
  const width=13*zoom,height=8*zoom;
  return {left:50-width/2+bounded(adjustment.x,-12,12),
   top:(figure==='male'?7.1:8)-height/2+bounded(adjustment.y,-8,8),width,height};
 }
 const ORDER=['bottom','top','layer','layer2','layer3','shoes'];
 const allowed=Object.freeze({
  top:['Tops','Dresses'],bottom:['Bottoms'],layer:['Tops','Outerwear'],
  layer2:['Outerwear'],layer3:['Outerwear'],shoes:['Shoes']
 });
 function isLocalGarmentImage(value){
  return typeof value==='string'&&value.length>=90&&value.length<=12_000_000&&
   /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
 }
 // Resolve display pixels from the saved original, never a cached mask or
 // generated display image. A crop is geometry into that original only.
 function savedSource(item,ownerId=null){
  if(!item||typeof item!=='object')return null;
  for(const record of [item,item.originalPhoto,item.recognitionPhoto]){
   if(record&&typeof record==='object')for(const key of ['ownerId','owner_id','accountId'])
    if(record[key]!==undefined&&record[key]!==ownerId)return null;
  }
  const hasOriginal=item.originalPhoto!==undefined;
  if(!hasOriginal&&(item.outfitSourceId||item.maskApplied===true||item.recognitionPhoto!==undefined))return null;
  const image=hasOriginal?item.originalPhoto?.image:item.image;
  if(!isLocalGarmentImage(image))return null;
  let crop=null;
  if(item.cropBounds!==undefined){
   const b=item.cropBounds;
   if(!hasOriginal||!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||
    b.x<0||b.y<0||b.width<=0||b.height<=0||b.x+b.width>1||b.y+b.height>1)return null;
   crop={x:b.x,y:b.y,width:b.width,height:b.height};
  }else if(item.outfitSourceId)return null; // Never overlay a whole outfit as one garment.
  // Metadata changes cancel pending work even if the source bytes are unchanged.
  const identity=JSON.stringify(Object.fromEntries(Object.entries(item)
   .filter(([key])=>/original|source|recognition|crop|hash|owner|photoVersion|mask/i.test(key))),
   (key,value)=>key==='image'?undefined:value);
  return {image,crop,sourceIdentity:identity,cacheSource:image+identity};
 }
 function plan(board,closet,figure='female',ownerId=null){
  const choice=Object.hasOwn(FIGURES,figure)?figure:'female';
  const slots=board?.slots||{},used=new Set(),placements=[],skipped=[];
  const source=Array.isArray(closet)?closet:[];
  const dress=source.find(x=>x.id===slots.top&&x.category==='Dresses');
  const selections=dress?['top','shoes']:ORDER;
  for(const slot of selections){
   if(!slots[slot])continue;
   const matches=source.filter(x=>x&&x.id===slots[slot]);
   const item=matches.length===1?matches[0]:null;
   const saved=savedSource(item,ownerId);
   if(!item||!saved||!allowed[slot].includes(item.category)||used.has(item.id)){
    skipped.push(slot);continue;
   }
   used.add(item.id);
   placements.push({slot,itemId:item.id,...saved,category:item.category,primaryColor:item.color||null,
    rect:placementRect(slot,item,choice)});
  }
  return {figure:choice,figureImage:FIGURES[choice],placements,skipped,
   excludesAccessories:true,usesOwnedGarmentsOnly:true,usesRemoteAI:false,
   needsTransparentCutouts:true,fitAndImageQualityVerified:false};
 }
 // Compare full source strings by equality without hashing or copying large photos.
 function samePlan(a,b){
  return !!a&&!!b&&a.figure===b.figure&&a.figureImage===b.figureImage&&
   a.skipped.length===b.skipped.length&&a.skipped.every((v,i)=>v===b.skipped[i])&&
   a.placements.length===b.placements.length&&a.placements.every((v,i)=>{
    const q=b.placements[i];
    return ['slot','itemId','image','sourceIdentity','category','primaryColor'].every(k=>v[k]===q[k])&&
     ['left','top','width','height'].every(k=>v.rect[k]===q.rect[k]);
   });
 }
 root.ClosetReusableFigure=Object.freeze({FIGURES,RECTS,FIGURE_RECTS,placementRect,selfieRect,isLocalGarmentImage,savedSource,plan,samePlan});
 if(typeof module!=='undefined')module.exports=root.ClosetReusableFigure;
})(typeof window!=='undefined'?window:globalThis);
