/** P65 installs mask-derived contour deformation into a disposable research donor only. */
import assert from 'node:assert/strict';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const donor=resolve(process.argv[2]||'');
const root=resolve('.');
if(!process.argv[2]||donor==='/'||donor===root||donor.startsWith(root+'/public/')||donor.startsWith(root+'/supabase/'))
 throw Error('P65 requires an explicitly disposable research donor outside shipping and cloud paths');
const swap=async(file,anchor,next)=>{
 const path=join(donor,file),before=await readFile(path,'utf8');
 assert.equal(before.split(anchor).length,2,'P65 donor drift '+file+' / '+anchor.slice(0,90));
 await writeFile(path,before.replace(anchor,next));
};
await mkdir(join(donor,'research/real-owner-garment-to-3d-65'),{recursive:true});
await copyFile(join(root,'research/real-owner-garment-to-3d-65/owner-mask-geometry.mjs'),
 join(donor,'research/real-owner-garment-to-3d-65/owner-mask-geometry.mjs'));
await swap('research/dress-mobile-01/dress-outfit-controller.mjs',
 "import {fitReviewedUpperPhoto62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';",
 "import {fitReviewedUpperPhoto62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';\nimport {fitOwnerMaskGeometry65} from '../real-owner-garment-to-3d-65/owner-mask-geometry.mjs';");
await swap('research/dress-mobile-01/dress-outfit-controller.mjs',
 "if(built.shirt?.stats?.sourceSHA256==='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24')built.shirt=fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true});",
 "if(built.shirt?.stats?.sourceSHA256==='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24')built.shirt=fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true});\n   if(candidate?.ownerMaskGeometry65)built.shirt=fitOwnerMaskGeometry65(built.shirt,root,candidate.ownerMaskGeometry65);");
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 "const prepared=prepareIndexedGarmentsFor3D(indexedPlan,{",
 `const selectedTop=plan.selected.find(x=>x.slot==='top');
  const blouseCandidate=selectedTop?.itemType==='Blouse'?sources.blouse:null;
  if(blouseCandidate?.ownerMaskGeometry65){const contour=blouseCandidate.ownerMaskGeometry65;
   if(contour.ownerId!==plan.ownerId||contour.garmentId!==selectedTop.itemId||
      contour.sourceSHA256!==selectedTop.originalSHA256||contour.ownerReviewAssertionOnly!==true)
    throw Error('P65 owner, saved garment, source SHA or review lease does not match current outfit');
  }
  const prepared=prepareIndexedGarmentsFor3D(indexedPlan,{`);
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 "import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';",
 "import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';\nimport {requireCurrentOwnerMaskGeometry65} from '../real-owner-garment-to-3d-65/owner-mask-geometry.mjs';");
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 `if(contour.ownerId!==plan.ownerId||contour.garmentId!==selectedTop.itemId||
      contour.sourceSHA256!==selectedTop.originalSHA256||contour.ownerReviewAssertionOnly!==true)
    throw Error('P65 owner, saved garment, source SHA or review lease does not match current outfit');`,
 `requireCurrentOwnerMaskGeometry65(contour,{ownerId:plan.ownerId,garmentId:selectedTop.itemId,
    sourceSHA256:selectedTop.originalSHA256});`);
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 "const key=[owner.ownerId,owner.generation,state.kind,decision.mode,...decision.renderedIds.map(id=>id+':'+(plan.selected.find(x=>x.itemId===id)?.originalSHA256||''))].join('\\u0000');",
 "const key=[owner.ownerId,owner.generation,state.kind,decision.mode,sources.blouse.ownerMaskGeometry65?.ownerMaskSHA256||'',...decision.renderedIds.map(id=>id+':'+(plan.selected.find(x=>x.itemId===id)?.originalSHA256||''))].join('\\u0000');");
await swap('research/outfit-3d-01/research-panel.mjs',
 "ownerMaskGeometryFromPrivatePNG189:false,",
 "ownerMaskGeometryFromPrivatePNG189:false,\n    ownerMaskGeometry65:view.outfit?.shirt?.ownerMaskGeometry65===true,\n    ownerMaskGeometryMovedVertices65:view.outfit?.shirt?.ownerMaskGeometry65MovedVertices,\n    ownerMaskGeometrySHA256_65:view.outfit?.shirt?.ownerMaskGeometry65SHA256||null,\n    ownerMaskReviewAssertionOnly65:view.outfit?.shirt?.ownerMaskReviewAssertionOnly65===true,\n    ownerMaskHumanReviewIndependentlyVerified65:false,");
for(const f of ['research/dress-mobile-01/dress-outfit-controller.mjs','research/outfit-3d-01/source-true-viewer.mjs','research/outfit-3d-01/research-panel.mjs'])
 execFileSync(process.execPath,['--check',join(donor,f)],{stdio:'inherit'});
console.log(JSON.stringify({priority:65,disposableResearchDonorOnly:true,
 sourceMaskDerivedGeometry:true,topologyReconstructed:false,humanReviewIndependentlyVerified:false,
 productionChanged:false,stagingChanged:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
