import {readFile} from 'node:fs/promises';
export function validateShadowAnnotation(annotation,entry){
 const issues=[];
 if(annotation?.schemaVersion!==1)issues.push('schemaVersion must be 1');
 if(annotation?.imageId!==entry.id)issues.push('image ID mismatch');
 if(annotation?.sourceSha256!==entry.sourceSha256)issues.push('source checksum mismatch');
 if(annotation?.reviewStatus!=='approved')issues.push('independent reviewer approval missing');
 for(const key of ['garment','shadow']){
  const polygons=annotation?.regions?.[key];
  if(!Array.isArray(polygons)||polygons.length===0){issues.push(key+' polygons missing');continue;}
  for(const polygon of polygons){
   if(!Array.isArray(polygon)||polygon.length<3||polygon.some(point=>!Array.isArray(point)||point.length!==2||point.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>1))){issues.push(key+' polygon must have at least 3 normalized [x,y] coordinates');continue;}
   // Reject collinear and duplicate-only vertices that cannot define a reviewable region.
   const unique=new Set(polygon.map(point=>point.join(',')));
   const signedTwiceArea=polygon.reduce((total,point,i)=>{const next=polygon[(i+1)%polygon.length];return total+point[0]*next[1]-next[0]*point[1]},0);
   if(unique.size<3||Math.abs(signedTwiceArea)<1e-8)issues.push(key+' polygon must enclose a nonzero area');
  }
 }
 return {valid:issues.length===0,issues,usableAsGroundTruth:issues.length===0};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 console.log('SHADOW_ANNOTATION_READINESS '+JSON.stringify({total:manifest.cases.length,approvedReferences:manifest.cases.filter(x=>x.reviewStatus==='approved'&&x.referenceMask).length,status:'awaiting-independent-annotations'}));
}
