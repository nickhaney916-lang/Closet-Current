/** Exact attribute deduplication for WebGL 1. No quantization or seam welding. */
export function indexPhotoMesh(vertices){
 if(!(vertices instanceof Float32Array)||!vertices.length||vertices.length%24||vertices.length/8>1_000_000||!vertices.every(Number.isFinite))throw Error('Bounded finite triangle attributes required');
 const bits=new Uint32Array(vertices.buffer,vertices.byteOffset,vertices.length),seen=new Map(),unique=[],indices=new Uint16Array(vertices.length/8);
 for(let i=0;i<vertices.length;i+=8){
  // Position, normal and UV bits all participate. Preserve hard edges and UV seams.
  const key=Array.from(bits.subarray(i,i+8)).join('/');let index=seen.get(key);
  if(index===undefined){index=unique.length/8;if(index>=65536)throw Error('WebGL 1 mesh index budget exceeded');seen.set(key,index);for(let j=0;j<8;j++)unique.push(vertices[i+j]);}
  indices[i/8]=index;
 }
 return {vertices:new Float32Array(unique),indices,sourceVertexCount:vertices.length/8};
}
