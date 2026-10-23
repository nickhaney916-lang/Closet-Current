/** #232 renderer extension: front-photo projection; all other garment surfaces estimated. */
import {createPhotoHumanoidGeometry} from './humanoid-3d-photo-geometry.mjs';
import {indexPhotoMesh} from './humanoid-3d-indexed-mesh.mjs';
import {getVerifiedPhotoFrame} from './humanoid-3d-photo-session.mjs';
export function createPhotoHumanoid3D(canvas,{indexed=true}={}){
 if(typeof indexed!=='boolean')throw Error('Invalid mesh mode');
 const gl=canvas?.getContext?.('webgl',{alpha:true,antialias:true,depth:true,preserveDrawingBuffer:true});
 if(!gl)return {supported:false,setFrame:()=>false,render:()=>false,rotate:()=>false,clear(){},dispose(){},getState:()=>({supported:false,fallback:'2d-original-reference'})};
 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 t;uniform mat4 matrix;varying vec3 N;varying vec2 uv;void main(){gl_Position=matrix*vec4(p,1.);N=n;uv=t;}`;
 const fs=`precision mediump float;varying vec3 N;varying vec2 uv;uniform vec4 color;uniform float photo;uniform float skin;uniform float yaw;uniform sampler2D original;
 void main(){vec3 n=normalize(N);if(photo>.5&&n.z>.55&&uv.x>=0.&&uv.x<=1.&&uv.y>=0.&&uv.y<=1.){vec4 source=texture2D(original,uv);if(source.a<.05)discard;gl_FragColor=source;}
 else{vec3 world=vec3(cos(yaw)*n.x+sin(yaw)*n.z,n.y,-sin(yaw)*n.x+cos(yaw)*n.z);float light=.68+.32*max(dot(world,normalize(vec3(-.4,.65,.8))),0.);float hatch=skin>.5?1.:(.78+.14*step(.5,fract((uv.x+uv.y)*27.)));gl_FragColor=vec4(color.rgb*light*hatch,color.a);}}`;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;};
 const program=gl.createProgram(),v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw Error('Photo renderer shader link failed');}
 const attrs=Object.fromEntries(['p','n','t'].map(k=>[k,gl.getAttribLocation(program,k)])),u=Object.fromEntries(['matrix','color','photo','skin','yaw','original'].map(k=>[k,gl.getUniformLocation(program,k)]));
 let parts=[],textures=new Map(),frame=null,yaw=0,disposed=false,lost=false,draws=[];
 function release(){for(const p of parts){gl.deleteBuffer(p.buffer);if(p.indexBuffer)gl.deleteBuffer(p.indexBuffer);}for(const t of textures.values())gl.deleteTexture(t);parts=[];textures.clear();frame=null;draws=[];}
 function clear(){release();if(!lost){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}}
 const contextLost=e=>{e.preventDefault();lost=true;release();};canvas.addEventListener('webglcontextlost',contextLost);
 function render(){
  if(disposed||lost||!frame)return false;let data;try{data=getVerifiedPhotoFrame(frame);}catch{clear();return false;}
  const w=canvas.clientWidth||320,h=canvas.clientHeight||480,dpr=Math.min(1.5,globalThis.devicePixelRatio||1);
  const width=Math.min(900,Math.round(w*dpr)),height=Math.min(900,Math.round(h*dpr));if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
  gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(program);
  const c=Math.cos(yaw),s=Math.sin(yaw),sx=.63*h/w,sy=.64,sz=.6;
  gl.uniformMatrix4fv(u.matrix,false,new Float32Array([c*sx,0,s*sz,0,0,sy,0,0,s*sx,0,-c*sz,0,0,0,0,1]));gl.uniform1f(u.yaw,yaw);gl.uniform1i(u.original,0);
  for(const k of Object.values(attrs))gl.enableVertexAttribArray(k);draws=[];
  for(const p of parts){
   const skin=p.key==='skin'||p.key==='detail',color=p.key==='detail'?[.19,.16,.15,1]:skin?[.76,.58,.47,1]:data.colors[p.key];
   if(!color)continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,p.buffer);gl.vertexAttribPointer(attrs.p,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(attrs.n,3,gl.FLOAT,false,32,12);gl.vertexAttribPointer(attrs.t,2,gl.FLOAT,false,32,24);
   gl.uniform4fv(u.color,color);gl.uniform1f(u.photo,p.photo&&textures.has(p.key)?1:0);gl.uniform1f(u.skin,skin?1:0);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures.get(p.key)||textures.values().next().value);
   if(p.indexBuffer){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.indexBuffer);gl.drawElements(gl.TRIANGLES,p.count,gl.UNSIGNED_SHORT,0);}else gl.drawArrays(gl.TRIANGLES,0,p.count);draws.push(p.id);
  }
  return true;
 }
 function setFrame(next){
  if(disposed||lost)return false;
  let data;try{data=getVerifiedPhotoFrame(next);}catch(error){clear();throw error;}
  clear();
  try{
   for(const part of createPhotoHumanoidGeometry(data.selected)){
    const mesh=indexed?indexPhotoMesh(part.vertices):{vertices:part.vertices,indices:null,sourceVertexCount:part.vertices.length/8};
    const buffer=gl.createBuffer();if(!buffer)throw Error('GPU buffer unavailable');
    const record={id:part.id,key:part.key,photo:part.photo,buffer,indexBuffer:null,count:mesh.indices?.length||mesh.sourceVertexCount,uniqueVertices:mesh.vertices.length/8,sourceVertices:mesh.sourceVertexCount,vertexBytes:mesh.vertices.byteLength,indexBytes:mesh.indices?.byteLength||0};parts.push(record);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
    if(mesh.indices){record.indexBuffer=gl.createBuffer();if(!record.indexBuffer)throw Error('GPU index buffer unavailable');gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,record.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);}
   }
   for(const m of data.materials){
    const t=gl.createTexture();if(!t)throw Error('GPU texture unavailable');textures.set(m.slot,t);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,m.width,m.height,0,gl.RGBA,gl.UNSIGNED_BYTE,m.rgba);
   }
   frame=next;return render();
  }catch(error){clear();throw error;}
 }
 return {supported:true,setFrame,render,clear,rotate(radians){if(!Number.isFinite(radians))throw Error('Invalid rotation');yaw=((yaw+radians)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return render();},
  getState(){return {supported:true,yaw,drawn:[...draws],textureCount:textures.size,vertexCount:parts.reduce((n,p)=>n+p.uniqueVertices,0),sourceVertexCount:parts.reduce((n,p)=>n+p.sourceVertices,0),indexCount:parts.reduce((n,p)=>n+(p.indexBuffer?p.count:0),0),bufferBytes:parts.reduce((n,p)=>n+p.vertexBytes+p.indexBytes,0),retainedGeometryBytes:0,indexed,lost,disposed,estimatedSideBack:true,physicalFitVerified:false};},
  dispose(){if(disposed)return;clear();disposed=true;canvas.removeEventListener('webglcontextlost',contextLost);gl.deleteProgram(program);}};
}
