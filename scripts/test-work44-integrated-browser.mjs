// Reuse the exact Work43 integration journey against source-pinned parent and
// style-only candidate. Licensed tests use the same generated recommendations,
// not hand-assembled looks. Photos and account/classifier data are test fixtures.
import {readFile,writeFile,rm,mkdir} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {join,resolve} from 'node:path';import assert from 'node:assert/strict';
const input=await readFile('scripts/test-work43-full-browser.mjs','utf8');
for(const [mode,licensed] of [['before',true],['after',true],['after-synthetic',false]]){
 let s=input;const replace=(a,b)=>{assert.equal(s.split(a).length,2,'Upstream test changed: '+a.slice(0,100));s=s.replace(a,b);};
 if(mode!=='before')replace("resolve('dist-work43-photo-board-HOLD')","resolve('dist-work44-visual-board-HOLD')");
 s=s.replaceAll('benchmark/work43','benchmark/work44-'+mode);
 replace('if(i===0){await mkdir(', 'if(true){await mkdir(');
 replace("+width+'-synthetic-photo-board.png'", "+width+'-look-'+(i+1)+'-synthetic-photo-board.png'");
 if(licensed)replace('once("for(const width of [320,390,430])", "for(const width of [390])");','once("for(const width of [320,390,430])", "for(const width of [320,390,430])");');
 const path=join('scripts','.work44-generated.mjs');try{await mkdir('benchmark/work44-'+mode,{recursive:true});await writeFile(path,s);const r=spawnSync(process.execPath,[resolve(path)],{stdio:'inherit',timeout:600000,maxBuffer:8e6,env:{...process.env,WORK43_LICENSED:licensed?'1':'0'}});if(r.error)throw r.error;if(r.status!==0)throw Error('Work44 '+mode+' browser journey failed: '+r.status);}finally{await rm(path,{force:true});}
}
console.log('WORK44_COMPLETE_PHOTO_BOARD_BROWSER_PASS');
