/** Source-relative integrity, never independent human segmentation truth.
 * Bounded, symmetric 4-neighbour boundary distances in registered raster pixels.
 * A small lost cuff can have high area IoU yet a large local boundary error.
 */
const fail=message=>{throw Error('PARALLEL66 '+message);};
function boundary(p,w,h){
 // Internal pinholes belong to P191/P192/P194. Only background connected
 // to the frame defines this exterior-edge metric; tiny pinholes must not
 // become distant new outer edges.
 for(const v of p)if(v!==0&&v!==1)fail('binary masks required');
 const exterior=new Uint8Array(p.length),q=new Int32Array(p.length);
 let head=0,tail=0;
 const add=i=>{if(!p[i]&&!exterior[i]){exterior[i]=1;q[tail++]=i;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
 for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){const i=q[head++],x=i%w,y=Math.floor(i/w);
  if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);
 }
 const edge=new Uint8Array(p.length);let count=0;
 for(let i=0;i<p.length;i++){
  if(p[i]!==0&&p[i]!==1)fail('binary masks required');
  if(!p[i])continue;
  const x=i%w,y=Math.floor(i/w);
  if(!x||!y||x===w-1||y===h-1||exterior[i-1]||exterior[i+1]||exterior[i-w]||exterior[i+w]){
   edge[i]=1;count++;
  }
 }
 if(!count)fail('empty garment boundary');
 return {edge,count};
}
function distances(edge,w,h){
 const d=new Int32Array(edge.length).fill(-1),q=new Int32Array(edge.length);
 let head=0,tail=0;
 for(let i=0;i<edge.length;i++)if(edge[i]){d[i]=0;q[tail++]=i;}
 while(head<tail){
  const i=q[head++],x=i%w,y=Math.floor(i/w);
  for(const j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])
   if(j>=0&&d[j]<0){d[j]=d[i]+1;q[tail++]=j;}
 }
 return d;
}
export function measureRegisteredBoundaries66({sourcePixels,ownerPixels,width,height,tolerance=2}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||
  width>192||height>192||!(sourcePixels instanceof Uint8Array)||
  !(ownerPixels instanceof Uint8Array)||sourcePixels.length!==width*height||
  ownerPixels.length!==width*height||!Number.isInteger(tolerance)||tolerance<0||tolerance>16)
  fail('bounded registered binary raster required');
 const a=boundary(sourcePixels,width,height),b=boundary(ownerPixels,width,height);
 const da=distances(a.edge,width,height),db=distances(b.edge,width,height);
 const directed=(edge,d)=>{
  let hit=0,sum=0,max=0,n=0;
  for(let i=0;i<edge.length;i++)if(edge[i]){
   const v=d[i];n++;sum+=v;max=Math.max(max,v);if(v<=tolerance)hit++;
  }
  return {hit,total:n,mean:sum/n,max};
 };
 const recall=directed(a.edge,db),precision=directed(b.edge,da);
 const r=recall.hit/recall.total,p=precision.hit/precision.total;
 return Object.freeze({schema:'registered-boundary-integrity-66/v1',
  distanceMetric:'exterior-four-neighbour-Manhattan-raster-pixels',tolerancePixels:tolerance,
  sourceBoundaryPixels:a.count,ownerBoundaryPixels:b.count,
  sourceBoundaryMatched:recall.hit,ownerBoundaryMatched:precision.hit,
  sourceBoundaryRecall:r,ownerBoundaryPrecision:p,boundaryF1:p+r?2*p*r/(p+r):0,
  meanSymmetricDistancePixels:(recall.mean+precision.mean)/2,
  maxDistancePixels:Math.max(recall.max,precision.max),
  maxDistanceFraction:Math.max(recall.max,precision.max)/Math.max(width,height),
  independentGroundTruth:false,photographTo3DAccuracy:null,releaseAuthorized:false});
}
export function verifyRegisteredBoundaries66(input){
 const result=measureRegisteredBoundaries66(input);
 // Integrity envelope only. Keep area, topology, local and hairline gates.
 if(result.maxDistanceFraction>.08)fail('localized source boundary loss exceeds 8 percent raster envelope');
 return result;
}
