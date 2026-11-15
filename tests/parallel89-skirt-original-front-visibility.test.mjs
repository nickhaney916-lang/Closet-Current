/**
 * Synthetic pixel-diagnostic contract tests only. Original source, actual
 * native screenshots and anatomical male/female THREE skinning are tested
 * separately by authenticated Chromium/WebKit CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalSkirtResearchFrontCoverage89} from
 '../research/parallel89/skirt-original-front-visibility89.mjs';
const sha='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const W=390,H=690;
const color=(arr,x,y,rgb)=>arr.set(rgb,(y*W+x)*3);
function fixture({occluded=true,improved=true}={}){
 const original=new Uint8Array(W*H*3),trial=new Uint8Array(W*H*3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  color(original,x,y,[242,234,223]);color(trial,x,y,[242,234,223]);
 }
 for(let x=150;x<235;x++)for(let y=205;y<264;y++){
  color(original,x,y,[151,143,137]);color(trial,x,y,[151,143,137]);
 }
 for(let x=175;x<215;x++)for(let y=333;y<363;y++){
  if(occluded)color(original,x,y,[151,143,137]);
  if(!improved)color(trial,x,y,[151,143,137]);
 }
 return {originalRGB:original,candidateRGB:trial,width:W,height:H,
  avatar:'female',pose:'source',sourceSHA256:sha};
}
test('real-source locked center front pixel witness rejects gross BVH zero intersection as clothing fit and records true photo panel improvement',()=>{
 const values=fixture();const before=values.originalRGB.slice(),after=values.candidateRGB.slice();
 const r=auditOriginalSkirtResearchFrontCoverage89(values);
 assert.equal(r.status,'ORIGINAL_PHOTOGRAPH_CENTER_FRONT_COVERAGE_IMPROVED_RESEARCH_ONLY');
 assert.ok(r.originalCenterFrontalVisibleMannequinFraction>.1);
 assert.equal(r.rigid45mmCenterFrontalVisibleMannequinFraction,0);
 assert.ok(r.rigid45mmCreamPanelPixelFraction>.85);
 assert.ok(r.originalCreamPanelPixelFraction<r.rigid45mmCreamPanelPixelFraction);
 assert.equal(r.originalPhotoCenterFrontOcclusionReduced,true);
 assert.equal(r.inferredRearStillUnphotographed,true);
 assert.equal(r.humanVisualFitAccepted,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(values.originalRGB,before);
 assert.deepEqual(values.candidateRGB,after);
});
test('a shifted garment whose front still exposes the public mannequin NEVER gets positive coverage evidence',()=>{
 for(const f of [fixture({improved:false}),fixture({occluded:false})]){
  const r=auditOriginalSkirtResearchFrontCoverage89(f);
  assert.equal(r.status,'ORIGINAL_PHOTO_CENTER_FRONT_COVERAGE_NOT_YET_VERIFIED');
  assert.equal(r.originalPhotoCenterFrontOcclusionReduced,false);
  assert.equal(r.releaseAuthorized,false);
 }
});
test('forged source and owner/body-shaped picture data must fail without exporting pixels',()=>{
 const v=fixture();
 for(const bad of [
  {avatar:'private-user'},{pose:'blend-25'},
  {sourceSHA256:'0'.repeat(64)},{width:0},
  {height:0},{originalRGB:new Uint8Array(100)},
  {candidateRGB:[]},{candidateRGB:undefined}
 ]){
  const r=auditOriginalSkirtResearchFrontCoverage89({...v,...bad});
  assert.equal(r.status,'ACTUAL_SOURCE_FRONT_VISIBILITY_NOT_VERIFIED');
  assert.equal(r.sourcePhoto2DFallbackRequired,true);
  assert.equal(r.releaseAuthorized,false);
 }
 const r=auditOriginalSkirtResearchFrontCoverage89(v);
 assert.ok(!JSON.stringify(r).includes('151,143,137'));
 assert.ok(!JSON.stringify(r).includes('242,234,223'));
});
