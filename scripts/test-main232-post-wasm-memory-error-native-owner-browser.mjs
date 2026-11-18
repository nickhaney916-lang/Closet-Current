/**
 * M232 - Adversarial post-WASM RuntimeError owner/private source safety.
 * Research-only controlled post-WASM fault; NOT a true original model failure,
 * NOT a permanent WebKit fix or reproduction of ORT's actual memory fault.
 * The app and original P94 Worker files are unchanged. A disposable Worker
 * injects one bounded test-only RuntimeError after native WASM instantiation.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const source=await readFile('scripts/test-parallel94-native-p88-browser.mjs','utf8');
const sha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(sha(Buffer.from(source)),'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'immutable original native source-positive test changed');
const marker="stage='genuine worker original JPEG and live SegFormer';";
assert.equal(source.split(marker).length,2,'original authenticated app entry anchor changed');
let derived=source.split(marker)[0];
const workerBytes=await readFile('public/outfit-worker-p94.mjs');
assert.equal(sha(workerBytes),'d66651b616de54c51eb7ef986324b30f1580888f','original installed P94 Worker moved');
const prelude="// M232 disposable source-derived Worker; test ONLY, not a real crash or positive model result.\nlet m232WasmReady=false,m232PostReadyGrow=0,m232FaultSent=false;\nconst m232NativeInstantiate=WebAssembly.instantiateStreaming;\nWebAssembly.instantiateStreaming=function(...args){\n const r=Reflect.apply(m232NativeInstantiate,WebAssembly,args);\n if(r&&typeof r.then==='function')r.then(()=>{m232WasmReady=true;},()=>{});\n return r;\n};\nconst m232NativeGrow=WebAssembly.Memory.prototype.grow;\nWebAssembly.Memory.prototype.grow=function(...args){\n if(m232WasmReady&&!m232FaultSent&&++m232PostReadyGrow===2){\n  m232FaultSent=true;\n  self.postMessage({type:'m232-fault',phase:'after-native-wasm',faultKind:'synthetic-memory-access'});\n  throw new WebAssembly.RuntimeError('memory access out of bounds');\n }\n return Reflect.apply(m232NativeGrow,this,args);\n};\n";
const workerSourceRead="  const body=await readFile(absolute);";
assert.equal(derived.split(workerSourceRead).length,2,'original P94 static server source changed');
derived=derived.replace(workerSourceRead,
"  const bytes=await readFile(absolute);\n  const body=path==='/public/outfit-worker-p94.mjs'?Buffer.concat([Buffer.from("+JSON.stringify(prelude)+",'utf8'),bytes]):bytes;");
const originalPage=" const page=await context.newPage();";
assert.equal(derived.split(originalPage).length,2,'P94 main owner page anchor moved');
const passive=[
 " await context.addInitScript(()=>{",
 "  window.__m232FaultCount=0;",
 "  const BaseWorker=window.Worker;",
 "  window.Worker=class extends BaseWorker {",
 "   constructor(...args){super(...args);",
 "    this.addEventListener('message',e=>{",
 "     if(e.data?.type==='m232-fault'&&e.data?.phase==='after-native-wasm')window.__m232FaultCount++;",
 "    });",
 "   }",
 "  };",
 " });",
].join('\n')+'\n';
derived=derived.replace(originalPage,passive+originalPage);
const tail=[
 " stage='owner-original P94 synthetic post-WASM memory-access fault';",
 " await page.evaluate(()=>switchView('scan'));",
 " await page.locator('#captureOutfit').click();",
 " await page.locator('#outfitUpload').setInputFiles({name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:file});",
 " await page.waitForFunction(expected=>window.multi24Research?.debug().sourceSHA256===expected,sha,{timeout:45000});",
 " await page.waitForFunction(()=>window.__m232FaultCount===1&&/Automatic extraction unavailable/.test(document.getElementById('multi24Status')?.textContent||''),null,{timeout:90000});",
 " assert.ok(actualWorkerPaths94.includes('/public/outfit-worker-p94.mjs'),'P94 Worker never launched before injected fault');",
 " assert.equal(await page.evaluate(()=>window.__m232FaultCount),1,'post-WASM synthetic fault not exercised once');",
 " assert.ok(external.some(x=>x.type==='pinned-model-hub'),'original public model/ONNX never reached');",
 " assert.equal(await page.evaluate(()=>window.multi24Research?.debug().working),false);",
 " assert.equal(await countRows(page),0,'synthetic WASM memory trap silently wrote garments');",
 " assert.equal(await page.locator('#multi24Grid .multi24-card').count(),0,'memory trap produced unverified review cards');",
 " stage='owner automatic P94_model_load failure with zero private writes';",

 " assert.equal(await page.locator('#multi24Research .multi24-source').getAttribute('src'),'data:image/jpeg;base64,'+file.toString('base64'),'original immutable JPEG lost on memory trap');",
 " assert.equal(await page.evaluate(()=>window.multi24Research.debug().sourceSHA256),sha);",
 " assert.equal(await countRows(page),0,'WebKit memory trap auto-saved a garment');",
 " assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);",
 " assert.equal(await page.locator('#outfit3D01Canvas').count(),0);",
 " stage='manual actual crop and explicit review after post-WASM RuntimeError';",
 " await page.getByRole('button',{name:'Add missed piece'}).click();",
 " const manual=page.locator('#multi24Grid .multi24-card[data-review-tier=\"manual\"]').last();",
 " await manual.waitFor({timeout:15000});",
 " await manual.getByRole('button',{name:'Adjust crop/mask'}).click();",
 " const crop=page.locator('dialog.photo-crop-editor');",
 " await crop.waitFor({state:'visible',timeout:15000});",
 " await crop.getByRole('button',{name:'Save crop'}).click();",
 " await crop.waitFor({state:'hidden',timeout:15000});",
 " await manual.getByLabel('Main category').selectOption('Tops');",
 " await manual.getByLabel('Specific type').selectOption('T-shirt');",
 " await manual.getByLabel('Color (confirm visually)').fill('Blue');",
 " await manual.getByLabel('I confirm this visible garment, category and color').check();",
 " assert.equal(await countRows(page),0,'manual crop/label was saved without confirmation gesture');",
 " await page.getByRole('button',{name:'Save confirmed pieces together'}).click();",
 " await page.waitForFunction(()=>/saved together with the original photo SHA-256/.test(document.getElementById('multi24Status')?.textContent||''),null,{timeout:45000});",
 " const saved=await page.evaluate(()=>new Promise((resolve,reject)=>{const req=db.transaction('items','readonly').objectStore('items').getAll();req.onsuccess=()=>resolve(req.result.map(r=>({ownerId:r.ownerId,sourceSHA256:r.sourceSHA256,original:r.originalPhoto?.image,threeDReady:r.threeDReady,photoOnly:r.photoOnly})));req.onerror=()=>reject(req.error);}));",
 " assert.equal(saved.length,1);assert.equal(saved[0].ownerId,'m58-A');",
 " assert.equal(saved[0].sourceSHA256,sha);",
 " assert.equal(saved[0].original,'data:image/jpeg;base64,'+file.toString('base64'));",
 " assert.equal(saved[0].threeDReady,false);assert.equal(saved[0].photoOnly,true);",
 " assert.equal(await page.locator('#outfit3D01Canvas').count(),0);",
 " assert.deepEqual(rejected,[],'unexpected third-party request');",
 " assert.deepEqual(issues,[],'native browser error after synthetic post-WASM memory failure');",
 " console.log('M232_POST_WASM_MEMORY_TRAP_OWNER_MANUAL_RECOVERY_PASS',JSON.stringify({engine,width,testOnlyInjectedMemoryAccess:true,afterNativeWasm:true,originalSourcePreserved:true,ownerExplicitManualSave:true,privateSaved:1,noAutoSave:true,noFitted3D:true,originalWorkerUnmodifiedOnDisk:true,instrumentedWorker:true,originalModelPositive:false,webKitRootRepair:false,physicalPhone:false,hostedRLS:false,hold:true}));",
 " await context.close();",
 "}catch(error){",
 " console.error('M232_TEST_NEGATIVE_FAIL',JSON.stringify({stage,error:String(error?.message||error).slice(0,280),issues:issues.slice(0,4)}));",
 " process.exitCode=1;",
 "}finally{",
 " await browser?.close();await new Promise(resolve=>server.close(resolve));",
 "}"
].join('\n')+'\n';
derived+=tail;
const path=resolve('scripts/.m232-real-owner-wasm-memory-negative.mjs');
try{
 await writeFile(path,derived,{flag:'wx'});
 const engine=process.env.M58_ENGINE||'webkit',width=process.env.P94_WIDTH||'430';
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(['320','390','430'].includes(width));
 const p=spawnSync(process.execPath,[path],{env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width},stdio:'inherit',timeout:8*60*1000});
 if(p.error)throw p.error;
 assert.equal(p.status,0,'real native owner post-WASM RuntimeError/manual fallback failed');
}finally{await rm(path,{force:true});}
