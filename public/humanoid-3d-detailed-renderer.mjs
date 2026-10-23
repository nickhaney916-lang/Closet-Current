/**
 * Optional WebGL anatomical-PROXY renderer for an isolated research page.
 * Uses procedural geometry only. Real cloth drape, prints, sizing and unseen
 * surfaces cannot be determined by this renderer. No remote requests/AI.
 */
import {createBodyGeometry} from './humanoid-3d-body-geometry.mjs';
const DEFAULT={top:[.30,.46,.68,1],bottom:[.22,.25,.31,1],shoes:[.18,.20,.25,1]};
const SKIN=[.79,.62,.51,1];
const TONE=[.72,.68,.73,1];
const isColor=v=>Array.isArray(v)&&v.length===4&&v.every(x=>Number.isFinite(x)&&x>=0&&x<=1);
export function createDetailedHumanoid3D(canvas){
 if(!canvas||typeof canvas.getContext!=='function')throw new TypeError('Canvas required');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true});
 if(!gl)return {supported:false,render:()=>false,setOutfit:()=>false,rotate:()=>false,angle:()=>0,dispose:()=>{},getState:()=>({supported:false})};
 const vs='attribute vec3 p;attribute vec3 n;uniform mat4 m;varying vec3 normal;void main(){gl_Position=m*vec4(p,1.0);normal=mat3(m)*n;}';
 const fs='precision mediump float;varying vec3 normal;uniform vec4 color;void main(){vec3 N=normalize(normal);float light=.64+.36*max(dot(N,normalize(vec3(-.4,.6,.8))),0.0);gl_FragColor=vec4(color.rgb*light,color.a);}';
 const shader=(kind,text)=>{
  const value=gl.createShader(kind);
  gl.shaderSource(value,text);gl.compileShader(value);
  if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(value);gl.deleteShader(value);throw Error(message);}
  return value;
 };
 const program=gl.createProgram(),vertex=shader(gl.VERTEX_SHADER,vs),fragment=shader(gl.FRAGMENT_SHADER,fs);
 gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.deleteShader(vertex);gl.deleteShader(fragment);
 const parts=createBodyGeometry();
 const buffers=[],position=gl.getAttribLocation(program,'p'),normals=gl.getAttribLocation(program,'n'),matrix=gl.getUniformLocation(program,'m'),tint=gl.getUniformLocation(program,'color');
 for(const part of parts){
  const handle=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,handle);gl.bufferData(gl.ARRAY_BUFFER,part.vertices,gl.STATIC_DRAW);
  buffers.push({id:part.id,key:part.key,handle,count:part.vertices.length/6});
 }
 let colors={...DEFAULT},yaw=0,disposed=false,lost=false;
 const onLost=event=>{event.preventDefault?.();lost=true;};
 canvas.addEventListener?.('webglcontextlost',onLost);
 const draws=[];
 function render(){
  if(disposed||lost)return false;
  const width=Math.max(1,canvas.clientWidth||canvas.width||320),height=Math.max(1,canvas.clientHeight||canvas.height||480);
  const dpr=Math.min(2,typeof devicePixelRatio==='number'?devicePixelRatio:1);
  const px=Math.min(1200,Math.round(width*dpr)),py=Math.min(1200,Math.round(height*dpr));
  if(canvas.width!==px)canvas.width=px;if(canvas.height!==py)canvas.height=py;
  gl.viewport(0,0,px,py);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(program);gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(normals);
  const c=Math.cos(yaw),s=Math.sin(yaw),aspect=Math.min(2,height/width);
  const sx=.62*aspect,sy=.60,sz=.60;
  const m=new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,0,0,0,1]);
  gl.uniformMatrix4fv(matrix,false,m);
  draws.length=0;
  for(const part of buffers){
   const key=part.key;
   if(key==='dressLeg'&&!colors.dress)continue;
   if(key!=='skin'&&key!=='dressLeg'&&(!colors[key]||(colors.dress&&['top','bottom','layer','layer2','layer3'].includes(key))))continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,part.handle);
   gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);
   gl.vertexAttribPointer(normals,3,gl.FLOAT,false,24,12);
   gl.uniform4fv(tint,(key==='skin'||key==='dressLeg')?SKIN:(colors[key]||TONE));
   gl.drawArrays(gl.TRIANGLES,0,part.count);
   draws.push(part.id);
  }
  return true;
 }
 function setOutfit(next){
  if(disposed)return false;
  if(!next||typeof next!=='object'||Array.isArray(next))throw new TypeError('Garment colors required');
  for(const [key,value] of Object.entries(next)){
   if(!['top','bottom','shoes','layer','layer2','layer3','dress'].includes(key))throw new TypeError('Unknown clothing layer');
   if(value!==null&&!isColor(value))throw new TypeError('RGBA color required for '+key);
  }
  for(const [key,value] of Object.entries(next)){if(value===null)delete colors[key];else colors[key]=[...value];}
  render();return true;
 }
 function rotate(radians){
  if(!Number.isFinite(radians))throw new TypeError('Invalid angle');
  if(disposed)return false;
  yaw=((yaw+radians)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
  return render();
 }
 function dispose(){
  if(disposed)return;
  disposed=true;canvas.removeEventListener?.('webglcontextlost',onLost);
  for(const part of buffers)gl.deleteBuffer(part.handle);
  gl.deleteProgram(program);
 }
 return {supported:true,render,setOutfit,rotate,angle:()=>yaw,getState:()=>({supported:true,yaw,drawn:[...draws],layers:Object.keys(colors),disposed,lost}),dispose};
}
