/** Generated solid-color 48x72 JPEGs, synthetic only, no customer data. */
const blue="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABIADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCUAupIAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k=";
const brown="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABIADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYBHXQAAAAAAAAAAAAAAAAAAAAAAAAAAAH/9k=";
const olive="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABIADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAIF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AqgM1IAAAAAAAAAAAAAAAAAAAAAAAAAAAD//Z";
export const syntheticJPEGs=Object.freeze({blue:'data:image/jpeg;base64,'+blue,brown:'data:image/jpeg;base64,'+brown,olive:'data:image/jpeg;base64,'+olive});
export const makeSyntheticPiece=(id,category,itemType,{image=syntheticJPEGs.blue,original=syntheticJPEGs.brown,outfitSourceId='capture-'+id,color='blue',cropIdentity=id}={})=>({
 id,category,itemType,image,originalPhoto:{image},outfitSourceId,color,colorHex:null,pattern:'Solid',name:'Synthetic '+category+' '+id,cropIdentity,
 ...{originalPhoto:{image:original}}
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
