'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/photo-crop-editor.js'),'utf8');
function fixture(source){
 const start=source.indexOf(' let previewRevision=0;');
 const updateStart=start<0?source.indexOf(' function update(){'):start;
 const end=source.indexOf(' frame.onpointerdown=',updateStart);
 assert.ok(updateStart>=0&&end>updateStart);
 const frames=[],pending=[];
 const element=()=>({style:{},setAttribute(){}});
 const preview={isConnected:true,getContext:()=>({drawImage(image){frames.push(image.src);},clearRect(){}})};
 const dialog={open:true};let current=true,mask={width:100,height:100};
 const args={mask,preview,dialog,isCurrent:()=>current,E:{pixels:()=>({width:100,height:100,outputWidth:100,outputHeight:100})},img:{src:'original',naturalWidth:100,naturalHeight:100},crop:{x:0,y:0,width:1,height:1},moveCrop:element(),erase:element(),restore:element(),frame:element(),maskMode:'brush',brushMode:'erase',choice:null,use:{},useLabel:{},status:{},dimensions:{},exportPhoto:()=> 'edit-'+(pending.length+1),Image:class{constructor(){pending.push(this);}}};
 const api=new Function(...Object.keys(args),source.slice(updateStart,end)+'\nreturn {update,clear:()=>{mask=null;},restore:()=>{mask={width:100,height:100};}};')(...Object.values(args));
 return {api,pending,frames,dialog,preview,lock:()=>{current=false;}};
}
test('masked crop preview rejects obsolete asynchronous image loads',()=>{
 const f=fixture(source);
 f.api.update();f.api.update();
 f.pending[1].onload();
 assert.equal(f.frames.at(-1),'edit-2');
 f.pending[0].onload();
 assert.equal(f.frames.at(-1),'edit-2');
 f.api.update();f.api.clear();f.api.update();f.api.restore();f.api.update();
 f.pending[3].onload();
 assert.equal(f.frames.at(-1),'edit-4');
 f.pending[2].onload();
 assert.equal(f.frames.at(-1),'edit-4');
 f.api.update();f.dialog.open=false;const closed=f.frames.length;f.pending[4].onload();assert.equal(f.frames.length,closed);
 f.dialog.open=true;f.api.update();f.lock();const locked=f.frames.length;f.pending[5].onload();assert.equal(f.frames.length,locked);
});
