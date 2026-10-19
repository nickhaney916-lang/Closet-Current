// Scene provenance/shape gate for the revised ORIGINAL procedural shoes.
// Geometry evidence is not an artistic, anatomical, or product approval.
export function checkProceduralFootwear(figure){
 if(!figure||figure.footwearGeometry!=='procedural-rounded-upper-contoured-outsole-three-laces-per-shoe'||
  figure.shoeUpperCount!==2||figure.shoeOutsoleCount!==2||
  figure.shoeLaceStrokeCount!==6||figure.blockPrimitiveFootwear!==false)
  throw Error('Footwear still uses old blocks or required original shoe parts are missing');
 if(figure.visualApproved!==false||figure.commercialProductApproval!==false)
  throw Error('Procedural geometry cannot imply production approval');
 return Object.freeze({actualScenePartCountsVerified:true,
  footwearStyle:'procedural rounded 3D prototype',sourcePhotosChanged:false,
  commercialProductApproved:false,photorealismVerified:false});
}
