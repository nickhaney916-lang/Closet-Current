/**
 * #89 genuine ORIGINAL public skirt JPEG and Work47 pinned alpha used to build
 * an independent category-specific research mesh on a SYNTHETIC 163-bone
 * harness. Does NOT claim an actual male/female anatomical avatar fit.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import sharp from 'sharp';
import {resolve,join} from 'node:path';
import {SKIRT_SOURCE89,attestActualSkirt89,sourceSkirtOutline89,
 buildOriginalPhotoSkirtProposal89} from '../research/parallel89/skirt-source3d89.mjs';
if(!process.argv[2])throw Error('separate pinned P541 Work47 generated original mask worktree needed');
const donor=resolve(process.argv[2]),rootDir=resolve('.');
if(donor===rootDir||donor==='/'||donor.startsWith(rootDir+'/public')||donor.startsWith(rootDir+'/supabase'))
 throw Error('No mutable original user/public source allowed');
const sha=b=>createHash('sha256').update(b).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const manifest=JSON.parse(await readFile(join(donor,'benchmark/work47/manifest.json'),'utf8'));
const original=await readFile('benchmark/fixtures/commons-0043.jpg');
const donorOriginal=await readFile(join(donor,'benchmark/work47/assets/commons-0043.jpg'));
const cutout=await readFile(join(donor,'benchmark/work47/assets/commons-0043.png'));
if(sha(original)!==SKIRT_SOURCE89.originalSHA256||!original.equals(donorOriginal))
 throw Error('Source identity mismatch between exact P89 original and immutable P541 Work47');
const row=manifest.rows.find(x=>x.id==='commons-0043');
const receipt=await attestActualSkirt89({originalBytes:original,cutoutBytes:cutout,
 lock:locked.find(x=>x.id==='commons-0043'),work47:row});
if(receipt.status!=='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED')
 throw Error('Independent real source skirt or REVIEW mask not byte verified: '+receipt.reason);
const originalCutoutRGBA=await sharp(cutout).ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Preserve exact relative source coordinates without letterbox padding:
const factor=Math.min(240/originalCutoutRGBA.info.width,240/originalCutoutRGBA.info.height);
const sampleWidth=Math.max(12,Math.round(originalCutoutRGBA.info.width*factor));
const sampleHeight=Math.max(12,Math.round(originalCutoutRGBA.info.height*factor));
const {data,info}=await sharp(cutout)
 .resize({width:sampleWidth,height:sampleHeight,fit:'fill'})
 .ensureAlpha().raw().toBuffer({resolveWithObject:true});
const alpha=new Uint8Array(info.width*info.height);
for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
const outline=sourceSkirtOutline89({alpha,width:info.width,height:info.height});
// Strictly synthetic 163-bone THREE rig. Unlike existing P84/P541 true-avatar
// browser proof, this validates independent original-skirt mesh construction
// only, pending actual 163-bone anatomical avatar attachment.
function syntheticRig(){
 const root=new THREE.Group(),geo=new THREE.BoxGeometry(.46,1.6,.25,2,2,2),
    p=geo.attributes.position;
 const ids=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++)weights[4*i]=1;
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const bones=Array.from({length:163},(_,i)=>{
  const b=new THREE.Bone();b.name=i===0?'pelvis':i===1?'spine04':'sourceResearchBone'+i;return b;
 });
 bones[1].position.set(0,1.1,0);
 root.add(...bones);
 const body=new THREE.SkinnedMesh(geo,new THREE.MeshStandardMaterial());
 root.add(body);root.updateMatrixWorld(true);body.bind(new THREE.Skeleton(bones));
 return {root,body,bones};
}
const {root,body}=syntheticRig();
// The actual source cutout pixels were verified above. The geometry is
// constructed with a bound Three.Texture image placeholder here, with a
// SEPARATE native real WebGL source-UV test required before photo-render claim.
const candidate=buildOriginalPhotoSkirtProposal89({
 root,receipt,outline,cutoutImage:{data:new Uint8Array(originalCutoutRGBA.data),
  width:originalCutoutRGBA.info.width,height:originalCutoutRGBA.info.height}
});
if(candidate?.receipt?.status!=='ACTUAL_SOURCE_SKIRT_VISIBLE_FRONT_PROPOSAL_NOT_FITTED_OR_ACCEPTED')
 throw Error('Research original-photo skirt mesh blocked: '+(candidate?.reason||'unknown'));
const mesh=candidate.mesh,g=mesh.geometry;
if(mesh.skeleton!==body.skeleton||mesh.skeleton.bones.length!==163||
    g.index.count!==candidate.receipt.triangleCount*3||
    g.groups.length<20||mesh.material.length!==2||
    mesh.material[0].map?.image?.data?.length!==originalCutoutRGBA.data.length||
    mesh.material[0].map?.image?.width!==originalCutoutRGBA.info.width||
    mesh.material[0].map?.image?.height!==originalCutoutRGBA.info.height||
    g.getAttribute('skinIndex').count!==g.getAttribute('position').count||
    g.getAttribute('sourceSkirt89Rest').count!==g.getAttribute('position').count||
    g.getAttribute('uv').array.some(x=>!Number.isFinite(x)||x<0||x>1)||
    g.getAttribute('position').array.some(x=>!Number.isFinite(x))||
    candidate.receipt.releaseAuthorized!==false)
 throw Error('Source skirt exact alpha-to-skin geometry or front UV integrity failed');
const report={schema:'P89-actual-independent-licensed-skirt-alpha-to-THREE-shell/v1',
 status:'GENUINE_SOURCE_SKIRT_SYNTHETIC_RIG_GEOMETRY_ONLY',
 source:SKIRT_SOURCE89.id,sourceSHA256:sha(original),cutoutSHA256:sha(cutout),
 sourceManifestDecision:row.decision,
 sourceAlphaHumanApproved:false,verifiedMaskBytes:cutout.length,
 actualSourceSilhouetteMask:true,derivedSourceRows:outline.sourceRowWidths,
 derivedSourceHemToWaistWidthRatio:outline.sourceHemToWaistWidthRatio,
 croppedObservedMask: outline.crop,
 skinnedShellVertices:g.getAttribute('position').count,triangles:g.index.count/3,
 originalSourceRGBAActuallyBoundTo3DFrontTexture:true,
 originalSourceRGBProjectedIntoNativeBrowser:false,
 originalSourcePhotoFrameModified:false,realAnatomicalAvatarTested:false,
 synthetic163BoneRigOnly:true,observedSkirtBack:false,
 realBodyAndInterlayerCollisionVerified:false,physicalClothDrapeVerified:false,
 physicalDeviceTested:false,independentHumanRealismApproved:false,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await mkdir('benchmark/parallel89',{recursive:true});
await writeFile('benchmark/parallel89/genuine-skirt-proposal.json',JSON.stringify(report,null,2)+'\n');
candidate.dispose();
if(root.children.includes(mesh))throw Error('Skirt dispose failed to revoke research 3D surface');
if(sha(original)!==SKIRT_SOURCE89.originalSHA256||sha(cutout)!==receipt.cutoutSHA256)
 throw Error('Original source JPEG or alpha changed during THREE research');
console.log('P89_GENUINE_SKIRT_ORIGINAL_ALPHA_RESEARCH_NOT_RELEASE',JSON.stringify(report));
