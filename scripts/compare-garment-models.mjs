import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {decodeReferenceMask} from '../benchmark/garment-mask-metrics.mjs';
import {lowerFootwearDisagreement} from '../benchmark/lower-footwear-disagreement.mjs';
export function compareGarmentMasks(a,b){
 if(a.width!==b.width||a.height!==b.height||a.sourceSha256!==b.sourceSha256)throw Error('Different source photos or dimensions');
 const x=decodeReferenceMask(a),y=decodeReferenceMask(b);let both=0,segformerOnly=0,modnetOnly=0;
 for(let i=0;i<x.length;i++){if(x[i]&&y[i])both++;else if(x[i])segformerOnly++;else if(y[i])modnetOnly++;}
 const union=both+segformerOnly+modnetOnly;
 return {both,segformerOnly,modnetOnly,union,agreementIoU:union?both/union:1,notAccuracy:true};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const segDir=process.argv[2]||'benchmark/segmentation-predictions',modDir=process.argv[3]||'benchmark/modnet-predictions',dest=process.argv[4]||'benchmark/model-disagreements';
 await mkdir(dest,{recursive:true});
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 const results=[];
 for(const item of manifest.cases){
  const seg=JSON.parse(await readFile(join(segDir,item.id+'.prediction.json'),'utf8'));
  const mod=JSON.parse(await readFile(join(modDir,item.id+'.modnet-prediction.json'),'utf8'));
  const compare=compareGarmentMasks(seg,mod);
  results.push({id:item.id,...compare,lowerFootwear:['commons-0079','commons-0094'].includes(item.id)?lowerFootwearDisagreement(seg,mod):null});
  console.log('MASK_DISAGREEMENT '+JSON.stringify(results.at(-1)));
 }
 await writeFile(join(dest,'summary.json'),JSON.stringify({kind:'inter-model-disagreement-not-accuracy',results},null,2));
}
