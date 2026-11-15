/** Research-only source-genuine P89 unsigned world-surface gap probe.
 * Patches ONLY the disposable P541 worktree AFTER pinned P84 installer.
 * Never production public/, source JPEG, original rig GLB or any donor branch.
 */
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const here=resolve('.'),donor=resolve(process.argv[2]||'');
assert.ok(process.argv[2]&&donor!==here&&donor!=='/'&&
 !here.startsWith(donor+'/')&&!donor.startsWith(here+'/public')&&
 !donor.startsWith(here+'/supabase'),'detached original research donor required');
const root='research/parallel89';
await mkdir(join(donor,root),{recursive:true});
for(const name of ['source-static-gap89.mjs','unsigned-surface-core89.mjs',
 'source-gap-contrast89.mjs','gated-source-shoulder89.mjs',
 'source-quarter-step89.mjs','source-quarter-compare89.mjs'])
 await copyFile(join(here,root,name),join(donor,root,name));
const p=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let text=await readFile(p,'utf8');
const head="import {auditActualSkinnedOutfitLayers84} from '../parallel84-real-photo-layers/actual-skinned-layers84.mjs';";
assert.equal(text.split(head).length,2,'actual pinned P84 installed native source required');
text=text.replace(head,head+"\nimport {auditActualOriginalSourcePoseSurfaceGaps89} from '../parallel89/source-static-gap89.mjs';"+
 "\nimport {gateOriginalPhotoShoulderResearchTrial89} from '../parallel89/gated-source-shoulder89.mjs';");
// P84 original research controller uses one static 10mm-down / 15mm-out
// shoulder trial. P89 installs ONLY a small URL-whitelisted parameter sweep
// in the disposable donor. No user-supplied coordinates, clothing uploads,
// shipped application files or other mission branch writes.
const sourceTrial="requestedDropMeters:.010,outwardClearanceMeters:.015";
assert.equal(text.split(sourceTrial).length,2,
 'original protected P84 shoulder candidate parameters changed');
const selected="new URLSearchParams(globalThis.location.search).get('parallel89ShapeVariant')";
text=text.replace(sourceTrial,
 "requestedDropMeters:(['low-drop','low-drop-outward'].includes("+selected+")?.004:.010),"+
 "outwardClearanceMeters:("+selected+"==='low-drop-outward'?.020:.015)");
// Source geometry belongs to an immutable user-unapproved genuine public
// garment; never leave a static crossing-free but gap-worsening yoke installed.
// Keep P84's underlying solver only as a donor to P89's fail-closed guard.
const trialAnchor="trialSourceBoneShoulderYoke84({\n    root,shirt:built.shirt,pants:built.pants,";
assert.equal(text.split(trialAnchor).length,2,
 'pinned original P84 shoulder-yoke trial anchor changed');
text=text.replace(trialAnchor,
 "gateOriginalPhotoShoulderResearchTrial89({\n    root,shirt:built.shirt,pants:built.pants,\n"+
 "    applyPose:researchPose=>setResearchPose(root,researchPose),");
const marker="  globalThis.__parallel84SetStaticPose=name=>{\n   if(!['source','blend-50','relaxed'].includes(name))throw Error('Invalid P84 research pose');\n   return setResearchPose(root,name);\n  };\n}";
assert.equal(text.split(marker).length,2,'original P84 static source-pose controller anchor changed');
text=text.replace(marker,marker+"\nif(globalThis.location?.hostname==='127.0.0.1'&&next==='shirt-pants'&&\n new URLSearchParams(globalThis.location.search).get('parallel89Gap')==='audit'){\n globalThis.__parallel89GapAudit=()=>auditActualOriginalSourcePoseSurfaceGaps89({\n  root,shirt:built.shirt,pants:built.pants,\n  avatar:globalThis.document?.getElementById('model')?.value,\n  applyPose:researchPose=>setResearchPose(root,researchPose),\n  poseContactReceipt:globalThis.__parallel84PoseResult\n });\n}");
// Standalone actual-geometry byte digest in the disposable original P541
// controller. This is independent of the P89 rollback gate's own assertions.
// Only fixed research SHA, no owner data or raw positions leave the browser.
const digestAnchor="  globalThis.__parallel89GapAudit=()=>auditActualOriginalSourcePoseSurfaceGaps89({";
assert.equal(text.split(digestAnchor).length,2,'P89 genuine source-gap hook missing');
const digestGuard=[
 "if(globalThis.location?.hostname==='127.0.0.1'&&next==='shirt-pants'&&",
 " new URLSearchParams(globalThis.location.search).get('parallel89Gap')==='audit'){",
 " globalThis.__parallel89RealShirtGeometryDigest=async()=>{",
 "  const meshes=built?.shirt?.meshes;",
 "  if(built?.shirt?.stats?.sourceSHA256!==",
 "   'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'||",
 "   !Array.isArray(meshes)||meshes.length<1||",
 "   meshes.some(m=>!m?.isSkinnedMesh||m.skeleton?.bones?.length!==163))",
 "   throw Error('real-public-photographed-163bone-source-only');",
 "  const byteHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');",
 "  const original=[];",
 "  for(const m of meshes){",
 "   const p=m.geometry.getAttribute('position'),n=m.geometry.getAttribute('normal');",
 "   if(!p||!n||!m.geometry.index)throw Error('real-source-buffer-missing');",
 "   for(const data of [p.array,n.array,m.geometry.index.array]){",
 "    const raw=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);",
 "    original.push(new Uint8Array(raw));",
 "   }",
 "  }",
 "  const total=original.reduce((n,b)=>n+b.length,0);",
 "  if(total<100||total>50000000)throw Error('original-source-research-budget');",
 "  const packed=new Uint8Array(total);let offset=0;",
 "  for(const bytes of original){packed.set(bytes,offset);offset+=bytes.length;}",
 "  const digest=await crypto.subtle.digest('SHA-256',packed);",
 "  return Object.freeze({",
 "   schema:'P89-actual-public-original-shirt-position-normal-index-sha256/v1',",
 "   originalShirtSHA256:built.shirt.stats.sourceSHA256,",
 "   meshCount:meshes.length,combinedBufferBytes:total,",
 "   originalRenderedSourceBufferSHA256:byteHex(new Uint8Array(digest)),",
 "   originalPhotoOwnerReleaseAuthorized:false,",
 "   originalSource2DFallbackRequired:true",
 "  });",
 " };",
 "}"
].join('\n');
text=text.replace(digestAnchor,digestGuard+"\n"+digestAnchor);
await writeFile(p,text);
console.log('P89_SOURCE_UNSIGNED_WORLD_TRIANGLE_GAP_HOOK_ON_DISPOSABLE_PUBLIC_DONOR_ONLY');
