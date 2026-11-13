/** Research-only cross-family interface. No persistence or owner approval capabilities. */
import {localCandidates} from './local-catalog.mjs';
export const VERSION81 = 'p81-cross-model-v1';
export const MODELS81 = Object.freeze({
  fashionclip: Object.freeze({id:'ff13/fashion-clip', revision:'0f99955d944c39bfd9d035a02ac273c7a44a406b', family:'clip', license:'MIT'}),
  fashionSiglip: Object.freeze({id:'Marqo/marqo-fashionSigLIP', revision:'782eaf7a0b95411ac96893d2300d1a61a2bcb757', family:'siglip', license:'Apache-2.0'}),
});
const sha = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const text = x => typeof x === 'string' && x.length > 0 && x.length <= 160;
const keys = ['sourceSha256','inputSha256','ownerSession','photoRevision','cropRevision','maskRevision','unitRevision','instanceId'];
const fail = reason => { throw Error('P81_'+reason); };
function binding81(b) {
  if (!b || !sha(b.sourceSha256) || !sha(b.inputSha256) || keys.some(k=>!text(b[k]))) fail('BINDING');
  return Object.fromEntries(keys.map(k=>[k,b[k]]));
}
const identical = (a,b) => keys.every(k=>a[k]===b[k]);
function rank81(scores) {
  if (!Array.isArray(scores) || scores.length!==localCandidates.length || new Set(scores.map(x=>x.label)).size!==scores.length) fail('INCOMPLETE_VOCABULARY');
  const catalog = new Map(localCandidates.map(x=>[x.label,x]));
  if(scores.some(x=>!catalog.has(x.label)||!Number.isFinite(x.score))) fail('INVALID_RANKING');
  return scores.map(x=>({...catalog.get(x.label),score:x.score})).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
}
/** Adapter takes observed complete ranks; declared provenance is checked against pinned registry.
 * It cannot authenticate an external caller's claim that an inference actually occurred.
 * Promotion therefore also requires independent scorer custody outside this module.
 */
export function observation81({modelKey,binding,scores,workerSourceSha256,vectorSha256,latencyMs}) {
  if(!Object.hasOwn(MODELS81,modelKey)||!sha(workerSourceSha256)||!sha(vectorSha256)||!Number.isFinite(latencyMs)||latencyMs<0) fail('PROVENANCE');
  return {version:VERSION81,modelKey,model:{...MODELS81[modelKey]},binding:binding81(binding),workerSourceSha256,vectorSha256,latencyMs,ranking:rank81(scores)};
}
function validate81(o,b) {
  const registered = MODELS81[o?.modelKey];
  if(o?.version!==VERSION81||!registered||Object.keys(registered).some(k=>registered[k]!==o.model?.[k])) fail('MODEL_REVISION');
  const checked = observation81({...o,scores:o.ranking});
  if(!identical(checked.binding,b)) fail('STALE_OR_DIFFERENT_SOURCE');
  return checked;
}
/** Each instance must have independently bound input pixels. Whole-frame ranks cannot be
 * copied to segmented instances. Regions and footwear remain proposals, never new items.
 * Same-family views supply stability evidence, not extra ensemble votes.
 */
export function arbitrate81({binding,observations,qualityFlags=[]}) {
  const b=binding81(binding);
  if(!Array.isArray(observations)||observations.length>8||!Array.isArray(qualityFlags)||qualityFlags.some(x=>!text(x))) fail('INPUT');
  const rows=observations.map(o=>validate81(o,b));
  const families=new Map();
  for(const row of rows){const group=families.get(row.model.family)||[];group.push(row);families.set(row.model.family,group);}
  const reasons=[];
  if(families.size<2) reasons.push('independent_model_missing');
  if(qualityFlags.length) reasons.push('quality_or_region_unverified');
  if(!rows.length) reasons.push('no_model_output');
  const tops=rows.map(x=>x.ranking[0]);
  const categorySet=new Set(tops.map(x=>x.category)), typeSet=new Set(tops.map(x=>x.itemType));
  if(categorySet.size>1) reasons.push('category_disagreement');
  if(typeSet.size>1) reasons.push('subtype_disagreement');
  if(tops.some(x=>x.category==='Uncategorized')) reasons.push('nonclothing_evidence');
  if(rows.some(x=>x.ranking[0].score===x.ranking[1].score)) reasons.push('top_rank_tied');
  // Rank fusion is only for displaying alternatives; NEVER average cosine and softmax scores.
  const hints=localCandidates.map(c=>({...c,rankSupport:[...families.values()].reduce((sum,group)=>sum+Math.min(...group.map(r=>1/(1+r.ranking.findIndex(x=>x.label===c.label)))),0)/Math.max(1,families.size)}))
    .sort((a,b)=>b.rankSupport-a.rankSupport||a.label.localeCompare(b.label)).slice(0,4);
  const supported=reasons.length===0;
  return {version:VERSION81,binding:b,status:supported?'cross_family_hypothesis':'abstain',
    category:supported?tops[0].category:'Uncategorized',itemType:'Unknown',
    hypotheses:rows.length?hints:[],reasons,independentFamilies:families.size,
    requiresOwnerConfirmation:true,automaticallyCertified:false,admissionAllowed:false,
    color:'Unknown',footwearPairing:'owner_review_required',
    modelEvidence:rows.map(x=>({model:x.model,workerSourceSha256:x.workerSourceSha256,vectorSha256:x.vectorSha256,latencyMs:x.latencyMs}))};
}
export function arbitrateInstances81(instances) {
  if(!Array.isArray(instances)||instances.length>32) fail('INSTANCES');
  const ids=new Set();
  const source=instances.length?binding81(instances[0].binding):null;
  return instances.map(x=>{const b=binding81(x.binding);if(['sourceSha256','ownerSession','photoRevision','unitRevision'].some(k=>b[k]!==source[k]))fail('MIXED_PHOTO_OR_OWNER');if(ids.has(b.instanceId))fail('DUPLICATE_INSTANCE');ids.add(b.instanceId);return arbitrate81(x);});
}
