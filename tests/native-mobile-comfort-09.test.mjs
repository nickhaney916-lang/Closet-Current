import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_MOBILE_09,NATIVE_MOBILE_09_CSS,mountNativeMobile09} from '../research/native-mobile-09/mobile-comfort.mjs';
test('mobile comfort gate is explicitly research only and never touches saved data',()=>{
 assert.equal(NATIVE_MOBILE_09.productionAuthorized,false);
 assert.equal(NATIVE_MOBILE_09.photosModified,false);
 assert.equal(NATIVE_MOBILE_09.ownerRecordsModified,false);
 assert.equal(NATIVE_MOBILE_09.geometryModified,false);
 assert.equal(NATIVE_MOBILE_09.familyAlpha,'HOLD');
 assert.deepEqual(NATIVE_MOBILE_09.viewports,[320,390,430]);
 assert.equal(NATIVE_MOBILE_09.minimumTouchTargetPx,48);
 assert.match(NATIVE_MOBILE_09_CSS,/#outfit3D01Dialog/);
 assert.match(NATIVE_MOBILE_09_CSS,/#nativeLossless04Controls/);
 assert.match(NATIVE_MOBILE_09_CSS,/#nativeReadiness08/);
 assert.match(NATIVE_MOBILE_09_CSS,/prefers-reduced-motion/);
 assert.doesNotMatch(NATIVE_MOBILE_09_CSS,/url\(|@import|background-image|display:\s*none|visibility:\s*hidden/);
});
function mock(url='?nativeLossless04=research&native3D05=research&sourceReadiness08=research&nativeMobile09=research'){
 let attached=null;
 const els=new Map(['nativeLossless04Controls','native3D05Preview','nativeReadiness08',
  'appShell','authGate','logout'].map(id=>[id,{id,hidden:id==='authGate',addEventListener(){},
   removeEventListener(){}}]));
 const doc={
  head:{append(el){attached=el;els.set(el.id,el);}},
  createElement(tag){return {tag,id:'',textContent:'',remove(){els.delete(this.id);attached=null;}};},
  getElementById(id){return els.get(id)||null;}
 };
 const win={
  location:{search:url},
  closetAuth:{user:{id:'fixture-owner'},getAccessToken:async()=>''},
  addEventListener(){},removeEventListener(){}
 };
 const board={status(){return {active:true};}};
 return {doc,win,board,getAttached:()=>attached,els};
}
test('native opt-in mounts 48px responsive CSS, never modifies auth or records, and disposes cleanly',()=>{
 const m=mock(),before=m.win.closetAuth;
 const bridge=mountNativeMobile09({...m,board:m.board});
 assert.equal(bridge.state().active,true);
 assert.equal(bridge.state().minimumTouchTargetPx,48);
 assert.equal(m.win.closetAuth,before);
 assert.ok(m.getAttached().textContent.includes('min-height:48px'));
 assert.match(m.getAttached().textContent,/safe-area-inset-bottom/);
 bridge.dispose();
 assert.equal(bridge.state().active,false);
 assert.equal(m.getAttached(),null);
});
test('absent gate or native authenticated owner refuses research styling',()=>{
 const absent=mock('?nativeLossless04=research&native3D05=research&sourceReadiness08=research');
 assert.throws(()=>mountNativeMobile09(absent),/research-only/);
 const missing=mock();missing.win.closetAuth.user=null;
 assert.throws(()=>mountNativeMobile09(missing),/signed-in/);
 const illegal=mock();illegal.els.delete('nativeReadiness08');
 assert.throws(()=>mountNativeMobile09(illegal),/signed-in/);
});
