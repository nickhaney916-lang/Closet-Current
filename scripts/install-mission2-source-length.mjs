import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const donor=resolve(process.argv[2]||'.');
if(donor===resolve('.')||donor==='/'||donor.startsWith(resolve('public'))||donor.startsWith(resolve('supabase')))throw Error('Explicit disposable donor required');
const patch=async(path,anchor,replacement)=>{const file=join(donor,path),s=await readFile(file,'utf8');assert.equal(s.split(anchor).length,2,path);await writeFile(file,s.replace(anchor,replacement));};
await mkdir(join(donor,'research/mission2-source-length'),{recursive:true});
for(const name of ['source-length.mjs','posed-intersections.mjs','source-projection.mjs'])await copyFile('research/mission2-source-length/'+name,join(donor,'research/mission2-source-length/'+name));
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',"import {fitOwnerAlphaToSkinnedBlouse190}","import {fitSourceLength,applyNoNewContactSourceLength} from '../mission2-source-length/source-length.mjs';\nimport {fitOwnerAlphaToSkinnedBlouse190}");
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',
 'built.shirt=fitOwnerAlphaToSkinnedBlouse190(built.shirt,root,candidate.ownerMaskGeometryProfile190);',
 `built.shirt=fitOwnerAlphaToSkinnedBlouse190(built.shirt,root,candidate.ownerMaskGeometryProfile190);
   if(built.shirt?.stats?.sourceSHA256==='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24'&&candidate?.silhouette62&&
      new URLSearchParams(globalThis.location?.search||'').get('photoSourceLength')==='research')
    built.shirt=(new URLSearchParams(globalThis.location?.search||'').get('photoSourceTrianglePolicy')==='adaptive'
      ?applyNoNewContactSourceLength(built.shirt,root,candidate.silhouette62,{projectSourceRGB:new URLSearchParams(globalThis.location?.search||'').get('photoSourceProjection')==='research',onResearchDiagnostic:diagnostic=>console.info('M2_BODY_CONTACT_LOCALITY:'+JSON.stringify(diagnostic))})
      :fitSourceLength(built.shirt,root,candidate.silhouette62,{projectSourceRGB:new URLSearchParams(globalThis.location?.search||'').get('photoSourceProjection')==='research',traceTriangleContacts:new URLSearchParams(globalThis.location?.search||'').get('photoSourceTriangleAudit')==='research',strictTriangleContacts:new URLSearchParams(globalThis.location?.search||'').get('photoSourceTriangleStrict')==='research'}));`);
await patch('research/outfit-3d-01/research-panel.mjs',
 'ownerAlphaMaskBasedPhysicalGeometry190:actualOutfit171[k].ownerAlphaMaskBasedPhysicalGeometry190===true,',
 `sourceProjectionRGB:actualOutfit171[k].sourceProjectionRGB===true,
        sourceProjectionMaterialCount:actualOutfit171[k].sourceProjectionMaterialCount,
        sourceProjectionCompiledMaterialCount:actualOutfit171[k].sourceProjectionRuntime?.compiledMaterialCount||0,
        sourceProjectionRearPhotographed:false,
        sourceLengthFit:actualOutfit171[k].sourceLengthFit===true,
        sourceLengthSHA256:actualOutfit171[k].sourceLengthSHA256,
        sourceLengthMovedVertices:actualOutfit171[k].sourceLengthMovedVertices,
        sourceLengthOldHemY:actualOutfit171[k].sourceLengthOldHemY,
        sourceLengthNewHemY:actualOutfit171[k].sourceLengthNewHemY,
        sourceLengthExtension:actualOutfit171[k].sourceLengthExtension,
        sourceLengthFlare:actualOutfit171[k].sourceLengthFlare,
        sourceLengthIntersectionPairsBefore:actualOutfit171[k].sourceLengthIntersectionPairsBefore,
        sourceLengthIntersectionPairsAfter:actualOutfit171[k].sourceLengthIntersectionPairsAfter,
        sourceLengthTestedPairs:actualOutfit171[k].sourceLengthTestedPairs,
        sourceLengthConstructionMs:actualOutfit171[k].sourceLengthConstructionMs,
        sourceLengthTriangleContactAudit:actualOutfit171[k].sourceLengthTriangleContactAudit===true,
        sourceLengthTriangleContactStrictlyAccepted:actualOutfit171[k].sourceLengthTriangleContactStrictlyAccepted===true,
        sourceLengthTriangleContactBefore:actualOutfit171[k].sourceLengthTriangleContactBefore,
        sourceLengthTriangleContactAfter:actualOutfit171[k].sourceLengthTriangleContactAfter,
        sourceLengthNewTriangleContacts:actualOutfit171[k].sourceLengthNewTriangleContacts,
        sourceLengthBodyContactDistribution:actualOutfit171[k].sourceLengthBodyContactDistribution,
        sourceLengthGarmentPartContactAudit:actualOutfit171[k].sourceLengthGarmentPartContactAudit===true,
        sourceLengthGarmentPartContactStrictlyAccepted:actualOutfit171[k].sourceLengthGarmentPartContactStrictlyAccepted===true,
        sourceLengthGarmentPartContactsBefore:actualOutfit171[k].sourceLengthGarmentPartContactsBefore,
        sourceLengthGarmentPartContactsAfter:actualOutfit171[k].sourceLengthGarmentPartContactsAfter,
        sourceLengthNewGarmentPartContacts:actualOutfit171[k].sourceLengthNewGarmentPartContacts,
        sourceLengthSelfLayerCollisionCertified:false,
        sourceLengthIntrapanelAudit:actualOutfit171[k].sourceLengthIntrapanelAudit===true,
        sourceLengthIntrapanelStrictlyAccepted:actualOutfit171[k].sourceLengthIntrapanelStrictlyAccepted===true,
        sourceLengthIntrapanelContactsBefore:actualOutfit171[k].sourceLengthIntrapanelContactsBefore,
        sourceLengthIntrapanelAffectedPairOnly:actualOutfit171[k].sourceLengthIntrapanelAffectedPairOnly===true,
        sourceLengthIntrapanelFullBaselineEnumerated:false,
        sourceLengthIntrapanelChangedFaces:actualOutfit171[k].sourceLengthIntrapanelChangedFaces,
        sourceLengthIntrapanelCandidateTests:actualOutfit171[k].sourceLengthIntrapanelCandidateTests,
        sourceLengthIntrapanelContactsAfter:actualOutfit171[k].sourceLengthIntrapanelContactsAfter,
        sourceLengthNewIntrapanelContacts:actualOutfit171[k].sourceLengthNewIntrapanelContacts,
        sourceLengthCollisionCertified:false,
        ownerAlphaMaskBasedPhysicalGeometry190:actualOutfit171[k].ownerAlphaMaskBasedPhysicalGeometry190===true,`);
console.log('Installed opt-in source-proportion lower garment extension; no release or physical fit certification');
