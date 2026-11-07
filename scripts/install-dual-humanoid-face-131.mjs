import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';

/**
 * FACE131 integration only in a DETACHED 163-bone CC0 donor worktree.
 * P118 overlay is installed separately from its PINNED research SHA,
 * and this installer extends that overlay; no shipping app is edited.
 */
const target=resolve(process.argv[2]||'.face131-donor-541');
const source=resolve('research/dual-humanoid-face-definition-131/face-definition.mjs');
const dest=resolve(target,'research/dual-humanoid-face-definition-131/face-definition.mjs');
await mkdir(dirname(dest),{recursive:true});
await copyFile(source,dest);
const file=resolve(target,'research/three-d-15/showroom.mjs');
let src=await readFile(file,'utf8');
const importMark="import {applyDualHumanoidRealism118} from '../dual-humanoid-photorealism-118/realism.mjs';";
assert.equal(src.split(importMark).length,2,'FACE131 pinned P118 import missing in detached donor');
src=src.replace(importMark,importMark+
 "\nimport {applyDualHumanoidFace131} from '../dual-humanoid-face-definition-131/face-definition.mjs';");
const anchor="shade(lastColor);if(new URLSearchParams(location.search).get('realism118')==='after'){const r118=applyDualHumanoidRealism118(selected,current);canvas.dataset.realism118=JSON.stringify(r118);}front();";
assert.equal(src.split(anchor).length,2,'FACE131 expected pinned P118 shaded figure anchor missing');
const installed="shade(lastColor);if(new URLSearchParams(location.search).get('realism118')==='after'){const r118=applyDualHumanoidRealism118(selected,current);canvas.dataset.realism118=JSON.stringify(r118);}"+
 "if(new URLSearchParams(location.search).get('face131')==='after'){"+
 "if(new URLSearchParams(location.search).get('realism118')!=='after')throw Error('FACE131 requires pinned P118 source-safe skin and hair');"+
 "const r131=applyDualHumanoidFace131(selected,current);canvas.dataset.face131=JSON.stringify(r131);"+
 "}else{delete canvas.dataset.face131;}front();";
src=src.replace(anchor,installed);
await writeFile(file,src);
console.log(JSON.stringify({installed:true,scope:'detached PR541 skinned-model research donor ONLY',
 figureModes:['female','male'],requiresP118:true,productionAuthorized:false,familyAlpha:'HOLD'}));
