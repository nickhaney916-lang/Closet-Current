import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';
/** Local native-pixel isolation. No network, model, storage or authorization.
 * Connectivity removes only background reachable from a photograph border.
 * No component ranking, hole filling, erosion, dilation or RGB replacement.
 * Color/geometry cannot prove cloth vs mannequin: every candidate needs review.
 */
const categories=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
function check(f){if(!f||!Number.isSafeInteger(f.width)||!Number.isSafeInteger(f.height)||f.width<32||f.height<32||f.width*f.height>8e6||!(f.rgba instanceof Uint8Array||f.rgba instanceof Uint8ClampedArray)||f.rgba.length!==f.width*f.height*4)throw Error('Invalid native RGBA photograph');}
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
function components(alpha,w,h){const seen=new Uint8Array(alpha.length),q=new Int32Array(alpha.length),parts=[];for(let s=0;s<alpha.length;s++){if(alpha[s]<128||seen[s])continue;let head=0,tail=1;q[0]=s;seen[s]=1;while(head<tail){const p=q[head++],x=p%w;for(const n of [x?p-1:-1,x<w-1?p+1:-1,p>=w?p-w:-1,p<alpha.length-w?p+w:-1])if(n>=0&&alpha[n]>=128&&!seen[n]){seen[n]=1;q[tail++]=n;}}parts.push(tail);}return parts.sort((a,b)=>b-a);}
export function isolateGarment(frame,{category='Tops',initialAlpha=null}={}){
 check(frame);if(!categories.has(category))throw Error('Unsupported garment category');const {width:w,height:h,rgba:source}=frame,n=w*h;
 if(initialAlpha!==null&&(!(initialAlpha instanceof Uint8Array)||initialAlpha.length!==n))throw Error('Invalid native alpha');
 const rgba=new Uint8ClampedArray(source),prior=initialAlpha?new Uint8Array(initialAlpha):new Uint8Array(n).fill(255);
 for(let i=0;i<n;i++)rgba[i*4+3]=prior[i];
 const reasons=['semantic-mannequin-hanger-and-fabric-review-required'];
 const finish=(metrics={},applied=false)=>({width:w,height:h,rgba,applied,qualityDecision:'REVIEW',requiresHumanReview:true,autoAccepted:false,ownerApproved:false,semanticIsolationVerified:false,reviewChecks:{boundary:'heuristic-only',missingVisibleFabric:'unverified',backgroundRetention:'heuristic-only',mannequinAndHanger:'unverified',garmentSeparation:'heuristic-only',narrowDetails:initialAlpha?'bounded-run-protection-only':'unverified'},reasons:[...new Set(reasons)],metrics});
 const strip=Math.max(2,Math.min(16,Math.floor(w*.015))),left=new Float32Array(h*3),right=new Float32Array(h*3),spread=[];
 for(let y=0;y<h;y++)for(let c=0;c<3;c++){const a=[],b=[];for(let x=0;x<strip;x++){a.push(source[(y*w+x)*4+c]);b.push(source[(y*w+w-1-x)*4+c]);}left[y*3+c]=median(a);right[y*3+c]=median(b);spread.push(Math.abs(left[y*3+c]-right[y*3+c]));}
 const diff=new Float32Array(n);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(source[(y*w+x)*4+c]-(left[y*3+c]*(1-x/(w-1))+right[y*3+c]*x/(w-1))));diff[y*w+x]=d;}
 const edge=[];for(let x=0;x<w;x++){edge.push(diff[x],diff[(h-1)*w+x]);}for(let y=0;y<h;y++)edge.push(diff[y*w],diff[y*w+w-1]);edge.sort((a,b)=>a-b);spread.sort((a,b)=>a-b);
 const borderResidual95=edge[Math.floor(edge.length*.95)],oppositeResidual95=spread[Math.floor(spread.length*.95)];
 if(borderResidual95>18||oppositeResidual95>28){reasons.push('complex-or-clipped-background');return finish({borderResidual95,oppositeResidual95});}
 const flood=threshold=>{const out=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;const push=p=>{if(!out[p]&&diff[p]<=threshold){out[p]=1;q[tail++]=p;}};for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}while(head<tail){const p=q[head++],x=p%w;if(x)push(p-1);if(x<w-1)push(p+1);if(p>=w)push(p-w);if(p<n-w)push(p+w);}return out;};
 // Protect narrow existing details independently of their color. A thin strap
 // matching the background is uncertainty, never permission to erase it.
 const narrow=new Uint8Array(n);
 if(initialAlpha){
  for(let y=0;y<h;y++)for(let x=0;x<w;){if(prior[y*w+x]<128){x++;continue;}const start=x;while(x<w&&prior[y*w+x]>=128)x++;if(x-start<=3)for(let k=start;k<x;k++)narrow[y*w+k]=1;}
  for(let x=0;x<w;x++)for(let y=0;y<h;){if(prior[y*w+x]<128){y++;continue;}const start=y;while(y<h&&prior[y*w+x]>=128)y++;if(y-start<=3)for(let k=start;k<y;k++)narrow[k*w+x]=1;}
 }
 const strict=flood(8),loose=flood(16),candidate=new Uint8Array(prior);let before=0,removed=0,unstable=0,lowContrast=0;
 for(let i=0;i<n;i++){if(prior[i]>=128){before++;if(diff[i]<32)lowContrast++;if(strict[i]!==loose[i])unstable++;if(strict[i]&&!narrow[i]){candidate[i]=0;removed++;}}}
 const partsBefore=components(prior,w,h),partsAfter=components(candidate,w,h),visible=before-removed;
 const metrics={borderResidual95,oppositeResidual95,before,removed,visible,thresholdDisagreementPixels:unstable,lowContrastPixels:lowContrast,componentsBefore:partsBefore.slice(0,20),componentsAfter:partsAfter.slice(0,20),componentCountBefore:partsBefore.length,componentCountAfter:partsAfter.length,protectedNarrowPixels:narrow.reduce((a,b)=>a+b,0),sourceRGBChanged:0,referenceMaskAvailable:false,maskIoU:null,fabricRecall:null};
 // Never throw away smaller pieces (straps, cuffs or the other shoe).
 // Any topology change of an existing proposal refuses the whole cleanup.
 if(initialAlpha&&(partsBefore.filter(p=>p>=Math.max(32,before*.001)).length!==partsAfter.filter(p=>p>=Math.max(32,before*.001)).length)){reasons.push('possible-separation-or-narrow-detail-loss');return finish(metrics);}
 if(initialAlpha&&removed>Math.max(16,before*.02)){reasons.push('excessive-removal-risk');return finish(metrics);}
 if(initialAlpha&&lowContrast>before*.035){reasons.push('pale-fabric-or-background-ambiguity');return finish(metrics);}
 if(unstable>Math.max(16,visible*.015)){reasons.push('unstable-low-contrast-boundary');return finish(metrics);}
 if(visible<64||visible>n*.93){reasons.push('empty-or-background-dominant');return finish(metrics);}
 const meaningful=partsAfter.filter(p=>p>=Math.max(32,visible*.01));if(meaningful.length>(category==='Shoes'?2:1)){reasons.push('multiple-pieces-need-review');return finish(metrics);}
 let clipped=false;for(let x=0;x<w;x++)if(candidate[x]>=128||candidate[(h-1)*w+x]>=128)clipped=true;for(let y=0;y<h;y++)if(candidate[y*w]>=128||candidate[y*w+w-1]>=128)clipped=true;
 if(clipped){reasons.push('source-clipped-or-border-contamination');return finish(metrics);}
 for(let i=0;i<n;i++)rgba[i*4+3]=candidate[i];
 if(category==='Shoes')reasons.push('shoe-pair-requires-explicit-confirmation');
 if(lowContrast)reasons.push('pale-regions-preserved-for-review');
 return finish(metrics,removed>0);
}
/** Adapter for the unchanged private original-pixel auditor and review editor. */
export function prepareAutomaticGarment(frame,options={}){
 const {width:w,height:h,data}=frame||{};
 const legacy=prepareSyntheticGarmentOriginal(frame,options);
 if(legacy.reason==='missing-source-identity'||legacy.reason==='invalid-segmentation-mask')return legacy;
 // Prefer source-native connectivity over the earlier global threshold, which
 // can silently discard pale straps attached to darker cloth.
 const r=isolateGarment({width:w,height:h,rgba:data},{category:options.category});
 if(!r.applied&&legacy.status==='prepared')return {...legacy,requiresHumanReview:true,qualityDecision:'REVIEW',autoAccepted:false,confidence:{...r,rgba:undefined}};
 if(!r.applied)return {status:'review',reason:r.reasons.at(-1),confidence:r};
 let left=w,top=h,right=0,bottom=0,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(r.rgba[(y*w+x)*4+3]>=128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);count++;}
 const pad=Math.max(2,Math.ceil(Math.max(right-left,bottom-top)*.045));left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(w,right+pad);bottom=Math.min(h,bottom+pad);const width=right-left,height=bottom-top,rgba=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)rgba.set(r.rgba.subarray(((y+top)*w+left)*4,((y+top)*w+right)*4),y*width*4);
 return {status:'prepared',width,height,rgba,bounds:{left,top,right,bottom},naturalWidth:w,naturalHeight:h,foregroundPixels:count,sourceIdentity:options.sourceIdentity,sourceVersion:options.sourceVersion,sourceRole:'retained-original',category:options.category,requiresHumanReview:true,qualityDecision:'REVIEW',autoAccepted:false,ownerApproved:false,semanticIsolationVerified:false,autoSaved:false,verifiedOwner:false,originalPixelsModified:false,confidence:{...r,rgba:undefined}};
}
