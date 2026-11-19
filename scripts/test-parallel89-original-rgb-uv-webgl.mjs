/** REAL original public JPEG -> native Chromium/WebKit WebGL2 observed-front
 * UV transfer. Test mask is synthetic; fitted 3D and human approval NOT tested.
 * Pure disposable local research, no customer photos or external network.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {createHash} from 'node:crypto';
import {buildOriginalJPEGTexturedFront89 as build} from
 '../research/parallel89/source-original-texture-transfer89.mjs';

const engine=process.env.P89_BROWSER;
assert.ok(['chromium','webkit'].includes(engine),'real browser explicitly required');
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const digest=x=>createHash('sha256').update(x).digest('hex');
const artifacts=[];
for(const id of ['commons-0003','commons-0023']){
 const bytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url));
 const alpha=new Uint8Array(12*12);
 for(let y=2;y<10;y++)for(let x=2;x<10;x++)
  if(!(x===2&&y<=5)&&!(x===9&&y>=7))alpha[y*12+x]=255;
 const res=await build({sourceId:id,originalBytes:bytes,
  lockedRecord:registry.find(r=>r.id===id),alpha,width:12,height:12,
  sourceMaskSHA256:digest(alpha)});
 assert.equal(res.status,'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY');
 assert.equal(res.originalJPEG_SHA256,digest(bytes));
 assert.equal(res.consumer3DAdmitted,false);
 artifacts.push({
  id,category:res.category,texture:Array.from(res.textureRGBA),
  textureSHA256:res.textureSHA256,
  position:Array.from(res.positions),uv:Array.from(res.uv),
  index:Array.from(res.indices),sourceSHA:res.originalJPEG_SHA256
 });
}
const browser=await ({chromium,webkit})[engine].launch({
 headless:true,args:engine==='chromium'?['--no-sandbox']:[]
});
try{
 const page=await browser.newPage({viewport:{width:390,height:700}});
 const requests=[];
 page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url());});
 await page.goto('about:blank');
 const results=await page.evaluate((cases)=>{
  function shader(gl,type,source){
   const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
    throw Error('GPU shader compile failed: '+gl.getShaderInfoLog(s));
   return s;
  }
  const out=[];
  for(const item of cases){
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
   const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,
    preserveDrawingBuffer:true,premultipliedAlpha:false});
   if(!gl)throw Error('REAL native WebGL2 context unavailable');
   const v=shader(gl,gl.VERTEX_SHADER,`#version 300 es
    in vec3 p; in vec2 t; out vec2 vuv;
    void main(){vuv=t;gl_Position=vec4(p.xy*1.8,0.,1.);}`);
   const f=shader(gl,gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;in vec2 vuv;uniform sampler2D sourceRGBA;
    out vec4 pixel;void main(){pixel=texture(sourceRGBA,vec2(vuv.x,1.0-vuv.y));}`);
   const program=gl.createProgram();
   gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))
    throw Error('GPU shader program link failed: '+gl.getProgramInfoLog(program));
   gl.useProgram(program);
   function attribute(name,values,size){
    const loc=gl.getAttribLocation(program,name);
    if(loc<0)throw Error('missing WebGL attribute '+name);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
   }
   attribute('p',item.position,3);attribute('t',item.uv,2);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(item.index),gl.STATIC_DRAW);
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,12,12,0,gl.RGBA,
    gl.UNSIGNED_BYTE,new Uint8Array(item.texture));
   gl.uniform1i(gl.getUniformLocation(program,'sourceRGBA'),0);
   gl.viewport(0,0,128,128);gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.drawElements(gl.TRIANGLES,item.index.length,gl.UNSIGNED_INT,0);
   gl.finish();
   const pix=new Uint8Array(128*128*4);
   gl.readPixels(0,0,128,128,gl.RGBA,gl.UNSIGNED_BYTE,pix);
   const err=gl.getError();
   let nonTransparent=0,nonGray=0;
   for(let k=0;k<pix.length;k+=4)if(pix[k+3]>0){
    nonTransparent++;
    if(pix[k]!==pix[k+1]||pix[k+1]!==pix[k+2])nonGray++;
   }
   out.push({id:item.id,category:item.category,webgl2:!!gl,
    gpuError:err,renderedOriginalPhotoPixels:nonTransparent,
    pixelsWithRGBVariation:nonGray,triangleCount:item.index.length/3});
   gl.deleteTexture(tex);gl.deleteProgram(program);
   gl.deleteShader(v);gl.deleteShader(f);
  }
  return out;
 },artifacts);
 assert.equal(results.length,2);
 for(const r of results){
  assert.equal(r.webgl2,true);
  assert.equal(r.gpuError,0);
  assert.ok(r.renderedOriginalPhotoPixels>40,
    'Original-source textured mesh must genuinely draw on WebGL GPU');
  assert.ok(r.triangleCount>0);
 }
 assert.deepEqual(requests,[],'offline native browser must not fetch external content');
 console.log('P89_GENUINE_ORIGINAL_JPEG_TO_PROVISIONAL_UV_WEBGL2_NOT_WEARABLE '+JSON.stringify({
  browserEngine:engine,viewportWidth:390,
  actualLicensedJPEGs:artifacts.map(x=>({id:x.id,category:x.category,
   originalSHA256:x.sourceSHA,originalRGBTextureSHA256:x.textureSHA256})),
  observedOriginalRGBFrontWebGL:results,
  masksExpertApproved:false,actualSkinnedAvatarFitProved:false,
  actualLayeredOutfitProved:false,consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true,networkRequests:requests.length,
  familyAlpha:'HOLD'
 }));
}finally{await browser.close();}
