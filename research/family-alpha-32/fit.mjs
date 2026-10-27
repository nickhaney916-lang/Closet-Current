// RESEARCH ONLY: no storage, requests, segmentation, renderer or engine modification.
// Anchors are explicitly reviewed annotations, NEVER inferred from a bounding box.
export const LIMITS=Object.freeze({minScale:.65,maxScale:1.5,maxWidthChange:.08,minStretch:.90,maxStretch:1.10,maxPixels:4_000_000});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&finite(p.x)&&finite(p.y);
export function planFit({width,height,anchors,target,waistFactor=1,protectedUntil=0,transitionEnd=height}){
 const fallback=reason=>({status:'review-required',reason,mode:'approved-preview',maxDistortion:0});
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<2||height<2||width*height>LIMITS.maxPixels)return fallback('Invalid image dimensions');
 if(!anchors?.reviewed||!Array.isArray(anchors.pair)||anchors.pair.length!==2||!Array.isArray(target)||target.length!==2||![...anchors.pair,...target].every(point))return fallback('Reviewed anatomical anchor pair required');
 const [a,b]=anchors.pair,[u,v]=target;
 if([a,b].some(p=>p.x<0||p.x>width||p.y<0||p.y>height)||b.x-a.x<width*.15||Math.abs(a.y-b.y)>1||Math.abs(u.y-v.y)>1)return fallback('Ambiguous or rotated garment needs review');
 const scale=(v.x-u.x)/(b.x-a.x),x=u.x-a.x*scale,y=u.y-a.y*scale;
 if(!finite(scale)||scale<LIMITS.minScale||scale>LIMITS.maxScale)return fallback('Excessive scale required');
 if(x<0||x+width*scale>360||y<0||y+height*scale>600)return fallback('Fit would clip source pixels at frame boundary');
 const rigid={status:'preview-only',mode:'rigid',scale,x,y,width,height,maxDistortion:0,waistFactor:1};
 if(!finite(waistFactor)||Math.abs(waistFactor-1)>LIMITS.maxWidthChange||!finite(protectedUntil)||!finite(transitionEnd)||protectedUntil<0||transitionEnd>height||transitionEnd<=protectedUntil)return {...rigid,reason:'Deformation refused; retain rigid approved pixels'};
 const derivative=(waistFactor-1)/(transitionEnd-protectedUntil),shear=Math.abs(derivative)*width/2;
 // Singular values of [[horizontal stretch, shear],[0,1]], at worst image edge.
 const f=Math.min(waistFactor,1),sum=f*f+shear*shear+1,disc=Math.sqrt(Math.max(0,sum*sum-4*f*f));
 const min=Math.sqrt((sum-disc)/2),max=Math.sqrt((sum+disc)/2);
 if(min<LIMITS.minStretch||max>LIMITS.maxStretch)return {...rigid,reason:'Local stretch/shear limit exceeded; rigid fallback'};
 return {...rigid,mode:waistFactor===1?'rigid':'bounded-warp',waistFactor,protectedUntil,transitionEnd,minStretch:min,maxStretch:max,maxDistortion:Math.abs(waistFactor-1)};
}
export function rowTransform(plan,row){
 const t=Math.max(0,Math.min(1,(row-plan.protectedUntil)/(plan.transitionEnd-plan.protectedUntil)));
 const factor=plan.mode==='bounded-warp'?1+(plan.waistFactor-1)*t:1;
 return {factor,x:plan.x+(plan.width-plan.width*factor)*plan.scale/2,y:plan.y+row*plan.scale};
}
export function paintFit(canvas,image,plan){
 if(plan.status!=='preview-only')return false;
 const ctx=canvas.getContext('2d');
 if(plan.mode==='rigid')ctx.drawImage(image,plan.x,plan.y,plan.width*plan.scale,plan.height*plan.scale);
 else for(let row=0;row<plan.height;row++){
  const r=rowTransform(plan,row);
  // Each original scanline is sampled once. No texture synthesis, retouch or source write.
  ctx.drawImage(image,0,row,plan.width,1,r.x,r.y,plan.width*plan.scale*r.factor,plan.scale);
 }
 return true;
}
export function clearOnScopeChange(container,getContext,initial){
 const c=getContext();if(!c||c.ownerId!==initial.ownerId||c.sessionGeneration!==initial.sessionGeneration){container.replaceChildren();return false;}return true;
}
