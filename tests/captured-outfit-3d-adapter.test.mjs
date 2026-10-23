import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {prepareCapturedOutfit3DItems} from '../public/captured-outfit-3d-adapter.mjs';
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const owns=(item,account)=>account==='verified-account'&&item.id!=='foreign';
const make=(id,source=jpeg(1))=>({id,outfitSourceId:'capture-1',originalPhoto:{image:source},image:jpeg(9),category:'Tops',color:'Blue'});
test('shared original capture maps two garments to same source fingerprint',async()=>{
 const result=await prepareCapturedOutfit3DItems([make('shirt'),make('pants')],'verified-account',owns,webcrypto);
 assert.equal(result.items.length,2);
 assert.equal(result.sourceIdentity(result.items[0]).id,'capture-1');
 assert.deepEqual(result.sourceIdentity(result.items[0]),result.sourceIdentity(result.items[1]));
 assert.equal(result.items[0].accountId,'verified-account');
});
test('cropped preview changes do not change source identity; changed original does',async()=>{
 const a=await prepareCapturedOutfit3DItems([make('shirt')],'verified-account',owns,webcrypto);
 const preview={...make('shirt'),image:jpeg(4)};
 const b=await prepareCapturedOutfit3DItems([preview],'verified-account',owns,webcrypto);
 const c=await prepareCapturedOutfit3DItems([make('shirt',jpeg(2))],'verified-account',owns,webcrypto);
 assert.equal(a.sourceIdentity(a.items[0]).version,b.sourceIdentity(b.items[0]).version);
 assert.notEqual(a.sourceIdentity(a.items[0]).version,c.sourceIdentity(c.items[0]).version);
});
test('rejects absent original, missing capture ID and duplicate garment IDs',async()=>{
 for(const rows of [[{...make('shirt'),originalPhoto:null}],[{...make('shirt'),outfitSourceId:''}],[make('shirt'),make('shirt')]]){
  await assert.rejects(()=>prepareCapturedOutfit3DItems(rows,'verified-account',owns,webcrypto));
 }
});

test('rejects foreign items and missing ownership verifier',async()=>{
 await assert.rejects(()=>prepareCapturedOutfit3DItems([make('foreign')],'verified-account',owns,webcrypto),/ownership/);
 await assert.rejects(()=>prepareCapturedOutfit3DItems([make('shirt')],'verified-account',undefined,webcrypto),/inputs|required/);
});
