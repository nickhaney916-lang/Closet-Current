import test from 'node:test';
import assert from 'node:assert/strict';
import {cropClothingPhotoPixels,isolateClothingPixels,clothingCropBounds,conservativeEdgeMask,connectedEdgeMask} from '../public/outfit-segmentation.mjs';

function fixture(){
 const width=96,height=96,channels=3,data=new Uint8ClampedArray(width*height*channels);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*3;const garment=x>=24&&x<=71&&y>=10&&y<=85;data[i]=garment?40:220;data[i+1]=garment?70:220;data[i+2]=garment?110:220;}
 const labels=new Uint8Array(24*24),selected=new Uint8Array(24*24);
 for(let y=3;y<=20;y++)for(let x=6;x<=17;x++){selected[y*24+x]=1;labels[y*24+x]=4;}
 const map={width:24,height:24,labels},group={selected,bounds:{left:6,top:3,right:18,bottom:21}};
 return {image:{width,height,channels,data},map,group};
}

test('unmasked original crop retains full source detail and surrounding edge pixels',()=>{
 const {image,map,group}=fixture(),result=cropClothingPhotoPixels(image,map,group),b=clothingCropBounds(image,map,group);
 assert.equal(result.width,b.width);assert.equal(result.height,b.height);
 for(let y=0;y<result.height;y++)for(let x=0;x<result.width;x++){
  const a=(y*result.width+x)*3,o=((y+b.top)*image.width+x+b.left)*3;
  for(let c=0;c<3;c++)assert.equal(result.data[a+c],image.data[o+c]);
 }
});
test('white background isolated crop does not overwrite source pixels inside selected mask',()=>{
 const {image,map,group}=fixture(),out=isolateClothingPixels(image,map,group);
 let retained=0,removed=0;
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
  const px=x+out.bounds.left,py=y+out.bounds.top,m=Math.floor(py/4)*24+Math.floor(px/4),i=(y*out.width+x)*3;
  if(group.selected[m]){assert.equal(out.data[i],40);retained++;}
  else{assert.equal(out.data[i],255);removed++;}
 }
 assert.ok(retained>0&&removed>0);
});
test('thin boundary areas are measured separately from original crop',()=>{
 const {image,map,group}=fixture(),raw=cropClothingPhotoPixels(image,map,group),white=isolateClothingPixels(image,map,group);
 let removedGarmentPixels=0;
 for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){
  const i=(y*raw.width+x)*3;
  if(raw.data[i]===40&&white.data[i]===255)removedGarmentPixels++;
 }
 assert.ok(Number.isInteger(removedGarmentPixels));
 // Diagnostic, not a claim of correctness: tests cannot infer exact
 // garment edges from an unlabeled real-world photograph.
 console.log('EDGE_MASK_DIAGNOSTIC '+JSON.stringify({removedGarmentPixels,sourceWidth:image.width,sourceHeight:image.height}));
});

test('thin garment extremities expose coarse-mask recall losses without altering recognition source',()=>{
 const cases=[
  {name:'thin shoulder strap',rects:[[34,5,38,25],[24,25,72,79]]},
  {name:'extended sleeve cuff',rects:[[12,30,84,62],[8,42,88,51]]},
  {name:'dress hem',rects:[[36,8,60,65],[19,65,77,87]]},
  {name:'shoe sole',rects:[[18,40,75,62],[12,62,83,67]]}
 ];
 const observations=[];
 for(const entry of cases){
  const width=96,height=96,data=new Uint8ClampedArray(width*height*3);
  data.fill(220);const truth=new Uint8Array(width*height);
  for(const [x0,y0,x1,y1] of entry.rects)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   truth[y*width+x]=1;const i=(y*width+x)*3;data[i]=40;data[i+1]=70;data[i+2]=110;
  }
  const selected=new Uint8Array(24*24);
  // Coarse segmentation recognizes the garment core but clips narrow details.
  for(let y=7;y<19;y++)for(let x=7;x<17;x++)selected[y*24+x]=1;
  const group={selected,bounds:{left:4,top:1,right:22,bottom:23}};
  const map={width:24,height:24};
  const image={width,height,channels:3,data};
  const isolated=isolateClothingPixels(image,map,group);
  const raw=cropClothingPhotoPixels(image,map,group);
  let visible=0,total=0,originalRetained=0;
  for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){
   const xx=x+raw.bounds.left,yy=y+raw.bounds.top;
   if(!truth[yy*width+xx])continue;
   total++;
   const i=(y*raw.width+x)*3;
   if(isolated.data[i]===40)visible++;
   if(raw.data[i]===40)originalRetained++;
  }
  assert.ok(total>0&&originalRetained===total);
  const recall=visible/total;
  assert.ok(recall<1,entry.name+' should reveal missing thin boundary fabric in coarse mask');
  observations.push({garment:entry.name,visibleFabricPixels:visible,groundTruthFabricPixels:total,maskRecall:Number(recall.toFixed(4)),sourceCropRecall:1});
 }
 console.log('GARMENT_EDGE_RECALL '+JSON.stringify(observations));
});

test('conservative edge recovery measures recall against background contamination',()=>{
 const cases=[
  {name:'shoulder strap',rects:[[34,5,38,25],[24,25,72,79]]},
  {name:'sleeve cuff',rects:[[12,30,84,62],[8,42,88,51]]},
  {name:'dress hem',rects:[[36,8,60,65],[19,65,77,87]]},
  {name:'shoe sole',rects:[[18,40,75,62],[12,62,83,67]]}
 ];
 const report=[];
 for(const item of cases){
  const width=96,height=96,truth=new Uint8Array(width*height),pixels=new Uint8ClampedArray(width*height*3);
  pixels.fill(220);
  for(const [x0,y0,x1,y1] of item.rects)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   truth[y*width+x]=1;const i=(y*width+x)*3;pixels[i]=40;pixels[i+1]=70;pixels[i+2]=110;
  }
  const selected=new Uint8Array(24*24);
  for(let y=7;y<19;y++)for(let x=7;x<17;x++)selected[y*24+x]=1;
  const image={width,height,channels:3,data:pixels},map={width:24,height:24},group={selected,id:4};
  const proposed=conservativeEdgeMask(image,map,group);
  function score(mask){
   let positives=0,retained=0,backgroundIncluded=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const isFabric=truth[y*width+x]===1,kept=mask[Math.floor(y/4)*24+Math.floor(x/4)]===1;
    if(isFabric){positives++;if(kept)retained++;}else if(kept)backgroundIncluded++;
   }
   return {recall:Number((retained/positives).toFixed(4)),backgroundPixels:backgroundIncluded};
  }
  const original=score(selected),candidate=score(proposed);
  assert.ok(candidate.recall>=original.recall,'recovery must not reduce garment recall');
  assert.ok(candidate.backgroundPixels<=original.backgroundPixels+384,'recovery must limit background exposure');
  report.push({garment:item.name,original,candidate});
 }
 console.log('CONSERVATIVE_EDGE_COMPARISON '+JSON.stringify(report));
});

test('connected edge recovery compares radius and background leakage on four garment outlines',()=>{
 const cases=[
  ['shoulder strap',[[34,5,38,25],[24,25,72,79]]],
  ['sleeve cuff',[[12,30,84,62],[8,42,88,51]]],
  ['dress hem',[[36,8,60,65],[19,65,77,87]]],
  ['shoe sole',[[18,40,75,62],[12,62,83,67]]]
 ];
 const results=[];
 for(const [name,rectangles] of cases){
  const width=96,height=96,truth=new Uint8Array(width*height),data=new Uint8ClampedArray(width*height*3);data.fill(220);
  for(const [a,b,c,d] of rectangles)for(let y=b;y<d;y++)for(let x=a;x<c;x++){
   const i=y*width+x;truth[i]=1;data[3*i]=40;data[3*i+1]=70;data[3*i+2]=110;
  }
  const seed=new Uint8Array(24*24);
  for(let y=7;y<19;y++)for(let x=7;x<17;x++)seed[y*24+x]=1;
  const image={width,height,channels:3,data},map={width:24,height:24},group={selected:seed,id:4};
  const measured=[];
  for(const steps of [0,1,2,3,4]){
   const mask=connectedEdgeMask(image,map,group,{maxSteps:steps});
   let retained=0,total=0,contamination=0;
   for(let i=0;i<truth.length;i++){
    const x=i%width,y=Math.floor(i/width),keep=mask[Math.floor(y/4)*24+Math.floor(x/4)]===1;
    if(truth[i]){total++;if(keep)retained++;}else if(keep)contamination++;
   }
   measured.push({steps,recall:Number((retained/total).toFixed(4)),backgroundPixels:contamination});
  }
  for(let i=1;i<measured.length;i++)assert.ok(measured[i].recall>=measured[i-1].recall);
  results.push({garment:name,measured});
 }
 console.log('CONNECTED_EDGE_SWEEP '+JSON.stringify(results));
});
