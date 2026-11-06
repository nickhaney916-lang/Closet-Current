/**
 * P110 research-only in-memory saved outfit to real source-licensed garment 3D.
 * Run AFTER exact original P103..109 detached CC0 PR541 donor overlays.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2];
if(arg!=='.photo103-donor-541')
 throw Error('PHOTO110 only exact original detached research donor allowed');
const root=resolve(arg);
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==
 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('PHOTO110 original 163-bone CC0 donor SHA mismatch');
const htmlPath=join(root,'research/three-d-69/index.html');
let html=await readFile(htmlPath,'utf8');
const hAnchor='<script type="module" src="../three-d-109/mobile-pose-controls.mjs"></script></body></html>';
if(html.split(hAnchor).length!==2)
 throw Error('PHOTO110 requires exactly one original P109 mobile photographed garment interface');
html=html.replace(hAnchor,
 '<script type="module" src="../three-d-109/mobile-pose-controls.mjs"></script>'+
 '<script type="module" src="../reviewed-closet-3d-handoff-110/reviewed-look-panel.mjs"></script>'+
 '</body></html>');
const indexPath=join(root,'research/three-d-69/index-to-real-garment-demo.mjs');
let index=await readFile(indexPath,'utf8');
const anchor=" window.cc69SetView=angle=>{app.viewAt(angle);return window.cc69Diagnostics();};";
const add=" // PHOTO110 original publicly licensed research owner-only benchmark bridge.\n if(new URLSearchParams(location.search).get('look110')==='on'&&\n    new URLSearchParams(location.search).get('knee109')==='on'){\n  window.cc110ResearchSession=()=>session;\n  window.cc110ResearchIndex=()=>indexRecord(currentSelection);\n  window.cc110ResearchSelect=(denim,ownerId,generation,sourceSHA256)=>{\n   if(!ready||closed||!$('review').checked||\n      session.authenticated!==true||ownerId!==session.ownerId||\n      generation!==session.generation||\n      !['public','second'].includes(denim)||\n      sourceSHA256!==(denim==='public'?first:second)?.pants?.sourceSHA256)\n    throw Error('PHOTO110 stale synthetic owner, source or unreviewed licensed garment not allowed');\n   const r=apply(denim);\n   if(!r.realPhotoApplied||r.anatomicalSkeletonBones!==163||\n      r.originalPhotoSHA256s?.bottom!==sourceSHA256||\n      r.originalPhotoSHA256s?.top!==VERIFIED_PUBLIC_SHIRT_SHA256||\n      r.releaseAuthorized!==false)\n    throw Error('PHOTO110 actual original photo to 163-bone source mesh SHA changed');\n   return Object.freeze({sourceSHA256,originalPublicLicenseOnly:true,\n    actual163BoneSourceGarment:true,realPrivateSignedAuth:false,\n    personalClothing3DApproved:false,familyAlpha:'HOLD',releaseAuthorized:false});\n  };\n }";
if(index.split(anchor).length!==2)
 throw Error('PHOTO110 original source index bridge anchor missing/duplicate');
index=index.replace(anchor,anchor+'\n'+add);
const target=join(root,'research/reviewed-closet-3d-handoff-110');
await mkdir(target,{recursive:true});
for(const file of ['owner-bound-look-policy.mjs','reviewed-look-panel.mjs'])
 await copyFile('research/reviewed-closet-3d-handoff-110/'+file,join(target,file));
await writeFile(htmlPath,html);
await writeFile(indexPath,index);
console.log('PHOTO110 only original SHA-pinned PR541 163-bone detached research donor, synthetic licensed source indexed look to real 3D, unsupported personal photo to 2D. No prod/staging/cloud changes.');
