/**
 * Deterministic independent P158 MIT original face-albedo audit.
 * Runs ONLY on SHA-pinned P156 repacked head-only GLB bytes from disposable CI.
 * Extracts original embedded PNG face map and independently re-derives
 * median source skin pixels used in the smartphone P158 runtime.
 * No user photo, account, staging, production, or network request.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const sha=b=>createHash('sha256').update(b).digest('hex');
const records={
 female:{
  file:'female-licensed-face-hair-only.glb',head:'f007_head',
  glb:'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4',
  texture:'74c3eaf62ef3716ae9e5cf9522c414dc02394c1ea6eb74108c4168d9bdcf2c1d',
  median:[187,136,104],sampleCount:33024
 },
 male:{
  file:'male-licensed-face-hair-only.glb',head:'m006_head',
  glb:'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72',
  texture:'3900466b7bc769c4c4cf0d384a043fcd16f92b98d1fce0ddfe8aa49b2aa3e72e',
  median:[140,94,65],sampleCount:23622
 }
};
function extractFacePng(glb,rec){
 assert.equal(glb.readUInt32LE(0),0x46546c67,'real GLB magic');
 assert.equal(glb.readUInt32LE(4),2,'glTF2 only');
 assert.equal(glb.readUInt32LE(8),glb.length);
 const jsonLength=glb.readUInt32LE(12);
 assert.equal(glb.readUInt32LE(16),0x4e4f534a);
 const parsed=JSON.parse(glb.subarray(20,20+jsonLength).toString().trim());
 const chunkOffset=20+jsonLength;
 const binaryLength=glb.readUInt32LE(chunkOffset);
 assert.equal(glb.readUInt32LE(chunkOffset+4),0x004e4942);
 assert.ok(binaryLength>0&&chunkOffset+8+binaryLength<=glb.length);
 const mat=parsed.materials.find(m=>m.name===rec.head);
 assert.ok(mat,'genuine exact original source face material');
 const textureIndex=mat.pbrMetallicRoughness?.baseColorTexture?.index;
 assert.ok(Number.isInteger(textureIndex),'real head base-color map required');
 const imgIndex=parsed.textures[textureIndex].source;
 const source=parsed.images[imgIndex];
 assert.equal(source.mimeType,'image/png');
 const view=parsed.bufferViews[source.bufferView];
 assert.ok(view.byteLength>100000&&view.byteLength<1000000);
 const start=chunkOffset+8+(view.byteOffset||0);
 assert.ok(start>=0&&start+view.byteLength<=glb.length);
 return glb.subarray(start,start+view.byteLength);
}
const evidence={priority:158,originalSourceLicense:'Microsoft Rocketbox MIT',
 exactP156GlbSHA256Verified:true,embeddedOriginalHeadPngSHA256Verified:true,
 originalFaceTexturePixelsReadFromImmutableSource:true,
 noCustomerImagesRead:true,familyAlpha:'HOLD',releaseAuthorized:false,figures:{}};
for(const [figure,rec] of Object.entries(records)){
 const buf=await readFile('benchmark/rocketbox-wardrobe-separation-156/heads/'+rec.file);
 assert.equal(sha(buf),rec.glb,'original 80-bone licensed source GLB changed');
 const png=extractFacePng(buf,rec);
 assert.equal(sha(png),rec.texture,'source face-albedo original PNG changed');
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,512);assert.equal(info.height,512);assert.equal(info.channels,4);
 const samples=[];
 for(let i=0;i<data.length;i+=16){
  const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
  if(a<235||r<56||r>244||g<31||g>223||b<18||b>212||
     r<g*1.065||g<b*1.02||r-g>94||g-b>78)continue;
  samples.push([r,g,b]);
 }
 const median=k=>{
  const sorted=samples.map(x=>x[k]).sort((a,b)=>a-b);
  return sorted[Math.floor(sorted.length/2)];
 };
 const measured=[median(0),median(1),median(2)];
 assert.equal(samples.length,rec.sampleCount,'source skin sample count differs');
 assert.deepEqual(measured,rec.median,'original face tone medians not independently reproducible');
 evidence.figures[figure]={
  originalHeadGLBSHA256:rec.glb,originalEmbeddedFacePngSHA256:rec.texture,
  actualLicensedFacePixelCount:samples.length,actualLicensedSRGBMedian:measured,
  originalTextureDimensions:[info.width,info.height],
  originalSourceModified:false,originalUserFaceOrPhotoRead:false
 };
}
await mkdir('benchmark/licensed-face-skin-neck-harmony-158/audit',{recursive:true});
await writeFile('benchmark/licensed-face-skin-neck-harmony-158/audit/pinned-verified-face-palettes.json',
 JSON.stringify(evidence,null,2)+'\n');
console.log('P158_ORIGINAL_MICROSOFT_LICENSED_HEAD_FACE_PALETTES_SHA256_VERIFIED '+JSON.stringify(evidence.figures));
