// Adapt the existing full synthetic import/atomic/favorites journey to the
// photo-only UI. All authentication, cloud and classifier calls remain mocked.
import {readFile,writeFile,rm} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {resolve,join} from 'node:path';import assert from 'node:assert/strict';
let s=await readFile('scripts/test-family-alpha-34-browser.mjs','utf8');
function once(a,b){assert.equal(s.split(a).length,2,'Upstream browser contract changed: '+a.slice(0,70));s=s.replace(a,b);}
once("resolve('dist-family-alpha-34-storage-HOLD')","resolve('dist-work43-photo-board-HOLD')");
const start=s.indexOf('   for(let i=0;i<3;i++){'),end=s.indexOf('   const first=panel.locator',start);assert.ok(start>=0&&end>start);
s=s.slice(0,start)+`   await panel.locator('.alpha29-options article').nth(2).locator('.work42-board').waitFor();
   for(let i=0;i<3;i++){
    const article=panel.locator('.alpha29-options article').nth(i);
    await article.locator('.work42-board').waitFor();
    assert.equal(await article.locator('.work42-grid img').count(),3);
    assert.match(await article.locator('.work42-board p').innerText(),/not a virtual try-on/);
    assert.equal(await article.locator('.family-alpha-avatar').count(),0);
    if(i===0){await mkdir('benchmark/work43',{recursive:true});await article.screenshot({path:'benchmark/work43/'+name.toLowerCase()+'-'+width+'-synthetic-photo-board.png'});}
   }
`+s.slice(end);
once("await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();await panel.getByRole('button',{name:'Save outfit 1',exact:true}).click();", "await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();await panel.locator('.alpha29-options article').nth(2).locator('.work42-board').waitFor();await panel.getByRole('button',{name:'Save outfit 1',exact:true}).click();");
once("reviewedAvatars:3", "photoBoards:3");once("refinedFaceVisible:refinedOnly", "refinedFaceVisible:false");
const p=join('scripts','.work43-browser-generated.mjs');try{await writeFile(p,s);const r=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',timeout:300000,maxBuffer:8e6,env:{...process.env,CLOSET_35_OFFLINE:'1'}});if(r.error)throw r.error;if(r.status!==0)throw Error('Photo board full workflow failed '+r.status);}finally{await rm(p,{force:true});}
