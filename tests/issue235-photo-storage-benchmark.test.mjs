import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import BackupEngine from '../public/cloud-backup-engine.js';

const fakeJPEG=part=>'data:image/jpeg;base64,'+Buffer.from([255,216,255,224,...part.split('').map(x=>x.charCodeAt(0)),255,217]).toString('base64');
const item=(i,photo)=>({id:'item-'+i,name:'Synthetic item',category:'Tops',image:photo});
const board=()=>({id:'outfit-board',current:{id:'a',slots:{top:'item-0'}},saved:[{id:'b',slots:{top:'item-0'}}]});
const doc=items=>({schemaVersion:1,items,state:{'outfit-board':board()}});
test('validates each synthetic size (25, 100, 250, 500) using exact existing backup schema',()=>{
 for(const n of [25,100,250,500]){
  const photos=Array.from({length:12},(_,i)=>fakeJPEG('photo-'+i));
  const data=doc(Array.from({length:n},(_,i)=>item(i,photos[i%photos.length])));
  assert.equal(BackupEngine.validateDocument(data),data);
  assert.equal(data.state['outfit-board'].saved[0].slots.top,'item-0');
 }
});
test('shared full-frame originals map to same cloud JPEG while distinct crops keep their identity',async()=>{
 const common=fakeJPEG('full-frame'),cropA=fakeJPEG('crop-A'),cropB=fakeJPEG('crop-B');
 const d=doc([{...item(0,cropA),originalPhoto:{image:common}},
  {...item(1,cropB),originalPhoto:{image:common}}]);
 const encoder=async value=>'closet-photo:11111111-1111-4111-8111-111111111111/'+createHash('sha256').update(Buffer.from(value.slice(value.indexOf(',')+1),'base64')).digest('hex')+'.jpg';
 const encoded=await BackupEngine.mapImages(d,encoder);
 assert.equal(encoded.items[0].originalPhoto.image,encoded.items[1].originalPhoto.image);
 assert.notEqual(encoded.items[0].image,encoded.items[1].image);
 assert.equal(d.items[0].originalPhoto.image,common);
});
test('outfit-board saved slots unchanged by image map and valid deletion does not rewrite original',async()=>{
 const d=doc([item(0,fakeJPEG('before'))]),snapshot=structuredClone(d);
 const encoded=await BackupEngine.mapImages(d,async image=>'stored:'+image.length);
 assert.deepEqual(encoded.state['outfit-board'],snapshot.state['outfit-board']);
 assert.deepEqual(d,snapshot);
 const restored=await BackupEngine.mapImages(encoded,async()=>d.items[0].image);
 assert.equal(restored.items[0].image,d.items[0].image);
});
test('cloud snapshot fail-closes on duplicate IDs and out-of-capacity wardrobes',()=>{
 const a=doc([item(0,fakeJPEG('a')),item(0,fakeJPEG('b'))]);
 assert.throws(()=>BackupEngine.validateDocument(a),/Invalid cloud item/);
 const large=doc(Array.from({length:1001},(_,i)=>item(i,fakeJPEG('same'))));
 assert.throws(()=>BackupEngine.validateDocument(large),/Invalid cloud closet/);
});
test('repository originals remain byte-identical and backup source limits unchanged',()=>{
 const app=readFileSync('public/app.js','utf8'),backup=readFileSync('public/cloud-backup.js','utf8');
 assert.match(app,/function openDB\(\)/);assert.match(app,/closet-current-user-/);
 assert.match(backup,/const hash=async bytes/);assert.match(backup,/photoPath\(value\)/);
 assert.match(backup,/SHA-256/);
 assert.match(app,/function saveIndexed\(item\)/);
});
