/** Source-RGB-only mask replay. No segmentation approval, storage or I/O.
 * Add reveals only source RGB already present in the independently audited crop.
 * Restore reverses editing back to the initial alpha; it cannot invent fabric. */
const valid=f=>f&&Number.isSafeInteger(f.width)&&Number.isSafeInteger(f.height)&&f.width>=32&&f.height>=32&&f.width*f.height<=8e6&&(f.rgba instanceof Uint8Array||f.rgba instanceof Uint8ClampedArray)&&f.rgba.length===f.width*f.height*4;
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
export function applyMaskRefinement(original,edits,{minRetained=.55,legacy}={}){
 if(!valid(original)||!Array.isArray(edits)||edits.length>40||!Number.isFinite(minRetained)||minRetained<.5||minRetained>1)throw Error('Invalid source mask or edit history');
 const {width:w,height:h}=original,rgba=new Uint8ClampedArray(original.rgba);let initial=0;for(let p=3;p<rgba.length;p+=4)if(rgba[p]>=128)initial++;
 if(initial<64)throw Error('Original mask has no meaningful garment');
 for(const e of edits){
  if(!e?.action){if(typeof legacy!=='function')throw Error('Legacy mask operation unavailable');rgba.set(legacy({width:w,height:h,rgba},[e],{minRetained:.5}).rgba);continue;}
  if(!['remove','restore','add','soften','connected'].includes(e.action))throw Error('Unknown refinement action');
  let region,minX,maxX,minY,maxY;
  if(e.kind==='polygon'){
   const pts=e.points;if(!Array.isArray(pts)||pts.length<3||pts.length>24||pts.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))throw Error('Invalid source outline');
   minX=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.x))*w));maxX=Math.min(w-1,Math.ceil(Math.max(...pts.map(p=>p.x))*w));minY=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.y))*h));maxY=Math.min(h-1,Math.ceil(Math.max(...pts.map(p=>p.y))*h));region=(x,y)=>inside((x+.5)/w,(y+.5)/h,pts);
  }else{
   if(!['x','y','radius'].every(k=>Number.isFinite(e[k]))||e.x<0||e.x>1||e.y<0||e.y>1||e.radius<.002||e.radius>.12)throw Error('Invalid refinement brush');
   const cx=e.x*w,cy=e.y*h,r=e.radius*Math.min(w,h);minX=Math.max(0,Math.floor(cx-r));maxX=Math.min(w-1,Math.ceil(cx+r));minY=Math.max(0,Math.floor(cy-r));maxY=Math.min(h-1,Math.ceil(cy+r));region=(x,y)=>(x+.5-cx)**2+(y+.5-cy)**2<=r*r;
  }
  if(e.action==='connected'){
   if(e.kind==='polygon'||!Number.isFinite(e.tolerance)||e.tolerance<0||e.tolerance>24)throw Error('Use a bounded background wand tolerance');
   const sx=Math.min(w-1,Math.floor(e.x*w)),sy=Math.min(h-1,Math.floor(e.y*h)),seed=sy*w+sx,ref=rgba.slice(seed*4,seed*4+3),rw=maxX-minX+1,rh=maxY-minY+1,seen=new Uint8Array(rw*rh),queue=new Int32Array(rw*rh);let head=0,tail=0,removed=0;
   const push=(x,y)=>{if(x<minX||x>maxX||y<minY||y>maxY||!region(x,y))return;const local=(y-minY)*rw+x-minX,p=(y*w+x)*4;if(seen[local])return;seen[local]=1;if(rgba[p+3]===0||[0,1,2].some(c=>Math.abs(rgba[p+c]-ref[c])>e.tolerance))return;queue[tail++]=y*w+x;};push(sx,sy);
   while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(rgba[i*4+3]>=128)removed++;rgba[i*4+3]=0;push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1);}
   if(removed>Math.max(32,initial*.03))throw Error('Wand region is too large; use a smaller brush or manual outline');
  }else{
   const alpha=e.action==='soften'?Uint8Array.from({length:w*h},(_,i)=>rgba[i*4+3]):null;
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    if(!region(x,y))continue;const p=(y*w+x)*4;
    if(e.action==='remove')rgba[p+3]=0;
    if(e.action==='restore')rgba[p+3]=original.rgba[p+3];
    if(e.action==='add')rgba[p+3]=255;
    if(e.action==='soften'&&alpha[y*w+x]){
     // Selected one-native-pixel inward antialias ring, frozen source alpha.
     const adjacent=(x===0||y===0||x===w-1||y===h-1||alpha[y*w+x-1]===0||alpha[y*w+x+1]===0||alpha[(y-1)*w+x]===0||alpha[(y+1)*w+x]===0);
     if(adjacent)rgba[p+3]=Math.min(alpha[y*w+x],Math.round(alpha[y*w+x]*.5));
    }
   }
  }
 }
 let visible=0,removed=0,added=0,changedAlpha=0;
 for(let i=0;i<w*h;i++){const p=i*4,b=original.rgba[p+3],a=rgba[p+3];if(a>=128)visible++;if(b>=128&&a<128)removed++;if(b<128&&a>=128)added++;if(a!==b)changedAlpha++;}
 if(visible<64||visible/initial<minRetained)throw Error('Too much garment removed; undo or reset');
 if(added>Math.max(32,Math.floor(initial*.03)))throw Error('Too much source background revealed; use smaller fabric repairs');
 return Object.freeze({width:w,height:h,rgba,originalVisiblePixels:initial,visiblePixels:visible,removedPixels:removed,addedPixels:added,changedAlphaPixels:changedAlpha,sourceRGBUnchanged:true,requiresHumanReview:true,ownerApproved:false});
}
