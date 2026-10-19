import {readFile} from 'node:fs/promises';
// A bow-tie or crossed outline has no unambiguous garment/shadow interior.
function crosses(a,b,c,d){
 const turn=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const on=(p,q,r)=>Math.min(p[0],q[0])<=r[0]&&r[0]<=Math.max(p[0],q[0])&&Math.min(p[1],q[1])<=r[1]&&r[1]<=Math.max(p[1],q[1]);
 const ab1=turn(a,b,c),ab2=turn(a,b,d),cd1=turn(c,d,a),cd2=turn(c,d,b);
 if((ab1>0&&ab2<0||ab1<0&&ab2>0)&&(cd1>0&&cd2<0||cd1<0&&cd2>0))return true;
 return (ab1===0&&on(a,b,c))||(ab2===0&&on(a,b,d))||(cd1===0&&on(c,d,a))||(cd2===0&&on(c,d,b));
}
function selfIntersects(points){
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  if(j===i+1||(i===0&&j===points.length-1))continue;
  if(crosses(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))return true;
 }
 return false;
}
export function validateShadowAnnotation(annotation,entry){
 const issues=[];
 if(annotation?.schemaVersion!==1)issues.push('schemaVersion must be 1');
 if(annotation?.imageId!==entry.id)issues.push('image ID mismatch');
 if(annotation?.sourceSha256!==entry.sourceSha256)issues.push('source checksum mismatch');
 if(annotation?.reviewStatus!=='approved')issues.push('independent reviewer approval missing');
 const reviewer=typeof annotation?.reviewer==='string'?annotation.reviewer.trim():'';
 const approvedBy=typeof annotation?.approvedBy==='string'?annotation.approvedBy.trim():'';
 if(!reviewer||!approvedBy||reviewer.toLowerCase()===approvedBy.toLowerCase())issues.push('two distinct reviewer and approvedBy identities are required');
 for(const key of ['garment','shadow']){
  const polygons=annotation?.regions?.[key];
  if(!Array.isArray(polygons)||polygons.length===0){issues.push(key+' polygons missing');continue;}
  for(const polygon of polygons){
   if(!Array.isArray(polygon)||polygon.length<3||polygon.some(point=>!Array.isArray(point)||point.length!==2||point.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>1))){issues.push(key+' polygon must have at least 3 normalized [x,y] coordinates');continue;}
   // Reject collinear and duplicate-only vertices that cannot define a reviewable region.
   const unique=new Set(polygon.map(point=>point.join(',')));
   const signedTwiceArea=polygon.reduce((total,point,i)=>{const next=polygon[(i+1)%polygon.length];return total+point[0]*next[1]-next[0]*point[1]},0);
   if(unique.size<3||Math.abs(signedTwiceArea)<1e-8)issues.push(key+' polygon must enclose a nonzero area');
   if(selfIntersects(polygon))issues.push(key+' polygon edges must not cross');
  }
 }
 return {valid:issues.length===0,issues,usableAsGroundTruth:issues.length===0};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 console.log('SHADOW_ANNOTATION_READINESS '+JSON.stringify({total:manifest.cases.length,approvedReferences:manifest.cases.filter(x=>x.reviewStatus==='approved'&&x.referenceMask).length,status:'awaiting-independent-annotations'}));
}
