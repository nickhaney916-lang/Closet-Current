import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createBodyGeometry,taperedLimb,ellipsoid} from '../public/humanoid-3d-body-geometry.mjs';
import {createDetailedHumanoid3D} from '../public/humanoid-3d-detailed-renderer.mjs';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/humanoid-3d-saved-demo.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../public/humanoid-3d-saved-demo.mjs',import.meta.url),'utf8');
test('human-shaped proxy has head, neck, tapered torso, two limbs, hands and layered shell meshes',()=>{
 const shapes=createBodyGeometry();
 const keys=new Set(shapes.map(x=>x.key));
 assert.deepEqual([...keys].sort(),['bottom','dress','layer','layer2','layer3','shoes','skin','top'].sort());
 assert.ok(shapes.some(x=>x.id==='head')&&shapes.some(x=>x.id==='coat-shell')&&shapes.some(x=>x.id==='dress-skirt'));
 assert.ok(shapes.length>=15);
 for(const shape of shapes){
  assert.equal(shape.vertices.length%18,0);
  assert.ok(shape.vertices.length>300);
  assert.ok(shape.vertices.every(Number.isFinite));
 }
});
test('body geometry validates radii and sensible bounds',()=>{
 assert.throws(()=>taperedLimb({top:0,bottom:0,rTop:.2,rBottom:.2}),/Invalid/);
 assert.throws(()=>ellipsoid({rx:0,ry:1,rz:1}),/Invalid/);
 const shapes=createBodyGeometry();
 const verts=shapes.flatMap(s=>[...s.vertices.filter((_,i)=>i%6<3)]);
 assert.ok(verts.every(v=>Math.abs(v)<2));
});
function fakeGL(){
 const events=[],buffers=[];
 const gl={
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,
  COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,DEPTH_TEST:64,BLEND:65,SRC_ALPHA:66,ONE_MINUS_SRC_ALPHA:67,
  createShader:()=>({}),shaderSource:()=>{},compileShader:()=>{},getShaderParameter:()=>true,getShaderInfoLog:()=>'',deleteShader:()=>{},
  createProgram:()=>({}),attachShader:()=>{},linkProgram:()=>{},getProgramParameter:()=>true,getProgramInfoLog:()=>'',deleteProgram:()=>events.push('program-disposed'),
  createBuffer:()=>{const b={};buffers.push(b);return b;},bindBuffer:()=>{},bufferData:(_,points)=>{assert.ok(points instanceof Float32Array);},
  viewport:()=>{},clearColor:()=>{},clear:()=>{},enable:()=>{},blendFunc:()=>{},useProgram:()=>{},
  getAttribLocation:(_,name)=>name==='p'?0:1,getUniformLocation:()=>({}),enableVertexAttribArray:()=>{},
  vertexAttribPointer:()=>{},uniformMatrix4fv:(_,__,m)=>{assert.equal(m.length,16);},uniform4fv:()=>{},
  drawArrays:()=>events.push('draw'),deleteBuffer:()=>events.push('buffer-disposed')
 };
 const canvas={clientWidth:390,clientHeight:470,width:390,height:470,getContext:()=>gl,addEventListener:()=>{},removeEventListener:()=>{}};
 return {events,canvas,buffers};
}
test('WebGL 3D rotates fully without repainting a 2D flat image and respects outer layers',()=>{
 const fake=fakeGL(),render=createDetailedHumanoid3D(fake.canvas);
 assert.equal(render.supported,true);
 assert.equal(render.render(),true);
 const initial=fake.events.filter(x=>x==='draw').length;
 assert.ok(initial>0);
 render.setOutfit({top:[.2,.3,.6,1],bottom:[.3,.4,.4,1],layer2:[.5,.4,.2,1]});
 assert.ok(render.getState().drawn.includes('jacket-shell'));
 render.rotate(Math.PI*2);
 assert.ok(Math.abs(render.angle())<1e-9);
 render.setOutfit({dress:[.4,.2,.5,1]});
 const state=render.getState();
 assert.ok(state.drawn.includes('dress-skirt'));
 assert.ok(!state.drawn.includes('left-leg')&&!state.drawn.includes('jacket-shell'));
 assert.throws(()=>render.setOutfit({layer2:[10,0,0,1]}),/RGBA/);
 assert.throws(()=>render.rotate(NaN),/Invalid/);
 render.dispose();
 assert.equal(render.render(),false);
 assert.ok(fake.events.includes('program-disposed'));
 assert.equal(fake.events.filter(x=>x==='buffer-disposed').length,fake.buffers.length);
});
test('WebGL unavailable gracefully returns static 2D reference mode',()=>{
 const renderer=createDetailedHumanoid3D({getContext:()=>null});
 assert.equal(renderer.supported,false);assert.equal(renderer.render(),false);
 assert.equal(renderer.setOutfit({top:[1,0,0,1]}),false);
});
test('prototype stays isolated: no network, app login/backup, paid AI or production switch',()=>{
 for(const source of [html,ui]){
  assert.doesNotMatch(source,/https?:\/\/|fetch\s*\(|XMLHttpRequest|https?:\\|openai\.com|replicate|fal\.ai|cloudflare/i);
 }
 assert.match(html,/No customer closet is connected/);
 assert.match(html,/pattern|stripes|checks/i);
 for(const name of ['humanoidCanvas','turnLeft','turnRight','front','angle','lookSelect','pin','swap','styleNew','save','restore','switchAccount','references','fallback'])
  assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(html,/@media\(max-width:350px\)/);
});
