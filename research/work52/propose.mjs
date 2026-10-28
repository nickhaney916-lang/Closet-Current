/** Bounded pale-background proposal. Original RGB and canonical alpha are immutable.
 * This is evidence for review, never semantic proof or permission to approve. */
import {proposeIsolationCleanup as supportCleanup} from '../work51/propose.mjs';
import {applyMaskRefinement} from '../work49/refine-engine.mjs';
export function proposeIsolationCleanup(base, options={}) {
 const inherited=supportCleanup(base,options);
 if(inherited.edits.length || options.existingEdits?.length)return inherited;
 const empty=reason=>({...inherited,reason});
 const {width:w,height:h,rgba}=base,n=w*h;
 if(!['Tops','Dresses','Outerwear','Bottoms','Shoes'].includes(options.category||'Tops'))return empty('unsupported-category');
 // Require all four source borders to describe the same almost-uniform field.
 const samples=[[],[],[]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1){const i=(y*w+x)*4;for(let c=0;c<3;c++)samples[c].push(rgba[i+c]);}
 const bg=samples.map(a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)]);
 if(Math.min(...bg)<185)return empty('no-pale-uniform-background');
 if(samples.some((a,c)=>a.some(v=>Math.abs(v-bg[c])>3)))return empty('complex-or-clipped-source-background');
 const diff=new Float32Array(n);let coreCount=0,coreContrast=0,visible=0;
 for(let i=0;i<n;i++){
  diff[i]=Math.max(...bg.map((v,c)=>Math.abs(rgba[i*4+c]-v)));
  if(rgba[i*4+3]>=128){visible++;const x=i%w,y=Math.floor(i/w);if(x>w*.35&&x<w*.65&&y>h*.35&&y<h*.7){coreCount++;coreContrast+=diff[i];}}
 }
 if(!coreCount||coreContrast/coreCount<10||coreContrast/coreCount>70)return empty('pale-core-background-ambiguity');
 // Flood only source pixels within two RGB levels of the observed background.
 // Every retained alpha value, including translucent lace, is a barrier unless
 // it is fully opaque and indistinguishable from the source background.
 const exterior=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 const push=i=>{if(!exterior[i]&&diff[i]<=2&&(rgba[i*4+3]===0||rgba[i*4+3]===255)){exterior[i]=1;q[tail++]=i;}};
 for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
 while(head<tail){const i=q[head++],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);if(i>=w)push(i-w);if(i<n-w)push(i+w);}
 // Protect a two-pixel source-detail neighborhood in every direction. Do not
 // bridge a neckline, erase a thin strap, or use morphology to invent fabric.
 const narrow=new Uint8Array(n);
 for(let y=0;y<h;y++)for(let x=0;x<w;){if(!rgba[(y*w+x)*4+3]){x++;continue;}const start=x;while(x<w&&rgba[(y*w+x)*4+3])x++;if(x-start<=5)for(let k=start;k<x;k++)narrow[y*w+k]=1;}
 for(let x=0;x<w;x++)for(let y=0;y<h;){if(!rgba[(y*w+x)*4+3]){y++;continue;}const start=y;while(y<h&&rgba[(y*w+x)*4+3])y++;if(y-start<=5)for(let k=start;k<y;k++)narrow[k*w+x]=1;}
 // Linear-time square guard, bounded even for a highly fragmented lace mask.
 const horizontal=new Uint8Array(n),protectedDetail=new Uint8Array(n);
 for(let y=0;y<h;y++){let count=0;for(let x=0;x<Math.min(w,5);x++)count+=narrow[y*w+x];for(let x=0;x<w;x++){if(x+5<w)count+=narrow[y*w+x+5];horizontal[y*w+x]=+(count>0);if(x>=5)count-=narrow[y*w+x-5];}}
 for(let x=0;x<w;x++){let count=0;for(let y=0;y<Math.min(h,5);y++)count+=horizontal[y*w+x];for(let y=0;y<h;y++){if(y+5<h)count+=horizontal[(y+5)*w+x];protectedDetail[y*w+x]=+(count>0);if(y>=5)count-=horizontal[(y-5)*w+x];}}
 const safe=new Uint8Array(n);let count=0;
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
  const i=y*w+x;if(!exterior[i]||protectedDetail[i]||rgba[i*4+3]!==255)continue;
  let ok=true;for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++)if(!exterior[i+dy*w+dx]){ok=false;break;}
  if(ok){safe[i]=1;count++;}
 }
 if(count<4||count>visible*.2)return empty('background-removal-budget-or-evidence');
 // Exact run rectangles only: never approximate a curved edge across fabric.
 // Merge identical adjacent rows; bounded portable polygons preserve replay.
 const rectangles=[],active=new Map();
 for(let y=0;y<h;y++){
  const next=new Map();for(let x=0;x<w;){if(!safe[y*w+x]){x++;continue;}const start=x;while(x<w&&safe[y*w+x])x++;const key=start+':'+x;let r=active.get(key);if(r)r.bottom=y+1;else {r={left:start,right:x,top:y,bottom:y+1};rectangles.push(r);}next.set(key,r);}active.clear();for(const [k,v]of next)active.set(k,v);
 }
 // Favor broad confidently flat regions; leave tiny leftovers for manual review.
 rectangles.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top));
 const edits=rectangles.slice(0,32).filter(r=>(r.right-r.left)*(r.bottom-r.top)>=4).map(r=>({action:'remove',kind:'polygon',points:[{x:r.left/w,y:r.top/h},{x:r.right/w,y:r.top/h},{x:r.right/w,y:r.bottom/h},{x:r.left/w,y:r.bottom/h}]}));
 if(!edits.length)return empty('no-safe-background-runs');
 const replay=applyMaskRefinement(base,edits);
 return {...inherited,edits,reason:'pale-exterior-background-proposal-needs-review',metrics:{removedPixels:replay.removedPixels,visiblePixels:visible,sourceRGBChanged:0,backgroundRGB:bg,coreContrast:coreContrast/coreCount,fullGarmentTruthAvailable:false,maskIoU:null,manualSeedPlacements:0}};
}
