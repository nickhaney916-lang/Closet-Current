import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const source=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
test('P90 donor installer refuses another source HEAD before any write',()=>{
 const dir=mkdtempSync(join(tmpdir(),'p90-'));
 try{
  execFileSync('git',['init',dir]);
  assert.throws(()=>execFileSync(process.execPath,['scripts/install-parallel90-viewer.mjs',dir],{stdio:'pipe'}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('P90 installer limits writes to disposable panel, showroom, source loader and exact controller only',()=>{
 const writes=[...source.matchAll(/writeFile\((\w+),s\)/g)].map(x=>x[1]);
 assert.deepEqual(writes,['panel','showroom','sourceViewer','sourceOutfitController','posedContact90']);
 assert.match(source,/assert.equal\(s.split\(a\).length,2/);
});
test('P90 context-loss listener is captured and removed on bridge disposal',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/addEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/removeEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/e.target\?\.id!=='outfit3D01Canvas'/);
});

test('P90 touch allows vertical page scrolling without disabling horizontal orbit',()=>{
 assert.match(source,/controls\.domElement\.style\.touchAction='pan-y'/);
 assert.match(source,/new OrbitControls\(camera,canvas\)/);
});
test('P90 a replacement WebGL canvas retains keyboard target and full instructions',()=>{
 assert.match(source,/fresh\.tabIndex=0;fresh\.setAttribute\('aria-label'/);
 assert.match(source,/canvas\.getAttribute\('aria-label'\)/);
});

test('P90 selected, freshly byte-attested top-source hint only removes unused public dress preparation',()=>{
 assert.ok(source.includes("nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.shirt"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 assert.ok(source.includes("if(dressOnly90&&shirtOnly90)throw Error"));
 assert.ok(source.includes("if(!shirtOnly90){"));
 assert.ok(source.includes("if(!sources.dress||!dressPiece"));
 assert.ok(source.includes("(sources?.dress==null&&sources?.bundles?.length===0)"));
 // An absent dress must not be forged using a placeholder source capability.
 assert.equal(source.includes("sourceSHA256:DRESS_SHA"),false);
});

test('P90 selects one original shirt research source only for verified saved board without bottom',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(bridge,/nativeBottomEmpty90:!Object\.hasOwn\(selected\.slots,'bottom'\)/);
 assert.ok(source.includes("nativeBottomEmpty90===true"));
 assert.ok(source.includes("if(singleShirtBundle90&&!shirtOnly90)throw Error"));
 assert.ok(source.includes("singleShirtBundle90?['public']:['public','second']"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 // Never change the default licensed-source path for selected bottoms/legacy.
 assert.equal(source.includes("for(const denim of ['public']){"),false);
});

test('P90 research presentation profiling only reports admitted numeric stages',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(source.includes('renderStages90:rendered?.renderStages90||null'));
 assert.ok(source.includes("const prepareStart90=performance.now()"));
 assert.ok(source.includes("const applyStart90=performance.now()"));
 assert.ok(source.includes("kind:'dress',prepareMs:0,applyMs:applyMs90"));
 assert.ok(source.includes("kind:decision.mode,prepareMs:prepareMs90,applyMs:applyMs90"));
 assert.match(bridge,/renderStages90:active\?data\.renderStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 real mesh renderer has exhaustive numeric read-only apply-stage diagnostics',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(source.includes("getState:()=>({startup90,applyStages90,kind:current,"));
 assert.ok(source.includes("let applyStages90=null;"));
 assert.ok(source.includes("const s=outfit.setOutfit(mode,candidate,options);"));
 assert.ok(source.includes("const fitted90=performance.now()"));
 assert.ok(source.includes("const sampling90=performance.now()"));
 assert.ok(source.includes("const reclaimed90=performance.now()"));
 assert.ok(source.includes("const finished90=performance.now()"));
 assert.ok(source.includes("sceneApplyStages90:view.applyStages90||null"));
 assert.match(bridge,/sceneApplyStages90:active\?data\.sceneApplyStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 M9 profiles exact 20 genuine-shirt construction stages with no dropped source calls',()=>{
 assert.match(source,/const sourceOutfitController=donor\+'\/research\/dress-mobile-01\/dress-outfit-controller\.mjs'/);
 assert.match(source,/shirtBuildStages90=Object\.freeze\(\{\.\.\.shirtClock90\}\)/);
 assert.match(source,/const timeShirt90=\(stage,run\)=>/);
 const labels=["attach","shoulders","cuffClearance","innerCuffs","cuffBridge","continuousFit","neckSeams","torsoDrape","panelsAndSleeves","shoulderTailor","shoulderCaps","shoulderContour","upperArm","collarRoll","rearRelief","crest","sleeveHang","sideFlow","shoulderFall","shoulderTop"];
 for(const name of labels)assert.ok(source.includes('timeShirt90(\\"'+name+'\\",()=>')||
  source.includes('timeShirt90("'+name+'",()=>'), 'source stage present '+name);
 assert.equal(labels.length,20);
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(bridge,/sceneShirtStages90:active\?data\.sceneShirtStages90\|\|null:null/);
 assert.match(bridge,/revokeChangedSource89\(\)/);
});

test('P90 pinned donor restores all five sources before every variant and final reset',()=>{
 const benchmark=readFileSync('scripts/benchmark-parallel90-startup.mjs','utf8');
 const command="run('git',['-C',donor,'restore','--','research/outfit-3d-01/research-panel.mjs','research/dress-mobile-01/dress-mobile-showroom.mjs','research/outfit-3d-01/source-true-viewer.mjs','research/dress-mobile-01/dress-outfit-controller.mjs','research/three-d-42/posed-contact.mjs']);";
 assert.equal(benchmark.split(command).length-1,2,
  'each paired variant and final rebuild must restore all five pinned PR541 originals');
 assert.ok(benchmark.includes("for(const variant of ['baseline','candidate','restored'])"));
 assert.match(benchmark,/P90_COMPARE_ONLY/);
});

test('P90 M10 attributes previously untimed original rig/pose/contact/release work',()=>{
 assert.ok(source.includes('M10 no-functional-change timing of previously unaccounted original pose'));
 for(const name of ['detachPrevious','poseSource','skeletonValidate','contactCreate','contactPose','contactFit','poseRestore','previousRelease'])
  assert.ok(source.includes("'"+name+"'"),'unmodified source operation still profiled: '+name);
 assert.ok(source.includes("if(!next.includes('shirt'))return run();"),
  'dress cannot falsely record shirt-only construction operations');
 assert.ok(source.includes("const skeletons=new Set();root.traverse"));
 assert.ok(source.includes("builtContact.fit(pose)"));
 assert.ok(source.includes("contact?.dispose();Object.values(parts).forEach(g=>g.dispose())"));
 assert.ok(source.includes("setResearchPose(root,pose)"));
 assert.ok(source.includes("shirtBuildStages90=Object.freeze({...shirtClock90})"));
});

test('P90 M11 reuses only authentic original body BVH inside candidate pose-contact fit',()=>{
 assert.match(source,/if\(startupVariant90==='candidate'\)\{/);
 assert.match(source,/const posedContact90=donor\+'\/research\/three-d-42\/posed-contact\.mjs'/);
 assert.ok(source.includes("bodyTree90||new MeshBVH(b)"));
 assert.ok(source.includes("bodyTree90=new MeshBVH(body.g)"));
 assert.ok(source.includes("triangleContacts(current.g,body.g,{collect:true,bodyTree90})"));
 assert.ok(source.includes("after=triangleContacts(current.g,body.g,{collect:true,bodyTree90})"));
 assert.match(source,/await writeFile\(posedContact90,s\)/);
 assert.ok(source.includes("const ba=new MeshBVH(a),bb=bodyTree90||new MeshBVH(b)"),
  'original garment BVH rebuilt per pass; body BVH reused only from unchanged pose');
 assert.ok(source.includes("for(let pass=0;pass<12;pass++)"),
  '12 original collision passes are NOT lowered');
 assert.ok(source.includes("if(!c.count)"),
  'real collision termination is NOT bypassed');
});

test('P90 M11 real collision scalar parity is owner gated and required by browser baseline',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const benchmark=readFileSync('scripts/benchmark-parallel90-startup.mjs','utf8');
 const switches=readFileSync('scripts/check-parallel90-saved-switch.mjs','utf8');
 const lifecycle=readFileSync('scripts/check-parallel90-interactions.mjs','utf8');
 assert.ok(source.includes("contactEvidence90:view.outfit?.shirt?.poseTriangleContact?{"));
 assert.match(bridge,/contactEvidence90:active\?data\.contactEvidence90\|\|null:null/);
 assert.ok(benchmark.includes("assert.deepEqual(rows[i].contactEvidence,original.contactEvidence"));
 for(const key of ['beforeCount','afterCount','steps','correctedVertices','maximumWorldCorrection'])
  assert.ok(switches.includes(key),'real source collision witness required: '+key);
 assert.ok(lifecycle.includes("contactEvidence90,null"));
});
