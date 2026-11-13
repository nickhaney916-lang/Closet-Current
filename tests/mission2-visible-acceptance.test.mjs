import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {exactVisualName,visiblePixelDelta,measuredIdenticalScenePixelDelta} from '../scripts/check-mission2-visual-delta.mjs';

test('M2 male PNG must not alias the female substring in exact source-length manifests',()=>{
 const female=exactVisualName('chromium',430,'female','front');
 const male=exactVisualName('chromium',430,'male','front');
 assert.equal(female,'chromium-430-01-female-front-provisional-blouse.png');
 assert.equal(male,'chromium-430-04-male-front-provisional-blouse.png');
 assert.notEqual(female,male);
 for(const width of [320,390,430])for(const view of ['front','side','rear'])
  assert.notEqual(exactVisualName('webkit',width,'female',view),exactVisualName('webkit',width,'male',view));
 assert.equal(exactVisualName('webkit',320,'male','rear'),'webkit-320-06-male-inferred-rear-provisional-blouse.png');
 assert.throws(()=>exactVisualName('chromium',320,'other','front'),/exact filename/);
 assert.throws(()=>exactVisualName('chrome',320,'male','front'),/exact filename/);
});
test('M2 image comparison checks actual WebGL viewport pixels, not labels or metadata',async()=>{
 const png=async(rgb)=>sharp({create:{width:320,height:350,channels:3,background:rgb}}).png().toBuffer();
 const gold=await png({r:190,g:160,b:65});
 const blue=await png({r:65,g:90,b:210});
 assert.equal(await visiblePixelDelta(gold,gold,320),0);
 assert.equal(await visiblePixelDelta(gold,blue,320),1);
 assert.rejects(()=>visiblePixelDelta(gold,blue,0),/crop width/);
});
test('M2 unchanged viewport despite changed image metadata cannot pass the visual gate',async()=>{
 const make=async n=>sharp({create:{width:320,height:350,channels:3,background:{r:200,g:150,b:55}}})
  .png({compressionLevel:n}).toBuffer();
 const a=await make(1),b=await make(9);
 assert.notDeepEqual(a,b,'different PNG bytes should still be same rendered pixels');
 assert.equal(await visiblePixelDelta(a,b,320),0);
});


test('P2-C33 controlled photographic RGB regression measures real PNG pixels, not just metadata or scene descriptions',async()=>{
 const width=320,height=920,base=Buffer.alloc(width*height*3,127);
 const make=async pixels=>sharp(pixels,{raw:{width,height,channels:3}}).png().toBuffer();
 const source=await make(base);
 const samePixelsDifferentEncoding=await sharp(source).png({compressionLevel:1}).toBuffer();
 const same=await measuredIdenticalScenePixelDelta(source,samePixelsDifferentEncoding,width);
 assert.equal(same.sampledPixels,(Math.floor(width*.85)-Math.floor(width*.15))*410);
 assert.equal(same.changedOver2,0);
 assert.equal(same.changedOver8,0);
 assert.equal(same.meanAbsoluteChannelError,0);
 assert.equal(same.noOriginalPhotoPixelsReturned,true);
 assert.equal(same.humanAppearanceImprovementNotEstablished,true);
 const inCrop=Buffer.from(base);
 for(let y=150;y<175;y++)for(let x=130;x<146;x++){
  const i=(y*width+x)*3;
  inCrop[i]=155;inCrop[i+1]=155;inCrop[i+2]=155;
 }
 const change=await measuredIdenticalScenePixelDelta(source,await make(inCrop),width);
 assert.equal(change.changedOver2,400);
 assert.equal(change.changedOver8,400);
 assert.equal(change.changedOver12,400);
 assert.equal(change.maxChannelDiff,28);
 assert.ok(change.meanAbsoluteChannelError>0);
 assert.ok(change.fractionChangedOver2>0&&change.fractionChangedOver2<.01);
 // Changes outside the documented photographed cloth viewing crop must not
 // be presented as garment pixel evidence, even when PNG bytes change.
 const away=Buffer.from(base);
 for(let i=0;i<150;i++)away[i]=255;
 const uiOnly=await measuredIdenticalScenePixelDelta(source,await make(away),width);
 assert.equal(uiOnly.changedOver2,0);
 assert.rejects(()=>measuredIdenticalScenePixelDelta(source,source,330),/validated screenshot width/);
});
