// Layered cutout routing: experimental recommendations only, never a production auto-apply.
// The source is always retained. A clean CI run or a confident score is NOT mask ground truth.
const allowedCategories=new Set(['Dresses','Bottoms','Shoes']);
const allowedEvidence=new Set(['unmeasured','acceptable','poor']);

export function proposeCutoutRoute(result){
  if(!result||!allowedCategories.has(result.category)
    ||typeof result.personDetected!=='boolean'
    ||!Number.isFinite(result.semanticPixels)||result.semanticPixels<0
    ||!Number.isFinite(result.retentionRatio)||result.retentionRatio<0||result.retentionRatio>1
    ||!Number.isFinite(result.objectPixels)||result.objectPixels<0
    ||!Number.isFinite(result.retainedPixels)||result.retainedPixels<0
    ||result.retainedPixels>result.objectPixels
    ||(result.captureQuality!==undefined&&!allowedEvidence.has(result.captureQuality))
    ||(result.sourceVerified!==undefined&&result.sourceVerified!==true))
    throw Error('Invalid routing evidence');

  const base={candidate:'original-source',reason:'source-preserving-default',
    reviewOnly:true,productionAuthorized:false,cutoutQualityVerified:false,
    independentBoundaryAccuracyMeasured:false,phonePerformanceMeasured:false,
    additionalUserInteraction:false,originalSourcePreserved:true,
    layers:['verified-original','semantic-garment','object-foreground','candidate-quality-gates','safe-fallback']};

  // Never "enhance" an untrusted or visibly compromised source. Quality is
  // not inferred from remote CI images when real phone camera data is absent.
  if(result.captureQuality==='poor')return {...base,reason:'photo-quality-poor-preserve-original'};
  if(result.objectPixels===0)return {...base,reason:'object-foreground-empty-preserve-original'};

  // Clothing part recognition restricts a general object cutout, with body
  // veto and limited contour halo. Reject catastrophic category loss.
  if(result.category==='Dresses'&&result.personDetected){
    if(result.semanticPixels>=64&&result.retainedPixels>0&&
      result.retentionRatio>=.30&&result.retentionRatio<=.95){
      return {...base,candidate:'clothing-guided-hybrid',
        reason:'person-or-mannequin-needs-clothing-only-masking'};
    }
    return {...base,reason:'dress-segmentation-weak-preserve-original'};
  }
  // Coarse garment-part segmentation previously erased uppers and laces.
  // Use the object candidate for standalone shoe product scenes only.
  if(result.category==='Shoes'&&!result.personDetected)
    return {...base,candidate:'object-alpha-only',
      reason:'preserve-shoe-uppers-avoid-semantic-erosion'};

  // Jeans in cluttered/worn scenes have uncertain body discrimination.
  if(result.category==='Bottoms'&&result.personDetected)
    return {...base,reason:'bottoms-body-evidence-ambiguous-preserve-original'};
  if(result.category==='Bottoms'&&!result.personDetected
    &&result.semanticPixels>=64&&result.retentionRatio>=.8)
    return {...base,candidate:'object-alpha-only',
      reason:'standalone-bottoms-strong-foreground-keep-silhouette'};
  return {...base,reason:'ambiguous-scene-keep-original'};
}

export function summarizeCutoutRoutes(rows){
  if(!Array.isArray(rows)||!rows.length)throw Error('Missing routing results');
  const output=rows.map(row=>{
    const route=proposeCutoutRoute(row);
    return {id:row.id,category:row.category,candidate:route.candidate,
      reason:route.reason,needsIndependentReview:true};
  });
  const counts={original:0,object:0,hybrid:0};
  for(const r of output){
    if(r.candidate==='original-source')counts.original++;
    else if(r.candidate==='object-alpha-only')counts.object++;
    else counts.hybrid++;
  }
  return {status:'experimental-recommendations',cases:output,counts,
    productionAuthorized:false,accuracyPercentage:null,
    noAutomaticReplacementOfOriginal:true};
}
