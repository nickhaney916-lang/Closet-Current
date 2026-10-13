import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {makeVectorScorer,loadVectorAssets} from '../public/vector-scorer.mjs';import {localCandidates,garmentDetailGroups} from '../public/local-catalog.mjs';import {categoryCandidates} from '../public/recognition-engine.mjs';import {fitPhotoDimensions,padPhotoPixels,fitWholePhoto} from '../public/recognition-photo.mjs';
function bundle(){const vectors=new Float32Array(1024);vectors[0]=1;vectors[513]=1;const bytes=vectors.buffer,metadata={version:1,model:'ff13/fashion-clip',revision:'0'.repeat(40),dimensions:512,scale:10,labels:['one','two'],sha256:createHash('sha256').update(new Uint8Array(bytes)).digest('hex')};return {metadata,vectors,bytes};}
test('all production clothing labels have finite vectors and the binary matches its digest',async()=>{
 const metadata=JSON.parse(fs.readFileSync('public/recognition-vectors.json')),binary=fs.readFileSync('public/recognition-vectors.bin'),vectors=new Float32Array(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength));assert.equal(createHash('sha256').update(binary).digest('hex'),metadata.sha256);
 const needed=[...categoryCandidates,...localCandidates,...localCandidates.filter(x=>x.category!=='Uncategorized').flatMap(x=>Object.values(garmentDetailGroups(x)).flat())];for(const x of needed)assert.ok(metadata.labels.includes(x.label),x.label);
 assert.ok(vectors.every(Number.isFinite));assert.equal(vectors.length,metadata.labels.length*512);
 for(let row=0;row<metadata.labels.length;row++){let sum=0;for(let k=0;k<512;k++)sum+=vectors[row*512+k]**2;assert.ok(Math.abs(sum-1)<.001);}
});
test('category and detail scoring reuse one image encoding without mixing photos',async()=>{
 const b=bundle();let calls=0;const scorer=makeVectorScorer(async image=>{calls++;const v=new Float32Array(512);v[image.index]=1;return v;},b.metadata,b.vectors),one={index:0},two={index:1};
 const [a,c]=await Promise.all([scorer(one,['one','two']),scorer(one,['two','one'])]);assert.equal(a[0].label,'one');assert.equal(c[0].label,'one');assert.equal(calls,1);assert.equal((await scorer(two,['one','two']))[0].label,'two');assert.equal(calls,2);
});
test('failed image encoding is retryable and unknown labels cannot fabricate a result',async()=>{
 const b=bundle();let fail=true,calls=0;const scorer=makeVectorScorer(async()=>{calls++;if(fail)throw Error('failed');return b.vectors.slice(0,512);},b.metadata,b.vectors),image={};await assert.rejects(scorer(image,['one','two']));fail=false;assert.equal((await scorer(image,['one','two']))[0].label,'one');assert.equal(calls,2);await assert.rejects(scorer(image,['unknown']));assert.equal(calls,2);
});
test('damaged or unavailable recognition assets fail before classification',async()=>{
 const b=bundle(),fetcher=async url=>url==='manifest'?{ok:true,json:async()=>b.metadata}:{ok:true,arrayBuffer:async()=>b.bytes};assert.equal((await loadVectorAssets('manifest','binary',{fetcher})).vectors.length,1024);
 const corrupt=b.bytes.slice(0);new Uint8Array(corrupt)[0]^=1;await assert.rejects(loadVectorAssets('manifest','binary',{fetcher:async url=>url==='manifest'?{ok:true,json:async()=>b.metadata}:{ok:true,arrayBuffer:async()=>corrupt}}),/integrity/);
 await assert.rejects(loadVectorAssets('manifest','binary',{fetcher:async()=>({ok:false})}),/could not load/);
});
test('whole-photo preparation preserves portrait and landscape edges',async()=>{
 assert.deepEqual(fitPhotoDimensions(100,400),{width:56,height:224,left:84,top:0,size:224});assert.deepEqual(fitPhotoDimensions(400,100),{width:224,height:56,left:0,top:84,size:224});
 const fit={width:1,height:2,left:1,top:0,size:2},source=new Uint8ClampedArray([255,0,0,0,0,255]),out=padPhotoPixels(source,3,fit);assert.deepEqual(Array.from(out),[255,255,255,255,0,0,255,255,255,0,0,255]);assert.deepEqual(Array.from(source),[255,0,0,0,0,255]);
 let requested;const raw={width:400,height:100,async resize(width,height){requested={width,height};return {data:new Uint8ClampedArray(width*height*3),width,height,channels:3};}};
 class Image{constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}}
 const fitted=await fitWholePhoto(raw,Image);assert.deepEqual(requested,{width:224,height:56});assert.equal(fitted.width,224);assert.equal(fitted.height,224);assert.equal(fitted.data[0],255);
});
