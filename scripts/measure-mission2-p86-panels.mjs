/** Reproducible licensed FRONT-only geometry experiment; no owner access. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import sharp from 'sharp';
import {buildObservedPhotoPanel86} from '../research/mission2-p86/photo-panel.mjs';
import {measurePrincipalStretch86} from '../research/mission2-p86/surface-metric.mjs';
const donor=process.argv[2]||'.native05-donor-541',out='benchmark/mission2-p86';
await mkdir(out,{recursive:true});const hash=b=>createHash('sha256').update(b).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const manifest=JSON.parse(await readFile(donor+'/benchmark/work47/manifest.json'));
const rows=[];
for(const id of ['commons-0001','commons-0016','commons-0053']){
 const source=await readFile('benchmark/fixtures/'+id+'.jpg'),lock=locked.find(x=>x.id===id);
 if(!lock?.verified||hash(source)!==lock.sha256)throw Error('source SHA/license mismatch '+id);
 const row=manifest.rows.find(r=>r.id===id);
 const cutout=await readFile(donor+'/benchmark/work47/assets/'+id+'.png');
 if(hash(cutout)!==row.cutoutSHA256)throw Error('derived cutout SHA mismatch '+id);
 const {data,info}=await sharp(cutout).resize({width:160,height:160,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const alpha=Uint8Array.from({length:info.width*info.height},(_,i)=>data[4*i+3]);
 const start=performance.now();
 const mesh=buildObservedPhotoPanel86({alpha,width:info.width,height:info.height,sourceSHA256:lock.sha256,maskSHA256:hash(cutout)});
 const elapsed=performance.now()-start;
 const invariant=measurePrincipalStretch86({original:mesh.positions,candidate:mesh.positions.slice(),indices:mesh.indices,originalUV:mesh.uv,candidateUV:mesh.uv.slice()});
 await writeFile(out+'/'+id+'-panel.json',JSON.stringify({positions:Array.from(mesh.positions),uv:Array.from(mesh.uv),indices:Array.from(mesh.indices),receipt:mesh.receipt}));
 await writeFile(out+'/'+id+'.png',cutout);
 rows.push({id,type:row.type,category:row.category,attribution:lock.attribution,originalSHA256:hash(source),
  cutoutSHA256:hash(cutout),maskDecision:row.decision,ownerApproved:false,
  ...mesh.receipt,identityMetric:invariant,constructionMs:elapsed});
}
await writeFile(out+'/measurements.json',JSON.stringify({rows,scope:'observed-front-panels-only',
 generalReconstructionComplete:false,avatarFit:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2));
console.log(JSON.stringify(rows.map(r=>({id:r.id,triangles:r.triangles,vertices:r.vertices,constructionMs:r.constructionMs}))));
