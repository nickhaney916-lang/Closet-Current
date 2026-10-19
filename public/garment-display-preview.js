'use strict';
// The approved AI image is a DISPLAY ONLY asset, never a source/recognition photo.
// The current app does NOT request, accept or save generated images by itself.
// A future private user-controlled review flow can populate this record.
(function(root){
 const DATA_URI=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
 const sha=/^[a-f0-9]{64}$/;
 const type=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
 function isDataImage(s){return typeof s==='string'&&s.length>=90&&s.length<=10_000_000&&DATA_URI.test(s);}
 async function sourceHash(uri){
  if(!isDataImage(uri)||typeof root.crypto?.subtle?.digest!=='function'||typeof root.atob!=='function')
   return null; // fail closed in unsupported/insecure contexts
  const encoded=uri.slice(uri.indexOf(',')+1);
  let bytes;
  try{
    const raw=root.atob(encoded);
    bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  }catch{return null;}
  const digest=new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes));
  return [...digest].map(v=>v.toString(16).padStart(2,'0')).join('');
 }
 async function approved(item){
  const record=item?.normalizedPreview,review=record?.review;
  if(!item||!record||!review||!type.includes(item.category)
   ||record.previewOnly!==true||review.status!=='approved'
   ||review.approvedByOwner!==true||review.identityChecked!==true
   ||review.explicitVisualReview!==true
   ||typeof root.GarmentFidelityReview==='undefined'
   ||root.GarmentFidelityReview.evaluate(review.fidelity).approved!==true
   ||record.itemId!==String(item.id)||record.category!==item.category
   ||!sha.test(record.sourceSha256||'')||!sha.test(record.previewSha256||'')
   ||!isDataImage(item.image)||!isDataImage(record.image)
   ||record.image===item.image)
   return null;
  try{
   const [source,preview]=await Promise.all([sourceHash(item.image),sourceHash(record.image)]);
   if(source!==record.sourceSha256||preview!==record.previewSha256)return null;
  }catch{return null;}
  // This is a user-reviewed representation, NOT independently verified fidelity
  // or proof of model accuracy. Source photo never changes.
  return record.image;
 }
 root.GarmentDisplayPreview={isDataImage,sourceHash,approved};
 if(typeof module!=='undefined')module.exports=root.GarmentDisplayPreview;
})(typeof window!=='undefined'?window:globalThis);
