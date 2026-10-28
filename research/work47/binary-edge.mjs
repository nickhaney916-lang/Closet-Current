/**
 * Explicit manual-review ONLY binary silhouette antialiasing.
 * Changes alpha of already opaque edge fabric; never adds cloth or changes RGB.
 * Exact source RGBA remains the caller's untouched buffer.
 * Hard masks only: mixed/translucent masks return a non-editing result.
 */
export function softenReviewedBinarySilhouette(rgba,width,height){
 if(!(rgba instanceof Uint8ClampedArray)||!Number.isSafeInteger(width)||
    !Number.isSafeInteger(height)||width<16||height<16||
    width*height>8_000_000||rgba.length!==width*height*4)
  throw Error('Invalid bounded binary silhouette display buffer');
 const n=width*height,alpha=new Uint8Array(n);
 let solid=0,clear=0,partial=0;
 for(let i=0;i<n;i++){const a=rgba[4*i+3];alpha[i]=a;
  if(a>=251)solid++;else if(a<=4)clear++;else partial++;
 }
 const unedited=(reason)=>Object.freeze({changed:0,reason,mode:'review-only',
   ownerApproved:false,sourceRGBModified:false});
 if(!solid||!clear||solid/n<.02||clear/n<.02||partial/n>.002)
  return unedited('NOT_REVIEWED_BINARY_CUTOUT');
 // Never process an opaque rectangular photo or heavily antialiased cutout.
 // Use ONLY transparent background reachable from the IMAGE EXTERIOR.
 // Enclosed transparent holes inside prints, embroidered letters, or fabric
 // openings are NOT silhouette edges and must stay exactly unchanged.
 const outside=new Uint8Array(n),queue=new Uint32Array(n);
 let head=0,tail=0;
 const seed=i=>{if(alpha[i]<=4&&!outside[i]){outside[i]=1;queue[tail++]=i;}};
 for(let x=0;x<width;x++){seed(x);seed((height-1)*width+x);}
 for(let y=1;y<height-1;y++){seed(y*width);seed(y*width+width-1);}
 if(!tail)return unedited('NO_EXTERIOR_TRANSPARENCY');
 while(head<tail){
  const i=queue[head++],x=i%width;
  if(x)seed(i-1);
  if(x<width-1)seed(i+1);
  if(i>=width)seed(i-width);
  if(i<n-width)seed(i+width);
 }
 const radius=Math.max(2,Math.min(12,Math.ceil(Math.max(width,height)/250)));
 const far=radius+1,dist=new Uint8Array(n);
 for(let i=0;i<n;i++)dist[i]=outside[i]?0:far;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  if(x&&dist[i-1]+1<dist[i])dist[i]=dist[i-1]+1;
  if(y&&dist[i-width]+1<dist[i])dist[i]=dist[i-width]+1;
 }
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
  const i=y*width+x;
  if(x<width-1&&dist[i+1]+1<dist[i])dist[i]=dist[i+1]+1;
  if(y<height-1&&dist[i+width]+1<dist[i])dist[i]=dist[i+width]+1;
 }
 let changed=0;
 // Bound editing to the innermost opaque silhouette fringe only.
 for(let i=0;i<n;i++){
  if(alpha[i]<251||dist[i]>radius||dist[i]===0)continue;
  const next=Math.min(alpha[i],Math.round(alpha[i]*(.60+.40*(dist[i]-1)/radius)));
  if(next<alpha[i]){rgba[4*i+3]=next;changed++;}
 }
 // Reject a silhouette if the operation would thin too much real cloth:
 // use a second pass against an untouched copy in caller if the guard fails.
 return Object.freeze({changed,radiusNativePx:radius,solid,clear,partial,
  affectedOpaqueRatio:solid?changed/solid:0,
  mode:'review-only',ownerApproved:false,sourceRGBModified:false});
}
