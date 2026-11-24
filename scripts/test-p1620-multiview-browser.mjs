// Actual indexed donor geometry in native WebGL. No network or consumer mount.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {buildCategorySourceVolume89} from '../research/parallel89/category-source-volume89.mjs';
import {buildAutomaticSourceVolume89} from '../research/parallel89/automatic-source-volume89.mjs';
import {sha256} from '../research/p1620-multiview/evaluator.mjs';

const registry=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const pack=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
const cases=[];
const browsers=[];
try{
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await type.launch(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
  const context=await browser.newContext({serviceWorkers:'block'});
  const requests=[];
  await context.route('**/*',r=>{
   if(r.request().url()==='http://127.0.0.1/')return r.fulfill({contentType:'text/html',body:'<!doctype html>'});
   requests.push(r.request().method());return r.abort();
  });
  const page=await context.newPage();
  await page.goto('http://127.0.0.1/');
  await page.setContent('<!doctype html><canvas width="192" height="192"></canvas>');
  browsers.push({engine,browser,page,requests});
 }
 for(const sourceId of ids){
  const originalBytes=await readFile('benchmark/fixtures/'+sourceId+'.jpg');
  const lockedRecord=registry.find(row=>row.id===sourceId);
  const args={sourceId,originalBytes,lockedRecord};
  const original=sha256(originalBytes);
  const constant=await buildAutomaticSourceVolume89(args),profile=await buildCategorySourceVolume89(args);
  assert.equal(constant.status,'PROVISIONAL_SOURCE_VOLUME_RESEARCH_ONLY');
  assert.equal(profile.status,'CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY');
  assert.equal(profile.originalSHA256,original);
  assert.equal(sha256(originalBytes),original);
  assert.deepEqual(profile.sourcePlane,constant.sourcePlane);
  assert.deepEqual(profile.topology.indices,constant.topology.indices);
  assert.equal(profile.consumer3DAdmitted,false);
  assert.equal(profile.releaseAuthorized,false);
  assert.equal(profile.familyAlpha,'HOLD');
  for(const result of [constant,profile]){
   assert.equal(result.inferredNeutral.photoTextureAllowed,false);
   assert.equal(result.inferredNeutral.textureRGBA,undefined);
   assert.equal(result.inferredNeutral.uv,undefined);
  }
  const front=profile.sourcePlane;
  const inputs={
   source:pack(originalBytes),rgba:pack(front.textureRGBA),dimensions:front.textureDimensions,
   uv:pack(front.uv),frontPositions:pack(front.positions),frontIndices:pack(front.indices),
   constantPositions:pack(constant.topology.positions),profilePositions:pack(profile.topology.positions),
   neutralIndices:pack(profile.inferredNeutral.indices)
  };
  for(const {engine,browser,page,requests} of browsers){
   const result=await page.evaluate(async p=>{
    const decoded=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    const floats=b=>new Float32Array(decoded(b).buffer),indices=b=>new Uint32Array(decoded(b).buffer);
    const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
     x=>x.toString(16).padStart(2,'0')).join('');
    const canvas=document.querySelector('canvas');
    const gl=canvas.getContext('webgl2',{antialias:false,premultipliedAlpha:false});
    if(!gl)throw Error('native WebGL2 unavailable');
    const makeShader=(type,source)=>{
     const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
     if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
     return shader;
    };
    const shaders=[makeShader(gl.VERTEX_SHADER,`#version 300 es
in vec3 position; in vec2 uv; uniform int view;
uniform float scale; uniform vec2 center; out vec2 photoUV;
void main() {
 float u = view == 1 ? position.z : (view == 2 ? -position.x : position.x);
 gl_Position=vec4((u-center.x)*scale,(position.y-center.y)*scale,0.,1.);
 photoUV=uv;
}`),makeShader(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;
in vec2 photoUV; uniform sampler2D photo; uniform bool observed; out vec4 sampleColor;
void main(){sampleColor=observed?texture(photo,vec2(photoUV.x,1.-photoUV.y)):
 vec4(99./255.,109./255.,121./255.,1.);}`)];
    const program=gl.createProgram();
    for(const shader of shaders)gl.attachShader(program,shader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    const [w,h]=p.dimensions;
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,decoded(p.rgba));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('texture readback unavailable');
    const pixels=(width,height)=>{
     const rgba=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
     if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL readback failed');
     return rgba;
    };
    const textureSHA256=await digest(pixels(w,h));
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
    const buffers=[gl.createBuffer(),gl.createBuffer(),gl.createBuffer()];
    const pos=gl.getAttribLocation(program,'position'),uv=gl.getAttribLocation(program,'uv');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffers[1]);gl.bufferData(gl.ARRAY_BUFFER,floats(p.uv),gl.STATIC_DRAW);
    gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    const front=floats(p.frontPositions);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(let i=0;i<front.length;i+=3){minX=Math.min(minX,front[i]);maxX=Math.max(maxX,front[i]);
     minY=Math.min(minY,front[i+1]);maxY=Math.max(maxY,front[i+1]);}
    const uniform=(name)=>gl.getUniformLocation(program,name);
    const scale=1.72/Math.max(maxX-minX,maxY-minY);
    function draw(positions,triangles,view,observed){
     gl.bindBuffer(gl.ARRAY_BUFFER,buffers[0]);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
     gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(pos);
     if(observed)gl.enableVertexAttribArray(uv);else gl.disableVertexAttribArray(uv);
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers[2]);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,triangles,gl.STATIC_DRAW);
     gl.uniform1i(uniform('view'),view);gl.uniform1i(uniform('observed'),Number(observed));
     gl.uniform1f(uniform('scale'),scale);
     gl.uniform2f(uniform('center'),view===1?-.07:(view===2?-1:1)*(minX+maxX)/2,(minY+maxY)/2);
     gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
     gl.drawElements(gl.TRIANGLES,triangles.length,gl.UNSIGNED_INT,0);
     const rgba=pixels(canvas.width,canvas.height);
     const silhouette=new Uint8Array(rgba.length/4);
     let area=0,neutral=true;
     for(let i=0;i<rgba.length;i+=4){
      if(!rgba[i+3])continue;
      silhouette[i/4]=1;area++;
      if(rgba[i]!==99||rgba[i+1]!==109||rgba[i+2]!==121)neutral=false;
     }
     return {area,neutral,silhouette};
    }
    const tris=indices(p.neutralIndices);
    const constant=floats(p.constantPositions),profile=floats(p.profilePositions);
    const frontFrame=draw(front,indices(p.frontIndices),0,true);
    const constantSide=draw(constant,tris,1,false),profileSide=draw(profile,tris,1,false);
    const constantRear=draw(constant,tris,2,false),profileRear=draw(profile,tris,2,false);
    const rearSame=constantRear.silhouette.every((v,i)=>v===profileRear.silhouette[i]);
    const sourceSHA256=await digest(decoded(p.source));
    for(const b of buffers)gl.deleteBuffer(b);
    for(const s of shaders)gl.deleteShader(s);
    gl.deleteProgram(program);gl.deleteTexture(texture);gl.deleteFramebuffer(framebuffer);
    return {sourceSHA256,textureSHA256,frontPixels:frontFrame.area,frontShowsPhoto:!frontFrame.neutral,
     constantSidePixels:constantSide.area,profileSidePixels:profileSide.area,
     rearPixels:profileRear.area,rearSame,
     sidesAndRearNeutral:[constantSide,profileSide,constantRear,profileRear].every(x=>x.neutral)};
   },inputs);
   assert.equal(result.sourceSHA256,original);
   assert.equal(result.textureSHA256,front.textureSHA256);
   assert.ok(result.frontPixels&&result.frontShowsPhoto&&result.rearPixels&&result.constantSidePixels&&result.profileSidePixels);
   assert.ok(result.rearSame&&result.sidesAndRearNeutral);
   assert.deepEqual(requests,[]);
   const receipt={engine,version:browser.version(),sourceId,...result,consumer3DAdmitted:false};
   cases.push(receipt);console.log('P1620_PROJECTION',JSON.stringify(receipt));
  }
 }
 assert.equal(cases.length,12);
 assert.ok(cases.some(row=>row.profileSidePixels!==row.constantSidePixels));
 if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(cases,null,2)+'\n');
}finally{await Promise.all(browsers.map(({browser})=>browser.close()));}
