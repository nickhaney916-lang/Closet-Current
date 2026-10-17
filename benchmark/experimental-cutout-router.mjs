// Experimental internal route recommendation, not automatic app processing.
// Conservative fallback ALWAYS retains the verified source for recognition.
export function proposeCutoutRoute(result){
  if(!result||!['Dresses','Bottoms','Shoes'].includes(result.category)
    ||typeof result.personDetected!=='boolean'
    ||!Number.isFinite(result.semanticPixels)||result.semanticPixels<0
    ||!Number.isFinite(result.retentionRatio)||result.retentionRatio<0||result.retentionRatio>1
    ||!Number.isFinite(result.objectPixels)||result.objectPixels<0
    ||!Number.isFinite(result.retainedPixels)||result.retainedPixels<0
    ||result.retainedPixels>result.objectPixels)throw Error('Invalid routing evidence');
  const base={candidate:'original-source',reason:'source-preserving-default',
    productionAuthorized:false,cutoutQualityVerified:false,additionalUserInteraction:false};
  if(result.category==='Dresses'&&result.personDetected){
    if(result.semanticPixels>=64&&result.retentionRatio>=.3&&result.retentionRatio<=.95){
      return {...base,candidate:'clothing-guided-hybrid',reason:'body-removal-potential-needs-visual-review'};
    }
    return {...base,reason:'dress-segmentation-weak-preserve-original'};
  }
  if(result.category==='Shoes'&&!result.personDetected&&result.objectPixels>0){
    return {...base,candidate:'object-alpha-only',reason:'semantic-hybrid-can-drop-shoe-uppers'};
  }
  if(result.category==='Bottoms'&&result.personDetected){
    return {...base,reason:'person-or-mannequin-near-bottoms-avoid-ungrounded-cutout'};
  }
  return base;
}
