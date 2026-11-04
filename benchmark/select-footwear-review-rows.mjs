// Select a few high-priority rows for legible image labels. Review only.
export function selectSilhouetteReviewRows(profile,{maxRows=8,minSeparation=14}={}){
 if(!profile||!Array.isArray(profile.abruptRows)||!Number.isInteger(maxRows)||maxRows<1||maxRows>30||!Number.isFinite(minSeparation)||minSeparation<0)throw Error('Invalid silhouette review profile/options');
 const sorted=profile.abruptRows.map(row=>{
  if(!Number.isInteger(row.y)||row.y<0||![row.centerShiftFraction,row.spanChangeFraction].every(Number.isFinite))throw Error('Invalid silhouette row');
  return {...row,severity:Math.max(Math.abs(row.centerShiftFraction)/.03,Math.abs(row.spanChangeFraction)/.1)};
 }).sort((a,b)=>b.severity-a.severity||a.y-b.y);
 const selected=[];
 for(const row of sorted){
  if(selected.every(earlier=>Math.abs(earlier.y-row.y)>=minSeparation))selected.push(row);
  if(selected.length===maxRows)break;
 }
 return selected.sort((a,b)=>a.y-b.y);
}
