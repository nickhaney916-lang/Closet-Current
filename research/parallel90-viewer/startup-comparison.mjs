import assert from 'node:assert/strict';
import sharp from 'sharp';
/** RGB threshold matching the existing source review comparisons, not human fidelity approval. */
export async function compareSourceFrames90(a,b){
 const [x,y]=await Promise.all([a,b].map(v=>sharp(v).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
 assert.equal(x.info.width,y.info.width);assert.equal(x.info.height,y.info.height);
 let changedAbove8=0,maxDelta=0,changedExact=0;
 for(let i=0;i<x.data.length;i+=4){
  let delta=0;for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(x.data[i+c]-y.data[i+c]));
  if(delta>8)changedAbove8++;if(delta>0)changedExact++;maxDelta=Math.max(maxDelta,delta);
 }
 assert.equal(changedAbove8,0,'startup change altered final source-frame RGB by more than 8');
 return {width:x.info.width,height:x.info.height,changedAbove8,changedExact,maxDelta};
}
