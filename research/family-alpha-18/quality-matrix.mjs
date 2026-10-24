import {syntheticScene,garmentCases} from '../family-alpha-16/synthetic-scenes.mjs';
import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';
import {createHash} from 'node:crypto';

// Category labels are supplied fixtures, NOT measured model recognition accuracy.
export function qualityMatrix(){
 const rows=[];
 for(const [kind,category] of garmentCases)for(const mode of ['plain','wrinkled','busy','clipped','blank','white','dark','blurry','shadow']){
  const scene=syntheticScene(kind,{mode:mode==='shadow'?'plain':mode});
  if(mode==='shadow')for(let y=0;y<scene.frame.height;y++)for(let x=0;x<scene.frame.width;x++){
   const p=4*(y*scene.frame.width+x);
   if(x<scene.frame.width/2)for(let c=0;c<3;c++)scene.frame.data[p+c]=Math.round(scene.frame.data[p+c]*.6);
  }
  const before=createHash('sha256').update(scene.frame.data).digest('hex');
  const result=prepareSyntheticGarmentOriginal(scene.frame,{category,sourceIdentity:'synthetic-'+kind,sourceVersion:before});
  const retained=before===createHash('sha256').update(scene.frame.data).digest('hex');
  rows.push({kind,mode,suppliedCategory:category,status:result.status,reason:result.reason||null,
   originalUnchanged:retained,autoSaved:result.autoSaved,hasDerivative:result.status==='prepared',
   recognitionMeasured:false,humanApproval:false});
 }
 return rows;
}
