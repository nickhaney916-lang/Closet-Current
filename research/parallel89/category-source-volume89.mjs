/** Dimensionless category-conditioned depth hypotheses, not anatomical
 * measurements. Existing source plane remains unchanged. Depth follows
 * indexed distance from the observed outline, never crosses a mask gap.
 */
import {createHash} from 'node:crypto';
import {buildAutomaticSourceVolume89} from './automatic-source-volume89.mjs';
const sha=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const hold={consumer3DAdmitted:false,physicalDepthMeasured:false,wearableFitProved:false,maskGroundTruthApproved:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
const refuse=(reason,identity={})=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...identity,...hold});
const profiles=Object.freeze({
 shirt:Object.freeze({cap:.12,falloff:.075}),
 blouse:Object.freeze({cap:.105,falloff:.065}),
 jeans:Object.freeze({cap:.09,falloff:.045}),
 skirt:Object.freeze({cap:.14,falloff:.075}),
 dress:Object.freeze({cap:.16,falloff:.08})
});
export function profileRearDepth89({category,positions,indices}={}){
 if(!Object.hasOwn(profiles,category)||!(positions instanceof Float32Array)||!(indices instanceof Uint32Array)||positions.length%3||indices.length%3||!positions.every(Number.isFinite))throw Error('invalid category or source geometry');
 const n=positions.length/3;
 if(n<3||n>100000||indices.length<3||indices.length>350000)throw Error('unbounded source geometry');
 const adjacent=Array.from({length:n},()=>new Set()),edges=new Map();
 let maxEdge=0;
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  if(a>=n||b>=n||c>=n||a===b||b===c||c===a)throw Error('invalid triangle');
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const k=u<v?u+':'+v:v+':'+u,e=edges.get(k);
   if(!e)edges.set(k,{u,v,count:1});else if(e.count===1&&e.u===v&&e.v===u)e.count=2;else throw Error('invalid oriented edge');
   adjacent[u].add(v);adjacent[v].add(u);
   maxEdge=Math.max(maxEdge,Math.hypot(positions[u*3]-positions[v*3],positions[u*3+1]-positions[v*3+1]));
  }
 }
 if(!Number.isFinite(maxEdge)||maxEdge<=0)throw Error('invalid edge scale');
 const hops=new Int32Array(n).fill(-1),q=new Uint32Array(n);let head=0,tail=0;
 for(const {u,v,count} of edges.values())if(count===1)for(const j of [u,v])if(hops[j]===-1){hops[j]=0;q[tail++]=j;}
 if(!tail)throw Error('outline missing');
 while(head<tail){const u=q[head++];for(const v of adjacent[u])if(hops[v]===-1){hops[v]=hops[u]+1;q[tail++]=v;}}
 if(tail!==n)throw Error('unreachable outline component');
 const {cap,falloff}=profiles[category],depths=new Float32Array(n);
 // All values are image-plane units, not centimeters. Shorter/narrower
 // connected regions remain shallower than broad interiors at equal scale.
 for(let i=0;i<n;i++)depths[i]=.02+cap*(1-Math.exp(-hops[i]*maxEdge/falloff));
 return {depths,hops,category,cap,falloff,edgeStepUpperBound:maxEdge};
}
export async function buildCategorySourceVolume89(args={}){
 try{
  const base=await buildAutomaticSourceVolume89(args);
  const identity={sourceId:base.sourceId,category:base.category,originalSHA256:base.originalSHA256};
  if(base.status!=='PROVISIONAL_SOURCE_VOLUME_RESEARCH_ONLY')return refuse(base.reason??'source-volume-refused',identity);
  const f=base.sourcePlane,t=base.topology,n=f.positions.length/3;
  const profile=profileRearDepth89({category:base.category,positions:f.positions,indices:f.indices});
  const positions=t.positions.slice();
  let min=Infinity,max=0;
  for(let i=0;i<n;i++){const d=profile.depths[i];if(!(d>=.019999&&d<=.02+profile.cap+1e-6))return refuse('profile-depth-out-of-bounds',identity);positions[(n+i)*3+2]=-d;min=Math.min(min,d);max=Math.max(max,d);}
  return {...base,status:'CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY',
   topology:{...t,positions,positionSHA256:sha(positions)},
   inferredNeutral:{...base.inferredNeutral,positions:positions.slice()},
   dimensionlessTrialDepth:null,dimensionlessDepthRange:[min,max],
   depthHypothesis:{method:'category-conditioned indexed outline hop distance',cap:profile.cap,falloff:profile.falloff,depthSHA256:sha(profile.depths),category:profile.category},
   anatomyRegionLabelsVerified:false,actualDepthRecovered:false,...hold};
 }catch{return refuse('category-volume-profile-failed');}
}
