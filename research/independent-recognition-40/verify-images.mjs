import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {auditDataset} from './score.mjs';
const rows=JSON.parse(await readFile(new URL('dataset-manifest.json',import.meta.url))),info=auditDataset(rows),examined=[],hashes=[];
for(const x of rows){
 const bytes=await readFile(x.fixture);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),x.sha256,'Source byte drift '+x.id);
 assert.ok(bytes[0]===255&&bytes[1]===216,'Non-JPEG fixture '+x.id);
 const meta=await sharp(bytes).metadata();assert.equal(meta.format,'jpeg');if(x.width)assert.equal(meta.width,x.width);if(x.height)assert.equal(meta.height,x.height);if(x.bytes)assert.equal(bytes.length,x.bytes);
 examined.push({id:x.id,sha256:x.sha256,width:meta.width,height:meta.height,sourceKind:x.sourceKind});
 const raw=await sharp(bytes).greyscale().resize(9,8).raw().toBuffer();let bits=0n;
 for(let y=0;y<8;y++)for(let i=0;i<8;i++)if(raw[y*9+i]>raw[y*9+i+1])bits|=1n<<BigInt(y*8+i);
 hashes.push([x.id,bits]);
}
const flagged=[];function bits(x){let n=0;while(x){n++;x&=x-1n;}return n;}
for(let i=0;i<hashes.length;i++)for(let j=i+1;j<hashes.length;j++){const distance=bits(hashes[i][1]^hashes[j][1]);if(distance<=5)flagged.push({ids:[hashes[i][0],hashes[j][0]],dHashDistance:distance,requiresHumanReview:true});}
assert.equal(examined.length,44);await mkdir('benchmark/recognition-acceptance-40',{recursive:true});
await writeFile('benchmark/recognition-acceptance-40/source-audit.json',JSON.stringify({...info,photos:examined,potentialNearDuplicates:flagged,notes:'dHash is a candidate-only visual similarity signal, not confirmed product duplication'},null,2));
console.log('INDEPENDENT40 SHA verified '+examined.length+' distinct existing JPEG fixtures; human adjudication remains unavailable.');
