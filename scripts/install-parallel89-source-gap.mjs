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
for(const name of ['source-static-gap89.mjs','unsigned-surface-core89.mjs'])
 await copyFile(join(here,root,name),join(donor,root,name));
const p=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let text=await readFile(p,'utf8');
const head="import {auditActualSkinnedOutfitLayers84} from '../parallel84-real-photo-layers/actual-skinned-layers84.mjs';";
assert.equal(text.split(head).length,2,'actual pinned P84 installed native source required');
text=text.replace(head,head+"\nimport {auditActualOriginalSourcePoseSurfaceGaps89} from '../parallel89/source-static-gap89.mjs';");
const marker="  globalThis.__parallel84SetStaticPose=name=>{\n   if(!['source','blend-50','relaxed'].includes(name))throw Error('Invalid P84 research pose');\n   return setResearchPose(root,name);\n  };\n}";
assert.equal(text.split(marker).length,2,'original P84 static source-pose controller anchor changed');
text=text.replace(marker,marker+"\nif(globalThis.location?.hostname==='127.0.0.1'&&next==='shirt-pants'&&\n new URLSearchParams(globalThis.location.search).get('parallel89Gap')==='audit'){\n globalThis.__parallel89GapAudit=()=>auditActualOriginalSourcePoseSurfaceGaps89({\n  root,shirt:built.shirt,pants:built.pants,\n  avatar:globalThis.document?.getElementById('model')?.value,\n  applyPose:researchPose=>setResearchPose(root,researchPose),\n  poseContactReceipt:globalThis.__parallel84PoseResult\n });\n}");
await writeFile(p,text);
console.log('P89_SOURCE_UNSIGNED_WORLD_TRIANGLE_GAP_HOOK_ON_DISPOSABLE_PUBLIC_DONOR_ONLY');
