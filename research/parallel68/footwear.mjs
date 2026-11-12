// Split visibly disconnected footwear without deleting narrow source-mask
// fragments. This does not infer invisible boundaries or new garment labels.
export function splitFootwear68(mask,width,height){
 if(!(mask instanceof Uint8Array)||mask.length!==width*height||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Invalid source footwear mask');
 const seen=new Uint8Array(mask.length),components=[];let foreground=0;
 for(const value of mask){if(value!==0&&value!==1)throw Error('Nonbinary source mask');foreground+=value;}
 if(!foreground)return [mask];
 for(let start=0;start<mask.length;start++){
  if(!mask[start]||seen[start])continue;
  const queue=[start];seen[start]=1;let sx=0,sy=0;
  for(let head=0;head<queue.length;head++){
   const i=queue[head],x=i%width,y=Math.floor(i/width);sx+=x;sy+=y;
   for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])if(n>=0&&!seen[n]&&mask[n]){seen[n]=1;queue.push(n);}
  }
  components.push({pixels:queue,cx:sx/queue.length,cy:sy/queue.length});
 }
 const major=components.filter(x=>x.pixels.length>=Math.max(16,Math.ceil(foreground*.1)));
 if(major.length<2)return [mask];
 const output=major.map(c=>{const bits=new Uint8Array(mask.length);for(const i of c.pixels)bits[i]=1;return bits;});
 // A detached lace/edge stays with the nearest substantial component instead
 // of being erased or counted as another shoe.
 for(const component of components){
  if(major.includes(component))continue;
  let best=0,distance=Infinity;
  for(let j=0;j<major.length;j++){const d=(major[j].cx-component.cx)**2+(major[j].cy-component.cy)**2;if(d<distance){distance=d;best=j;}}
  for(const i of component.pixels)output[best][i]=1;
 }
 return output;
}
export function maskIntersection68(a,b){
 if(a.length!==b.length)throw Error('Mask dimensions differ');let intersection=0,union=0;
 for(let i=0;i<a.length;i++){if(a[i]&&b[i])intersection++;if(a[i]||b[i])union++;}
 return union?intersection/union:0;
}
export function postprocessFootwear68(regions,masks,width,height){
 if(regions.length!==masks.length)throw Error('Incomplete model masks');
 const proposals=[];
 for(let i=0;i<regions.length;i++){
  const region=regions[i],categories=region.categories||[region.category];
  const children=categories.includes('Shoes')?splitFootwear68(masks[i],width,height):[masks[i]];
  for(let child=0;child<children.length;child++){
   const existing=proposals.find(x=>x.categories.some(c=>categories.includes(c))&&maskIntersection68(x.mask,children[child])>=.85);
   if(existing){existing.duplicateEvidence.push({parentIndex:i,childIndex:child,label:region.label});continue;}
   proposals.push({...region,categories,mask:children[child],parentIndex:i,childIndex:child,parentSplitCount:children.length,duplicateEvidence:[],requiresReview:true,strong:false});
  }
 }
 return proposals;
}
