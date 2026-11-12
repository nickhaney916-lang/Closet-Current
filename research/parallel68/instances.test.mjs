import test from 'node:test';import assert from 'node:assert/strict';
import {splitFootwear68,postprocessFootwear68} from './footwear.mjs';
import {makeReviewPacket68,editReviewNote68,exportReviewNotes68} from './review-packet.mjs';
test('separated shoes retain every original pixel including detached lace fragments',()=>{
 const w=24,h=12,m=new Uint8Array(w*h);
 for(let y=2;y<10;y++)for(const [a,b]of [[1,7],[16,22]])for(let x=a;x<b;x++)m[y*w+x]=1;
 m[0]=1;m[23]=1;
 const split=splitFootwear68(m,w,h);assert.equal(split.length,2);
 for(let i=0;i<m.length;i++)assert.equal(split.reduce((sum,x)=>sum+x[i],0),m[i]);
 assert.equal(splitFootwear68(new Uint8Array(w*h),w,h).length,1);
});
test('postprocessing deduplicates same-mask proposals without inventing source pixels',()=>{
 const w=10,h=10,m=new Uint8Array(100);m.fill(1,20,80);
 const r={label:'shoe',category:'Shoes'};const out=postprocessFootwear68([r,r],[m,m],w,h);
 assert.equal(out.length,1);assert.equal(out[0].duplicateEvidence.length,1);assert.equal(out[0].requiresReview,true);assert.equal(out[0].strong,false);
 assert.throws(()=>splitFootwear68(Uint8Array.of(2),1,1));
});
test('review note edits cannot grant save authority or become independent human labels',()=>{
 const packet=makeReviewPacket68({sha256:'a'.repeat(64),width:100,height:100,regions:[{maskSha256:'b'.repeat(64),categories:['Shoes']}]});
 const note=editReviewNote68(packet,packet.instances[0].id,{itemType:'Sneakers',color:'Blue'});
 assert.equal(note.instances[0].requiresReview,true);assert.equal(note.instances[0].classificationVerified,false);
 assert.equal(exportReviewNotes68(note).canSaveToCloset,false);assert.equal(exportReviewNotes68(note).independentGroundTruth,false);
 assert.throws(()=>editReviewNote68(packet,packet.instances[0].id,{strong:true}));
 const foreign=structuredClone(packet);foreign.instances[0].sourceSha256='c'.repeat(64);assert.throws(()=>exportReviewNotes68(foreign));
 const tampered=structuredClone(packet);tampered.canSaveToCloset=true;assert.throws(()=>exportReviewNotes68(tampered));
 assert.match(makeReviewPacket68({sha256:'a'.repeat(64),width:100,height:100,regions:[]}).reviewReason,/entire original/);
});
