/** Score frozen independent source color labels without laundering review into
 * accuracy. These are predominant-object source labels, not per-mask truth. */
const LABELS={white:'White',black:'Black',grey:'Gray',red:'Red',blue:'Blue',brown:'Brown',green:'Green',yellow:'Yellow',pink:'Pink',orange:'Orange',purple:'Purple',beige:'Beige',multicoloured:'Multicolor'};
export function scoreColorReference68(manifest,measurements){
 if(!manifest?.rows?.length||manifest.schema!=='closet-current-parallel68-human-validated-color-object-reference/v1'||!Array.isArray(measurements)||measurements.length!==manifest.rows.length)throw Error('Incomplete frozen color reference');
 const expected=new Map(manifest.rows.map(row=>[row.id,row]));if(expected.size!==manifest.rows.length)throw Error('Duplicate human source identity');
 const seen=new Set(),rows=[];
 for(const sample of measurements){
  const truth=expected.get(sample.id);if(!truth||seen.has(sample.id)||sample.sha256!==truth.sha256||truth.humanValidated!==true||truth.labelModified!==false)throw Error('Altered/missing independent color source');seen.add(sample.id);
  if(!Object.hasOwn(LABELS,truth.humanColor)||!Array.isArray(truth.humanAnnotations)||truth.humanAnnotations.length!==1)throw Error('Unsupported or unranked human color truth');
  const result=sample.result;if(!result||result.verified!==false||result.requiresReview!==true||result.automaticColorSaveAllowed!==false)throw Error('Unverified color escaped manual review');
  if(sample.maskSha256!==null&&!/^[a-f0-9]{64}$/.test(sample.maskSha256||''))throw Error('Missing actual mask provenance');
  const predicted=result.color||null,expectedColor=LABELS[truth.humanColor],correct=predicted===expectedColor;
  rows.push({id:sample.id,sha256:sample.sha256,expectedColor,predictedColor:predicted,correct,abstained:predicted===null,requiresReview:true,maskSha256:sample.maskSha256,reason:result.reason,offWhiteShade:result.shade||null});
 }
 const labeled=rows.filter(x=>!x.abstained),correct=rows.filter(x=>x.correct).length;
 const perColor=Object.fromEntries([...new Set(rows.map(x=>x.expectedColor))].map(color=>{const group=rows.filter(x=>x.expectedColor===color);return [color,{correct:group.filter(x=>x.correct).length,total:group.length,abstained:group.filter(x=>x.abstained).length}];}));
 return {schema:'closet-current-parallel68-color-reference-score/v1',split:manifest.split,total:rows.length,correctIncludingAbstentionsAsNotCorrect:correct,agreement:correct/rows.length,predicted:labeled.length,abstained:rows.length-labeled.length,coverage:labeled.length/rows.length,agreementAmongProposals:labeled.length?correct/labeled.length:null,perColor,rows,allReviewRequired:true,automaticColorSaved:0,scope:'predominant-object human-color agreement; NOT per-instance primary-color acceptance on overlapping outfits',offWhiteAccuracy:'unavailable',representative95PercentTargetProven:false};
}
