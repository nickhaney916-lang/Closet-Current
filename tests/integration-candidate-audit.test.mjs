import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyScope,validateSnapshot,expectedHarness,SNAPSHOT} from '../scripts/audit-integration-candidate.mjs';
const snapshot=JSON.parse(fs.readFileSync(SNAPSHOT,'utf8'));
test('browser race adjustment keeps stale-image and eventual recovery assertions byte-exact',()=>{
 const current=fs.readFileSync('scripts/test-style-my-new-item-mobile.mjs','utf8');
 const adjustment=" // A background board refresh may already have started the current preview.\n // Observe and activate Retry in one browser turn instead of waiting forever\n // for a control that correctly becomes hidden during/successful recovery.\n await page.evaluate(()=>{\n  const retry=document.querySelector('#reusableFigureRetry');\n  if(!retry.hidden)retry.click();\n });";
 const prior=current.replace(adjustment," await page.locator('#reusableFigureRetry').click();");
 // A frozen hash independently binds all prior harness assertions, even in
 // the inherited shallow-checkout Node workflow (which lacks old Git objects).
 assert.equal(createHash('sha256').update(prior).digest('hex'),'60b51c751591b5f12643b8c8a5b9a2015b1c9016be13462f7990e53f285d0e27');
 assert.equal(current,expectedHarness(prior));
 assert.match(current,/assert.equal\(await page.locator\('#reusableFigureGarments img'\).count\(\),0\)/);
 assert.match(current,/try\{await page.waitForFunction\(\(\)=>document.querySelectorAll\('#reusableFigureGarments img'\).length===1\)/);
});
test('CI evidence for another commit cannot be credited to an integrated source',()=>{
 const s=structuredClone(snapshot);s.pulls.find(p=>p.ci?.length).ci[0].headSha='0'.repeat(40);
 assert.throws(()=>validateSnapshot(s),/exact PR head/);
});
test('duplicate and truncated source inventories fail closed',()=>{
 const s=structuredClone(snapshot);s.pulls[1]=s.pulls[0];assert.throws(()=>validateSnapshot(s),/Duplicate/);
 s.pulls.pop();assert.throws(()=>validateSnapshot(s),/100/);
});
function fixture(fn){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'closet-audit-test-'));
 const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);};
 try{
  git('init','-q');git('config','user.name','Synthetic test');git('config','user.email','test@example.invalid');
  write('public/local-worker.mjs','original RGB before masking');write('docs/PROGRESS-CHECKPOINT.md','prior evidence\n');
  git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
  fn({root,git,write,base});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('committed and uncommitted recognition edits are refused',()=>fixture(({root,git,write,base})=>{
 write('public/local-worker.mjs','unapproved model');assert.throws(()=>verifyScope(root,base),/working change/);
 git('add','.');git('commit','-qm','bad model');assert.throws(()=>verifyScope(root,base),/tree change/);
}));
test('deleting or changing mode of source code is refused',()=>fixture(({root,git,base})=>{
 fs.chmodSync(path.join(root,'public/local-worker.mjs'),0o755);assert.throws(()=>verifyScope(root,base),/working change/);
 git('checkout','--','.');fs.unlinkSync(path.join(root,'public/local-worker.mjs'));
 assert.throws(()=>verifyScope(root,base),/working change/);
}));
test('historical checkpoint rewrite is refused even if the latest note looks valid',()=>fixture(({root,write,base})=>{
 write('docs/PROGRESS-CHECKPOINT.md','new claim\nrewritten evidence\n');
 assert.throws(()=>verifyScope(root,base),/rewrites history/);
}));
test('untracked runtime injection is refused',()=>fixture(({root,write,base})=>{
 write('public/injected.js','unexpected');assert.throws(()=>verifyScope(root,base),/untracked/);
}));
test('only explicit new audit files and prepended evidence are permitted',()=>fixture(({root,git,write,base})=>{
 write('docs/audit.md','read only audit');write('docs/PROGRESS-CHECKPOINT.md','new audit\nprior evidence\n');
 git('add','.');git('commit','-qm','audit');
 assert.equal(verifyScope(root,base,'HEAD',new Set(['docs/audit.md'])).checkpointHistoryPreserved,true);
}));
test('an audit file symlink cannot replace an ordinary reviewed addition',()=>fixture(({root,git,base})=>{
 fs.symlinkSync('../public/local-worker.mjs',path.join(root,'docs/audit.md'));
 git('add','.');git('commit','-qm','bad symlink');
 assert.throws(()=>verifyScope(root,base,'HEAD',new Set(['docs/audit.md'])),/regular files/);
}));
