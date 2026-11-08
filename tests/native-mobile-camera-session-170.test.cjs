'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const guard=require('../public/native-mobile-camera-lease-170.js');
const src=readFileSync('public/app.js','utf8');
const html=readFileSync('public/index.html','utf8');
const OWNER='11111111-1111-4111-8111-111111111111';
function state(){
 const s={epoch:'epoch-170-valid-owner',doc:{hidden:false,visibilityState:'visible'}};
 const storage={getItem:key=>key==='closet-current-auth-v1'?JSON.stringify({epoch:s.epoch}):null};
 const auth={user:{id:OWNER},assertCurrent(){if(!this.user||!this.user.id)throw Error('locked');}};
 const db={name:'closet-current-user-'+OWNER};
 return {...s,auth,db,storage};
}
const context=o=>({doc:o.doc,auth:o.auth,db:o.db,storage:o.storage});
test('P170 owner photo camera lease requires matching private IndexedDB and current auth session',()=>{
 const a=state(),lease=guard.capture(context(a));
 assert.equal(lease.owner,OWNER);
 assert.equal(guard.assert(lease,context(a)),true);
 assert.equal(guard.current(lease,context(a)),true);
 assert.throws(()=>guard.capture({...context(a),db:{name:'closet-current-user-other'}}),e=>e.code==='camera-owner-session-invalid-170');
 assert.throws(()=>guard.capture({...context(a),auth:{user:{id:OWNER}}}),/camera owner session|Camera stopped/i);
});
test('P170 invalidated local auth epoch cannot accept the old camera session',()=>{
 const a=state(),lease=guard.capture(context(a));
 a.epoch='epoch-170-rotated';a.storage.getItem=()=>JSON.stringify({epoch:a.epoch});
 assert.equal(guard.current(lease,context(a)),false);
 assert.throws(()=>guard.assert(lease,context(a)),e=>e.code==='camera-owner-session-invalid-170');
});
test('P170 visible-state changes, freeze/prerender and hidden document fail closed',()=>{
 const a=state(),lease=guard.capture(context(a));
 for(const v of ['hidden','prerender','unloaded']){
  a.doc.visibilityState=v;assert.equal(guard.current(lease,context(a)),false);
  assert.throws(()=>guard.capture(context(a)),e=>e.code==='camera-owner-session-invalid-170');
 }
 a.doc.visibilityState='visible';a.doc.hidden=true;
 assert.equal(guard.current(lease,context(a)),false);
});
test('P170 no raw image or account data is written by the pure lease and guard is immutable',()=>{
 const a=state(),lease=guard.capture(context(a));
 assert.equal(Object.isFrozen(lease),true);
 assert.equal(Object.isFrozen(guard),true);
 assert.equal('image' in lease,false);
 assert.equal('access_token' in lease,false);
 assert.equal('refresh_token' in lease,false);
});
test('P170 real app loads camera owner guard before app and wires check across permission / play / digest',()=>{
 assert.ok(html.includes('native-mobile-camera-lease-170.js'));
 assert.ok(html.indexOf('native-mobile-camera-lease-170.js')<html.indexOf('<script src="app.js"'));
 assert.match(src,/const lease170=window\.ClosetCameraLease170\?\.capture\(/);
 assert.match(src,/if\(request!==cameraRequest\|\|!acquiredOwnerStillCurrent\)/);
 assert.match(src,/acquired\.getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
 assert.match(src,/await video\.play\(\);[\s\S]*?if\(request!==cameraRequest\|\|lease170/);
 assert.match(src,/if\(lease170&&!window\.ClosetCameraLease170\.current\(lease170/);
 assert.match(src,/document\.addEventListener\('freeze',/);
 assert.match(src,/stopCamera\(\);message\('Camera stopped while the browser was frozen/);
});
