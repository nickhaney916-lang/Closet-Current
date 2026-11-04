import test from 'node:test';
import assert from 'node:assert/strict';
import {planEdit,validateNormalizeCandidate,validateOutput,
 NORMALIZE_PREVIEW_DEFAULT_ENABLED} from '../supabase/functions/garment-normalize/protocol.mjs';

const image='data:image/jpeg;base64,'+'A'.repeat(300);
const base={action:'normalize-preview',category:'Tops',garmentImage:image,
 itemId:'item-1',photoSha256:'a'.repeat(64),userInitiated:true,storeResult:false};
test('paid normalizer cannot run without user opt-in and a source-linked category',()=>{
 assert.equal(NORMALIZE_PREVIEW_DEFAULT_ENABLED,false);
 assert.throws(()=>validateNormalizeCandidate({...base,userInitiated:false}));
 assert.throws(()=>validateNormalizeCandidate({...base,storeResult:true}));
 assert.throws(()=>validateNormalizeCandidate({...base,photoSha256:'bad'}));
 assert.throws(()=>validateNormalizeCandidate({...base,category:'Uncategorized'}));
 assert.throws(()=>validateNormalizeCandidate({...base,category:'Accessories'}));
 assert.throws(()=>validateNormalizeCandidate({...base,garmentImage:'https://external.example/private.jpg'}));
});
test('normalization requests use documented FASHN edit API single cheap private preview',()=>{
 for(const category of ['Tops','Bottoms','Dresses','Outerwear','Shoes']){
  const request=planEdit({...base,category});
  assert.equal(request.model_name,'edit');
  assert.equal(request.inputs.image,image);
  assert.equal(request.inputs.num_images,1);
  assert.equal(request.inputs.resolution,'1k');
  assert.equal(request.inputs.generation_mode,'fast');
  assert.equal(request.inputs.return_base64,true);
  assert.match(request.inputs.prompt,/neutral bright studio background/);
  assert.match(request.inputs.prompt,/not invent a new graphic/);
  assert.equal(request.inputs.output_format,'png');
 }
});
test('preview results cannot overwrite wardrobe or source assets by protocol',()=>{
 const r=validateOutput('data:image/png;base64,'+'B'.repeat(300));
 assert.equal(r.previewOnly,true);
 assert.equal(r.garmentIdentityVerified,false);
 assert.equal(r.canAutoReplaceClosetTile,false);
 assert.equal(r.canReplaceSourcePhoto,false);
 assert.equal(r.requiresVisualReview,true);
});
test('invalid provider outputs fail closed rather than saving to the closet',()=>{
 assert.throws(()=>validateOutput('https://cdn.example/some-image.png'));
 assert.throws(()=>validateOutput('data:image/svg+xml;base64,'+'A'.repeat(300)));
 assert.throws(()=>validateOutput(''));
});
test('different stored item IDs still cannot be conflated with source image hash',()=>{
 assert.throws(()=>planEdit({...base,itemId:''}));
 assert.throws(()=>planEdit({...base,itemId:'x'.repeat(129)}));
 const plan=planEdit(base);
 assert.equal('itemId' in plan.inputs,false);
 assert.equal('photoSha256' in plan.inputs,false);
});
