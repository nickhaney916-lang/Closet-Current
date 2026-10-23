/** Local research boundary. Authority comes from caller callbacks, NOT owner-ID fields. */
const frames=new WeakMap(),slots=new Set(['top','bottom','shoes','layer','layer2','layer3']);
const signature=v=>JSON.stringify({selected:v.selected,colors:v.colors,hasDress:!!v.hasDress});
function selection(value){
 if(value?.placeholderOnly!==true||!Array.isArray(value.selected)||!value.selected.length||value.selected.length>6)throw Error('Verified selection contract required');
 const copy=structuredClone(value),ids=new Set(),usedSlots=new Set(),sources=new Set();
 for(const r of copy.selected){
  if(!slots.has(r?.slot)||typeof r.itemId!=='string'||!r.itemId||typeof r.sourceIdentity!=='string'||!r.sourceIdentity||!/^[a-f0-9]{64}$/.test(r.sourceVersion||''))throw Error('Verified SHA-256 source identity required');
  if(ids.has(r.itemId)||usedSlots.has(r.slot))throw Error('Duplicate selected garment');ids.add(r.itemId);usedSlots.add(r.slot);
  const sourceKey=JSON.stringify([r.sourceIdentity,r.sourceVersion,r.cropBounds||{x:0,y:0,width:1,height:1}]);
  if(sources.has(sourceKey))throw Error('Duplicate original/crop projection');sources.add(sourceKey);
  const c=copy.colors?.[r.slot];if(!Array.isArray(c)||c.length!==4||c.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Verified color required');
  if(r.slot==='top'&&!['Tops','Dresses'].includes(r.category)||r.slot==='bottom'&&r.category!=='Bottoms'||r.slot==='shoes'&&r.category!=='Shoes'||['layer','layer2','layer3'].includes(r.slot)&&!['Tops','Outerwear'].includes(r.category))throw Error('Incompatible selected category');
 }
 if(!!copy.hasDress!==copy.selected.some(r=>r.slot==='top'&&r.category==='Dresses'))throw Error('Dress contract mismatch');
 if(copy.hasDress&&copy.selected.some(r=>!['top','shoes'].includes(r.slot)))throw Error('Dress conflicts with separates/layers');
 return copy;
}
export function cropOriginalRGBA(image,bounds={x:0,y:0,width:1,height:1},maxEdge=1024){
 const {width,height,data}=image||{};
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>8192||height>8192||width*height>24_000_000||
  !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||data.length!==width*height*4||
  !bounds||![bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite)||bounds.x<0||bounds.y<0||bounds.width<=0||bounds.height<=0||bounds.x+bounds.width>1||bounds.y+bounds.height>1||
  !Number.isInteger(maxEdge)||maxEdge<16||maxEdge>1024)throw Error('Invalid original RGBA/crop');
 const left=Math.floor(bounds.x*width),top=Math.floor(bounds.y*height),right=Math.min(width,Math.ceil((bounds.x+bounds.width)*width)),bottom=Math.min(height,Math.ceil((bounds.y+bounds.height)*height));
 const nativeWidth=right-left,nativeHeight=bottom-top,scale=Math.min(1,maxEdge/Math.max(nativeWidth,nativeHeight)),w=Math.max(1,Math.round(nativeWidth*scale)),h=Math.max(1,Math.round(nativeHeight*scale));
 const rgba=new Uint8Array(w*h*4);let visible=0;const minimum=[255,255,255],maximum=[0,0,0];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const xx=left+Math.min(nativeWidth-1,Math.floor((x+.5)*nativeWidth/w)),yy=top+Math.min(nativeHeight-1,Math.floor((y+.5)*nativeHeight/h)),src=(yy*width+xx)*4,dst=(y*w+x)*4;
  rgba.set(data.subarray(src,src+4),dst);
  if(data[src+3]>=224){visible++;for(let c=0;c<3;c++){minimum[c]=Math.min(minimum[c],data[src+c]);maximum[c]=Math.max(maximum[c],data[src+c]);}}
 }
 if(visible<Math.min(16,w*h)||maximum.every((v,c)=>v-minimum[c]<3))throw Error('Blank/transparent source requires 2D review');
 return {rgba,width:w,height:h,nativeCrop:{left,top,width:nativeWidth,height:nativeHeight},downsampled:scale<1,originalPixelsOnly:true};
}
export async function decodeLocalOriginal(bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>16_000_000)throw Error('Bounded original bytes required');
 const jpeg=bytes[0]===255&&bytes[1]===216,png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 if(!jpeg&&!png)throw Error('Original JPEG/PNG required');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:jpeg?'image/jpeg':'image/png'}));
 try{
  if(bitmap.width>8192||bitmap.height>8192||bitmap.width*bitmap.height>24_000_000)throw Error('Original decode exceeds budget');
  const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
  return {width:bitmap.width,height:bitmap.height,data:ctx.getImageData(0,0,bitmap.width,bitmap.height).data};
 }finally{bitmap.close();}
}
export function getVerifiedPhotoFrame(token){
 const data=frames.get(token);
 if(data&&!data.revoked&&data.current()!==true){data.revoked=true;for(const m of data.materials)m.rgba.fill(0);}
 if(!data||data.revoked)throw Error('Revoked/unverified photo frame');return data;
}
export function createPhotoTextureSession({verifySelection,readOriginal,isCurrent,decodeOriginal=decodeLocalOriginal,cryptoProvider=globalThis.crypto}={}){
 if(typeof verifySelection!=='function'||typeof readOriginal!=='function'||typeof isCurrent!=='function'||typeof decodeOriginal!=='function'||!cryptoProvider?.subtle?.digest)throw Error('Authoritative verifier, original reader and current-scope guard required');
 let epoch=0,disposed=false,live=[];
 const revoke=()=>{for(const m of live)m.rgba.fill(0);live=[];};
 const scope=v=>{try{return !disposed&&isCurrent(v)===true;}catch{return false;}};
 return {
  invalidate(){epoch++;revoke();},dispose(){epoch++;disposed=true;revoke();},
  async prepare(board){
   if(disposed)throw Error('Texture session disposed');const request=++epoch;revoke();
   const verified=selection(await verifySelection(board)),stamp=signature(verified),materials=[];
   const current=()=>request===epoch&&scope(verified);
   const guard=()=>{if(!current())throw Error('Account or source selection changed');};
   guard();
   try{
    for(const ref of verified.selected){
     const supplied=await readOriginal(Object.freeze({...ref}));guard();
     if(!(supplied instanceof Uint8Array)||!supplied.length||supplied.byteLength>16_000_000)throw Error('Bounded original bytes required');
     const bytes=new Uint8Array(supplied),digest=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes));guard();
     const hash=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');if(hash!==ref.sourceVersion)throw Error('Original source version changed');
     const image=await decodeOriginal(bytes);guard();
     const texture=cropOriginalRGBA(image,ref.cropBounds);guard();
     materials.push({...texture,slot:ref.slot,itemId:ref.itemId,sourceIdentity:ref.sourceIdentity,sourceVersion:hash});
    }
    const final=selection(await verifySelection(board));guard();if(signature(final)!==stamp)throw Error('Verified selection changed during decode');
    const token=Object.freeze({sourceCount:materials.length,estimatedSurfaces:true,physicalFitVerified:false});
    live=materials;frames.set(token,{selected:verified.selected,colors:verified.colors,materials,current});return token;
   }catch(error){if(request===epoch)epoch++;for(const m of materials)m.rgba.fill(0);throw error;}
  }
 };
}
