import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHumanoid3D } from '../public/humanoid-3d-prototype.mjs';

test('gracefully falls back when WebGL is unavailable', () => {
  const renderer=createHumanoid3D({getContext:()=>null});
  assert.equal(renderer.supported,false);
  assert.equal(renderer.render(),false);
  renderer.rotate(Math.PI);
  renderer.setOutfit({top:[1,0,0,1]});
  renderer.dispose();
});
test('rejects invalid canvas', () => {
  assert.throws(()=>createHumanoid3D(null),TypeError);
});
test('renders and rotates synthetic avatar without external APIs', () => {
  const calls=[];
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,
    COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,DEPTH_TEST:64,
    createShader:()=>({}),shaderSource:()=>{},compileShader:()=>{},getShaderParameter:()=>true,
    createProgram:()=>({}),attachShader:()=>{},linkProgram:()=>{},getProgramParameter:()=>true,
    deleteShader:()=>{},getAttribLocation:()=>0,getUniformLocation:()=>({}),
    createBuffer:()=>({}),bindBuffer:()=>{},bufferData:()=>{},viewport:()=>{},
    clearColor:()=>{},clear:()=>{},enable:()=>{},useProgram:()=>{},
    enableVertexAttribArray:()=>{},vertexAttribPointer:()=>{},
    uniformMatrix4fv:(_,__,m)=>{assert.equal(m.length,16);calls.push('matrix');},
    uniform4fv:()=>{},drawArrays:()=>calls.push('draw'),
    deleteBuffer:()=>calls.push('dispose-buffer'),deleteProgram:()=>calls.push('dispose-program')
  };
  const canvas={clientWidth:320,clientHeight:480,getContext:(name)=>name==='webgl'?gl:null};
  const renderer=createHumanoid3D(canvas);
  assert.equal(renderer.supported,true);
  assert.equal(renderer.render(),true);
  assert.equal(canvas.width>0,true);
  assert.equal(calls.filter(x=>x==='draw').length,10);
  renderer.rotate(Math.PI);
  assert.equal(calls.filter(x=>x==='draw').length,20);
  renderer.setOutfit({top:[1,0,0,1]});
  assert.equal(calls.filter(x=>x==='draw').length,30);
  assert.throws(()=>renderer.setOutfit({top:[2,0,0,1]}),TypeError);
  renderer.dispose();
  assert.ok(calls.includes('dispose-buffer'));
  assert.ok(calls.includes('dispose-program'));
});
