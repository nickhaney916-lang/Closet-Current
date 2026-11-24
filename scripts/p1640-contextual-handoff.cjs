'use strict';
// Narrow #1640 handoff: never modify a product source unless explicitly
// invoked with a disposable source path. #1636 owns the production files.
const fs=require('node:fs');
function contextualCandidate(source){
 const replacements=[
 [`score:item.id===focus?.id?Math.max(8,stylistItemScore(item,slot,context,library)||0):stylistItemScore(item,slot,context,library)`,
  `score:stylistItemScore(item,slot,context,library)`],
 [`if(selected.some(x=>!x.item.color))notices.push('Some colors are unknown; check the photos together.');`,
  `if(selected.some(x=>!String(x.item.color||'').trim()||colorFamily(x.item.color)==='unknown'))notices.push('Some colors are unknown; check the photos together.');`],
 [`function stylistTrendMatches(item,slot,context,library){return (library?.directions||[]).filter(d=>d.slot===slot&&d.type===item.itemType&&(!d.audiences.length||d.audiences.includes('All')||context.audience==='All'||d.audiences.includes(context.audience))&&(!d.occasions.length||d.occasions.includes(context.occasion))&&(!d.seasons.length||d.seasons.includes(context.season))).filter(d=>library.sources.some(s=>s.id===d.sourceId));}`,
  `function stylistTrendMatches(item,slot,context,library){
 if(!Array.isArray(library?.directions)||!Array.isArray(library?.sources))return [];
 return library.directions.filter(d=>d&&typeof d==='object'&&d.slot===slot&&d.type===item.itemType&&
  typeof d.label==='string'&&typeof d.reason==='string'&&typeof d.sourceId==='string'&&
  [d.audiences,d.occasions,d.seasons].every(a=>Array.isArray(a)&&a.every(v=>typeof v==='string'))&&
  (!d.audiences.length||d.audiences.includes('All')||context.audience==='All'||d.audiences.includes(context.audience))&&
  (!d.occasions.length||d.occasions.includes(context.occasion))&&(!d.seasons.length||d.seasons.includes(context.season))&&
  // Match the same first source the reference renderer will consume.
  (()=>{const source=library.sources.find(s=>s?.id===d.sourceId);
   return source&&typeof source.title==='string'&&safeTrendURL(source.url);})());
}`],
 // The reference consumer must tolerate malformed/null entries before the matched source.
 [`source:library.sources.find(s=>s.id===d.sourceId)`,`source:library.sources.find(s=>s?.id===d.sourceId)`]
 ];
 for(const [before,after] of replacements){
  if(source.split(before).length!==2)throw Error('Contextual handoff anchor absent or ambiguous: '+before.slice(0,100));
  source=source.replace(before,after);
 }
 return source;
}
module.exports={contextualCandidate};
if(require.main===module){
 const [input,output]=process.argv.slice(2);
 if(!input||!output||input===output||!output.endsWith('.js'))throw Error('Provide source and distinct disposable JS output');
 fs.writeFileSync(output,contextualCandidate(fs.readFileSync(input,'utf8')));
}
