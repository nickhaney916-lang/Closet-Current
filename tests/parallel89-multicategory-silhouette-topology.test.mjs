import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {buildOriginalJPEGTexturedFront89:build}=await import(new URL(process.env.M2_EDGE_BASELINE==='1'?'../research/parallel89/.edge-baseline.mjs':'../research/parallel89/source-original-texture-transfer89.mjs',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const w=12,h=12;
function topology(out){
 const edges=new Map(),degree=new Map();
 const add=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;const e=edges.get(key)||{a,b,count:0};e.count++;edges.set(key,e)};
 for(let i=0;i<out.indices.length;i+=3){const [a,b,c]=out.indices.slice(i,i+3);assert.notEqual(a,b);assert.notEqual(a,c);assert.notEqual(b,c);add(a,b);add(b,c);add(c,a)}
 for(const e of edges.values()){assert.ok(e.count<=2);if(e.count===1)for(const v of [e.a,e.b])degree.set(v,(degree.get(v)||0)+1)}
 return degree;
}
function mask(type){
 const a=new Uint8Array(w*h);
 const set=(x,y)=>a[y*w+x]=255;
 if(type==='diagonal'){for(let y=2;y<5;y++)for(let x=2;x<5;x++)set(x,y);for(let y=5;y<8;y++)for(let x=5;x<8;x++)set(x,y)}
 else if(type==='reverse'){for(let y=2;y<5;y++)for(let x=5;x<8;x++)set(x,y);for(let y=5;y<8;y++)for(let x=2;x<5;x++)set(x,y)}
 else {for(let y=2;y<10;y++)for(let x=2;x<10;x++)if(!(x>=5&&x<7&&y>=5&&y<7))set(x,y)}
 return a;
}
test('six original JPEGs: diagonal silhouette contacts are not welded; holes and pixels retained',async()=>{
 const failures=[];
 for(const id of ids)for(const type of ['diagonal','reverse','hole']){
  const alpha=mask(type),originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url));
  const before=sha(originalBytes),maskHash=sha(alpha),lockedRecord=registry.find(r=>r.id===id);
  const out=await build({sourceId:id,originalBytes,lockedRecord,alpha,width:w,height:h,sourceMaskSHA256:maskHash,textureScale:2});
  assert.equal(out.status,'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY');
  const degree=topology(out);
  if([...degree.values()].some(n=>n!==2))failures.push(id+':'+type);
  const cells=alpha.filter(v=>v===255).length;
  assert.equal(out.indices.length/3,cells*2);assert.equal(out.textureForegroundPixels,cells*4);
  assert.equal(out.positions.length/3,out.uv.length/2);
  // Independently recover each triangle cell from UV centroid: no filled gap or lost cell.
  const counts=new Map();
  for(let i=0;i<out.indices.length;i+=3){
   let u=0,v=0;for(const j of out.indices.slice(i,i+3)){u+=out.uv[j*2];v+=out.uv[j*2+1]}
   const x=Math.floor(u/3*w),y=Math.floor((1-v/3)*h),k=y*w+x;
   assert.equal(alpha[k],255);counts.set(k,(counts.get(k)||0)+1);
  }
  for(let i=0;i<alpha.length;i++)assert.equal(counts.get(i)||0,alpha[i]?2:0);
  assert.equal(out.originalJPEG_SHA256,before);assert.equal(sha(originalBytes),before);assert.equal(sha(alpha),maskHash);
  assert.equal(out.consumer3DAdmitted,false);assert.equal(out.familyAlpha,'HOLD');
 }
 assert.deepEqual(failures,[],'SILHOUETTE_POINT_WELD: disconnected edge fans share a vertex');
});
