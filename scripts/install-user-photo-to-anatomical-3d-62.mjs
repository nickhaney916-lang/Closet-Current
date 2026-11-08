/** Install P62 only into the detached exact P541 donor used by browser CI. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const donorArg=process.argv[2];
if(!donorArg)throw Error('P62 requires an explicit disposable P541 donor path');
const donor=resolve(donorArg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/'))
 throw Error('P62 refuses modifying the current repository or root');
const read=path=>readFile(join(donor,path),'utf8');
const write=async(path,value)=>writeFile(join(donor,path),value);
const install=async(path,source)=>{const target=join(donor,path);await mkdir(dirname(target),{recursive:true});await copyFile(source,target);};
const insertOnce=(source,anchor,replacement,label)=>{
 assert.equal(source.split(anchor).length,2,'P62 pinned donor anchor changed: '+label);
 return source.replace(anchor,replacement);
};
await install('research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs',
 'research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs');

let texture=await read('research/three-d-02/reviewed-texture.mjs');
texture=insertOnce(texture,"import {representativeFabricColor} from '../three-d-03/fabric-color.mjs';",
 "import {representativeFabricColor} from '../three-d-03/fabric-color.mjs';\nimport {measureUpperSilhouette62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';",'texture import');
texture=insertOnce(texture," 'commons-0003':Object.freeze({type:'shirt',category:'Tops',slot:'top'}),",
 " 'commons-0003':Object.freeze({type:'shirt',category:'Tops',slot:'top'}),\n 'commons-0016':Object.freeze({type:'shirt',category:'Tops',slot:'top'}),",'blouse source map');
texture=insertOnce(texture,' const fabric=representativeFabricColor({data:sample.data,width:sample.width,height:sample.height});',
 ' const fabric=representativeFabricColor({data:sample.data,width:sample.width,height:sample.height});\n'+
 " const silhouette62=id==='commons-0016'?measureUpperSilhouette62({data:sample.data,width:sample.width,height:sample.height,sourceId:id,sourceSHA256:row.sourceSHA256,cutoutSHA256:row.cutoutSHA256,reviewConfirmed:true}):null;\n"+
 " if(id==='commons-0016'&&!silhouette62?.accepted)throw Error('P62 blouse silhouette review is not safe for 3D; retain original photo');",'silhouette profile');
texture=insertOnce(texture,'  ownerApproved:false,releaseAuthorized:false,',
 '  ...(silhouette62?{silhouette62}:{}),ownerApproved:false,releaseAuthorized:false,','candidate profile');
await write('research/three-d-02/reviewed-texture.mjs',texture);

let rig=await read('research/three-d-07/rig-shirt-transfer.mjs');
rig=insertOnce(rig," if(acknowledged!==true||!item||item.id!==LICENSED_SHIRT||",
 " if(acknowledged!==true||!item||\n  (item.id!==LICENSED_SHIRT&&!(item.id==='commons-0016'&&item.silhouette62?.accepted===true))||",'shirt source admission');
await write('research/three-d-07/rig-shirt-transfer.mjs',rig);

let shell=await read('research/three-d-08/garment-shell.mjs');
shell=insertOnce(shell,'sourceSHA256:source.sourceSHA256,photoSpan,envelope,releaseAuthorized:false',
 'sourceId:source.id,sourceSHA256:source.sourceSHA256,photoSpan,envelope,releaseAuthorized:false','source receipt');
await write('research/three-d-08/garment-shell.mjs',shell);

let fit=await read('research/photo-garment-anatomical-fitting-60/fit-contract.mjs');
fit=insertOnce(fit,"  'commons-0003': Object.freeze({\n    sourceSHA256: 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',\n    garment: 'shirt'\n  }),",
 "  'commons-0003': Object.freeze({\n    sourceSHA256: 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',\n    garment: 'shirt'\n  }),\n  'commons-0016': Object.freeze({\n    sourceSHA256: 'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',\n    garment: 'shirt'\n  }),",'P60 source fixture');
fit=insertOnce(fit,"(sourceId === 'commons-0003' && garment.meshes?.some(mesh => {",
 "(['commons-0003','commons-0016'].includes(sourceId) && garment.meshes?.some(mesh => {",'P60 source photo projection');
await write('research/photo-garment-anatomical-fitting-60/fit-contract.mjs',fit);

let pbr=await read('research/photo-cloth-realism-164/pbr-fabric.mjs');
pbr=insertOnce(pbr,"  'commons-0003': 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',",
 "  'commons-0003': 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',\n  'commons-0016': 'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',",'P164 blouse source');
pbr=insertOnce(pbr,"  'commons-0003': Object.freeze({ fabric: 'cotton-jersey', roughness: .86, sheen: .20 }),",
 "  'commons-0003': Object.freeze({ fabric: 'cotton-jersey', roughness: .86, sheen: .20 }),\n  'commons-0016': Object.freeze({ fabric: 'light-woven', roughness: .90, sheen: .14 }),",'P164 blouse material');
pbr=insertOnce(pbr,"(verifiedSourceId === 'commons-0003' && hasPhotoProjection);",
 "(['commons-0003','commons-0016'].includes(verifiedSourceId) && hasPhotoProjection);",'P164 blouse projection');
await write('research/photo-cloth-realism-164/pbr-fabric.mjs',pbr);

let controller=await read('research/dress-mobile-01/dress-outfit-controller.mjs');
controller=insertOnce(controller,"import {contourSourceVerifiedShirt172} from '../photo-torso-contour-172/torso-contour.mjs';",
 "import {contourSourceVerifiedShirt172} from '../photo-torso-contour-172/torso-contour.mjs';\nimport {fitReviewedUpperPhoto62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';",'native fit import');
controller=insertOnce(controller,'   if(built.shirt)built.shirt=contourSourceVerifiedShirt172(built.shirt,root);',
 "   if(built.shirt?.stats?.sourceSHA256==='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64')built.shirt=contourSourceVerifiedShirt172(built.shirt,root);\n"+
 "   if(built.shirt?.stats?.sourceSHA256==='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24')built.shirt=fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62);",'physical mesh integration');
controller=insertOnce(controller,"if(built.shirt&&new URLSearchParams(globalThis.location?.search||'').get('photoSleeve174')==='research')",
 "if(built.shirt?.stats?.sourceSHA256==='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'&&new URLSearchParams(globalThis.location?.search||'').get('photoSleeve174')==='research')",'P174 source gate');
controller=insertOnce(controller,"if(id==='commons-0003')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});",
 "if(candidate?.id==='commons-0003'||candidate?.id==='commons-0016')requireAnatomicalShirtPreview(candidate,{acknowledged:reviewed});",'native blouse confirmation');
await write('research/dress-mobile-01/dress-outfit-controller.mjs',controller);

let panel=await read('research/outfit-3d-01/research-panel.mjs');
panel=insertOnce(panel,'sourceSHA256:actualOutfit171[k].sourceSHA256,',
 "sourceSHA256:actualOutfit171[k].sourceSHA256,\n       silhouette62:k==='shirt'?{\n        sourcePhotoSilhouetteFit62:actualOutfit171[k].sourcePhotoSilhouetteFit62===true,\n        silhouetteFit62MovedVertices:actualOutfit171[k].silhouetteFit62MovedVertices,\n        silhouetteFit62MaxMeters:actualOutfit171[k].silhouetteFit62MaxMeters,\n        silhouetteSourceSHA256:actualOutfit171[k].silhouetteSourceSHA256,\n        cutoutSHA256:actualOutfit171[k].cutoutSHA256,\n        normalizedSilhouetteOnly:actualOutfit171[k].normalizedSilhouetteOnly===true,\n        inferredRear62:actualOutfit171[k].inferredRear62===true\n       }:null,",'panel read-only fit receipt');
await write('research/outfit-3d-01/research-panel.mjs',panel);

let viewer=await read('research/outfit-3d-01/source-true-viewer.mjs');
viewer=insertOnce(viewer,"const SHIRT_SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';",
 "const SHIRT_SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';\nconst BLOUSE_SHA='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';",'viewer blouse SHA');
viewer=insertOnce(viewer,'shirt:SHIRT_SHA,denim:DENIM_SHAS',
 'shirt:SHIRT_SHA,blouse:BLOUSE_SHA,denim:DENIM_SHAS','viewer SHA export');
viewer=insertOnce(viewer,"else if(top?.category==='Tops'&&top.itemType==='T-shirt'&&top.originalSHA256===SHIRT_SHA)\n  renderable.push(top);",
 "else if(top?.category==='Tops'&&top.itemType==='T-shirt'&&top.originalSHA256===SHIRT_SHA)\n  renderable.push(top);\n else if(top?.category==='Tops'&&top.itemType==='Blouse'&&top.originalSHA256===BLOUSE_SHA)\n  renderable.push(top);", 'blouse plan admission');
viewer=insertOnce(viewer," const dress=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});",
 " const dress=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});\n const rawBlouse=await loadLicensedCutout('commons-0016',{manifest,reviewConfirmed:true});\n if(rawBlouse.sourceSHA256!==BLOUSE_SHA||!rawBlouse.silhouette62?.accepted)throw Error('P62 original blouse source/mask is not reviewed');\n const blouse=Object.freeze({...rawBlouse,originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true});",'load blouse');
viewer=insertOnce(viewer,'return Object.freeze({dress,bundles:Object.freeze(bundles),',
 'return Object.freeze({dress,blouse,bundles:Object.freeze(bundles),','return blouse candidate');
viewer=insertOnce(viewer,"if(typeof viewer?.applyOutfit!=='function'||typeof viewer?.getState!=='function'||\n   typeof controller?.sourceIndex!=='function'||!sources?.dress||!Array.isArray(sources?.bundles))",
 "if(typeof viewer?.applyOutfit!=='function'||typeof viewer?.getState!=='function'||\n   typeof controller?.sourceIndex!=='function'||!sources?.dress||!sources?.blouse||!Array.isArray(sources?.bundles))",'source viewer guard');
viewer=insertOnce(viewer," const top=plan.selected.find(x=>x.slot==='top'),bottom=plan.selected.find(x=>x.slot==='bottom');",
 " const top=plan.selected.find(x=>x.slot==='top'),bottom=plan.selected.find(x=>x.slot==='bottom');",'viewer top anchor');
viewer=insertOnce(viewer,"const indexed=controller.sourceIndex(),restricted={};",
 "const indexed=controller.sourceIndex(),restricted={};",'indexed plan');
viewer=insertOnce(viewer,'shirtCandidate:bundle.shirt,pantsCandidate:decision.mode===\'shirt-pants\'?bundle.pants:null',
 "shirtCandidate:plan.selected.find(x=>x.slot==='top')?.itemType==='Blouse'?sources.blouse:bundle.shirt,pantsCandidate:decision.mode==='shirt-pants'?bundle.pants:null",'candidate selection');
await write('research/outfit-3d-01/source-true-viewer.mjs',viewer);

let bridge=await read('research/three-d-69/index-to-real-garment-viewer.mjs');
bridge=insertOnce(bridge," if(!isVettedOriginalGarmentCandidate(candidate))throw Error('Independently SHA-tested photographed shirt source capability required');",
 " const p62=candidate?.id==='commons-0016'&&candidate?.silhouette62?.accepted===true&&candidate?.originalVerified===true&&candidate?.cutoutVerified===true;\n if(!p62&&!isVettedOriginalGarmentCandidate(candidate))throw Error('Independently SHA-tested photographed shirt source capability required');",'shirt candidate trust');
bridge=insertOnce(bridge," if(piece.category!=='Tops'||piece.itemType!=='T-shirt'||piece.anatomicalSlot!=='shirt-or-dress'||\n    !sameString(candidate?.id,'commons-0003')||\n    !sameString(piece.sourceSHA256,candidate.sourceSHA256)||\n    candidate.sourceSHA256!==VERIFIED_PUBLIC_SHIRT_SHA256)",
 " const p62=candidate?.id==='commons-0016'&&candidate?.silhouette62?.accepted===true&&candidate?.originalVerified===true&&candidate?.cutoutVerified===true;\n if(piece.category!=='Tops'||!(piece.itemType==='T-shirt'&&candidate?.id==='commons-0003'||piece.itemType==='Blouse'&&p62)||piece.anatomicalSlot!=='shirt-or-dress'||\n    !sameString(candidate?.id,p62?'commons-0016':'commons-0003')||\n    !sameString(piece.sourceSHA256,candidate.sourceSHA256)||\n    candidate.sourceSHA256!==(p62?'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24':VERIFIED_PUBLIC_SHIRT_SHA256))",'blouse source type/hash');
bridge=insertOnce(bridge," if(shirt){if(!isVettedOriginalGarmentCandidate(shirt))throw Error('Original authenticated photographed shirt source not current');requireAnatomicalShirtPreview(shirt,{acknowledged:true});}",
 " if(shirt){const p62=shirt?.id==='commons-0016'&&shirt?.silhouette62?.accepted===true&&shirt?.originalVerified===true&&shirt?.cutoutVerified===true;if(!p62&&!isVettedOriginalGarmentCandidate(shirt))throw Error('Original authenticated photographed shirt source not current');requireAnatomicalShirtPreview(shirt,{acknowledged:true});}",'blouse current source verification');
await write('research/three-d-69/index-to-real-garment-viewer.mjs',bridge);

console.log(JSON.stringify({priority:62,donor:'P541 detached disposable only',newSource:'commons-0016',
 sourceSHA256:'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',
 actualNativeOwnerSavedOutfitPath:true,geometryChange:true,sourcePhotoAndCutoutIdentityRequired:true,
 originalUnknownPhotoFallback:true,inferredRear:true,releaseAuthorized:false,familyAlpha:'HOLD'}));
