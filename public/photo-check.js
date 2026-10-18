'use strict';
// Deliberately narrow checks: flat frames can be skipped, visual lookalikes
// need review because similar garments are not necessarily duplicates.
function photoQuality(pixels){
 const rgb=[],sums=[0,0,0],squares=[0,0,0],mins=[255,255,255],maxs=[0,0,0];
 for(let i=0;i<pixels.length;i+=4)for(let c=0;c<3;c++){
  const value=pixels[i+c];rgb.push(value);sums[c]+=value;squares[c]+=value*value;mins[c]=Math.min(mins[c],value);maxs[c]=Math.max(maxs[c],value);
 }
 const count=pixels.length/4;
 const flat=count>0&&sums.every((sum,c)=>Math.sqrt(Math.max(0,squares[c]/count-(sum/count)**2))<1.2&&maxs[c]-mins[c]<6);
 return {blank:!count||flat,signature:rgb};
}
function similarPhotos(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return false;
 let total=0;
 for(let i=0;i<a.length;i++)total+=Math.abs(a[i]-b[i]);
 return total/a.length<=2.5;
}
async function checkPhoto(image){
 const decoded=new Image();decoded.src=image;let timeout;
 try{await Promise.race([decoded.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Photo decoding timed out.')),15000);})]);}finally{clearTimeout(timeout);}
 if(!decoded.width||!decoded.height)throw Error('The photo could not be decoded.');
 const sample=document.createElement('canvas');sample.width=16;sample.height=16;
 const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(decoded,0,0,16,16);
 const pixels=ctx.getImageData(0,0,16,16).data;
 const primary=window.PhotoColor?.estimate(pixels,16,16)||null;
 // Keep confident colored readings. A white center can be the product-photo
 // backdrop rather than the garment, so verify only that case with the
 // conservative, independently confirmed foreground palette.
 let colorEstimate=primary;
 const mayBeWhiteBackdrop=primary?.color==='White'&&!primary.needsConfirmation;
 if(!primary||primary.needsConfirmation||mayBeWhiteBackdrop){
  const colorCanvas=document.createElement('canvas');colorCanvas.width=64;colorCanvas.height=64;
  const colorCtx=colorCanvas.getContext('2d',{willReadFrequently:true});
  colorCtx.drawImage(decoded,0,0,64,64);
  const separated=window.PhotoColor?.uniformLightBackgroundPalette?.(colorCtx.getImageData(0,0,64,64).data,64,64);
  if(separated)colorEstimate=separated;
 }
 return {...photoQuality(pixels),colorEstimate,aspect:decoded.width/decoded.height};
}
