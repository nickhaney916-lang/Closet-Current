/**
 * Synthetic *falsification* of index-space manifold checks plus optional
 * genuine The Met original source 2551406 research shell witness.
 * No synthetic sample is a real photographed garment or wearable 3D proof.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {
 auditIndexedClosedSurface89 as audit,
 auditMetSourceShellForSinglePiece89 as metAudit
} from '../research/parallel89/met-source-shell-manifold-proof89.mjs';
import {buildMetSourceFrontNeutralBackShell89 as realShell}
 from '../research/parallel89/met-source-front-neutral-shell89.mjs';

function testBox(x=0,y=0){
 const pts=[
 [x+0,y+0,0],[x+1,y+0,0],[x+1,y+1,0],[x+0,y+1,0],
 [x+0,y+0,-.02],[x+1,y+0,-.02],[x+1,y+1,-.02],[x+0,y+1,-.02]
 ];
 const edges=[[0,1],[1,2],[2,3],[3,0]],index=[
 0,1,2,0,2,3,6,5,4,7,6,4
 ];
 for(const [u,v] of edges)index.push(u,u+4,v,v,u+4,v+4);
 return {positions:new Float32Array(pts.flat()),indices:new Uint32Array(index)};
}
const box=testBox();
const good=audit(box.positions,box.indices);
assert.equal(good.indexedClosedOrientableManifold,true,good.reason);
assert.equal(good.connectedComponents,1);
assert.equal(good.eulerCharacteristic,2);
assert.equal(good.totalTopologicalGenus,0);
assert.equal(good.consumer3DAdmitted,false);
assert.equal(good.sourcePhoto2DFallbackRequired,true);
assert.equal(good.singlePieceAvatarFitEligible,false);

function denied(pos,index,reason){
 const result=audit(pos,index);
 assert.equal(result.status,'TOPOLOGY_INVALID_2D_ONLY');
 assert.equal(result.reason,reason);
 assert.equal(result.consumer3DAdmitted,false);
}
const broken=Uint32Array.from(box.indices);
broken[1]=broken[2];denied(box.positions,broken,'out-of-range-or-degenerate-face-index');
const oob=Uint32Array.from(box.indices);
oob[0]=999;denied(box.positions,oob,'out-of-range-or-degenerate-face-index');
denied(box.positions,box.indices.slice(0,-3),'open-boundary-edge');
const backwards=Uint32Array.from(box.indices);
[backwards[0],backwards[1]]=[backwards[1],backwards[0]];
denied(box.positions,backwards,'same-direction-shared-edge-or-inconsistent-winding');
const zero=Float32Array.from(box.positions);
zero[3]=zero[0];zero[4]=zero[1];zero[5]=zero[2];
denied(zero,box.indices,'zero-or-subprecision-triangle-area');
const nan=Float32Array.from(box.positions);nan[2]=NaN;
denied(nan,box.indices,'nonfinite-3d-vertex');

// Two individually closed components pass edge-degree=2 but do not produce
// a single connected, research-only physical item.
const distant=testBox(3,0);
const twice=new Float32Array([...box.positions,...distant.positions]);
const doubleIndex=new Uint32Array([...box.indices,...Array.from(distant.indices,i=>i+8)]);
const doubleResult=audit(twice,doubleIndex);
assert.equal(doubleResult.indexedClosedOrientableManifold,true);
assert.equal(doubleResult.connectedComponents,2);
assert.equal(doubleResult.status,'INDEXED_CLOSED_BUT_MULTIPLE_COMPONENTS_2D_ONLY');

// Same-index vertex weld with two disconnected incident surface fans.
// Every indexed edge can remain 2-incidence yet surface is NOT manifold.
const second=testBox(-3,-3);
const weld=new Float32Array([...box.positions,...second.positions.slice(3)]);
const indexWeld=new Uint32Array([...box.indices,...Array.from(second.indices,i=>i===0?0:i+7)]);
const pinched=audit(weld,indexWeld);
assert.equal(pinched.status,'TOPOLOGY_INVALID_2D_ONLY',JSON.stringify(pinched));
assert.equal(pinched.reason,'pinched-disconnected-vertex-fans');

assert.equal(metAudit(null).status,'TOPOLOGY_INVALID_2D_ONLY');
assert.equal(metAudit({status:'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',
 imageId:2551408,consumer3DAdmitted:false,sourcePhoto2DFallbackRequired:true}).reason,
 'unverified-museum-front-or-unsafe-source-status');

console.log('M2_SHELL_TOPOLOGY_SYNTHETIC_FALSIFICATION_PASS '+JSON.stringify({
 examples:9,properIndexedManifold:good.status,disconnectedButClosed:doubleResult.status,
 pinchedVerticesRejected:pinched.reason,physicalClothProof:false,
 consumer3DAdmitted:false,sourcePhoto2DFallbackRequired:true,familyAlpha:'HOLD'
}));

if(process.env.P89_ACTUAL_SOURCE==='1'){
 const root='benchmark/parallel89-met70759-four-photo-research/';
 const masks='benchmark/parallel89-met70759-full-alpha-proposals/';
 const out='benchmark/parallel89-met-source-shell-manifold-HOLD/';
 const jpeg=await readFile(root+'met-70759-gallery-2551406.jpg');
 const png=await readFile(masks+'met-70759-2551406-AUTO-UNREVIEWED-foreground-mask.png');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const shell=await realShell({imageId:2551406,originalJPEGBytes:jpeg,conservativeMaskPNGBytes:png});
 assert.equal(shell.status,'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',shell.reason);
 const witness=metAudit(shell);
 assert.equal(witness.indexedClosedOrientableManifold,true,
  'Genuine original source indexed manifold failure: '+JSON.stringify(witness));
 assert.equal(witness.originalFrontJPEGByteSHA256,sha(jpeg));
 assert.equal(witness.originalFrontRGBATextureSHA256,sha(shell.originalRGBAFront));
 assert.equal(witness.consumer3DAdmitted,false);
 assert.equal(witness.sourcePhoto2DFallbackRequired,true);
 assert.equal(witness.machineMaskHumanApproved,false);
 assert.equal(witness.sourceAnatomicalFitProven,false);
 // A detached source-mask fragment is evidence, NOT a verified wearable item.
 assert.equal(witness.singlePieceAvatarFitEligible,false);
 await mkdir(out,{recursive:true});
 await writeFile(out+'original-met-front-index-manifold-witness.json',
  JSON.stringify(witness,null,2)+'\n');
 console.log('M2_GENUINE_MET_ORIGINAL_FRONT_INDEX_MANIFOLD_DIAGNOSIS '+JSON.stringify(witness));
}
