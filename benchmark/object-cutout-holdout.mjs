// Experimental selection and reporting only. Recognition category labels are NOT mask ground truth.
export const HOLDOUT_IDS=Object.freeze([
  'validation-0001', // dress: outdoor scene
  'validation-0003', // dress: museum display
  'validation-0010', // dress with visible underlying layer
  'validation-0017', // jeans
  'validation-0019', // sneaker: studio
  'validation-0023', // high-top sneaker
  'validation-0024', // metallic sneaker
]);
export function selectHoldoutPhotos(rows,ids=HOLDOUT_IDS,comparisonIds=[]){
  if(!Array.isArray(rows)||!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Invalid or duplicate holdout identifiers');
  const originals=new Set(comparisonIds),index=new Map();
  for(const row of rows){
    if(!row||!row.id||index.has(row.id))throw Error('Invalid or duplicate source manifest ID');
    index.set(row.id,row);
  }
  return ids.map(id=>{
    const item=index.get(id);
    if(!item||originals.has(id)||item.verified!==true||item.id!==id
      ||!/^validation-[0-9]{4}\.jpg$/.test(item.image)
      ||!/^[a-f0-9]{64}$/.test(item.sha256)
      ||!item.attribution?.license||!item.attribution?.source
      ||!item.conditions?.includes('fresh-independent-validation'))throw Error('Unverified, overlapping, or incomplete holdout photo: '+id);
    return item;
  });
}
export function holdoutReport({cases,modelId,revision,loadMs,status='running'}){
  if(!['running','complete'].includes(status)||!Array.isArray(cases)||!modelId||!revision)throw Error('Invalid experiment report');
  return {
    status,dataset:'fresh-independent-photos',modelId,revision,
    loadMs,environment:'node-cpu-fp32',comparison:'original-versus-candidate',
    maskGroundTruthAvailable:false,pixelAccuracyMeasured:false,
    recognitionLabelsAreNotMasks:true,phonePerformanceMeasured:false,
    noProductionChanges:true,humanBoundaryReviewRequired:true,
    sourceRgbPreserved:true,alphaThreshold:128,cases
  };
}
