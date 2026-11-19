/**
 * Original Met front 2551406 ONLY: authentic original institutional JPEG,
 * original conservative OpenCV mask, explicit neutral-back placeholder shell.
 * True source pixels are transferred ONLY to independently captioned FRONT.
 * No fitted anatomy, source-camera scale or rear RGB/realism certification.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildMetSourceFrontNeutralBackShell89 as build}
 from '../research/parallel89/met-source-front-neutral-shell89.mjs';
const root='benchmark/parallel89-met70759-four-photo-research/';
const masks='benchmark/parallel89-met70759-full-alpha-proposals/';
const out='benchmark/parallel89-met-original-front-neutral-shell-HOLD/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

const jpeg=await readFile(root+'met-70759-gallery-2551406.jpg');
const mask=await readFile(masks+'met-70759-2551406-AUTO-UNREVIEWED-foreground-mask.png');
const source=JSON.parse(await readFile(masks+'met-70759-four-photo-AUTO-UNREVIEWED-mask-receipts.json'));
assert.equal(source.allMasksMachineGeneratedAndUnreviewed,true);
assert.equal(source.humanOrCuratorialMaskAcceptanceReceived,false);
const sourceReceipt=source.maskedOriginalPhotoPixels.find(x=>x.imageId===2551406);
assert.ok(sourceReceipt);
assert.equal(sourceReceipt.outputMaskPngSHA256,hash(mask));
const orig={jpeg:hash(jpeg),mask:hash(mask)};
const shell=await build({imageId:2551406,originalJPEGBytes:jpeg,
 conservativeMaskPNGBytes:mask});
assert.equal(shell.status,'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',shell.reason);
assert.equal(shell.originalMuseumExactCaption,'a) front');
assert.equal(shell.originalDecodedRGBSHA256,sourceReceipt.originalFullDecodedRGBSHA256);
assert.equal(shell.originalJPEGByteSHA256,orig.jpeg);
assert.equal(shell.originalSourceConservativeMaskSHA256,sourceReceipt.originalFullDecodedRGBSHA256?'757b7c16161de68151c98d514907a6a1004259ae43fcfb7c1a8aa1fa72febfd4':'');
assert.equal(shell.originalSourceMaskUncertainPixelsExcluded,sourceReceipt.uncertainBoundaryPixelCount);
assert.equal(shell.neutralBackHasNoOriginalPhotographRGB,true);
assert.equal(shell.materialGroupsMustBeDrawnSeparately,true);
assert.equal(shell.shellIndexedEdgeIncidenceExactlyTwo,true);
assert.ok(shell.sourceDerivedBoundaryEdges>40);
assert.equal(shell.frontOriginalTriangles,35262);
assert.equal(shell.inferredRearTriangles,shell.frontOriginalTriangles);
assert.equal(shell.inferredSideTriangles,2*shell.sourceDerivedBoundaryEdges);
assert.equal(shell.indices.length/3,shell.frontOriginalTriangles*2+shell.inferredSideTriangles);
assert.equal(shell.uv.length/2,shell.positions.length/3);
assert.equal(shell.originalRGBAFront.length,
 shell.photoDimensions[0]*shell.photoDimensions[1]*4);
assert.equal(hash(shell.originalRGBAFront),shell.sourceMaskedOriginalRGBTexSHA256);
for(let v=0;v<shell.positions.length/6;v++){
 assert.equal(shell.positions[v*3+0],shell.positions[(v+shell.positions.length/6)*3+0]);
 assert.equal(shell.positions[v*3+1],shell.positions[(v+shell.positions.length/6)*3+1]);
 assert.equal(shell.positions[v*3+2],0);
 assert.equal(shell.positions[(v+shell.positions.length/6)*3+2],-.02);
 const rearUV=(v+shell.positions.length/6)*2;
 assert.equal(shell.uv[rearUV],0);
 assert.equal(shell.uv[rearUV+1],0);
}
assert.equal(shell.approvedSourceMaskHumanReviewed,false);
assert.equal(shell.realGarmentBackObserved,false);
assert.equal(shell.realPhysicalDepthMeasured,false);
assert.equal(shell.original163BoneSkinningAttached,false);
assert.equal(shell.actualAnatomicalFitProved,false);
assert.equal(shell.anySweptCollisionOrDrapeProved,false);
assert.equal(shell.consumer3DAdmitted,false);
assert.equal(shell.sourcePhoto2DFallbackRequired,true);
assert.equal(shell.releaseAuthorized,false);
assert.equal(shell.familyAlpha,'HOLD');
// Strict rejection: although there is another original Met image 2551408,
// its institutionally identified garment part and view are still UNKNOWN.
const unknown=await readFile(root+'met-70759-gallery-2551408.jpg');
const unknownMask=await readFile(masks+'met-70759-2551408-AUTO-UNREVIEWED-foreground-mask.png');
for(const edit of [
 {imageId:2551408,originalJPEGBytes:unknown,conservativeMaskPNGBytes:unknownMask},
 {imageId:2551408},
 {originalJPEGBytes:Buffer.from(jpeg.subarray(1))},
 {conservativeMaskPNGBytes:unknownMask},
 {conservativeMaskPNGBytes:Buffer.from(mask.subarray(1))},
 {sampleWidth:350},{sampleWidth:-2}
]){
 const refused=await build({imageId:2551406,originalJPEGBytes:jpeg,
  conservativeMaskPNGBytes:mask,...edit});
 assert.equal(refused.status,'ORIGINAL_PHOTO_2D_REQUIRED','unsafe original-view gate '+Object.keys(edit));
 assert.equal(refused.consumer3DAdmitted,false);
 assert.equal(refused.familyAlpha,'HOLD');
}
assert.equal(hash(jpeg),orig.jpeg);assert.equal(hash(mask),orig.mask);
const summary={
 schema:shell.schema,imageId:shell.imageId,
 observedPhotoFrontSourceOriginalJPEG_SHA256:shell.originalJPEGByteSHA256,
 originalFullSourceRGB_SHA256:shell.originalDecodedRGBSHA256,
 originalSourceConservativeMaskRawSHA256:shell.originalSourceConservativeMaskSHA256,
 originalFrontRGBATextureSHA256:shell.sourceMaskedOriginalRGBTexSHA256,
 originalSourceUncertaintyExcludedPixels:shell.originalSourceMaskUncertainPixelsExcluded,
 frontSourceDerivedTriangles:shell.frontOriginalTriangles,
 unobservedRearPlaceholderTriangles:shell.inferredRearTriangles,
 neutralBoundaryWallTriangles:shell.inferredSideTriangles,
 sourceBoundaryEdges:shell.sourceDerivedBoundaryEdges,
 indexedEdgesAllTwoIncidentFaces:shell.shellIndexedEdgeIncidenceExactlyTwo,
 sourceOriginalFrontCaptionVerified:true,
 unobservedReverseMuseumCameraVerification:false,
 physicalDepthMeasured:false,sourceAnatomicalFit:false,
 sewnPhysicalManifoldProved:false,independentHumanMasksApproved:false,
 actualLicensedAvatarPoseAcceptance:false,
 sourceOriginal2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await mkdir(out,{recursive:true});
await writeFile(out+'source-mask-closed-shell-research-receipt.json',JSON.stringify(summary,null,2)+'\n');
console.log('M2_ACTUAL_SOURCE_MASK_FRONT_NEUTRAL_BACK_EDGE_CLOSED_NOT_FITTED '+JSON.stringify(summary));

if(process.env.P89_BROWSER){
 const engine=process.env.P89_BROWSER;
 assert.ok(['webkit','chromium'].includes(engine));
 const {chromium,webkit}=await import('playwright');
 const browser=await ({webkit,chromium})[engine].launch({headless:true,
  args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const page=await browser.newPage({viewport:{width:390,height:700}});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url());});
  await page.goto('about:blank');
  const samples=await page.evaluate(async mesh=>{
   const cvs=document.createElement('canvas');cvs.width=cvs.height=256;
   document.body.style.margin='0';document.body.style.background='#ececed';
   document.body.append(cvs);
   const gl=cvs.getContext('webgl2',{
    alpha:true,antialias:false,preserveDrawingBuffer:true,premultipliedAlpha:false
   });
   if(!gl)throw Error('real native WebGL2 rendering unavailable');
   function compile(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
     throw Error('WebGL2 shader error: '+gl.getShaderInfoLog(s));
    return s;
   }
   const vert=compile(gl.VERTEX_SHADER,`#version 300 es
    in vec3 p;in vec2 t;out vec2 texUV;uniform float theta;
    void main(){float c=cos(theta),s=sin(theta);
      vec3 v=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
      gl_Position=vec4(v.xy*1.38,-v.z*.9,1.);texUV=t;
    }`);
   const frag=compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;in vec2 texUV;out vec4 pixel;
    uniform sampler2D sourceRGB;uniform int region;
    void main(){pixel=region==0?texture(sourceRGB,vec2(texUV.x,1.-texUV.y)):
      region==1?vec4(0.047,0.757,0.867,1.):vec4(0.957,0.710,0.302,1.);
    }`);
   const prog=gl.createProgram();
   gl.attachShader(prog,vert);gl.attachShader(prog,frag);gl.linkProgram(prog);
   if(!gl.getProgramParameter(prog,gl.LINK_STATUS))
    throw Error('native shader link error');
   gl.useProgram(prog);
   const arr=(label,values,stride)=>{
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,label);
    if(loc<0)throw Error('shader attribute '+label+' lost');
    gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,stride,gl.FLOAT,false,0,0);
   };
   arr('p',mesh.positions,3);arr('t',mesh.uv,2);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(mesh.indices),gl.STATIC_DRAW);
   const texture=gl.createTexture();
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   for(const [param,val] of [
    [gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],
    [gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]
   ])gl.texParameteri(gl.TEXTURE_2D,param,val);
   gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,mesh.w,mesh.h,0,
    gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(mesh.texture));
   gl.uniform1i(gl.getUniformLocation(prog,'sourceRGB'),0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LESS);
   const range=mesh.ranges;
   const out=[];
   for(const deg of [0,65,180]){
    gl.uniform1f(gl.getUniformLocation(prog,'theta'),deg*Math.PI/180);
    gl.viewport(0,0,256,256);
    gl.clearColor(0,0,0,0);gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(const [name,code] of [['sourcePhotoFront',0],['unobservedNeutralBack',1],
      ['inferredNeutralSideWalls',2]]){
     gl.uniform1i(gl.getUniformLocation(prog,'region'),code);
     const r=range[name];
     gl.drawElements(gl.TRIANGLES,r.count,gl.UNSIGNED_INT,r.start*4);
    }
    gl.finish();
    const pix=new Uint8Array(256*256*4);
    gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,pix);
    let opaque=0,neutralBack=0,sideWalls=0,photoPixels=0;
    for(let i=0;i<pix.length;i+=4)if(pix[i+3]>0){
     opaque++;
     if(pix[i]===12&&pix[i+1]===193&&pix[i+2]===221)neutralBack++;
     else if(pix[i]===244&&pix[i+1]===181&&pix[i+2]===77)sideWalls++;
     else photoPixels++;
    }
    out.push({degrees:deg,opaque,originalPhotoRGBPixels:photoPixels,
     inferredNeutralBackPixels:neutralBack,inferredSidePixels:sideWalls,
     glError:gl.getError(),png:cvs.toDataURL('image/png')});
   }
   gl.deleteTexture(texture);gl.deleteProgram(prog);
   gl.deleteShader(vert);gl.deleteShader(frag);
   return out;
  },{
   positions:Array.from(shell.positions),uv:Array.from(shell.uv),
   indices:Array.from(shell.indices),texture:Array.from(shell.originalRGBAFront),
   w:shell.photoDimensions[0],h:shell.photoDimensions[1],
   ranges:shell.drawRanges
  });
  assert.deepEqual(samples.map(s=>s.degrees),[0,65,180]);
  assert.ok(samples.every(s=>s.opaque>1000&&s.glError===0));
  assert.ok(samples[0].originalPhotoRGBPixels>1000,'original front should visibly render authentic source RGB');
  assert.ok(samples[2].inferredNeutralBackPixels>1000,
    'reverse angle must show visible NEUTRAL UNOBSERVED material, never source photograph');
  assert.ok(samples[2].inferredNeutralBackPixels>samples[2].originalPhotoRGBPixels,
    'reverse was mislabeled as published photo evidence');
  assert.ok(samples[1].opaque>1000,'rotated nonzero-depth shell must remain visible');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  for(const row of samples){
   await writeFile(out+engine+'-source-original-shell-'+row.degrees+'deg-UNAPPROVED.png',
    Buffer.from(row.png.split(',')[1],'base64'));
  }
  console.log('M2_TRUE_MET_ORIGINAL_NEUTRAL_BACK_NATIVE_WEBGL_NOT_WEARABLE '+JSON.stringify({
   engine,viewportWidth:390,verifiedOriginalPhotoRGBFrontOnly:true,
   literalNeutralInferredBackMaterial:true,images:samples.map(({png,...rest})=>rest),
   actualPhysicalDepthOrCamera:false,originalAvatar163BoneFitted:false,
   noRealismApproval:true,externalRequests:requests.length,errors:errors.length,
   consumer3DAdmitted:false,familyAlpha:'HOLD'
  }));
 }finally{await browser.close();}
}
