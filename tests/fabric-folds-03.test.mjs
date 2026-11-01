import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {PLEATS03,fold03Signal,createSourceNeutralPosePleats03}
 from '../research/fabric-folds-03/pose-conditioned-source-pleats.mjs';

test('source-bounded pose-driven radial hem pleats vanish on neutral and are opposite-phase responsive',()=>{
 assert.equal(PLEATS03.sourceId,'commons-0053');
 assert.match(PLEATS03.sourceSHA256,/^[0-9a-f]{64}$/);
 assert.equal(PLEATS03.sourceSHA256,'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019');
 assert.equal(PLEATS03.maxDisplacementMeters,.0108);
 assert.equal(PLEATS03.defaultEnabled,false);
 for(const angle of [-3.14,-1.7,-.4,0,.3,1.5,3.14]){
  for(const lower of [0,.2,.5,.9,1]){
   const neutral=fold03Signal(0,angle,lower),back=fold03Signal(1,angle,lower);
   assert.equal(neutral.radial,0);assert.equal(neutral.tangential,0);
   assert.equal(back.radial,0);
   const left=fold03Signal(.25,angle,lower),right=fold03Signal(.75,angle,lower);
   for(const p of [left,right]){
    assert.ok(p.radial>=0&&p.radial<=1,'never inward radial squeeze');
    assert.ok(p.vertical>=0&&p.vertical<=1);
    assert.ok(Math.abs(p.tangential)<=1);
   }
   // A few symmetric angular positions can legitimately match; test the
   // asymmetric side-rear sector separately below.
  }
 }
 const asymmetricLeft=fold03Signal(.25,.7,.6),asymmetricRight=fold03Signal(.75,.7,.6);
 assert.ok(Math.abs(asymmetricLeft.tangential-asymmetricRight.tangential)>.01||
   Math.abs(asymmetricLeft.radial-asymmetricRight.radial)>.01);
 for(const bad of [-1,2,NaN,Infinity])assert.throws(()=>fold03Signal(bad,0,.5),/Finite/);
 assert.throws(()=>fold03Signal(.2,0,-.1),/Finite/);
 assert.throws(()=>fold03Signal(.2,0,1.2),/Finite/);
});
test('reject fabricated clothing, unvetted private photos, missing original skinned rig or canonical spring',()=>{
 assert.throws(()=>createSourceNeutralPosePleats03({},new THREE.Group(),null),/FOLDS-03 requires/);
 assert.throws(()=>createSourceNeutralPosePleats03({stats:{sourceId:'commons-0053'}},new THREE.Group(),null),/FOLDS-03 requires/);
 assert.equal(PLEATS03.sourceFrontUntouched,true);
 assert.equal(PLEATS03.releaseAuthorized,false);
 assert.equal(PLEATS03.sweptCollisionCertified,false);
 assert.equal(PLEATS03.physicalPhoneTested,false);
});
test('research copy strictly opt-in, preserves original source fields, neutralizes all folds at reset',()=>{
 const base='research/fabric-folds-03/';
 const source=readFileSync(base+'pose-conditioned-source-pleats.mjs','utf8'),
  controller=readFileSync(base+'dress-outfit-controller.mjs','utf8'),
  viewer=readFileSync(base+'dress-mobile-showroom.mjs','utf8'),
  app=readFileSync(base+'wardrobe-demo.mjs','utf8'),
  html=readFileSync(base+'index.html','utf8');
 assert.match(controller,/posePleats03=false/);
 assert.match(viewer,/poseConditionedPleats03=false/);
 assert.ok(controller.includes('createSourceNeutralPosePleats03(built.dress,root,newMotion01)'));
 assert.ok(controller.includes('folds03?.dispose()'));
 assert.ok(controller.includes('resetPosePleats03'));
 assert.ok(viewer.includes('outfit.applyPosePleats03(phase)'));
 assert.ok(viewer.includes('outfit.resetPosePleats03()'));
 assert.ok(app.includes("get('folds')==='after'"));
 assert.ok(app.includes("get('walk')==='after'"));
 assert.ok(app.includes("last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha"));
 assert.ok(html.includes('?walk=after'));
 for(const f of ['dressRest','skinIndex','skinWeight','photographed','spring.state().steps',
  'frontProtected','sourceSHA256','maxDisplacementMeters','reset','dispose'])
  assert.ok(source.includes(f),'must retain real source identity + reversible fold safety: '+f);
 assert.doesNotMatch(source,/fetch\(|createClient\(|localStorage|blob\.arrayBuffer/);
});
