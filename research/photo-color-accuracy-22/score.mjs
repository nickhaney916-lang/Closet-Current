function totals(rows,arm){
 const s={evaluable:0,correct:0,incorrect:0,missing:0,correctAccepted:0,wrongAccepted:0,reviewOnly:0,multicolor:0,multicolorCorrect:0};
 for(const row of rows){
  if(!row.color)continue;
  s.evaluable++;
  const {estimate,accepted}=row[arm];
  const match=estimate?.color===row.color;
  if(!estimate)s.missing++;
  else if(match)s.correct++;
  else s.incorrect++;
  if(accepted){if(accepted===row.color)s.correctAccepted++;else s.wrongAccepted++;}
  else if(estimate)s.reviewOnly++;
  if(row.color==='Multicolor'){s.multicolor++;if(match)s.multicolorCorrect++;}
 }
 return s;
}
export function score(registry,engines){
 const summary={},slices={};
 const annotated=new Map(registry.map(row=>[row.id,row]));
 const arms=['baseline','updated'];
 for(const [engine,results] of Object.entries(engines)){
  const rows=results.map(r=>({...annotated.get(r.id),...r}));
  summary[engine]={};
  slices[engine]={};
  for(const arm of arms){
   summary[engine][arm]={all:totals(rows,arm),development:totals(rows.filter(r=>r.split==='development'),arm),
    holdout:totals(rows.filter(r=>r.split==='holdout'),arm)};
   slices[engine][arm]={};
   for(const field of ['category','color','condition','inputKind']){
    const groups=[...new Set(rows.map(r=>r[field]).filter(Boolean))];
    slices[engine][arm][field]=Object.fromEntries(groups.map(value=>[value,totals(rows.filter(r=>r[field]===value),arm)]));
   }
  }
 }
 const pairs=new Map((engines.webkit||[]).map(row=>[row.id,row]));
 const disagreements=Object.fromEntries(arms.map(arm=>[arm,(engines.chromium||[])
  .filter(row=>pairs.has(row.id)&&row[arm].accepted!==pairs.get(row.id)[arm].accepted).map(row=>row.id)]));
 return {summary,slices,pairedOriginals:(engines.chromium||[]).filter(r=>pairs.has(r.id)).length,disagreements};
}
