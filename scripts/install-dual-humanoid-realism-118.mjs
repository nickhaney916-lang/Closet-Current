import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';

const target=resolve(process.argv[2]||'.photo103-donor-541');
const source=resolve('research/dual-humanoid-photorealism-118/realism.mjs');
const destination=resolve(target,'research/dual-humanoid-photorealism-118/realism.mjs');
await mkdir(dirname(destination),{recursive:true});
await copyFile(source,destination);
const file=resolve(target,'research/three-d-15/showroom.mjs');
let text=await readFile(file,'utf8');
const importMark="import * as THREE from 'three';";
assert.equal(text.split(importMark).length,2,'unexpected pinned donor showroom import');
text=text.replace(importMark,importMark+"\nimport {applyDualHumanoidRealism118} from '../dual-humanoid-photorealism-118/realism.mjs';");
const anchor='shade(lastColor);front();';
assert.equal(text.split(anchor).length,2,'unexpected pinned P541 post-load shade anchor');
text=text.replace(anchor,"shade(lastColor);if(new URLSearchParams(location.search).get('realism118')==='after'){const r118=applyDualHumanoidRealism118(selected,current);canvas.dataset.realism118=JSON.stringify(r118);}front();");
await writeFile(file,text);
console.log(JSON.stringify({installed:true,target:'detached CC0 PR541 donor',feature:'query-opt-in skin PBR + hair geometry',releaseAuthorized:false}));
