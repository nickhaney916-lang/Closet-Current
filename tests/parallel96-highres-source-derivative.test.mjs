/** P96 contract tests. Geometry/receipts are synthetic; REAL ONNX and 4K browser evidence is a separate gate. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {createInferenceDerivative96,inverseCrop96,openHighResP88Intake96,
 MAX_SOURCE_PIXELS96,MAX_MODEL_SIDE96} from '../research/parallel96-highres/source-derivative-intake96.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const sourceBytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
const expected=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
const sourceSHA256=createHash('sha256').update(sourceBytes).digest('hex');
assert.equal(sourceSHA256,expected.sha256);
const original='data:image/jpeg;base64,'+sourceBytes.toString('base64');
// A JPEG comment makes a second valid source byte stream for synthetic
// independent-source testing without inventing a real garment or real label.
const commented=Buffer.concat([sourceBytes.subarray(0,2),
 Buffer.from([0xff,0xfe,0,4,65,66]),sourceBytes.subarray(2)]);
const modelImage='data:image/jpeg;base64,'+commented.toString('base64');
const sha=x=>createHash('sha256').update(Buffer.from(x.split(',')[1],'base64')).digest('hex');
const maskA='a1'.repeat(32),maskB='b2'.repeat(32),maskC='c3'.repeat(32);
const requestId='87ed02a2-1135-4856-bbee-ab319a1ffb19';
function fixture(image=original,w=4096,h=2731,orientation=1){
 const hash=sha(image);
 return {image,sourceSHA256:hash,sourceHashVerified:true,
  originalPhoto:{image,sha256:hash,width:w,height:h,orientation}};
}
function canvas(image=modelImage){
 return {width:0,height:0,getContext:()=>({drawImage:()=>{}}),
  toDataURL:()=>image};
}
const fakeDecoded=(width=4096,height=2731)=>({naturalWidth:width,naturalHeight:height});
async function derivative(proof=fixture(),decoded=fakeDecoded(),model=modelImage){
 return createInferenceDerivative96({proof,decoded,makeCanvas:()=>canvas(model)});
}
function signed(proof=fixture()){
 const state={owner:'synthetic-P96-A',source:proof.sourceSHA256,epoch:10,
  request:requestId,db:'closet-current-user-synthetic-P96-A'};
 return {state,args:{ownerId:state.owner,requestId:state.request,
  reviewEpoch:state.epoch,getOwner:()=>state.owner,
  getSourceSHA256:()=>state.source,getReviewEpoch:()=>state.epoch,
  getActiveRequestId:()=>state.request,getDbName:()=>state.db}};
}
function proposal(s,{ordinal=0,mask=maskA,hash=s.derivative.geometry.modelSHA256,
 crop={x:.1,y:.15,width:.3,height:.35},
 method='native_semantic_group',hint={categories:['Tops'],types:[],
  confidence:.9,clipped:false}}={}){
 return {type:'piece',id:requestId,piece:{
  cropBounds:crop,instanceMethod:method,hint,
  image:'data:image/jpeg;base64,UNTRUSTED',ownerId:'FOREIGN',
  colorEstimate:{color:'Blue',secret:'DO NOT PROPAGATE'},
  reconciliation70:{sourceSha256:hash,maskSha256:mask,
   instanceOrdinal:ordinal,method}
 }};
}
async function session(proof=fixture()){
 const d=await derivative(proof);
 const s=signed(proof);
 const intake=await openHighResP88Intake96({proof,derivative:d,...s.args});
 return {...s,derivative:d,intake};
}
test('P96 licensed input SHA is exact; 4K model raster stays transient and transform reversible',async()=>{
 const p=fixture(),d=await derivative(p);
 assert.equal(p.image,original);
 assert.equal(p.originalPhoto.image,original);
 assert.equal(sha(original),expected.sha256);
 assert.equal(d.geometry.sourceSHA256,expected.sha256);
 assert.equal(d.geometry.modelSHA256,sha(modelImage));
 assert.notEqual(d.geometry.sourceSHA256,d.geometry.modelSHA256);
 assert.equal(Math.max(d.geometry.modelWidth,d.geometry.modelHeight),MAX_MODEL_SIDE96);
 assert.equal(d.geometry.sourceWidth,4096);
 assert.equal(d.geometry.sourceHeight,2731);
 assert.equal(d.geometry.mapping,'full-frame-axis-aligned-canvas-resize');
 assert.equal(d.geometry.maskResolutionVerified,false);
 const box={x:.1357,y:.1439,width:.4212,height:.3333};
 const inverse=inverseCrop96(box,d.geometry);
 for(const k of Object.keys(box)){
  const measure=k==='x'||k==='width'?4096:2731;
  assert.ok(Math.abs(box[k]-inverse[k])*measure<=2.01,k);
 }
 assert.equal(Object.hasOwn(d.geometry,'image'),false);
});
test('P96 real native worker request gets DERIVATIVE, no original, owner or cloud',async()=>{
 const s=await session();
 assert.deepEqual(s.intake.workerRequest(),{
  id:requestId,image:modelImage,instanceReview70:true,instanceReview840:true
 });
 assert.equal(s.intake.ledger().sourceSHA256,sourceSHA256);
 assert.equal(s.intake.ledger().modelSHA256,sha(modelImage));
 assert.equal(s.intake.ledger().reviewOnly,true);
 assert.equal(s.intake.ledger().renderAuthorized3D,false);
 assert.ok(!JSON.stringify(s.intake.ledger()).includes('data:image'));
 s.intake.close();
});
test('P96 worker MASK is bound to derivative SHA, not original SHA',async()=>{
 const s=await session();
 const bad=s.intake.intake(proposal(s,{hash:sourceSHA256}));
 assert.equal(bad.accepted,false);
 assert.equal(bad.reason,'invalid-model-source-mask-receipt');
 // A refused message still consumes an ordinal; wrong ordinal cannot be replayed.
 const correct=s.intake.intake(proposal(s,{ordinal:1}));
 assert.equal(correct.accepted,true,correct.reason);
 assert.equal(correct.piece.personDetected,false);
 assert.ok(correct.piece.instanceKey.startsWith('seg-'));
 assert.equal(correct.piece.hint.categories[0],'Tops');
 assert.equal(correct.piece.hint.instanceMethod,undefined,
  'sanitizer must not promote a worker method into human-verified identity');
 assert.equal(JSON.stringify(correct).includes('FOREIGN'),false);
 assert.equal(JSON.stringify(correct).includes('DO NOT PROPAGATE'),false);
 s.intake.close();
});
test('P96 same mask under a later ordinal and spatially ambiguous distinct masks fail closed',async()=>{
 const s=await session();
 const first=s.intake.intake(proposal(s));
 assert.equal(first.accepted,true,first.reason);
 assert.equal(s.intake.intake(proposal(s,{ordinal:1})).reason,'duplicate-source-mask');
 assert.equal(s.intake.intake(proposal(s,{ordinal:2,mask:maskB,
  crop:{x:.101,y:.151,width:.3,height:.35}})).reason,'ambiguous-same-photo-region');
 const separate=s.intake.intake(proposal(s,{ordinal:3,mask:maskC,
  crop:{x:.63,y:.61,width:.2,height:.25}}));
 assert.equal(separate.accepted,true,separate.reason);
 assert.equal(separate.piece.personDetected,false);
 s.intake.close();
});
test('P96 hostile/out-of-range/bad masks never become reviewed source coordinates',async()=>{
 const s=await session();
 const invalid=[{x:-.1,y:.1,width:.4,height:.3},
  {x:.2,y:.2,width:.9,height:.3},{x:NaN,y:0,width:.2,height:.2},
  {x:.4,y:.3,width:0,height:.2}];
 for(let i=0;i<invalid.length;i++)
  assert.equal(s.intake.intake(proposal(s,{ordinal:i,mask:(i+1).toString(16).repeat(64),
   crop:invalid[i]})).reason,'uncertain-original-crop-mapping');
 assert.equal(s.intake.intake(proposal(s,{ordinal:invalid.length,
  hash:'f'.repeat(64)})).reason,'invalid-model-source-mask-receipt');
 s.intake.close();
});
test('P96 every held worker event revokes across owner, source, request, epoch, DB, and close',async()=>{
 for(const field of ['owner','source','request','epoch','db']){
  const s=await session();
  s.state[field]=field==='epoch'?11:'other';
  assert.equal(s.intake.intake(proposal(s)).reason,'stale-source-or-owner-lease',field);
  assert.throws(()=>s.intake.workerRequest(),/stale source or owner lease/);
 }
 const s=await session();
 s.intake.close();
 assert.equal(s.intake.intake(proposal(s)).accepted,false);
 assert.throws(()=>s.intake.workerRequest(),/stale source or owner lease/);
});
test('P96 invalid sources, oversized pixel budgets, orientation, dimensions and canvas errors fail before worker',async()=>{
 const bad=fixture();bad.originalPhoto.image=modelImage;
 await assert.rejects(derivative(bad),/unverified original/);
 await assert.rejects(derivative(fixture(original,9000,4000),fakeDecoded(9000,4000)),/pixel budget/);
 await assert.rejects(derivative(fixture(original,4096,2731,6)),/EXIF orientation/);
 await assert.rejects(derivative(fixture(),fakeDecoded(4097,2731)),/dimensions changed/);
 await assert.rejects(derivative(fixture(original,3072,2048),fakeDecoded(3072,2048)),/not a high-resolution/);
 await assert.rejects(createInferenceDerivative96({
  proof:fixture(),decoded:fakeDecoded(),makeCanvas:()=>({getContext:()=>null})
 }),/derivative unavailable/);
 assert.ok(MAX_SOURCE_PIXELS96>=4096*2731);
});
test('P96 mismatched/resized/tampered model bytes and two separate originals cannot cross-source lease',async()=>{
 const one=await session();
 const secondProof=fixture(modelImage);
 const second=signed(secondProof);
 await assert.rejects(openHighResP88Intake96({
  proof:secondProof,derivative:one.derivative,...second.args
 }),/derivative\/source identity mismatch/);
 await assert.rejects(openHighResP88Intake96({
  proof:fixture(),derivative:{...one.derivative,image:original},...signed().args
 }),/derivative\/source identity mismatch/);
 one.state.source=secondProof.sourceSHA256;
 assert.equal(one.intake.intake(proposal(one)).reason,'stale-source-or-owner-lease');
 one.intake.close();
});

function exifOriginalWithOrientation96(originalJPEG,orientation){
 // Legitimate JPEG APP1 EXIF/TIFF IFD0 orientation entry, inserted just after SOI.
 // The test uses byte-derived source proof, never a fabricated digest receipt.
 const src=Buffer.from(originalJPEG.split(',')[1],'base64');
 assert.equal(src[0],255);assert.equal(src[1],216);
 const tiff=Buffer.from([
  0x49,0x49,0x2a,0,8,0,0,0, // little-endian TIFF, IFD0 at byte 8
  1,0,0x12,1,3,0,1,0,0,0,orientation,0,0,0, // one SHORT orientation value
  0,0,0,0 // next IFD offset
 ]);
 const payload=Buffer.concat([Buffer.from('Exif\\0\\0','latin1'),tiff]);
 const length=payload.length+2;
 return 'data:image/jpeg;base64,'+Buffer.concat([
  src.subarray(0,2),Buffer.from([255,225,length>>8,length&255]),
  payload,src.subarray(2)
 ]).toString('base64');
}
test('P96 forged upright metadata cannot bypass EXIF rotation/mirror in verified original JPEG',async()=>{
 // Authentic original JPEG data are byte-preserved other than legal APP1 metadata.
 // The proof SHA is correctly recomputed, so this specifically checks EXIF
 // crop coordinate safety rather than tamper rejection.
 for(const orientation of [2,3,4,5,6,7,8,9]){
  const exif=exifOriginalWithOrientation96(original,orientation);
  const p=fixture(exif,4096,2731,1); // hostile or stale "upright" receipt
  assert.notEqual(p.sourceSHA256,sourceSHA256);
  await assert.rejects(derivative(p,fakeDecoded()),/EXIF orientation requires manual crop review/,
   'orientation '+orientation+' must not enter model crop mapping');
 }
 const upright=exifOriginalWithOrientation96(original,1);
 const accepted=await derivative(fixture(upright,4096,2731,1),fakeDecoded());
 assert.equal(accepted.geometry.sourceSHA256,sha(upright));
 assert.equal(accepted.geometry.physicalGarmentVerified,false);
});
