// Desktop Linux Chromium/WebKit instrumentation smoke test.
// This does NOT load FashionCLIP/SigLIP or prove physical phone memory usage.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {snapshotBrowserProcessTree} from '../research/master-consolidation-1054/browser-process-memory.mjs';

for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  let server,client,context;
  try{
    server=await browserType.launchServer({
      headless:true,args:name==='chromium'?['--no-sandbox']:[]
    });
    client=await browserType.connect(server.wsEndpoint());
    context=await client.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.goto('data:text/html,<title>HOLD no deployment</title>');
    await page.evaluate(()=>document.body.textContent='synthetic memory instrumentation');
    const rootPid=server.process()?.pid;
    const sample=snapshotBrowserProcessTree(rootPid);
    assert.ok(sample?.measured,name+' Linux browser root /proc memory inaccessible');
    assert.ok(sample.rootRSSBytes>0);
    assert.ok(sample.processCount>=1);
    assert.ok(sample.summedTreeRSSBytes===null||sample.summedTreeRSSBytes>=sample.rootRSSBytes);
    // Missing smaps_rollup must stay null, never guessed from RSS.
    if(!sample.pssComplete)assert.equal(sample.proportionalTreePSSBytes,null);
    const receipt={
      engine:name,browser:'desktop Linux disposable',sampled:true,
      rootRSSBytes:sample.rootRSSBytes,
      summedTreeRSSBytes:sample.summedTreeRSSBytes,
      proportionalTreePSSBytes:sample.proportionalTreePSSBytes,
      pssComplete:sample.pssComplete,processCount:sample.processCount,
      genuineModelInference:false,physicalIPhone:false,releaseReady:false,
      familyAlpha:'HOLD'
    };
    assert.doesNotMatch(JSON.stringify(receipt),/"pid"|"ppid"|token|photoBytes/i);
    console.log('MAIN1054_MEMORY_BROWSER_SMOKE',JSON.stringify(receipt));
  }finally{
    try{await context?.close();}catch{}
    try{await client?.close();}catch{}
    try{await server?.close();}catch{}
  }
}
