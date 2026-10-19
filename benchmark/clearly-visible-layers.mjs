// Conservative visible-layer decision: deliberate photo vs full-outfit capture.
// Research policy only, NOT imported into Closet Current's app.
// Never infer a sweater from an unseen collar or duplicate foreground boxes.
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const allowedCoat=new Set(['Coat','Jacket','Raincoat','Blazer']);
const allowedTop=new Set(['Sweater','Sweatshirt','Hoodie']);
const ratio=(a,b)=>a/Math.max(1,b);

function parseEvidence(x,sourceSha256,width,height){
  if(!x||!['Outerwear','Tops'].includes(x.category)
     ||typeof x.id!=='string'||!x.id||x.id.length>128
     ||x.sourceSha256!==sourceSha256
     ||!Number.isFinite(x.confidence)||x.confidence<0||x.confidence>1
     ||!ArrayBuffer.isView(x.mask)||x.mask.length!==width*height)
    throw Error('Invalid visible-garment mask identity');
  const permitted=x.category==='Outerwear'?allowedCoat:allowedTop;
  if(!permitted.has(x.itemType))throw Error('Unsupported or guessed garment type');
  let pixels=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let i=0;i<x.mask.length;i++){
    const v=x.mask[i];
    if(v!==0&&v!==1&&v!==255)throw Error('Invalid binary garment mask');
    if(!v)continue;
    pixels++;
    minX=Math.min(minX,i%width);maxX=Math.max(maxX,i%width);
    minY=Math.min(minY,Math.floor(i/width));maxY=Math.max(maxY,Math.floor(i/width));
  }
  return {...x,pixels,bounds:pixels?{minX,minY,maxX,maxY}:null};
}
export function evaluateClearlyVisibleLayers({
  sourceSha256,captureMode,width,height,coat,sweater
}){
  if(!sha(sourceSha256)||!['single-item','full-outfit'].includes(captureMode)
    ||!Number.isInteger(width)||!Number.isInteger(height)
    ||width<8||height<8||width*height>1_000_000)
    throw Error('Invalid visible-layer capture context');
  const base={status:'single-intent-only',suggestedCategories:['Outerwear'],
    reason:'only-photograph-intended-foreground',
    canAutoSaveSecondItem:false,secondItemVerified:false,
    noNewConfirmationUI:true,originalSourcePreserved:true,
    productionAuthorized:false,requiresIndependentMaskReview:true};
  // In deliberate single-item capture, the exposed shirt belongs in another
  // deliberate photo, even if a background model claims to see it.
  if(captureMode==='single-item')return base;
  if(!coat)return {...base,reason:'no-primary-outerwear-evidence'};
  const outer=parseEvidence(coat,sourceSha256,width,height);
  if(outer.category!=='Outerwear'||outer.pixels===0||outer.confidence<.78)
    return {...base,reason:'primary-coat-evidence-insufficient'};
  if(!sweater)return {...base,reason:'no-separate-visible-sweater'};
  const inner=parseEvidence(sweater,sourceSha256,width,height);
  if(inner.category!=='Tops'||inner.id===outer.id||inner.pixels===0||inner.confidence<.78)
    return {...base,reason:'no-reliable-second-clothing-instance'};

  // Nearly identical object masks are multiple labels for the same garment.
  let shared=0;for(let i=0;i<inner.mask.length;i++)if(inner.mask[i]&&outer.mask[i])shared++;
  if(ratio(shared,Math.min(inner.pixels,outer.pixels))>.025)
    return {...base,reason:'coat-and-sweater-claims-overlapping-pixels'};

  // The sweater must be substantially EXPOSED in the coat's central torso.
  // A collar / cuff glimpse is insufficient. Area gates are initial research
  // heuristics, not measured acceptance thresholds and cannot auto-save.
  const b=outer.bounds,spanX=b.maxX-b.minX+1,spanY=b.maxY-b.minY+1;
  const left=b.minX+spanX*.25,right=b.minX+spanX*.75;
  const top=b.minY+spanY*.24,bottom=b.minY+spanY*.78;
  let center=0;
  for(let i=0;i<inner.mask.length;i++){
    if(!inner.mask[i])continue;
    const x=i%width,y=Math.floor(i/width);
    if(x>=left&&x<right&&y>=top&&y<bottom)center++;
  }
  const exposureRatio=ratio(inner.pixels,outer.pixels);
  const centerFraction=ratio(center,inner.pixels);
  const torsoVisibility=ratio(center,outer.pixels);
  const measurements={exposureRatio,centerFraction,torsoVisibility,
    overlapShare:ratio(shared,Math.min(inner.pixels,outer.pixels))};
  if(exposureRatio<.10||centerFraction<.35||torsoVisibility<.035)
    return {...base,reason:'only-small-collar-cuff-or-ambiguous-sweater-visible',measurements};
  return {...base,status:'candidate-only-visible-pair',
    reason:'two-substantial-visible-regions-need-real-mask-validation',
    suggestedCategories:['Outerwear','Tops'],suggestedTypes:[coat.itemType,sweater.itemType],
    measurements,canAutoSaveSecondItem:false,secondItemVerified:false,
    // This is a testable *policy* for future validated models, not a release.
    requiresIndependentMaskReview:true
  };
}
