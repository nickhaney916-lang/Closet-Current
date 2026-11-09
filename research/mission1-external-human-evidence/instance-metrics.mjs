/** Diagnostic matching at model-raster resolution; not COCO AP or unseen acceptance. */
export function scoreInstances({truth,predictions,width,height,iouThreshold=.5}){
 const n=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||n>512*512||!Number.isFinite(iouThreshold)||iouThreshold<=0||iouThreshold>1)throw Error('Invalid instance raster or threshold');
 const validate=rows=>{
  if(!Array.isArray(rows)||rows.length>128)throw Error('Invalid instance collection');
  const ids=new Set();
  for(const row of rows){
   if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id)||![4,5,6,7,9].includes(row.region)||!Array.isArray(row.mask)||row.mask.length!==n||row.mask.some(x=>x!==0&&x!==1)||!row.mask.some(Boolean))throw Error('Invalid or empty instance');
   ids.add(row.id);
  }
 };
 validate(truth);validate(predictions);
 const overlaps=truth.map(t=>predictions.map(p=>{
  if(t.region!==p.region)return 0;
  let intersection=0,union=0;
  for(let i=0;i<n;i++){intersection+=t.mask[i]&p.mask[i];union+=t.mask[i]|p.mask[i];}
  return intersection/union;
 }));
 const assigned=new Map();
 function augment(t,seen){
  const eligible=predictions.map((_,p)=>p).filter(p=>overlaps[t][p]>=iouThreshold).sort((a,b)=>overlaps[t][b]-overlaps[t][a]||a-b);
  for(const p of eligible){if(seen.has(p))continue;seen.add(p);
   if(!assigned.has(p)||augment(assigned.get(p),seen)){assigned.set(p,t);return true;}
  }
  return false;
 }
 for(let t=0;t<truth.length;t++)augment(t,new Set());
 const matches=Array.from(assigned,([p,t])=>({truthId:truth[t].id,predictionId:predictions[p].id,region:truth[t].region,iou:overlaps[t][p]}));
 const tp=matches.length,fp=predictions.length-tp,fn=truth.length-tp;
 return {truthInstances:truth.length,predictedInstances:predictions.length,truePositives:tp,falsePositives:fp,falseNegatives:fn,
  precision:predictions.length?tp/predictions.length:null,recall:truth.length?tp/truth.length:null,
  f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null,iouThreshold,matches,
  missedTruthIds:truth.filter(t=>!matches.some(m=>m.truthId===t.id)).map(t=>t.id),
  unmatchedPredictionIds:predictions.filter(p=>!assigned.has(predictions.indexOf(p))).map(p=>p.id)};
}
