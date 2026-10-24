// Metadata-only audit. Never describes archived predictions as fresh inference.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function score(manifest, results) {
  assert.equal(new Set(manifest.map(r=>r.id)).size,manifest.length,'Duplicate labels');
  assert.equal(new Set(results.map(r=>r.id)).size,results.length,'Duplicate predictions');
  assert.equal(results.length,manifest.length,'Incomplete result set');
  const byId=new Map(results.map(r=>[r.id,r])), groups={}, failures=[];
  const empty=()=>({total:0,categoryCorrect:0,exactTypeCorrect:0,acceptedTypeCorrect:0,abstained:0,strong:0,wrongStrongType:0,categoryOnly:0,runtimeErrors:0});
  const total=empty();let negatives=0,rejected=0;
  for(const m of manifest){
    const r=byId.get(m.id);assert.ok(r,'Missing prediction '+m.id);
    const p=r.prediction||{},ok=!r.error&&p.category===m.expectedCategory;
    if(m.expectedCategory==='Uncategorized') {negatives++;if(!r.error&&!r.strong&&!r.categoryConfirmed&&(!p.category||p.category==='Uncategorized'))rejected++;continue;}
    const accepted=ok&&(m.acceptedTypes||[m.expectedType]).includes(p.type);
    for(const g of [total,groups[m.expectedCategory]||=empty(),groups['type:'+m.expectedType]||=empty()]){
      g.total++;g.categoryCorrect+=+ok;g.exactTypeCorrect+=+(ok&&p.type===m.expectedType);g.acceptedTypeCorrect+=+accepted;
      g.abstained+=+(!p.category||p.category==='Uncategorized');g.strong+=+!!r.strong;g.wrongStrongType+=+(!!r.strong&&!accepted);g.categoryOnly+=+(!r.strong&&!!r.categoryConfirmed);g.runtimeErrors+=+!!r.error;
    }
    if(!accepted)failures.push({id:m.id,expectedCategory:m.expectedCategory,expectedType:m.expectedType,prediction:p,strong:!!r.strong,categoryConfirmed:!!r.categoryConfirmed,reason:r.reason||null,error:r.error||null});
  }
  for(const g of [total,...Object.values(groups)])g.categoryAccuracyPercent=+(100*g.categoryCorrect/g.total).toFixed(2);
  return {total,groups,negatives:{total:negatives,rejected},failures,colorAccuracy:null,numericConfidenceCalibration:null};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const read=p=>JSON.parse(fs.readFileSync(p)),cohorts=['reviewed-32','holdout-16','fresh-11'];
  const manifest=cohorts.flatMap(k=>read('benchmark/manifest-'+k+'.json'));
  const sources=read('benchmark/locked-photo-sources.json');assert.equal(sources.length,59);
  for(const s of sources){assert.ok(s.attribution?.license);assert.equal(createHash('sha256').update(fs.readFileSync('benchmark/fixtures/'+s.image)).digest('hex'),s.sha256);}
  const prior=read('benchmark/assignment233/baseline-226.json');
  const report={measurement:'archived actual model predictions; metadata-only rescoring, no new inference',sourceHashesVerified:59,sourceCommit:prior.sourceCommit,sourceWorkflowRun:prior.workflowRun,
    historical:score(manifest,cohorts.flatMap(k=>read('benchmark/regression-'+k+'.json').results)),
    verified226:score(manifest,cohorts.flatMap(k=>prior.cohorts[k]))};
  if(process.argv[2]){
    const dir=process.argv[2],trace=read(dir+'/source-integrity-and-hint-report.json');
    assert.equal(trace.originalHashMatches,59);assert.equal(trace.remoteRequestsAfterWarmup,0);
    report.fresh=score(manifest,cohorts.flatMap(k=>read(dir+'/candidate-'+k+'.json')));
    report.freshBaseline=score(manifest,cohorts.flatMap(k=>read(dir+'/baseline-'+k+'.json')));
    report.measurement='fresh inference inputs supplied; historical and fresh metrics separately reported';
  }
  console.log(JSON.stringify(report,null,2));
}
