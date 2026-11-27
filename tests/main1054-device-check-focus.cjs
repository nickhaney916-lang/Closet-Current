'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const source=load('device-check.js'),engine=load('device-check-engine.js');
async function fixture(source,engine){
 let active=null,read,written=null;
 const elements=new Map(),listeners={};
 function node(tag,text){
  return {tag,textContent:text||'',children:[],attrs:{},hidden:false,disabled:false,
   append(...x){this.children.push(...x);},
   replaceChildren(){const contains=(parent,child)=>parent===child||parent.children.some(x=>contains(x,child));if(active&&contains(this,active))active=null;this.children=[];},
   setAttribute(name,value){this.attrs[name]=value;},focus(){active=this;}};
 }
 const $=id=>{if(!elements.has(id))elements.set(id,node('div'));return elements.get(id);};
 const db={transaction(name,mode){const tx={objectStore(){return mode==='readwrite'?{put(value){written=JSON.parse(JSON.stringify(value));Promise.resolve().then(()=>tx.oncomplete());}}:{get(){read={result:null};return read;}};}};return tx;}};
 const ctx={window:{addEventListener:(name,fn)=>listeners[name]=fn},db,closetReady:Promise.resolve(),$,node,queued:work=>work(),setTimeout:()=>1,clearTimeout(){},confirm:()=>true};
 new Function(...Object.keys(ctx),engine+'\n'+source)(...Object.values(ctx));
 for(let i=0;i<8;i++)await Promise.resolve();read.onsuccess();for(let i=0;i<8;i++)await Promise.resolve();
 const row=$('deviceCheckSteps').children[0],pass=row.children[2].children[0],fail=row.children[2].children[1];
 pass.focus();await pass.onclick();
 const afterPass={focus:active===pass,sameRow:$('deviceCheckSteps').children[0]===row,pressed:pass.attrs['aria-pressed']==='true'&&fail.attrs['aria-pressed']==='false',saved:written?.steps?.login==='pass',summary:$('deviceCheckSummary').textContent.includes('1 of')};
 const currentRow=$('deviceCheckSteps').children[0],currentFail=currentRow.children[2].children[1],currentPass=currentRow.children[2].children[0];
 currentFail.focus();await currentFail.onclick();
 const afterFail={focus:active===currentFail,sameRow:$('deviceCheckSteps').children[0]===currentRow,pressed:currentFail.attrs['aria-pressed']==='true'&&currentPass.attrs['aria-pressed']==='false',saved:written?.steps?.login==='fail',summary:$('deviceCheckSummary').textContent.includes('1 need attention')};
 return {afterPass,afterFail};
}
test('manual device checks retain focused controls, update pressed state and persist both choices',async()=>{
 const result=await fixture(source,engine);
 for(const [choice,checks] of Object.entries(result))for(const [name,passed]of Object.entries(checks))assert.equal(passed,true,choice+' '+name);
});
