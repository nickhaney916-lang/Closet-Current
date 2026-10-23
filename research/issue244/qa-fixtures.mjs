/**
 * Real 48x72 JPEG generated from a synthetic solid-color PIL canvas.
 * Tagged variants insert well-formed JPEG COM (FFFE) segments; every variant
 * decodes to the same synthetic solid pixels but has distinct ORIGINAL BYTES.
 * No photographs of real people/clothing, external image source or model call.
 */
const encoded=[
'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsU',
'FRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoK',
'Cg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3',
'Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABIADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAA',
'AAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAA',
'AAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCUAupIAAAA',
'AAAAAAAAAAAAAAAAAAAAAAAD/9k='
].join('');
if(encoded.length!==412)throw Error('Synthetic canonical JPG length changed');
function labeledJPEG(label){
 const raw=atob(encoded);
 if(label.length>24)throw Error('Synthetic image tag too long');
 const marker=String.fromCharCode(255,254,0,label.length+2)+label;
 // Insert JPEG COM after the complete 16-byte APP0 JFIF segment at byte 20.
 const altered=raw.slice(0,20)+marker+raw.slice(20);
 return 'data:image/jpeg;base64,'+btoa(altered);
}
export const syntheticJPEGs=Object.freeze({
 blue:labeledJPEG('synthetic-blue'),
 brown:labeledJPEG('synthetic-brown'),
 olive:labeledJPEG('synthetic-olive')
});
export const makeSyntheticPiece=(id,category,itemType,{
 image=syntheticJPEGs.blue,original=syntheticJPEGs.brown,
 outfitSourceId='capture-'+id,color='blue',cropIdentity=id
}={})=>({
 id,category,itemType,image,originalPhoto:{image:original},outfitSourceId,
 color,colorHex:null,pattern:'Solid',name:'Synthetic '+category+' '+id,cropIdentity
});
export function makeSyntheticCloset(){return [
 makeSyntheticPiece('top-1','Tops','T-shirt',{outfitSourceId:'shared-capture',original:syntheticJPEGs.brown,image:syntheticJPEGs.blue,color:'blue'}),
 makeSyntheticPiece('bottom-1','Bottoms','Jeans',{outfitSourceId:'shared-capture',original:syntheticJPEGs.brown,image:syntheticJPEGs.olive,color:'olive'}),
 makeSyntheticPiece('shoes-1','Shoes','Sneakers',{color:'brown'}),
 makeSyntheticPiece('top-2','Tops','Polo',{color:'brown'}),
 makeSyntheticPiece('jacket-1','Outerwear','Jacket',{color:'olive'}),
 makeSyntheticPiece('coat-1','Outerwear','Coat',{color:'brown'}),
 makeSyntheticPiece('dress-1','Dresses','Casual dress',{color:'blue'})
];}
