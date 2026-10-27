/** OFFLINE candidate: connectivity-aware background proposal; never source recoloring.
 * Simple edge-consistent backgrounds only. No semantic person/mannequin segmentation.
 * A prepared result is PROVISIONAL and still needs existing owner/source audit
 * and explicit human cutout approval. No persistent image, network or model.
 */
import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';
const review=reason=>({status:'review',reason,image:null,autoSaved:false,verifiedOwner:false});
export function prepareBorderConnectedGarment(frame,options={}){
 const {width:w,height:h,data}=frame||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>8_000_000||!(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||data.length!==w*h*4)throw Error('Invalid retained-original RGBA frame');
 if(options.mask!=null)return review('external-mask-needs-separate-provenance');
 // Robust edge strips follow vertical studio gradients/floor transitions.
 // Require agreement between opposite edges; this is not a semantic mask.
 const strip=Math.max(2,Math.min(32,Math.floor(w*.02))),left=new Float64Array(h*3),right=new Float64Array(h*3),spread=[];
 for(let y=0;y<h;y++)for(let k=0;k<3;k++){
  const a=[],b=[];for(let x=0;x<strip;x++){if(data[(y*w+x)*4+3]<250||data[(y*w+w-1-x)*4+3]<250)return review('transparent-or-ambiguous-source-border');a.push(data[(y*w+x)*4+k]);b.push(data[(y*w+w-1-x)*4+k]);}
  a.sort((x,y)=>x-y);b.sort((x,y)=>x-y);left[y*3+k]=a[Math.floor(strip/2)];right[y*3+k]=b[Math.floor(strip/2)];spread.push(Math.abs(left[y*3+k]-right[y*3+k]));
 }
 spread.sort((a,b)=>a-b);if(spread[Math.floor(spread.length*.95)]>35)return review('opposite-background-edges-disagree');
 function background(x,y,k){const u=x/(w-1);return left[y*3+k]*(1-u)+right[y*3+k]*u;}
 function difference(x,y){const p=(y*w+x)*4;let max=0;for(let k=0;k<3;k++)max=Math.max(max,Math.abs(data[p+k]-background(x,y,k)));return max;}
 const border=[];for(let i=0;i<=40;i++){const x=Math.round(i*(w-1)/40),y=Math.round(i*(h-1)/40);for(const [a,b]of [[x,0],[x,h-1],[0,y],[w-1,y]])border.push(difference(a,b));}
 border.sort((a,b)=>a-b);const residual=border[Math.floor(border.length*.95)];
 if(residual>22)return review('border-is-not-a-simple-background');
 const eligible=new Uint8Array(w*h),removed=new Uint8Array(w*h),queue=new Int32Array(w*h);
 // Fixed conservative threshold. Connectivity, not a global white-pixel deletion.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)eligible[y*w+x]=Number(data[(y*w+x)*4+3]>=220&&difference(x,y)<=32);
 let head=0,tail=0;const push=p=>{if(!removed[p]&&eligible[p]){removed[p]=1;queue[tail++]=p;}};
 for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
 while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);if(x)push(p-1);if(x+1<w)push(p+1);if(y)push(p-w);if(y+1<h)push(p+w);}
 const mask=Uint8Array.from(removed,x=>1-x);
 const value=prepareSyntheticGarmentOriginal(frame,{...options,mask});
 if(value.status!=='prepared')return value;
 // Ambiguous foreground edge pixels are counted, never silently recolored or erased.
 let enclosed=0;for(let i=0;i<mask.length;i++)if(mask[i]&&eligible[i])enclosed++;
 let edge=0,ambiguous=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;if(mask[p]&&(!mask[p-1]||!mask[p+1]||!mask[p-w]||!mask[p+w])){edge++;if(difference(x,y)<48)ambiguous++;}}
 const edgeAmbiguity=edge?ambiguous/edge:1;
 if(enclosed>Math.max(8,value.foregroundPixels*.001))return {...review('enclosed-pale-fabric-or-hole-needs-review'),proposedCutout:value,enclosedPixels:enclosed};
 if(edgeAmbiguity>.30)return {...review('low-contrast-garment-edge-needs-review'),proposedCutout:value,edgeAmbiguity};
 return {...value,algorithm:'border-connected-edge-strips-v2',requiresHumanReview:true,
  qualityDecision:'REVIEW',semanticIsolationVerified:false,borderResidual95:residual,edgeAmbiguity,
  autoSaved:false,verifiedOwner:false,originalPixelsModified:false};
}

/** Model alpha is untrusted evidence, never authorization or a human review. */
export function prepareAlphaProposal(frame,{alpha,...options}={}){
 const {width:w,height:h,data}=frame||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>8_000_000||!(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||data.length!==w*h*4)throw Error('Invalid retained-original RGBA frame');
 if(!(alpha instanceof Uint8Array)||alpha.length!==w*h)return review('invalid-native-alpha-mask');
 const binary=Uint8Array.from(alpha,x=>Number(x>=32));
 const proposed=prepareSyntheticGarmentOriginal(frame,{...options,mask:binary});
 if(proposed.status!=='prepared')return proposed;
 let substantial=0;
 for(let y=0;y<proposed.height;y++)for(let x=0;x<proposed.width;x++){
  const dst=(y*proposed.width+x)*4,src=(y+proposed.bounds.top)*w+x+proposed.bounds.left;
  proposed.rgba[dst+3]=proposed.rgba[dst+3]?alpha[src]:0;
  if(proposed.rgba[dst+3]>=128)substantial++;
 }
 if(substantial<w*h*.018)return review('model-mask-too-small-or-uncertain');
 return {...review('model-saliency-requires-garment-and-edge-review'),proposedCutout:{...proposed,requiresHumanReview:true,qualityDecision:'REVIEW',semanticIsolationVerified:false,algorithm:'u2netp-alpha-native-source-rgb',originalPixelsModified:false},requiresHumanReview:true,semanticIsolationVerified:false};
}
