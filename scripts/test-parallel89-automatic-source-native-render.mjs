/** Native browser pixel oracle for actual automatic source-derived meshes.
 * No caller masks, external network, anatomical fit or release authorization.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {buildPhotoDerivedResearchMesh89 as build} from '../research/parallel89/source-photo-to-mesh89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const engine=process.env.P89_BROWSER;
assert.ok(['chromium','webkit'].includes(engine));
const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
const receipts=[],requests=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:700},deviceScaleFactor:1});
 page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('about:blank');
 for(const id of ids){
  const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),sourceSHA=sha(originalBytes);
  const r=await build({sourceId:id,originalBytes,lockedRecord:reg.find(x=>x.id===id),textureScale:2});
  assert.equal(r.originalSHA256,sourceSHA);assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.familyAlpha,'HOLD');assert.equal(sha(originalBytes),sourceSHA);
  if(r.status==='ORIGINAL_PHOTO_2D_REQUIRED'){
   assert.equal(r.mesh,undefined);receipts.push({id,sourceSHA,status:'ABSTAINED',reason:r.reason});continue;
  }
  assert.equal(r.status,'SOURCE_DERIVED_TEXTURED_VIEW_PLANE_RESEARCH_ONLY');
  const m=r.mesh,[w,h]=m.textureDimensions;
  assert.equal(sha(m.textureRGBA),m.textureSHA256);
  const result=await page.evaluate(({positions,uv,indices,rgba,w,h,aspect})=>{
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
   if(!gl)throw Error('native WebGL2 unavailable');
   function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
   const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec3 p;in vec2 t;out vec2 v;uniform float aspect;void main(){v=t;gl_Position=vec4(p.x*2.0/aspect,p.y*2.0,0.,1.);}');
   const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;in vec2 v;uniform sampler2D image;out vec4 pixel;void main(){pixel=texture(image,vec2(v.x,1.0-v.y));}');
   const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);
   function attr(name,values,size){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);return b;}
   const p=attr('p',positions,3),t=attr('t',uv,2),i=gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(indices),gl.STATIC_DRAW);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
   for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(rgba));
   gl.uniform1i(gl.getUniformLocation(pr,'image'),0);gl.uniform1f(gl.getUniformLocation(pr,'aspect'),aspect);
   gl.disable(gl.DITHER);gl.disable(gl.BLEND);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);gl.finish();
   const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let alphaMismatch=0,rgbMismatch=0,visible=0,maxRGBDelta=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const a=4*(y*w+x),b=4*((h-1-y)*w+x);
    if(pixels[b+3]!==rgba[a+3])alphaMismatch++;
    if(pixels[b+3]===255)visible++;
    for(let c=0;c<3;c++){const d=Math.abs(pixels[b+c]-rgba[a+c]);maxRGBDelta=Math.max(maxRGBDelta,d);if(d>1)rgbMismatch++}
   }
   const error=gl.getError();gl.deleteTexture(texture);gl.deleteBuffer(p);gl.deleteBuffer(t);gl.deleteBuffer(i);gl.deleteProgram(pr);gl.deleteShader(vs);gl.deleteShader(fs);
   return {alphaMismatch,rgbMismatch,visible,maxRGBDelta,error};
  },{positions:Array.from(m.positions),uv:Array.from(m.uv),indices:Array.from(m.indices),rgba:Array.from(m.textureRGBA),w,h,aspect:m.decodedOriginalAspect});
  assert.equal(result.error,0,id);assert.equal(result.alphaMismatch,0,id);assert.equal(result.rgbMismatch,0,id);
  assert.equal(result.visible,m.textureForegroundPixels,id);
  receipts.push({id,sourceSHA,maskSHA:r.maskSHA256,textureSHA:m.textureSHA256,status:'PASS_NATIVE_VIEW_PLANE',triangles:m.indices.length/3,dimensions:[w,h],...result});
 }
 assert.ok(receipts.filter(r=>r.status==='PASS_NATIVE_VIEW_PLANE').length>=3,'at least prior three actual proposals must render');
 assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 const report={engine,receipts,networkRequests:requests.length,consumer3DAdmitted:false,maskGroundTruthApproved:false,wearableFitProved:false,familyAlpha:'HOLD'};
 mkdirSync('benchmark/m2-native-source-render-HOLD',{recursive:true});writeFileSync('benchmark/m2-native-source-render-HOLD/'+engine+'.json',JSON.stringify(report,null,2));console.log('NATIVE_SOURCE_RENDER '+JSON.stringify(report));
}finally{await browser.close()}
