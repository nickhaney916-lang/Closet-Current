import {webcrypto} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {prepareSyntheticGarmentOriginal} from '../../reference-pr257/research/family-alpha-13/garment-photo-preparation.mjs';
import {syntheticScene,garmentCases} from './synthetic-scenes.mjs';
import {auditMask,fingerprintSavedCrop} from './source-mask-audit.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment}
 from '../../public/family-alpha-2d-saved-board.mjs';
const owner='a1111111-1111-4111-8111-111111111111';
const JPEG=seed=>{
 const bytes=new Uint8Array(128).fill(seed%210+12);
 bytes[0]=255;bytes[1]=216;bytes[126]=255;bytes[127]=217;
 return 'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64');
};
const scope=()=>({ownerId:owner,epoch:1});
export async function fixture(scene,serial=1){
 const id='synthetic-'+scene.kind.replace(/[^a-z0-9_-]/g,'-')+'-'+serial;
 const source=JPEG(17+serial),image=JPEG(50+serial);
 const item={id,category:scene.category,image,originalPhoto:{image:source},outfitSourceId:'synthetic-frame-'+serial};
 const originalSha=await fingerprintAlphaRetainedOriginal(source,webcrypto);
 const cropSha=await fingerprintSavedCrop(item,webcrypto);
 const raw=prepareSyntheticGarmentOriginal(scene.frame,{category:scene.category,sourceIdentity:identityForSavedGarment(item),sourceVersion:originalSha});
 const prepared=raw.status==='prepared'?{...raw,itemId:item.id,ownerId:owner,originalSha,cropSha}:raw;
 const options={item,prepared,ownerId:owner,getScope:scope,getItem:()=>item,cryptoProvider:webcrypto,
   decodeOriginal:async jpeg=>{
    if(jpeg!==source)throw Error('Synthetic fixture decoder got different source');
    return scene.frame;
   },groundTruth:scene.truth};
 return {...options,scene};
}
export async function runMatrix(){
 const rows=[];
 let count=0;
 for(const [kind] of garmentCases){
  const scene=syntheticScene(kind,{mode:'plain'});
  const f=await fixture(scene,++count);
  const result=await auditMask(f);
  rows.push({kind,condition:'patterned/plain background',expected:'pass',observed:result.status,
    reason:result.reason,metrics:result.metrics});
 }
 const conditions=[
  ['short-sleeve','white','review'],['sweater','dark','review'],
  ['shirt','busy','review'],['dress','multiple','review'],
  ['jacket','clipped','review'],['short-sleeve','blank','review'],
  ['sneakers','transparent','review'],['skirt','wrinkled','pass']
 ];
 for(const [kind0,mode,expected] of conditions){
  const kind=kind0==='shirt'?'short-sleeve':kind0;
  const scene=syntheticScene(kind,{mode});
  const f=await fixture(scene,++count);
  const result=await auditMask(f);
  rows.push({kind,condition:mode,expected,observed:result.status,reason:result.reason,metrics:result.metrics});
 }
 const summary={
  originalProcessor:'PR257 HEAD df8d2589dd9b1767b727270fed9ce00f7a80afae',
  checkedSource:'synthetic deterministic pixels and mocked JPEG envelope in Node; NOT actual JPEG decode',
  cases:rows.length,
  syntheticPass:rows.filter(x=>x.expected==='pass'&&x.observed==='pass').length,
  syntheticExpectedPass:rows.filter(x=>x.expected==='pass').length,
  unsafeAccepts:rows.filter(x=>x.expected==='review'&&x.observed==='pass').length,
  review:rows.filter(x=>x.observed==='review').length,
  reject:rows.filter(x=>x.observed==='reject').length,
  discrepancies:rows.filter(x=>x.expected!==x.observed).map(x=>({kind:x.kind,condition:x.condition,expected:x.expected,observed:x.observed,reason:x.reason}))
 };
 return {summary,rows};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const out=await runMatrix();await mkdir('benchmark/family-alpha-16',{recursive:true});
 await writeFile('benchmark/family-alpha-16/node-matrix.json',JSON.stringify(out,null,2));
 console.log('Family Alpha 16 synthetic matrix '+JSON.stringify(out.summary));
}
