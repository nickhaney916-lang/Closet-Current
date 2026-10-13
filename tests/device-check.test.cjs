const test=require('node:test'),assert=require('node:assert/strict');
const {cleanDeviceEvent,cleanDeviceCheck,deviceCheckReport}=require('../public/device-check-engine.js');
test('diagnostic events discard photos, credentials, clothing names, and arbitrary error text',()=>{
 const e=cleanDeviceEvent('scanner_error',{stage:'runtime_import',code:'network',durationMs:20,image:'private photo',email:'private email',access_token:'private token',name:'private clothing name',message:'private error text'});assert.deepEqual(e,{type:'scanner_error',stage:'runtime_import',code:'network',durationMs:20});
});
test('reports contain only whitelisted manual results and bounded diagnostic events',()=>{
 const report=deviceCheckReport({enabled:true,userId:'private-user',steps:{recognition:'fail',login:'pass',unknown:'pass'},events:[null,...Array.from({length:50},()=>({type:'recognized_saved',durationMs:12,accountId:'private-user'}))]},'abc123abc123','Android');assert.deepEqual(report.steps,{login:'pass',recognition:'fail'});assert.equal(report.events.length,40);assert.ok(!JSON.stringify(report).includes('private-user'));assert.equal(report.appRelease,'abc123abc123');
});
test('unknown stages, errors, and events cannot inject arbitrary contents into a report',()=>{
 assert.equal(cleanDeviceEvent('custom private event',{}),null);assert.deepEqual(cleanDeviceEvent('scanner_error',{stage:'private stage',code:'private error'}),{type:'scanner_error'});assert.equal(deviceCheckReport(null,'private URL','private device').appRelease,'unavailable');assert.equal(deviceCheckReport(null,'','private device').platform,'Other');
});
test('recording defaults off and saved test states remain account-local data',()=>{
 assert.equal(cleanDeviceCheck(null).enabled,false);assert.equal(cleanDeviceCheck({enabled:'true'}).enabled,false);assert.equal(cleanDeviceCheck({enabled:true}).enabled,true);
});
test('worker error codes distinguish network, memory, runtime, and image problems without exposing messages',async()=>{
 const {scannerErrorCode}=await import('../public/scanner-errors.mjs');assert.equal(scannerErrorCode(Error('Failed to fetch private URL'),'model_download'),'network');assert.equal(scannerErrorCode(Error('memory allocation failure'),'identify'),'memory');assert.equal(scannerErrorCode(Error('unsupported wasm kernel'),'runtime_import'),'runtime');assert.equal(scannerErrorCode(Error('image decode failure'),'identify'),'image');
});

test('outfit capture diagnostics retain timing without photos or body information',()=>{
 const event=cleanDeviceEvent('outfit_split_ready',{durationMs:1123,image:'private-image',label:'private-label',face:'private-face',sourceId:'private-id'});
 assert.deepEqual(event,{type:'outfit_split_ready',durationMs:1123});assert.equal(cleanDeviceEvent('outfit_split_failed',{}).type,'outfit_split_failed');
});
