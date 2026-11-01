import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SWEEP04,gaitSweepPhases04,phaseContinuity04,
 createContinuousGaitClock04,sampleGaitDrapeContinuity04
} from '../research/fabric-sweep-04/continuous-gait-phase.mjs';

test('exact 9 authentic poses across entire true body gait, no interpolation cheat',()=>{
 const phases=gaitSweepPhases04(),result=sampleGaitDrapeContinuity04(phases);
 assert.deepEqual([...phases],[0,.125,.25,.375,.5,.625,.75,.875,1]);
 assert.equal(result.length,9);
 assert.equal(SWEEP04.originalRigBones,163);
 assert.equal(SWEEP04.defaultOff,true);
 assert.equal(SWEEP04.mathematicallyContinuousCollisionCertified,false);
 assert.ok(result.every(x=>x.originalPhotographedDressFrontPreserved===true&&x.actualOriginalBonePose===true));
 assert.ok(result.some(x=>x.bones.leftKnee>0));
 assert.ok(result.some(x=>x.bones.rightKnee>0));
 assert.ok(result.some(x=>x.fold.radial>.1));
 for(const p of result.slice(1))assert.ok(p.prior.realBoneDegrees<=8.1);
 for(const p of [-1,NaN,Infinity,1.1])assert.throws(()=>phaseContinuity04(.1,p),/Finite/);
 assert.throws(()=>sampleGaitDrapeContinuity04([.25,.75]),/9-sample/);
});
test('monotonic bounded real browser clock: phase continuity on variable mobile frame rate, exact reset',()=>{
 const clock=createContinuousGaitClock04();
 const first=clock.tick(0);assert.equal(first.ticks,1);
 let time=0,prior=first;
 for(let i=0;i<400;i++){
  time+=i%3===0?33.333:16.667;
  const v=clock.tick(time);
  assert.ok(v.deltaSeconds<=.05&&v.deltaSeconds>=0);
  const distance=Math.min(Math.abs(v.phase-prior.phase),1-Math.abs(v.phase-prior.phase));
  assert.ok(distance<=.05/1.65+1e-9,'no teleport even at mobile throttling');
  prior=v;
 }
 assert.throws(()=>clock.tick(-1),/Valid/);
 assert.throws(()=>clock.tick(time-3),/Monotonic/);
 const before=clock.state();assert.ok(before.elapsedMs>1000);
 clock.reset();assert.equal(clock.state().ticks,0);
 assert.equal(clock.state().phase,0);
 clock.tick(0);const stalled=clock.tick(10000);
 assert.equal(stalled.deltaSeconds,.05);
 assert.ok(stalled.clampedFrames>=1);
 clock.dispose();assert.throws(()=>clock.tick(10011),/Valid/);
 assert.throws(()=>createContinuousGaitClock04({periodMs:20}),/outside safe/);
});
test('real viewer opt-in, no source substitution, source contact B/V/H scans, original pose restoration',()=>{
 const path='research/fabric-sweep-04/';
 const viewer=readFileSync(path+'dress-mobile-showroom.mjs','utf8'),
  app=readFileSync(path+'wardrobe-demo.mjs','utf8'),
  folds=readFileSync(path+'pose-conditioned-source-pleats.mjs','utf8'),
  browser=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8');
 assert.ok(viewer.includes('createContinuousGaitClock04'));
 assert.ok(viewer.includes('sampleSweep04'));
 assert.ok(viewer.includes('haltGait02'));
 assert.ok(viewer.includes('outfit.applyPosePleats03(phase)'));
 assert.ok(app.includes('window.ccWardrobeSweep04=phase'));
 assert.ok(app.includes("get('sweep')==='after'"));
 assert.ok(app.includes("bound.indexed.byId.get(slots.top)?.category==='Dresses'"));
 assert.ok(app.includes('app.getState().stats?.bones===163'));
 assert.ok(app.includes("last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha"));
 for(const key of ['dressRest','skinIndex','skinWeight','frontProtected','maxDisplacementMeters'])
  assert.ok(folds.includes(key));
 assert.ok(browser.includes("window.ccWardrobeGait02('audit')"));
 assert.ok(browser.includes("window.ccWardrobeSweep04(phase)"));
 assert.ok(browser.includes("sweep-contact"));
 assert.doesNotMatch(app,/supabase\.auth|createClient\(|localStorage\.setItem\(/);
});