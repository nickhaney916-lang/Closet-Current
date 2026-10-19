// Experimental provenance and alpha-confidence preflight for *real* model
// comparisons. Raw model differences cannot establish garment accuracy.
// A binary threshold-128 mask is NOT the >=224 raw-alpha evidence needed by
// the isolated source-resolution agreement experiment.
import {compareCutoutMasks} from './object-cutout-mask.mjs';

const MODNET='Xenova/modnet';
const BIREFNET='onnx-community/BiRefNet_lite-ONNX';
const PINNED_REVISION='de15b22ba131738a16dff04aab8bdf8dc32e3ac1';
const isSha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function inspectLockedSecondModelEvidence(entry,baseline,candidate,{
 minimumAlphaThreshold=224
}={}){
 if(!entry||!/^commons-[0-9]{4}$/.test(entry.id)||
  entry.image!==entry.id+'.jpg'||!isSha(entry.sourceSha256)||
  !Number.isInteger(minimumAlphaThreshold)||
  minimumAlphaThreshold<192||minimumAlphaThreshold>255)
  throw Error('Invalid locked source entry or confidence requirement');
 if(!baseline||!candidate||baseline.image!==entry.image||candidate.image!==entry.image||
  baseline.sourceSha256!==entry.sourceSha256||candidate.sourceSha256!==entry.sourceSha256)
  throw Error('Source identity or SHA-256 does not match locked photo');
 if(baseline.model!==MODNET||candidate.modelId!==BIREFNET||
  candidate.revision!==PINNED_REVISION||baseline.model===candidate.modelId)
  throw Error('Wrong, unpinned or non-distinct model provenance');
 if(!Number.isInteger(candidate.foregroundThreshold)||
  candidate.foregroundThreshold<1||candidate.foregroundThreshold>255)
  throw Error('Candidate threshold evidence missing');
 const delta=compareCutoutMasks(baseline,candidate);
 const meetsRequestedAlphaThreshold=candidate.foregroundThreshold>=minimumAlphaThreshold;
 return {id:entry.id,image:entry.image,sourceSha256:entry.sourceSha256,
  primaryModel:MODNET,secondaryModel:BIREFNET,
  pinnedCandidateRevision:PINNED_REVISION,
  modelMetadataConsistent:true,
  // Model provenance is claimed by the producing script; an arbitrary JSON
  // cannot cryptographically prove which network ran.
  modelComputationIndependentlyVerified:false,
  candidateBinaryThreshold:candidate.foregroundThreshold,
  minimumRequiredAlphaThreshold:minimumAlphaThreshold,
  meetsRequestedAlphaThreshold,
  status:meetsRequestedAlphaThreshold?'eligible-for-experimental-input-only':
   'blocked-weak-binary-alpha-evidence',
  maskDifferences:delta,
  fullAlphaConfidenceAvailable:false,
  garmentAccuracyMeasured:false,
  backgroundRemovalVerified:false,
  noCustomerModelChange:true,productionAuthorized:false};
}
export function summarizeLockedEdgeReadiness(manifest,baselines,candidates){
 if(manifest?.schemaVersion!==1||manifest.cases?.length!==6||
    !(baselines instanceof Map)||!(candidates instanceof Map)||
    baselines.size!==6||candidates.size!==6)
  throw Error('Expected six locked real-photo model comparisons');
 const cases=manifest.cases.map(entry=>
  inspectLockedSecondModelEvidence(entry,baselines.get(entry.id),candidates.get(entry.id)));
 const qualifying=cases.filter(c=>c.meetsRequestedAlphaThreshold).length;
 const references=manifest.cases.filter(x=>x.reviewStatus==='approved'&&x.referenceMask).length;
 return {status:qualifying===cases.length&&references===cases.length?
  'experimental-evidence-only-awaiting-independent-scoring':'blocked-incomplete-confidence-or-human-references',
  cases,photos:cases.length,highConfidenceMaskCases:qualifying,
  independentlyApprovedReferenceCases:references,
  accuracyMeasured:false,liveEdgeRecoveryEnabled:false,productionAuthorized:false};
}
