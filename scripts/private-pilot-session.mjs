// Supplemental fixed-status self-report. Never hardware, accuracy, or deployment proof.
export const sections=Object.freeze({
 staging:[
  ['separateSite','Owner approved an independent staging site and empty Supabase project; no paid resources or live customer data.'],
  ['access','Cloudflare Access denies signed-out requests on every staging hostname, preview alias, page and script; an allowed tester can enter.'],
  ['backend','Generated bundle uses only the separate staging Supabase URL and public key; known Closet Current and Drive Duel endpoints are absent.'],
  ['permissions','Reviewed local migration safeguards, two-account RLS, private storage, revision races and failed-save recovery all pass.'],
  ['auth','Separate staging Auth is enabled with exact HTTPS callback/redirect allowlists; no production or wildcard redirects.'],
  ['email','Real confirmation and password-reset emails return only to protected staging; account switching and sign-out work.'],
  ['artifact','Immutable staging artifact passes integrity checks: no symlinks, locks, orphan output, credentials or unexpected backend references.'],
  ['approval','Owner reviewed all evidence and separately authorized restricted pilot access. This form never authorizes upload or deployment.']
 ],
 phone:[
  ['capture','Add clothes: use the rear camera at highest available resolution. Compare fine fabric detail with the untouched original; record failure if blurred or downsized unexpectedly.'],
  ['modes','Take photos manually, then Hands-free photos every 5 seconds. Stop capture, deny/reallow permission, rotate and background/resume without losing items.'],
  ['original','Device help → original-photo diagnostic: confirm recognition and color use the full-resolution original before clipping/masking; inspect original versus isolated preview. Use source guard evidence too—appearance alone cannot prove ordering.'],
  ['isolation','Photograph one garment against a contrasting background. Inspect edges, retained shoes/straps, proposed category and color; Adjust must preserve the original.'],
  ['outfitPhoto','Whole outfit: include top, jacket, bottom and shoes. Review every detected piece; no missing pieces, merged garments or duplicates. Correct ambiguous pieces explicitly.'],
  ['save','Save the reviewed clothes. Reopen Closet and confirm categories, colors, sharp originals and isolated previews remain usable.'],
  ['cloud','My account must show Cloud backup up to date. On a second approved test session restore the same synthetic wardrobe; compare originals and items. Never delete the only copy to simulate restore.'],
  ['style','Home → Style new clothes, photograph a new piece, save it and tap Style this. Check generated outfits use that piece and existing owned wardrobe items.'],
  ['recovery','With synthetic items only: interrupt connectivity during save, reconnect, reopen and verify no silent loss, duplication or cross-account data. Export a local backup first.'],
  ['report','Device help: finish and export its anonymous phone report; export original-photo diagnostics and saved-closet audits on the same app build for the canonical reviewer.']
 ],
 recognition:[
  ['blindLabels','Independent reviewer labels the untouched original BEFORE seeing suggestions, crops or saved labels, using Device help → original-photo diagnostic. Lock those labels; uncertain subtype stays unknown.'],
  ['shoes','Test sneakers, ankle/tall boots and sandals where available: shoe category, appropriate subtype, paired shoes versus duplicate items, true original color, intact toes/heels.'],
  ['dresses','Test a casual and longer dress: one dress rather than separate top/skirt; distinguish jumpsuit or romper; retain hem and sleeves.'],
  ['shortsSkirts','Test shorts and skirt separately, including similar colors and loose silhouettes. Require visible leg openings for shorts; do not infer subtype from a crop alone.'],
  ['jackets','Test jacket over a top and alone: outerwear versus shirt/cardigan, preserve sleeves, separate visible layers, avoid duplicates.'],
  ['colors','Compare predicted and saved color to the untouched original under daylight and indoor light. Do not use the mask background as garment color.'],
  ['multiple','For a whole-outfit original, independently count and label visible garments, then compare detections, categories, colors, omissions and duplicates.'],
  ['savedAudit','Independently inspect actual saved items on Android and iPhone using saved-closet audit; export anonymous audit JSON. Model suggestions are not saved-item accuracy.']
 ]
});
export const statuses=Object.freeze(['unknown','pass','fail','blocked']);
const deny=()=>{throw new Error('Unsupported private-pilot report. Use only this kit’s fixed-status JSON; private fields and unsupported evidence are rejected.');};
const exact=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==[...keys].sort().join('|'))deny();};
export function blankSession(){return {format:'closet-current-private-pilot-session',version:1,kind:'supplemental-self-report-only',platform:'unselected',appRelease:'unavailable',checks:Object.fromEntries(Object.entries(sections).map(([s,rows])=>[s,Object.fromEntries(rows.map(([id])=>[id,'unknown']))])),physicalHardwareVerified:false,independentRecognitionVerified:false,recognitionAccuracy:null,permittedToDeploy:false,productionReleaseApproved:false,sendAutomatically:false};}
export function validateSession(value){
 const blank=blankSession();exact(value,Object.keys(blank));
 for(const key of Object.keys(blank).filter(k=>!['checks','platform','appRelease'].includes(k)))if(value[key]!==blank[key])deny();
 if(!['unselected','Android','iPhone'].includes(value.platform)||!(value.appRelease==='unavailable'||/^[a-f0-9]{12}$/.test(value.appRelease)))deny();
 exact(value.checks,Object.keys(sections));
 for(const [section,rows] of Object.entries(sections)){exact(value.checks[section],rows.map(([id])=>id));for(const [id] of rows)if(!statuses.includes(value.checks[section][id]))deny();}
 return JSON.parse(JSON.stringify(value));
}
export function parseSession(text){if(typeof text!=='string'||text.length>65536)deny();let value;try{value=JSON.parse(text);}catch{deny();}return validateSession(value);}
export function summarizeSession(value){const report=validateSession(value);return {sections:Object.fromEntries(Object.entries(report.checks).map(([name,checks])=>{const values=Object.values(checks);return [name,{pass:values.filter(s=>s==='pass').length,total:values.length,fail:values.filter(s=>s==='fail').length,blocked:values.filter(s=>s==='blocked').length,unknown:values.filter(s=>s==='unknown').length,selfReportedCompletionPercent:Math.floor(100*values.filter(s=>s==='pass').length/values.length)}];})),physicalHardwareVerified:false,independentRecognitionVerified:false,recognitionAccuracy:null,permittedToDeploy:false,productionPromotion:'BLOCKED'};}
