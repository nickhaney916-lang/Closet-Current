import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBodyGeometry} from '../public/humanoid-3d-body-geometry.mjs';
import {createDetailedHumanoid3D} from '../public/humanoid-3d-detailed-renderer.mjs';
const html=readFileSync(new URL('../public/verified-humanoid-browser-fixture.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/verified-humanoid-browser-fixture.mjs',import.meta.url),'utf8');
test('synthetic WebGL QA fixture exposes visible garment, rotation, and clear controls',()=>{
 for(const id of ['avatar','outfit','dress','rotate','clear','status'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(script,/applyVerifiedHumanoidOutfit/);
 assert.match(script,/clearVerifiedHumanoidOutfit/);
 assert.match(script,/Math.PI\/2/);
 assert.match(script,/NOT authenticated original-photo verification/);
});
test('research geometry is finite and renderer handles WebGL-unavailable browser',()=>{
 const shapes=createBodyGeometry();
 assert.ok(shapes.length>=15);
 assert.ok(shapes.every(shape=>shape.vertices.every(Number.isFinite)));
 const unsupported=createDetailedHumanoid3D({getContext:()=>null});
 assert.equal(unsupported.supported,false);
 assert.equal(unsupported.render(),false);
});
