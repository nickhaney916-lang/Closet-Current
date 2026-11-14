import test from 'node:test';
import assert from 'node:assert/strict';
import {
 LOCKED_P93_SOURCE,LOCKED_P93_CUTOUT,P93_PARAMETERS,
 proposeAlphaOnlyLicensedDress93
} from '../research/mission2-p93/alpha-only-source-warm-edge.mjs';
const W=200,H=150;
const fixture=()=>{
 const rgba=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const o=(y*W+x)*4;
  if(x>=40&&x<=160&&y>=30&&y<=145){
   rgba[o]=22;rgba[o+1]=18;rgba[o+2]=21;rgba[o+3]=255;
  }
 }
 const fill=(xa,xb,ya,yb,r,g,b)=>{
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){
   const o=(y*W+x)*4;
   rgba[o]=r;rgba[o+1]=g;rgba[o+2]=b;
  }
 };
 // Real mannequin-like warm source touching alpha boundary.
 fill(41,54,34,52,167,151,135);
 // High brightness neutral white genuine piping. Must NOT disappear.
 fill(43,44,34,52,239,239,239);
 // High brightness true internal white printed logo.
 fill(100,112,38,46,241,241,240);
 // Warm center NOT connected to source transparent outline.
 fill(84,110,51,56,171,151,133);
 return rgba;
};
const args=rgba=>({rgba,width:W,height:H,
 sourceSHA256:LOCKED_P93_SOURCE,cutoutSHA256:LOCKED_P93_CUTOUT});
test('P93 selects a real boundary-connected warm-alpha candidate, never edits a source pixel RGB',()=>{
 const f=fixture(),p=proposeAlphaOnlyLicensedDress93(args(f));
 assert.ok(p.proposedAlphaPixelsRemoved>=100);
 assert.ok(p.selectedBoundaryConnectedComponents>=1);
 assert.equal(p.sourceRGBChangedPixels,0);
 assert.equal(p.sourceAlphaIncreasedPixels,0);
 assert.equal(p.changedOutsideConservativeUpperRegion,0);
 assert.equal(p.removedPixelsWithoutSourceWarmSignature,0);
 assert.ok(p.originalVisiblePixels>=10000);
 for(let i=0;i<f.length;i+=4){
  assert.equal(p.candidateRGBA[i],f[i]);
  assert.equal(p.candidateRGBA[i+1],f[i+1]);
  assert.equal(p.candidateRGBA[i+2],f[i+2]);
  assert.ok(p.candidateRGBA[i+3]<=f[i+3]);
 }
});
test('P93 protects actual source black garment, logo and white piping; ignores source interior hue',()=>{
 const f=fixture(),p=proposeAlphaOnlyLicensedDress93(args(f)),a=p.candidateRGBA;
 const alpha=(x,y)=>a[(y*W+x)*4+3];
 assert.equal(alpha(41,38),0,'boundary-connected warm mannequin becomes alpha-clear proposal');
 assert.equal(alpha(43,38),255,'genuine neutral white piping survives');
 assert.equal(alpha(106,42),255,'source logo survives unchanged');
 assert.equal(alpha(101,52),255,'interior warm source component must remain');
 assert.equal(alpha(90,130),255,'garment body must remain');
 assert.equal(alpha(20,20),0,'transparent background must not be filled');
 assert.equal(p.releaseAuthorized,false);
 assert.equal(p.familyAlpha,'HOLD');
 assert.equal(p.noHumanOriginalPhotoApproval,true);
});
test('P93 deterministic source-alpha-only proof with exact fixed original JPEG/PNG SHA',()=>{
 const a=proposeAlphaOnlyLicensedDress93(args(fixture()));
 const b=proposeAlphaOnlyLicensedDress93(args(fixture()));
 assert.deepEqual(a.candidateRGBA,b.candidateRGBA);
 assert.equal(a.originalSourceSHA256,LOCKED_P93_SOURCE);
 assert.equal(a.originalCutoutSHA256,LOCKED_P93_CUTOUT);
 assert.equal(a.sourcePhotographAndAllOriginalRGBUntouched,true);
 assert.equal(a.removalIsCompleteMannequinSegmentation,false);
 assert.equal(a.originalOutlineAndLogoReviewStillRequired,true);
});
test('P93 refuses forged owner JPEG/cutout source, arbitrary new palette or source dimensions',()=>{
 const variations=[
  x=>x.sourceSHA256='0'.repeat(64),x=>x.cutoutSHA256='0'.repeat(64),
  x=>x.width=0,x=>x.height=0,
  x=>x.rgba=new Uint8Array(10),
  x=>x.parameters={...P93_PARAMETERS,maximumRemovedFractionOfOriginalVisible:.9},
 ];
 for(const fn of variations){
  const x=args(fixture());fn(x);
  assert.throws(()=>proposeAlphaOnlyLicensedDress93(x),/BLOCKED/);
 }
});
test('P93 refuses mass deletion, impossible source, or a no-op false-clean-up',()=>{
 const empty=new Uint8Array(W*H*4);
 assert.throws(()=>proposeAlphaOnlyLicensedDress93(args(empty)),/BLOCKED/);
 const plain=fixture();
 for(let y=34;y<=52;y++)for(let x=41;x<=54;x++){
  const o=(y*W+x)*4;
  plain[o]=13;plain[o+1]=12;plain[o+2]=16;
 }
 assert.throws(()=>proposeAlphaOnlyLicensedDress93(args(plain)),/BLOCKED/);
});
test('P93 excludes original center-line white markings without weakening source SHA',()=>{
 const f=fixture();
 const before=new Uint8Array(f);
 const p=proposeAlphaOnlyLicensedDress93(args(f));
 assert.deepEqual(f,before,'original research input must remain byte-identical');
 assert.ok(p.unchangedHighBrightnessNeutralPipingLogoSamples>50);
 assert.ok(p.proposedAlphaPixelsRemoved/p.originalVisiblePixels<
  P93_PARAMETERS.maximumRemovedFractionOfOriginalVisible);
});
