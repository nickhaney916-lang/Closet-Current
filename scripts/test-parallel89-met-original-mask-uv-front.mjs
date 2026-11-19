/**
 * True same-original-image Met IIIF JPEG + pinned OpenCV conservative mask
 * to source-pixel UV FRONT ONLY in Node / genuine native browser.
 * Browser draws source RGB on a 2D plane: NOT a fitted clothing 3D volume.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {buildMetOriginalMaskTexturedFront89 as build} from
 '../research/parallel89/met-original-mask-rgb-uv-front89.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const src='benchmark/parallel89-met70759-four-photo-research';
const masks='benchmark/parallel89-met70759-full-alpha-proposals';
const artifactDir='benchmark/parallel89-met-source-mask-real-uv-HOLD';
const report=JSON.parse(await readFile(masks+'/met-70759-four-photo-AUTO-UNREVIEWED-mask-receipts.json'));
assert.equal(report.schema,'M2-source-attested-original-Met-four-foreground-alpha-candidates/v1');
assert.equal(report.sourceObjectNumber,'1983.21a, b');
assert.equal(report.humanOrCuratorialMaskAcceptanceReceived,false);
assert.equal(report.allMasksMachineGeneratedAndUnreviewed,true);
assert.equal(report.consumer3DAdmitted,false);
assert.equal(report.releaseAuthorized,false);
assert.equal(report.familyAlpha,'HOLD');
const shots=[];
for(const id of [2551406,2551408]){
 const bytes=await readFile(src+'/met-70759-gallery-'+id+'.jpg');
 const origRaw=await readFile(src+'/met-70759-gallery-'+id+'.rgb');
 const png=await readFile(masks+'/met-70759-'+id+'-AUTO-UNREVIEWED-foreground-mask.png');
 const entry=report.maskedOriginalPhotoPixels.find(x=>x.sourceImageId===id||x.imageId===id);
 assert.ok(entry,'actual separately generated mask provenance must exist for '+id);
 assert.equal(entry.maskNotHumanOrCuratorApproved,true);
 assert.equal(entry.independentExpertBoundaryReviewRequired,true);
 assert.equal(entry.outputMaskPngSHA256,sha(png));
 assert.equal(entry.originalFullDecodedRGBSHA256,
  sha(origRaw),'source original RGB must match its generated mask receipt');
 const result=await build({imageId:id,originalJPEGBytes:bytes,conservativeMaskPNGBytes:png});
 assert.equal(result.status,'REAL_ORIGINAL_PHOTO_SOURCE_MASK_TEXTURED_FRONT_RESEARCH_UNAPPROVED',id+': '+result.reason);
 assert.equal(result.actualOriginalJPEGByteSHA256,sha(bytes));
 assert.equal(result.independentlyValidatedOriginalDecodedRGBSHA256,sha(origRaw));
 assert.equal(result.originalMaskPNG_SHA256,sha(png));
 assert.equal(result.originalMaskForegroundPixels,entry.maskForegroundPixelCount);
 assert.equal(result.conservativeSampledSourcePixels,result.indices.length/6);
 assert.equal(result.originalSourceTextureRGBA_SHA256,sha(result.textureRGBA));
 assert.equal(result.museumCaptionVerified,id===2551406);
 assert.equal(result.institutionallyVerifiedPart,id===2551406?'a':null);
 assert.equal(result.institutionallyVerifiedSide,id===2551406?'front':null);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.originalPhoto2DFallbackRequired,true);
 assert.equal(result.maskBoundaryDisputedNotHumanApproved,true);
 assert.equal(result.sourceFitted163BoneAvatars,false);
 assert.equal(result.sourceLayeredOutfitFitProved,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
 const {data:fullMask,info}=await sharp(png).greyscale().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.channels,1);
 const [w,h]=[result.downsampledWidth,result.downsampledHeight];
 let tested=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=Math.min(1199,Math.floor((x+.5)*1200/w));
  const sy=Math.min(info.height-1,Math.floor((y+.5)*info.height/h));
  const srcIdx=sy*1200+sx,dstIdx=(y*w+x)*4;
  const a=fullMask[srcIdx],actual=result.textureRGBA.slice(dstIdx,dstIdx+4);
  if(a===0)assert.deepEqual(Array.from(actual),[0,0,0,0]);
  else{
   const rgbIdx=srcIdx*3;
   assert.deepEqual(Array.from(actual),[origRaw[rgbIdx],origRaw[rgbIdx+1],origRaw[rgbIdx+2],255]);
   tested++;
  }
 }
 assert.equal(tested,result.conservativeSampledSourcePixels);
 // Tamper original JPEG/mask, role, dimensions: ALL should refuse and
 // NEVER silently promote unreviewed mask to consumer 3D.
 const corruptJPEG=Buffer.from(bytes);corruptJPEG[70]^=1;
 const corruptPNG=Buffer.from(png);corruptPNG[50]^=1;
 for(const invalid of [
  {imageId:2551499},{imageId:id===2551406?2551408:2551406},
  {originalJPEGBytes:corruptJPEG},{originalJPEGBytes:new Uint8Array(0)},
  {conservativeMaskPNGBytes:corruptPNG},
  {conservativeMaskPNGBytes:new Uint8Array(0)},
  {sampleWidth:300},{sampleWidth:2},{sampleWidth:1.2}
 ]){
  const refused=await build({imageId:id,originalJPEGBytes:bytes,conservativeMaskPNGBytes:png,...invalid});
  assert.equal(refused.status,'ORIGINAL_PHOTO_2D_REQUIRED','refusal not enforced: '+Object.keys(invalid));
  assert.equal(refused.consumer3DAdmitted,false);
  assert.equal(refused.familyAlpha,'HOLD');
 }
 shots.push(result);
}
assert.notEqual(shots[0].actualOriginalJPEGByteSHA256,shots[1].actualOriginalJPEGByteSHA256);
assert.notEqual(shots[0].originalMaskPNG_SHA256,shots[1].originalMaskPNG_SHA256);
assert.notEqual(shots[0].originalSourceTextureRGBA_SHA256,shots[1].originalSourceTextureRGBA_SHA256);
// Metadata does not invent a two-part wearable outfit. 1408 is an
// uncaptioned photo; do not treat its appearance as curator-certified part b.
assert.equal(shots[1].institutionallyVerifiedPart,null);
assert.equal(shots[1].institutionallyVerifiedSide,null);
const summary={schema:'M2-true-Met-original-source-mask-to-UV-front-native-HOLD/v1',
 ids:shots.map(s=>({
  imageId:s.imageId,verifiedPhotoRole:s.institutionallyVerifiedSide,
  originalJPEG_SHA256:s.actualOriginalJPEGByteSHA256,
  decodedOriginalRGB_SHA256:s.independentlyValidatedOriginalDecodedRGBSHA256,
  conservativeOriginalMaskPNG_SHA256:s.originalMaskPNG_SHA256,
  sourceForegroundPixels:s.originalMaskForegroundPixels,
  uncertainOriginalPixelsExcluded:s.originalSourceBoundaryUncertaintyExcludedPixels,
  UVSampleDimensions:[s.downsampledWidth,s.downsampledHeight],
  UVTrueOriginalPixels:s.conservativeSampledSourcePixels,
  RGBATextureSHA256:s.originalSourceTextureRGBA_SHA256,
  geometricTriangles:s.indices.length/3
 })),
 actualSourceOriginalJPEGs:2,
 actualSourceConservativeMasks:2,
 expertApprovedMasks:0,
 sourceVerifiedFrontCaptions:1,
 sourceVerifiedReverseOrAdditionalParts:0,
 fittedSource3DAvatars:0,
 verifiedConsumer3DOutfits:0,
 original2DMandatory:true,releaseAuthorized:false,familyAlpha:'HOLD'};
await mkdir(artifactDir,{recursive:true});
await writeFile(artifactDir+'/source-matched-true-original-mask-UV-evidence.json',
 JSON.stringify(summary,null,2)+'\n');
console.log('M2_GENUINE_MET_MASK_TO_ACTUAL_ORIGINAL_RGB_FRONT_UV_UNAPPROVED '+JSON.stringify(summary));

if(process.env.P89_BROWSER){
 const engine=process.env.P89_BROWSER;
 assert.ok(['chromium','webkit'].includes(engine),'genuine native engine required');
 const {chromium,webkit}=await import('playwright');
 const browser=await ({chromium,webkit})[engine].launch({headless:true,
  args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const page=await browser.newPage({viewport:{width:390,height:700}});
  const network=[];page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.goto('about:blank');
  const gpu=await page.evaluate((items)=>{
   function compile(gl,type,s){
    const sh=gl.createShader(type);gl.shaderSource(sh,s);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))
     throw Error('WebGL compilation failure '+gl.getShaderInfoLog(sh));
    return sh;
   }
   return items.map(item=>{
    const c=document.createElement('canvas');c.width=c.height=160;
    const gl=c.getContext('webgl2',{alpha:true,antialias:false,
     preserveDrawingBuffer:true,premultipliedAlpha:false});
    if(!gl)throw Error('actual native WebGL2 required');
    const vs=compile(gl,gl.VERTEX_SHADER,`#version 300 es
      in vec3 p;in vec2 t;out vec2 uv;
      void main(){uv=t;gl_Position=vec4(p.xy*1.7,0.,1.);}`);
    const fs=compile(gl,gl.FRAGMENT_SHADER,`#version 300 es
      precision highp float;in vec2 uv;uniform sampler2D photo;
      out vec4 px;void main(){px=texture(photo,vec2(uv.x,1.0-uv.y));}`);
    const prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('WebGL program link failed');
    gl.useProgram(prog);
    for(const [label,values,size] of [['p',item.pos,3],['t',item.uv,2]]){
     const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
     gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
     const loc=gl.getAttribLocation(prog,label);
     if(loc<0)throw Error('missing actual WebGL attribute');
     gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(item.indices),gl.STATIC_DRAW);
    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    for(const param of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],
      [gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])
     gl.texParameteri(gl.TEXTURE_2D,param[0],param[1]);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,item.w,item.h,0,
      gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(item.tex));
    gl.uniform1i(gl.getUniformLocation(prog,'photo'),0);
    gl.viewport(0,0,160,160);gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,item.indices.length,gl.UNSIGNED_INT,0);gl.finish();
    const pixels=new Uint8Array(160*160*4);gl.readPixels(0,0,160,160,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let colored=0,mixedRGB=0;
    for(let k=0;k<pixels.length;k+=4)if(pixels[k+3]>0){
     colored++;if(pixels[k]!==pixels[k+1]||pixels[k+1]!==pixels[k+2])mixedRGB++;
    }
    const error=gl.getError();
    gl.deleteTexture(tex);gl.deleteProgram(prog);gl.deleteShader(vs);gl.deleteShader(fs);
    return {imageId:item.id,drawnPixels:colored,colorVariantPixels:mixedRGB,
     triangles:item.indices.length/3,glError:error};
   });
  },shots.map(s=>({id:s.imageId,w:s.downsampledWidth,h:s.downsampledHeight,
   tex:Array.from(s.textureRGBA),pos:Array.from(s.positions),
   uv:Array.from(s.originalPixelUV),indices:Array.from(s.indices)})));
  assert.deepEqual(gpu.map(x=>x.imageId),[2551406,2551408]);
  assert.ok(gpu.every(g=>g.drawnPixels>100&&g.triangles>100));
  assert.ok(gpu.every(g=>g.glError===0));
  assert.deepEqual(network,[]);
  console.log('M2_GENUINE_MET_TRUE_MASK_SOURCE_PIXEL_WEBGL2_NOT_WEARABLE '+JSON.stringify({
   engine,viewportWidth:390,originalPhotos:2,originalConservativeMasks:2,
   nativeWebGL2Results:gpu,physical3DGeometry:false,expertApproval:false,
   networkRequests:network.length,consumer3DAdmitted:false,familyAlpha:'HOLD'
  }));
 }finally{await browser.close();}
}
