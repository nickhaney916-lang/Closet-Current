import {readFile} from 'node:fs/promises';
export function validateVisualFeedback(feedback,manifest){
 if(feedback?.schemaVersion!==1||feedback?.kind!=='visual-feedback-not-ground-truth'||!Array.isArray(feedback.results))throw Error('Not a visual feedback export');
 const byId=new Map(manifest.cases.map(c=>[c.id,c])),seen=new Set(),issues=['Missing fabric','Background left','Blurry edges','Wrong garment'];
 const summary=[];
 for(const r of feedback.results){
  const expected=byId.get(r.id);
  if(!expected||seen.has(r.id)||r.sourceSha256!==expected.sourceSha256||r.image!==expected.image)throw Error('Unknown, duplicate, or mismatched verified photo');
  seen.add(r.id);
  if(!['good','bad','not-reviewed'].includes(r.assessment))throw Error('Invalid assessment');
  if(r.assessment==='bad'&&!issues.includes(r.issue))throw Error('Needs-work rating missing valid reason');
  if(r.assessment!=='bad'&&r.issue!=null)throw Error('Unexpected reason');
  summary.push({id:r.id,assessment:r.assessment,issue:r.issue??null});
 }
 if(!summary.length)throw Error('Empty feedback');
 return {kind:'visual-feedback-summary-not-accuracy',reviewed:summary.filter(r=>r.assessment!=='not-reviewed').length,total:summary.length,results:summary};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [file,manifestPath='benchmark/segmentation-review-manifest.json']=process.argv.slice(2);
 if(!file)throw Error('Usage: node scripts/validate-visual-feedback.mjs <downloaded-feedback.json>');
 console.log(JSON.stringify(validateVisualFeedback(JSON.parse(await readFile(file,'utf8')),JSON.parse(await readFile(manifestPath,'utf8'))),null,2));
}
