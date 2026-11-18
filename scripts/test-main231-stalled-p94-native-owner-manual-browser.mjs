/**
 * MAIN231 - Native app response to a model asset request which never settles.
 * Research-only controlled negative. This is NOT a real positive model pass,
 * not a simulation of a genuine ORT memory-access exception, and not a cure.
 * The app and original P94 Worker remain unmodified. The live route stalls
 * ONLY the PUBLIC licensed model's ONNX request. Manual review is explicit.
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
const networkEntry="  if(req.method()==='GET'&&(lib||hub||weights)){";
assert.equal(derived.split(networkEntry).length,2,'pinned model route moved');
const hold="let heldModelGateResolve;\n"+
 "const heldModelGate=new Promise(resolve=>{heldModelGateResolve=resolve;});\n"+
 "const heldRequests=[];\nlet heldONNXCount=0;\n";
const counters="const external=[],rejected=[],issues=[],modelResponses=[];";
assert.equal(derived.split(counters).length,2,'original model egress counters moved');
derived=derived.replace(counters,counters+'\n'+hold);
const injection=networkEntry+'\n'+
 "   if(hub&&url.pathname.endsWith('.onnx')){\n"+
 "    heldONNXCount++;heldModelGateResolve();\n"+
 "    heldRequests.push(route);\n"+
 "    return new Promise(resolve=>{route.__m231Resolve=resolve;});\n"+
 "   }";
derived=derived.replace(networkEntry,injection);
const tail=[
 " stage='owner-original P94 genuine public model ONNX request deliberately held';",
 " await page.evaluate(()=>switchView('scan'));",
 " await page.locator('#captureOutfit').click();",
 " await page.locator('#outfitUpload').setInputFiles({name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:file});",
 " await page.waitForFunction(expected=>window.multi24Research?.debug().sourceSHA256===expected,sha,{timeout:45000});",
 " const guard=new Promise((_,reject)=>setTimeout(()=>reject(Error('M231 genuine ONNX model request never reached')),90000));",
 " await Promise.race([heldModelGate,guard]);",
 " assert.ok(heldONNXCount>0,'the original P94 model weights were not requested');",
 " assert.ok(actualWorkerPaths94.includes('/public/outfit-worker-p94.mjs'));",
 " assert.equal(await page.evaluate(()=>window.multi24Research?.debug().working),true);",
 " assert.equal(await countRows(page),0,'model stall silently wrote unverified garments');",
 " assert.equal(await page.locator('#multi24Grid .multi24-card').count(),0,'stalled model invented review proposals');",
 " stage='owner clicks real Stop AI while original model session is unresolved';",
 " await page.getByRole('button',{name:'Stop AI; keep manual review'}).click();",
 " await page.waitForFunction(()=>{const x=window.multi24Research?.debug();return x&&!x.working&&/Automatic detection stopped by you/.test(document.getElementById('multi24Status')?.textContent||'');},null,{timeout:15000});",
 " assert.equal(await page.locator('#multi24Research .multi24-source').getAttribute('src'),'data:image/jpeg;base64,'+file.toString('base64'),'original immutable JPEG lost on stop');",
 " assert.equal(await page.evaluate(()=>window.multi24Research.debug().sourceSHA256),sha);",
 " assert.equal(await countRows(page),0,'Stop AI auto-saved a garment');",
 " assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);",
 " assert.equal(await page.locator('#outfit3D01Canvas').count(),0);",
 " stage='manual actual crop and explicit review after stopping unresolved model';",
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
 " assert.deepEqual(issues,[],'native browser error on stalled model owner fallback');",
 " console.log('M231_STALLED_PUBLIC_ONNX_OWNER_MANUAL_RECOVERY_PASS',JSON.stringify({engine,width,controlledModelRequestHeld:heldONNXCount,originalSourcePreserved:true,ownerExplicitManualSave:true,privateSaved:1,noAutoSave:true,noFitted3D:true,realInstalledWorker:true,originalModelPositive:false,webKitRootRepair:false,physicalPhone:false,hostedRLS:false,hold:true}));",
 " for(const route of heldRequests){try{await route.abort();}catch{}route.__m231Resolve?.();}",
 " await context.close();",
 "}catch(error){",
 " console.error('M231_STALL_NEGATIVE_FAIL',JSON.stringify({stage,error:String(error?.message||error).slice(0,280),heldONNXCount,issues:issues.slice(0,4)}));",
 " process.exitCode=1;",
 "}finally{",
 " for(const route of heldRequests){try{await route.abort();}catch{}route.__m231Resolve?.();}",
 " await browser?.close();await new Promise(resolve=>server.close(resolve));",
 "}"
].join('\n')+'\n';
derived+=tail;
const path=resolve('scripts/.m231-real-owner-stall-negative.mjs');
try{
 await writeFile(path,derived,{flag:'wx'});
 const engine=process.env.M58_ENGINE||'webkit',width=process.env.P94_WIDTH||'430';
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok(['320','390','430'].includes(width));
 const p=spawnSync(process.execPath,[path],{env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width},stdio:'inherit',timeout:8*60*1000});
 if(p.error)throw p.error;
 assert.equal(p.status,0,'real native owner stall/manual fallback failed');
}finally{await rm(path,{force:true});}
