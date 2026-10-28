import {planGarmentFit} from '../work47/fit.mjs';
/** Review-only starting landmarks from an already approved source cutout.
 * No segmentation, mask mutation, garment generation, identity or approval. */
export function suggestStartingFit(frame,{slot,verifiedProfile=null}={}){
 const {width:w,height:h,rgba}=frame||{};
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<32||h<32||w*h>8e6||!(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray)||rgba.length!==w*h*4)throw Error('Invalid reviewed source');
 if(!['top','bottom','dress','layer'].includes(slot))return {status:'fallback',reason:'unsupported-source-or-shoes',ownerApproved:false};
 if(verifiedProfile){if(verifiedProfile.slot!==slot)throw Error('Verified landmarks belong to another slot');const profile=structuredClone(verifiedProfile);planGarmentFit(w,h,profile);return {status:'suggested',profile,adjust:{dx:0,dy:0,scale:1,tilt:0,leftSleeve:0,rightSleeve:0},method:'existing-verified-landmarks',requiresHumanReview:true,ownerApproved:false};}
 let l=w,r=-1,t=h,b=-1,count=0,clipped=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>=128){count++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(!x||!y||x===w-1||y===h-1)clipped=true;}
 const fallback=reason=>({status:'fallback',reason,requiresHumanReview:true,ownerApproved:false});
 if(count<64||count>w*h*.93||clipped)return fallback('empty-opaque-or-clipped-cutout');
 const bw=r-l+1,bh=b-t+1;
 if(bw<w*.18||bh<h*.18)return fallback('insufficient-source-extent');
 // Bottoms use the first stable broad waistband row. Tops use a short robust
 // shoulder band, not the PNG rectangle. This is a geometric starting guess.
 const fraction=slot==='bottom'?.03:.08,center=Math.round(t+bh*fraction),rows=[];
 for(let y=Math.max(t,center-2);y<=Math.min(b,center+2);y++){
  let left=w,right=-1,opaque=0;for(let x=l;x<=r;x++)if(rgba[(y*w+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);opaque++;}
  if(right-left<bw*.35||right-left>bw*.94||opaque/(right-left+1)<.65)continue;rows.push({left,right,y});
 }
 if(rows.length<3)return fallback('unstable-shoulder-or-waistband-evidence');
 const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
 const left=median(rows.map(a=>a.left)),right=median(rows.map(a=>a.right)),y=median(rows.map(a=>a.y));
 if(Math.max(...rows.map(a=>a.left))-Math.min(...rows.map(a=>a.left))>bw*.05||Math.max(...rows.map(a=>a.right))-Math.min(...rows.map(a=>a.right))>bw*.05)return fallback('unstable-source-boundary');
 if((slot==='top'||slot==='layer')&&bw/(right-left)>1.8)return fallback('wide-sleeve-pose-needs-reviewed-panels');
 const profile={slot,anchors:[[left/w,y/h],[right/w,y/h]]},adjust={dx:0,dy:0,scale:slot==='layer'?1.06:1,tilt:0,leftSleeve:0,rightSleeve:0};
 try{planGarmentFit(w,h,profile,adjust);}catch{return fallback('unsafe-initial-geometry');}
 return {status:'suggested',profile,adjust,method:'reviewed-alpha-starting-guess',requiresHumanReview:true,ownerApproved:false,sourceBounds:{left:l,top:t,right:r+1,bottom:b+1}};
}
