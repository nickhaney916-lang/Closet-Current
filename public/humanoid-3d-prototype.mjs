/**
 * Dependency-free, browser-side 3D humanoid research prototype.
 * Synthetic geometry only. No customer photos, external requests or AI API.
 * NOT a fit simulator or accurate reconstruction of unseen garment surfaces.
 */
export function createHumanoid3D(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('Canvas required');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
  if (!gl) return { supported: false, render: () => false, setOutfit: () => {}, rotate: () => {}, dispose: () => {} };
  const vs = `attribute vec3 p; uniform mat4 transform; void main(){ gl_Position=transform*vec4(p,1.); }`;
  const fs = `precision mediump float; uniform vec4 color; void main(){gl_FragColor=color;}`;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const program=gl.createProgram(), vertex=compile(gl.VERTEX_SHADER,vs), fragment=compile(gl.FRAGMENT_SHADER,fs);
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  const pos=gl.getAttribLocation(program,'p'), transform=gl.getUniformLocation(program,'transform'), color=gl.getUniformLocation(program,'color');
  const buffer=gl.createBuffer();
  // Cuboid triangles: 6 faces, each with 2 triangles. Coordinates are local.
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const faces=[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]];
  const vertices=new Float32Array(faces.flatMap(([a,b,c,d])=>[a,b,c,a,c,d].flatMap(i=>corners[i])));
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  let angle=0, outfit={top:[0.27,0.43,0.74,1],bottom:[0.16,0.20,0.29,1],shoes:[0.20,0.20,0.22,1]};
  const body=[0.71,0.55,0.45,1], skin=[0.78,0.60,0.48,1];
  const parts=[
    [0,0.33,0,0.25,0.37,0.13,'top'],
    [-0.37,0.29,0,0.10,0.33,0.10,'top'],[0.37,0.29,0,0.10,0.33,0.10,'top'],
    [0,-0.16,0,0.22,0.15,0.12,'bottom'],
    [-0.13,-0.57,0,0.105,0.35,0.10,'bottom'],[0.13,-0.57,0,0.105,0.35,0.10,'bottom'],
    [-0.13,-0.95,0.08,0.12,0.08,0.22,'shoes'],[0.13,-0.95,0.08,0.12,0.08,0.22,'shoes'],
    [0,0.88,0,0.17,0.20,0.15,'skin'],[0,0.65,0,0.065,0.08,0.07,'skin']
  ];
  function draw() {
    const width=canvas.clientWidth||canvas.width||320,height=canvas.clientHeight||canvas.height||480;
    const dpr=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);
    const c=Math.cos(angle),s=Math.sin(angle),aspect=canvas.height/canvas.width;
    for(const [x,y,z,sx,sy,sz,key] of parts){
      const scale=0.72;
      const matrix=new Float32Array([
        sx*c*scale,0,-sx*s*scale,0,
        0,sy*scale,0,0,
        sz*s*scale,0,sz*c*scale,0,
        (x*c+z*s)*scale*aspect,y*scale,(-x*s+z*c)*scale,1
      ]);
      gl.uniformMatrix4fv(transform,false,matrix);
      gl.uniform4fv(color,key==='skin'?skin:(outfit[key]||body));
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);
    }
    return true;
  }
  function setOutfit(next){
    for(const key of ['top','bottom','shoes']){
      if(next?.[key]!==undefined){
        const v=next[key];
        if(!Array.isArray(v)||v.length!==4||v.some(n=>!Number.isFinite(n)||n<0||n>1))throw new TypeError('RGBA color required for '+key);
        outfit[key]=[...v];
      }
    }
    draw();
  }
  return {supported:true,render:draw,setOutfit,rotate:(radians)=>{if(!Number.isFinite(radians))throw new TypeError('Invalid angle');angle=(angle+radians)%(Math.PI*2);draw();},dispose:()=>{gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}
