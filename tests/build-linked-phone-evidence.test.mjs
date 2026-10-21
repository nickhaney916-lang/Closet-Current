import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {linkedPhoneHTML,writeLinkedPhoneHTML} from '../scripts/build-linked-phone-evidence.mjs';
test('offline single-file reviewer compiles without external network dependencies',()=>{
 const page=linkedPhoneHTML(),script=page.match(/<script>([\s\S]*)<\/script>/)?.[1];
 assert.ok(script);new vm.Script(script);
 assert.match(page,/connect-src &#39;none&#39;/);
 assert.doesNotMatch(page,/<script[^>]+src=|<img[^>]+src=|fetch\(|localStorage|sessionStorage/);
 for(const word of ['initial model','actually saved','original','offline','24 phone scenes'])
  assert.ok(page.toLowerCase().includes(word.toLowerCase()),word);
});
test('worksheet never overwrites previous local results',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc-phone-trial-'));
 try{const name=path.join(root,'private','TRIAL.html');
  const r=writeLinkedPhoneHTML(name);assert.equal(r.networkRequests,0);
  assert.ok(fs.readFileSync(name,'utf8').includes('closet-current-linked-phone-original-trials'));
  assert.throws(()=>writeLinkedPhoneHTML(name),{code:'EEXIST'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
