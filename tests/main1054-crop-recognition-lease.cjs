'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/photo-crop-editor.js'),'utf8');
function fixture(){
 const a=source.indexOf("check=button('Check recognition',"),b=source.indexOf(",cancel=button('Cancel'",a);
 const start=source.indexOf(" function setBusy(value)"),end=source.indexOf(" function exportPhoto()");
 assert.ok(a>=0&&b>a&&start>=0&&end>start);
 const controls=Array.from({length:8},()=>({disabled:false})),use={checked:true},useLabel={hidden:false},status={},dialog={open:true,isConnected:true};
 let resolve,reject,current=true;
 const pending=new Promise((r,j)=>{resolve=r;reject=j;});
 const args={button:(t,fn)=>({onclick:fn}),analyze:()=>pending,exportPhoto:()=> 'old-crop',isCurrent:()=>current,dialog,status,useLabel,use,reset:controls[0],cancel:controls[1],commit:controls[2],frame:{querySelectorAll:()=>[]},moveCrop:controls[3],erase:controls[4],restore:controls[5],clearMask:controls[6],brushInput:controls[7]};
 const api=new Function(...Object.keys(args),"let busy=false,savingCrop=false,choice=null,previewRevision=0;"+source.slice(start,end)+";const "+source.slice(a,b)+";return {check,revise:()=>{++previewRevision;choice=null;use.checked=false;useLabel.hidden=true;status.textContent='';},choice:()=>choice};")(...Object.values(args));
 return {api,controls,use,useLabel,status,dialog,resolve,reject,lock:()=>{current=false;}};
}
test('crop recognition locks all mask controls and rejects stale recognition',async()=>{
 const f=fixture(),work=f.api.check.onclick();
 assert.ok(f.controls.slice(3).every(x=>x.disabled));
 assert.equal(f.use.checked,false);assert.equal(f.useLabel.hidden,true);
 f.api.revise();f.resolve({category:'Old crop',details:{}});await work;
 assert.equal(f.api.choice(),null);assert.equal(f.useLabel.hidden,true);
 assert.ok(f.controls.every(x=>!x.disabled));
});
test('current crop recognition can still be reviewed, with controls restored',async()=>{
 const f=fixture(),work=f.api.check.onclick();f.resolve({category:'Top',itemType:'T-shirt',details:{}});await work;
 assert.equal(f.api.choice().category,'Top');assert.equal(f.useLabel.hidden,false);
 assert.equal(f.use.checked,false);assert.ok(f.controls.every(x=>!x.disabled));
});
test('closed or revoked crop does not retain returned recognition',async()=>{
 for(const invalidate of [f=>{f.dialog.open=false;},f=>f.lock()]){
  const f=fixture(),work=f.api.check.onclick();invalidate(f);f.resolve({category:'Old crop'});await work;
  assert.equal(f.api.choice(),null);assert.equal(f.useLabel.hidden,true);
 }
});
test('stale recognition rejection does not replace the revised crop status',async()=>{
 const f=fixture(),work=f.api.check.onclick();f.api.revise();f.reject(Error('old request'));await work;
 assert.equal(f.status.textContent,'');assert.ok(f.controls.every(x=>!x.disabled));
});
