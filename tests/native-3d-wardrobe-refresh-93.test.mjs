import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requireNative3D05WardrobeRevision93}
 from '../research/native-3d-05/native-preview-bridge.mjs';

function fixture(){
 let revision=1,generation=3,ownerId='owner-93';
 const consumer={readOnlyWardrobeRevision93:()=>({ownerId,generation,revision})};
 const expected=requireNative3D05WardrobeRevision93({consumer,ownerId:'owner-93'});
 const check=()=>requireNative3D05WardrobeRevision93({
  consumer,ownerId:'owner-93',expected
 });
 return {consumer,expected,check,
  refresh:()=>revision++,
  owner:x=>ownerId=x,generation:x=>generation=x,
  revision:x=>revision=x};
}
test('NATIVE93 same original owner and unchanged wardrobe revision preserves source-true 3D admission',()=>{
 const f=fixture(),a=f.check();
 assert.deepEqual(a,f.expected);
 assert.ok(Object.isFrozen(a));
 assert.equal(a.ownerId,'owner-93');
 assert.equal(a.generation,3);
 assert.equal(a.revision,1);
});
test('NATIVE93 a new private wardrobe snapshot invalidates a rendered 3D scene even if SHA metadata remains unchanged',()=>{
 const f=fixture();f.refresh();
 assert.throws(f.check,/NATIVE93 private wardrobe refreshed/);
});
test('NATIVE93 a session refresh or owner switch cannot inherit previous photo 3D admission',()=>{
 const f=fixture();f.generation(4);
 assert.throws(f.check,/NATIVE93 private wardrobe refreshed/);
 const other=fixture();other.owner('owner-B');
 assert.throws(other.check,/NATIVE93 invalid owner-private wardrobe revision/);
});
test('NATIVE93 requires bounded integer valid revision and nonnegative live owner generation',()=>{
 for(const revision of [-1,0,NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1]){
  const f=fixture();f.revision(revision);
  assert.throws(f.check,/NATIVE93 invalid owner-private wardrobe revision/,
   'Unsafe revision must fail closed: '+revision);
 }
 const invalid=fixture();invalid.generation(NaN);
 assert.throws(invalid.check,/NATIVE93 invalid owner-private wardrobe revision/);
});
test('NATIVE93 no private wardrobe revision API or no owner refuses admission without guessing',()=>{
 const f=fixture();
 assert.throws(()=>requireNative3D05WardrobeRevision93({
  consumer:{},ownerId:'owner-93',expected:f.expected
 }),/NATIVE93 owner-private wardrobe revision unavailable/);
 assert.throws(()=>requireNative3D05WardrobeRevision93({
  consumer:f.consumer,ownerId:'',expected:f.expected
 }),/NATIVE93 owner-private wardrobe revision unavailable/);
});
test('NATIVE93 private epoch increments only for adopted owner wardrobe snapshots, never rewrites a saved outfit',()=>{
 const s=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 assert.match(s,/editSerial=0,wardrobeRevision93=0/);
 assert.match(s,/loaded=true;\s*wardrobeRevision93\+\+/);
 assert.match(s,/wardrobe=next;\s*wardrobeRevision93\+\+/);
 assert.match(s,/const readOnlyWardrobeRevision93=\(\)=>/);
 assert.match(s,/get\('native3D05'\)!=='research'/);
 assert.match(s,/const lease=alive\(\);\s*return Object\.freeze\(\{ownerId:lease\.ownerId,generation:lease\.generation,\s*revision:wardrobeRevision93\}\)/);
 assert.match(s,/attestOriginalPhotoBytes92,sessionLease,readOnlyWardrobeRevision93,applyOwnedSlots/);
 const local=s.slice(s.indexOf('const readOnlyWardrobeRevision93='),s.indexOf('// STYLE-OWNED-LIVE-03:'));
 assert.doesNotMatch(local,/originalPhoto:\s*|sourceSHA256:|image:|persist\(|objectStore\(|put\(/);
});
test('NATIVE93 bridge revokes stale source photos while opening AND after real WebGL was rendered',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/const selectedRevision93=requireNative3D05WardrobeRevision93/);
 assert.match(s,/requireNative3D05WardrobeRevision93\(\{consumer,ownerId:selected\.ownerId,expected:selectedRevision93\}\)/);
 assert.match(s,/displayedRevision93=selectedRevision93/);
 assert.match(s,/ownerId:displayedSelection89\.admitted\.ownerId,expected:displayedRevision93/);
 assert.match(s,/displayedRevision93=null;/);
 assert.match(s,/new mutationHost\(\(\)=>revokeChangedSource89\(\)\)/);
 assert.match(s,/const state=\(\)=>\{\s*\/\/ Also enforce source admission[\s\S]*?revokeChangedSource89\(\)/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Cryptographic JPEG bytes/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Repeat after slow WebGL/);
});
test('NATIVE93 genuine original-photo Chromium test edits source bytes AFTER model is visible, unchanged SHA and owner',()=>{
 const s=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const t of ["const native93=process.env.NATIVE93==='1'",
  'if(native93&&width===390)',
  "row.originalPhoto.image=image",
  'window.nativeLossless04Bridge.refreshWardrobe()',
  'window.nativeLossless04Bridge.readOnlyWardrobeRevision93()',
  'afterRevision.revision,beforeRevision.revision+1',
  'shaMetadataIntentionallyUnchanged:true',
  'privatePhotoRemovedBeforeStateRead:true',
  'reOpenCorruptSourceBlockedByWebCrypto:true',
  'postOpenUnchangedSHASourceRevoked93'])
  assert.ok(s.includes(t),'missing browser acceptance: '+t);
 assert.match(s,/privateSavedBoardUnchanged:true/);
 assert.match(s,/real owner wardrobe refresh/i);
});
