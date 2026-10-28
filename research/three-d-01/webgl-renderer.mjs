/** Native WebGL2 procedural avatar, front-photo projection, no CDN, model weights, storage or remote requests. */
import {buildAvatarScene,TYPES} from './geometry.mjs';
const VS=[
 '#version 300 es','precision highp float;',
 'layout(location=0) in vec3 aPos;','layout(location=1) in vec3 aNormal;',
 'layout(location=2) in vec2 aUV;','layout(location=3) in float aFront;',
 'uniform float uYaw;','uniform float uAspect;',
 'out vec2 vUV;','out float vFront;','out float vLight;',
 'void main(){',
 ' float s=sin(uYaw),c=cos(uYaw);',
 ' vec3 p=vec3(aPos.x*c+aPos.z*s,aPos.y,-aPos.x*s+aPos.z*c);',
 ' vec3 n=normalize(vec3(aNormal.x*c+aNormal.z*s,aNormal.y,-aNormal.x*s+aNormal.z*c));',
 ' float depth=4.7-p.z;',
 ' gl_Position=vec4(p.x*2.75/max(uAspect,.55),(p.y-1.38)*2.75,p.z*.12,depth);',
 ' vUV=aUV;vFront=aFront;vLight=clamp(.55+.40*dot(n,normalize(vec3(.45,.8,.7))),.35,1.);',
 '}'
].join('\n');
const FS=[
 '#version 300 es','precision highp float;',
 'in vec2 vUV;','in float vFront;','in float vLight;',
 'uniform vec3 uColor;','uniform sampler2D uPhoto;',
 'uniform float uUsePhoto;','uniform vec4 uCrop;','out vec4 outColor;',
 'void main(){',
 ' vec3 cloth=uColor;',
 ' if(uUsePhoto>.5&&vFront>.14){',
 '  vec2 uv=uCrop.xy+vUV*uCrop.zw;',
 '  vec4 sampled=texture(uPhoto,clamp(uv,vec2(.001),vec2(.999)));',
 '  cloth=mix(cloth,sampled.rgb,clamp(sampled.a*.9,0.,.9));',
 ' }',
 ' outColor=vec4(pow(clamp(cloth*vLight,vec3(0.),vec3(1.)),vec3(.87)),1.);',
 '}'
].join('\n');
function compile(gl,type,text){
 const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('3D shader unavailable: '+e);}
 return s;
}
function programFor(gl){
 const v=compile(gl,gl.VERTEX_SHADER,VS),f=compile(gl,gl.FRAGMENT_SHADER,FS),p=gl.createProgram();
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error('3D renderer unavailable: '+e);}
 return p;
}
export function mount3D(canvas,{onRender=()=>{}}={}){
 if(!canvas||typeof canvas.getContext!=='function')throw Error('Canvas required');
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL2 unsupported; use the original-photo board');
 const prog=programFor(gl),u={},meshes=[],textures=[];
 for(const n of ['uYaw','uAspect','uColor','uPhoto','uUsePhoto','uCrop'])u[n]=gl.getUniformLocation(prog,n);
 let scene=null,type='shirt',body='adult',yaw=0,photo=null,crop=[.12,.08,.76,.84],projection=false,count=0,closed=false;
 const white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
 const free=()=>{for(const m of meshes){gl.deleteBuffer(m.vert);gl.deleteBuffer(m.index);gl.deleteVertexArray(m.vao);}meshes.length=0;};
 const upload=item=>{
  const vao=gl.createVertexArray(),vert=gl.createBuffer(),index=gl.createBuffer();
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vert);
  gl.bufferData(gl.ARRAY_BUFFER,item.vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,item.indices,gl.STATIC_DRAW);
  for(const [loc,size,offset]of [[0,3,0],[1,3,12],[2,2,24],[3,1,32]]){
   gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,36,offset);
  }
  gl.bindVertexArray(null);
  return {vert,index,vao,count:item.indices.length,material:item.material,name:item.name};
 };
 function draw(){
  if(closed)return false;
  const r=canvas.getBoundingClientRect(),pixelRatio=Math.min(2,window.devicePixelRatio||1);
  const w=Math.min(1000,Math.max(160,Math.round((r.width||400)*pixelRatio)));
  const h=Math.min(1200,Math.max(160,Math.round((r.height||520)*pixelRatio)));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(.965,.972,.974,1);gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(prog);
  gl.uniform1f(u.uYaw,yaw);gl.uniform1f(u.uAspect,w/h);
  gl.uniform1i(u.uPhoto,0);gl.uniform4fv(u.uCrop,new Float32Array(crop));
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,photo||white);
  for(const m of meshes){
   gl.uniform3fv(u.uColor,new Float32Array(m.material.color));
   gl.uniform1f(u.uUsePhoto,m.material.photographed&&projection?1:0);
   gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);
  }
  gl.bindVertexArray(null);gl.flush();
  const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('WebGL error '+error);
  count++;canvas.dataset.renderCount=String(count);canvas.dataset.meshCount=String(meshes.length);
  canvas.dataset.yaw=String(yaw);
  onRender({type,body,yaw,meshes:meshes.length,triangles:scene?.triangles||0,
   frontPhotoProjection:projection,releaseAuthorized:false});
  return true;
 }
 function setScene(next,shape=body){
  if(closed||!TYPES.includes(next)||!['adult','youth'].includes(shape))throw Error('Unsupported 3D figure');
  free();type=next;body=shape;scene=buildAvatarScene({type,body});
  for(const item of scene.parts)meshes.push(upload(item));
  return draw();
 }
 function setPhoto(image,{cropRect=[.12,.08,.76,.84]}={}){
  if(closed)throw Error('3D preview closed');
  if(!Array.isArray(cropRect)||cropRect.length!==4||
   cropRect.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)||
   cropRect[2]<=.1||cropRect[3]<=.1||cropRect[0]+cropRect[2]>1||cropRect[1]+cropRect[3]>1)
   throw Error('Invalid front-photo crop');
  if(image&&!(image instanceof HTMLImageElement)&&!(image instanceof HTMLCanvasElement))
   throw Error('Photo must be locally decoded');
  crop=[...cropRect];projection=!!image;
  if(photo){gl.deleteTexture(photo);textures.splice(textures.indexOf(photo),1);photo=null;}
  if(image){
   photo=gl.createTexture();textures.push(photo);gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D,photo);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  }
  return draw();
 }
 const rotate=delta=>{if(closed||!Number.isFinite(delta))throw Error('Invalid angle');yaw=((yaw+delta)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return draw();};
 const setRotation=angle=>{if(closed||!Number.isFinite(angle))throw Error('Invalid angle');yaw=angle;return draw();};
 let dragging=false,last=0;
 const down=e=>{dragging=true;last=e.clientX;canvas.setPointerCapture?.(e.pointerId);};
 const move=e=>{if(!dragging||closed)return;const dx=e.clientX-last;last=e.clientX;rotate(dx*.012);};
 const up=e=>{dragging=false;if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
 for(const [event,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up]])
  canvas.addEventListener(event,fn);
 canvas.style.touchAction='none';
 const dispose=()=>{if(closed)return;closed=true;
  for(const [event,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up]])
   canvas.removeEventListener(event,fn);
  free();for(const t of textures)gl.deleteTexture(t);gl.deleteTexture(white);gl.deleteProgram(prog);photo=null;};
 setScene('shirt');
 return {setScene,setPhoto,draw,rotate,setRotation,dispose,
  getState:()=>({type,body,yaw,meshes:meshes.length,projection,renderCount:count,closed})};
}
