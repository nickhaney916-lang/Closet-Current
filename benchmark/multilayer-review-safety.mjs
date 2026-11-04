// Diagnostic-only selection of review previews from known, benchmark-labelled scenes.
// Do not use human-provided benchmark categories to claim automatic recognition accuracy.
const SLOT=Object.freeze({
  Tops:'upper',Outerwear:'upper',Skirt:'skirt',Skirts:'skirt',
  Dresses:'dress',Pants:'pants-or-shorts',Shorts:'pants-or-shorts',Shoes:'shoes'
});
export function evaluateMultiGarmentReview({
  expected,personDetected,parts,objectPixels,mode='benchmark-verified-source'
}){
  if(mode!=='benchmark-verified-source'||!Array.isArray(expected)||!expected.length
    ||expected.some(e=>!SLOT[e])||typeof personDetected!=='boolean'
    ||!Array.isArray(parts)||!Number.isFinite(objectPixels)||objectPixels<0)
      throw Error('Untrusted or incomplete benchmark review inputs');
  const distinctExpected=new Set(expected.map(e=>SLOT[e]));
  const detected=new Set();
  for(const p of parts){
    if(!p||!['upper','skirt','pants-or-shorts','dress','shoes'].includes(p.slot)
      ||detected.has(p.slot)||!Number.isFinite(p.retainedPixels)
      ||!Number.isFinite(p.objectPixels)||p.objectPixels<0||p.retainedPixels<0
      ||p.retainedPixels>p.objectPixels)throw Error('Invalid or repeated mask part');
    detected.add(p.slot);
  }
  const missing=expected.filter(e=>!detected.has(SLOT[e]));
  const unexpected=[...detected].filter(slot=>!distinctExpected.has(slot));
  const ambiguous=expected.includes('Tops')&&expected.includes('Outerwear') ||
    expected.includes('Pants')&&expected.includes('Shorts');
  const base={recommendedPreview:'original-source',reason:'unresolved-garment-evidence',
    missingExpected:missing,unverifiedExtraRegions:unexpected,sharedClassAmbiguity:ambiguous,
    originalPreserved:true,automaticCatalogApproved:false,productionAuthorized:false,
    independentPixelAccuracyMeasured:false,humanReviewRequired:true,
    benchmarkLabelUsedForSafetyOnly:true};
  if(missing.length)return {...base,reason:'missing-expected-garment'};
  if(ambiguous)return {...base,reason:'different-garments-share-semantic-class'};
  if(objectPixels===0)return {...base,reason:'no-object-cutout'};
  // A no-person product scene can be reviewed using the less-destructive
  // object cutout; this is a preview recommendation, not proof it is clean.
  if(!personDetected&&expected.length===1)
    return {...base,recommendedPreview:'object-alpha-only',
      reason:'standalone-object-preview-preserves-fabric'};
  // Never isolate multiple expected garments from one foreground mask merely
  // because it contains all of their pixels.
  if(expected.length>1)return {...base,reason:'multi-item-separation-not-verified'};
  const target=parts.find(p=>distinctExpected.has(p.slot));
  if(personDetected && target && !unexpected.length &&
    target.retainedPixels/Math.max(1,target.objectPixels)>=.30)
    return {...base,recommendedPreview:'clothing-guided-hybrid',
      reason:'person-present-garment-guided-preview-needs-review'};
  return base;
}
