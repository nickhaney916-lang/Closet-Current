import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {MOTION01,createDampedClothSpring,createSourceTrueSkirtMotion}
 from '../research/fabric-motion-01/bounded-skirt-motion.mjs';

test('genuine source dress, not arbitrary photographed user clothing',()=>{
 assert.equal(MOTION01.sourceId,'commons-0053');
 assert.match(MOTION01.sourceSHA256,/^[a-f0-9]{64}$/);
 assert.equal(MOTION01.maxDisplacementMeters,.018);
 assert.equal(MOTION01.dynamicCollisionCertified,false);
 assert.equal(MOTION01.releaseAuthorized,false);
 assert.throws(()=>createSourceTrueSkirtMotion({mesh:{isSkinnedMesh:true}},new T.Object3D()),/genuine SHA-reviewed/);
 assert.throws(()=>createSourceTrueSkirtMotion({mesh:{isSkinnedMesh:true},stats:{
  sourceId:'commons-0053',sourceSHA256:'0'.repeat(64)}},new T.Object3D()),/genuine SHA-reviewed/);
});
test('finite bounded reversible damped spring with no perpetual render',()=>{
 const s=createDampedClothSpring();
 assert.deepEqual(s.sample(),{displacement:0,velocity:0,settled:true});
 for(const v of [NaN,Infinity,-1.01,1.01])assert.throws(()=>s.kick(v),/Bounded/);
 for(const v of [NaN,Infinity,-.01,.26])assert.throws(()=>s.step(v),/Finite/);
 s.kick(.8);
 const samples=Array.from({length:720},()=>s.step(1/60));
 assert.ok(samples.some(x=>Math.abs(x)>.01),'real inertia must visibly change shape');
 assert.ok(samples.every(x=>Math.abs(x)<=1),'no unbounded oscillation');
 assert.equal(s.sample().settled,true,'idle movement must stop');
 s.kick(-1);assert.ok(s.step(.1)<0,'direction changes with true impulse');
 s.reset();assert.deepEqual(s.sample(),{displacement:0,velocity:0,settled:true});
});
test('integrated 3D dress remains opt-in; protected photographic data and identity cannot be rewritten',()=>{
 const c=readFileSync('research/fabric-motion-01/dress-outfit-controller.mjs','utf8'),
  v=readFileSync('research/fabric-motion-01/dress-mobile-showroom.mjs','utf8'),
  w=readFileSync('research/fabric-motion-01/wardrobe-demo.mjs','utf8'),
  source=readFileSync('research/fabric-motion-01/bounded-skirt-motion.mjs','utf8');
 assert.match(c,/skirtSecondaryMotion01=false/);
 assert.match(v,/skirtSecondaryMotion01=false/);
 assert.match(w,/get\('motion'\)==='after'/);
 assert.match(w,/last3D\.originalPhotoSHA256s\?\.dress===SYNTHETIC_SOURCES10\.dress\.sha/);
 for(const name of ['dressRest','skinIndex','skinWeight','sourceSHA256',
  'photoProtectedVertices','reset','dispose','163','maxDisplacementMeters'])
  assert.ok(source.includes(name),'missing source preservation '+name);
 assert.doesNotMatch(source,/createClient\(|supabase|fetch\(|localStorage|canvas\.toDataURL/);
});
