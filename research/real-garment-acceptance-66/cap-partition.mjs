/** Preserve original source triangles when a separate shoulder panel is too
 * small to retessellate. No new surface, photograph, UV or skin weight is made.
 */
export function partitionSourceCapFaces66(chosen,{minimumFaces=20}={}){
 if(!(chosen instanceof Map)||!Number.isInteger(minimumFaces)||minimumFaces<1)
  throw Error('P66 invalid source shoulder partition');
 const excluded=new Set(),retained=new Set(),seen=new Set();
 for(const [side,faces] of chosen){
  if(!['L','R'].includes(side)||!Array.isArray(faces))throw Error('P66 invalid cap role');
  for(const face of faces){
   if(!Number.isInteger(face?.at)||face.at<0||face.at%3||seen.has(face.at))
    throw Error('P66 duplicated or invalid source triangle');
   seen.add(face.at);
   (faces.length>=minimumFaces?excluded:retained).add(face.at);
  }
 }
 return {excluded,retained,sourceSelectedFaces:seen.size,
  rebuiltFaces:excluded.size,originalFacesRetained:retained.size};
}
