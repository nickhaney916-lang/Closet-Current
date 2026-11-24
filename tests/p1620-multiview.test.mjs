import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {verifyCohort,compareRegistered,sha256} from '../research/p1620-multiview/evaluator.mjs';

test('held-out custody checks component, role, duplicate bytes, corruption and inherited use',async()=>{
 const bytes=await Promise.all(['#a02530','#164783'].map(background=>
  sharp({create:{width:16,height:20,channels:3,background}}).jpeg().toBuffer()));
 const recordURL='https://museum.example/object/1';
 const views=bytes.map((buffer,i)=>({role:i?'rear':'front',part:'jacket',objectRecord:recordURL,
  sha256:sha256(buffer),license:'CC0',width:16,height:20,mediaId:String(i),
  photoURL:'https://museum.example/image/'+i,rightsURL:recordURL}));
 const catalog={institution:'Museum fixture',accession:'fixture-1',part:'jacket',recordURL,tuningEligible:false,views};
 const read=view=>bytes[Number(view.mediaId)];
 const plan=await verifyCohort([catalog],read);
 assert.equal(plan[0].input.role,'front');assert.deepEqual(plan[0].heldOut,[views[1]]);
 assert.ok(!plan[0].heldOut.some(view=>view.role==='side'));
 for(const bad of [
  {...catalog,views:[views[0],{...views[1],part:'skirt'}]},
  {...catalog,views:[views[0],{...views[1],sha256:views[0].sha256}]},
  {...catalog,views:[views[0]]},{...catalog,tuningEligible:true}
 ])await assert.rejects(verifyCohort([bad],read));
 await assert.rejects(verifyCohort([catalog],()=>Buffer.from('altered')),/byte receipt/);
 await assert.rejects(verifyCohort([catalog],read,new Set([views[0].sha256])),/custody/);
});

test('comparison blocks unregistered or changed masks and retains diagnostic limits',()=>{
 const reference=Uint8Array.of(1,0,0,0),projection=Uint8Array.of(1,1,0,0),uncertain=new Uint8Array(4);
 const source={role:'side',sha256:'a'.repeat(64)},projectionSHA256=sha256(projection);
 const registration={status:'independently-registered',view:'side',viewSHA256:source.sha256,
  projectionSHA256,referenceMaskSHA256:sha256(reference),uncertaintyMaskSHA256:sha256(uncertain),
  width:2,height:2,reviewReceipt:'synthetic registration control',maskReview:'machine-unreviewed'};
 const args={reference,projection,uncertain,width:2,height:2,registration,source,projectionSHA256};
 const result=compareRegistered(args);
 assert.equal(result.iou,.5);assert.equal(result.boundaryL1MeanPixels,1/3);
 assert.equal(result.physicalDepthVerified,false);assert.equal(result.wearableFitVerified,false);
 assert.equal(result.humanApprovedMask,false);
 assert.equal(compareRegistered({...args,registration:{}}).status,'BLOCKED');
 assert.equal(compareRegistered({...args,source:{...source,role:'rear'}}).status,'BLOCKED');
 assert.equal(compareRegistered({...args,reference:Uint8Array.of(0,1,0,0)}).status,'BLOCKED');
 uncertain[1]=1;
 const masked=compareRegistered({...args,registration:{...registration,uncertaintyMaskSHA256:sha256(uncertain)}});
 assert.equal(masked.iou,1);assert.equal(masked.boundaryL1MeanPixels,null);
});
