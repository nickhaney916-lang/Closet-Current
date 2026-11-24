/** Offline evaluator; supplied views never become generator inputs. */
import {createHash} from 'node:crypto';
import sharp from 'sharp';

export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const roles=new Set(['front','side','rear','oblique']);
const hash=/^[0-9a-f]{64}$/;

export async function verifyCohort(objects,readPhoto,inheritedHashes=new Set()){
 const seen=new Set(inheritedHashes),media=new Set(),identities=new Set();
 for(const object of objects){
  const key=JSON.stringify([object.institution,object.accession,object.part]);
  if(identities.has(key)||!object.institution||!object.accession||!object.part||
     !object.recordURL.startsWith('https://')||object.tuningEligible!==false)
   throw Error('invalid or repeated held-out object');
  identities.add(key);
  const fronts=object.views.filter(view=>view.role==='front');
  if(fronts.length!==1||!object.views.some(view=>view.role==='side'||view.role==='rear'))
   throw Error('cohort requires one front and at least one alternate view');
  const directions=new Set();
  for(const view of object.views){
   if(view.objectRecord!==object.recordURL||view.part!==object.part||!roles.has(view.role)||
      directions.has(view.role)||media.has(view.mediaId)||!view.mediaId||
      !['CC0','Public Domain'].includes(view.license)||!view.rightsURL.startsWith('https://')||
      !view.photoURL.startsWith('https://')||!hash.test(view.sha256)||seen.has(view.sha256))
    throw Error('invalid view provenance, component, rights, or custody');
   directions.add(view.role);media.add(view.mediaId);seen.add(view.sha256);
   const bytes=await readPhoto(view);
   if(sha256(bytes)!==view.sha256)throw Error('original byte receipt mismatch');
   const metadata=await sharp(bytes).metadata();
   if(metadata.format!=='jpeg'||metadata.width!==view.width||metadata.height!==view.height)
    throw Error('original JPEG dimensions mismatch');
  }
 }
 return objects.map(object=>({
  accession:object.accession,part:object.part,
  input:object.views.find(view=>view.role==='front'),
  heldOut:object.views.filter(view=>view.role!=='front')
 }));
}

function outlineDistances(mask,width,height){
 const edge=new Uint8Array(mask.length),distance=new Int32Array(mask.length).fill(-1);
 const queue=new Int32Array(mask.length);
 let read=0,write=0;
 const neighbors=i=>{
  const x=i%width;
  return [x>0?i-1:-1,x<width-1?i+1:-1,i>=width?i-width:-1,i+width<mask.length?i+width:-1];
 };
 for(let i=0;i<mask.length;i++){
  if(mask[i]!==1||!neighbors(i).some(j=>j<0||mask[j]===0))continue;
  edge[i]=1;distance[i]=0;queue[write++]=i;
 }
 while(read<write){
  const i=queue[read++];
  for(const j of neighbors(i)){
   if(j<0||distance[j]>=0)continue;
   distance[j]=distance[i]+1;queue[write++]=j;
  }
 }
 return {edge,distance};
}

/** Masks must already be in the independently registered photographic frame.
 * Evaluation never stretches, centers or optimizes against held-out pixels.
 */
export function compareRegistered({reference,projection,uncertain,width,height,registration,source,projectionSHA256}){
 const blocked=reason=>({status:'BLOCKED',reason,physicalDepthVerified:false,wearableFitVerified:false});
 if(!source||!['side','rear'].includes(source.role)||registration?.status!=='independently-registered'||
    registration?.viewSHA256!==source.sha256||registration?.view!==source.role||
    registration?.projectionSHA256!==projectionSHA256||!hash.test(projectionSHA256)||
    !registration?.reviewReceipt||registration.width!==width||registration.height!==height)
  return blocked('independent pose, view and pixel-frame registration required');
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width*height>1_000_000||
    ![reference,projection,uncertain].every(mask=>mask instanceof Uint8Array&&
    mask.length===width*height&&mask.every(value=>value===0||value===1))||
    sha256(reference)!==registration.referenceMaskSHA256||
    sha256(uncertain)!==registration.uncertaintyMaskSHA256||
    sha256(projection)!==projectionSHA256) return blocked('invalid or altered mask receipt');
 let intersection=0,union=0,uncertainPixels=0;
 for(let i=0;i<reference.length;i++){
  if(uncertain[i]){uncertainPixels++;continue;}
  intersection+=Number(reference[i]&&projection[i]);
  union+=Number(reference[i]||projection[i]);
 }
 if(!union)return blocked('registered foreground not observable');
 // Whole-mask boundaries may straddle uncertain regions. Withhold the
 // distance score instead of treating uncertain neighbors as background.
 let boundaryL1MeanPixels=null;
 if(!uncertainPixels){
  const a=outlineDistances(reference,width,height),b=outlineDistances(projection,width,height);
  if(a.edge.some(Boolean)&&b.edge.some(Boolean)){
   let sum=0,count=0;
   for(let i=0;i<a.edge.length;i++){
    if(a.edge[i]){sum+=b.distance[i];count++;}
    if(b.edge[i]){sum+=a.distance[i];count++;}
   }
   boundaryL1MeanPixels=sum/count;
  }
 }
 return {status:'REGISTERED_SILHOUETTE_DIAGNOSTIC',iou:intersection/union,
  boundaryL1MeanPixels,uncertainPixels,intersection,union,
  humanApprovedMask:registration.maskReview==='independent-human',
  physicalDepthVerified:false,wearableFitVerified:false};
}
