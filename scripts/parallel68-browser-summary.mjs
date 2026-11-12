// Fail-closed aggregation of genuine DEV-only WASM evidence, no new inference.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=await readFile('research/parallel67-reference/fashionpedia/manifest.json'),manifest=JSON.parse(manifestBytes),truth=new Map(manifest.rows.map(x=>[x.id,x]));
const moduleSha256=sha(await readFile('research/parallel68/semantic-instances.mjs'));
const reports={},summary={format:'closet-current-parallel68-real-browser-dev-summary/v1',model:'Xenova/segformer_b0_clothes',revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',dtype:'fp32',moduleSha256,developmentManifestSha256:sha(manifestBytes),engines:{},totalActualInferences:48,physicalDeviceTests:false,validationOrSealedAcceptanceRead:false,notFlorenceSam2BrowserAcceptance:true,notFullApplicationOrPrivateClosetAcceptance:true,notAnnotationAccuracyMeasurement:true,modelCorrectnessCannotBeInferredFromCounts:true,browserPeakMemoryMeasured:false,remoteColdNetworkStartupMeasured:false,sourceImageUploads:false,automaticSave:false,allResultsRequireReview:true};
const signature=r=>JSON.stringify([r.baseline.map(x=>x.originalResolutionMaskSha256),r.candidate.map(x=>x.originalResolutionMaskSha256)]);
for(const engine of ['chromium','webkit']){
 const x=JSON.parse(await readFile('research/parallel68/results/browser-'+engine+'-dev8.json'));
 if(x.moduleSha256!==moduleSha256||x.developmentManifestSha256!==summary.developmentManifestSha256||x.physicalDevice!==false||x.networkViolations.length||x.pageErrors.length||x.rows.length!==24||x.model!==summary.model||x.revision!==summary.revision||x.dtype!=='fp32')throw Error('Invalid/incomplete actual browser evidence');
 if(summary.modelSha256&&summary.modelSha256!==x.modelSha256)throw Error('Different model bytes');summary.modelSha256=x.modelSha256;summary.modelBytes=x.modelBytes;
 const seen=new Set(),perOriginal={};
 for(const r of x.rows){
  const source=truth.get(r.id),key=r.viewportWidth+'/'+r.id;
  if(!source||r.sha256!==source.sha256||r.width!==source.width||r.height!==source.height||seen.has(key)||![320,390,430].includes(r.viewportWidth)||r.type!=='result'||r.automaticSave!==false||r.requiresReview!==true||!Number.isFinite(r.elapsedMs))throw Error('Missing/mutated original or unsafe result');seen.add(key);
  if(perOriginal[r.id]&&perOriginal[r.id].signature!==signature(r))throw Error('Mask signatures changed with viewport');
  perOriginal[r.id]={baselineInstances:r.baseline.length,candidateInstances:r.candidate.length,signature:signature(r),maskHashesStableAcrossViewportContexts:true};
 }
 if(Object.keys(perOriginal).length!==8||x.views.some(v=>v.width!==v.contentWidth))throw Error('Missing sources or viewport overflow');
 const times=x.rows.map(r=>r.elapsedMs).sort((a,b)=>a-b);
 summary.engines[engine]={browserVersion:x.browserVersion,actualInferences:24,sources:8,viewportWidths:[320,390,430],loadMs:x.loads,inferenceMs:{median:(times[11]+times[12])/2,p95:times[22]},perOriginal:Object.fromEntries(Object.entries(perOriginal).map(([id,v])=>{const {signature,...rest}=v;return [id,rest]})),instancesPerViewport:{baseline:Object.values(perOriginal).reduce((s,v)=>s+v.baselineInstances,0),candidate:Object.values(perOriginal).reduce((s,v)=>s+v.candidateInstances,0)},networkViolations:0,pageErrors:0};
 reports[engine]=x;
}
summary.crossEngineOriginalResolutionMaskHashParitySources=manifest.rows.filter(source=>signature(reports.chromium.rows.find(r=>r.id===source.id))===signature(reports.webkit.rows.find(r=>r.id===source.id))).map(x=>x.id);
summary.rootlessLocalWebkitLaunch={systemPackagesChanged:false,wrapper:'/tmp/p68-webkit-wrapper.sh',extractedLibraries:'/tmp/p68-webkit-deps/usr/lib/x86_64-linux-gnu',note:'Local Debian13 accommodation only; standard Playwright install --with-deps is preferred on CI hosts.'};
await writeFile('research/parallel68/results/browser-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log('P68_GENUINE_BROWSER_DEV_EVIDENCE',JSON.stringify({actualInferences:48,engines:Object.fromEntries(Object.entries(summary.engines).map(([k,v])=>[k,{version:v.browserVersion,medianMs:v.inferenceMs.median,p95Ms:v.inferenceMs.p95,instances:v.instancesPerViewport}])),crossEngineFullMaskHashParity:summary.crossEngineOriginalResolutionMaskHashParitySources.length,physicalDevices:false,automaticSave:false}));
