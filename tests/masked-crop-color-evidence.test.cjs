'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const PhotoColor=require('../public/photo-color.js');
const src=fs.readFileSync('public/photo-crop-editor.js','utf8');
const cut=src.indexOf("'use strict';");
assert.ok(cut>0&&src.includes('function cropMaskColorEvidence'),'Pure mask evidence helper required');
const ctx={Uint8ClampedArray,Number,Math};
vm.createContext(ctx);vm.runInContext(src.slice(0,cut),ctx);
const evidence=ctx.cropMaskColorEvidence;
function makeMask({width=80,height=80,color=[30,70,215],box=[25,25,55,55],opaqueAll=false}={}){
 const bytes=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;bytes[i]=color[0];bytes[i+1]=color[1];bytes[i+2]=color[2];
  bytes[i+3]=opaqueAll||x>=box[0]&&x<box[2]&&y>=box[1]&&y<box[3]?255:0;
 }
 return bytes;
}
test('an isolated original RGB blue garment with robust eroded foreground earns real mask provenance',()=>{
 const pixels=makeMask(),original=new Uint8ClampedArray(pixels);
 const value=evidence(pixels,80,80,PhotoColor);
 assert.equal(value.color,'Blue');
 assert.equal(value.source,'photo-estimate');
 assert.equal(value.method,'garment-mask');
 assert.equal(value.needsConfirmation,false);
 assert.ok(value.support>=.6&&value.support<=1);
 assert.deepEqual(pixels,original,'checking color never edits the original masked pixels');
});
test('fully opaque crop is not a known garment mask: never trust its background color',()=>{
 const result=evidence(makeMask({opaqueAll:true}),80,80,PhotoColor);
 assert.equal(result,null);
});
test('minor transparent border cannot prove garment isolation',()=>{
 const bytes=makeMask({box:[1,1,79,79]});
 assert.equal(evidence(bytes,80,80,PhotoColor),null);
});
test('tiny, low-coverage garment mask cannot produce verified color',()=>{
 const bytes=makeMask({box:[35,35,44,44]});
 assert.equal(evidence(bytes,80,80,PhotoColor),null);
});
test('unconfirmed palette source can never be silently elevated',()=>{
 const bytes=makeMask();
 const fake={
  maskedPalette:()=>({primary:'Blue',coverage:.15,needsConfirmation:false}),
  confirmedGarmentPalette:()=>({color:'Blue',source:'unverified-preview',support:.95})
 };
 assert.equal(evidence(bytes,80,80,fake),null);
});
test('mask cannot be evaluated with forged dimensions or missing supported palette engine',()=>{
 assert.equal(evidence(makeMask(),200,80,PhotoColor),null);
 assert.equal(evidence(makeMask(),80,80,{}),null);
});
test('manual edited photo path sends only two-region evidence into saved crop',()=>{
 assert.match(src,/const confirmed=cropMaskColorEvidence\(pixels.data,canvas.width,canvas.height,window.PhotoColor\)/);
 assert.match(src,/if\(confirmed\)photo.maskedColorEstimate=confirmed/);
 assert.doesNotMatch(src,/if\(palette&&!palette.needsConfirmation\)photo.maskedColorEstimate/);
});
test('app never rewrites unverified mask-color provenance to verified on manual crop save',()=>{
 const code=fs.readFileSync('public/app.js','utf8');
 assert.match(code,/Only the editor's two-view verified foreground method is trusted/);
 assert.doesNotMatch(code,/if\(photo.maskedColorEstimate&&value.colorSource==='photo-estimate'\)value.colorMethod='garment-mask'/);
});
