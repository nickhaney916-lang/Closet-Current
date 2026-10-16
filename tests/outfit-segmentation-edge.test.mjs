import test from 'node:test';
import assert from 'node:assert/strict';
import {cropClothingPhotoPixels,isolateClothingPixels,clothingCropBounds} from '../public/outfit-segmentation.mjs';

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
