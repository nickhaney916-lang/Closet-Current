import fs from 'node:fs';
import path from 'node:path';
import {digest,evaluateEvidence,FEATURES} from '../benchmark/verified-mask-quality.mjs';
const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p));
const manifest=JSON.parse(read('benchmark/local-fitting-real-photo-manifest.json'));
const registry=JSON.parse(read('benchmark/reference-mask-evidence/registry.json'));
const boundaries=JSON.parse(read('artifacts/source-guided-boundaries/results.json'));
const locked=JSON.parse(read('benchmark/locked-photo-sources.json'));
// Fail closed until an importer can validate real reference + review + rights artifacts.
// Never accept a truth mask through report JSON or generate one from model output.
if(registry.references.length)throw Error('Reference importer requires explicit reviewed implementation; do not silently promote labels');
const cases=manifest.cases.map(row=>{
 const source=read('benchmark/fixtures/'+row.image),sha=digest(source),record=boundaries.cases.find(c=>c.id===row.id);
 if(sha!==row.sourceSha256||sha!==locked.find(x=>x.id===row.id)?.sha256||sha!==record?.sourceSha256||!record.sourceFileUnchanged)throw Error('Photo provenance mismatch');
 if(record.displayEligible!==false)throw Error('Unexpected display eligibility');
 return {id:row.id,image:row.image,sourceSha256:sha,attribution:locked.find(x=>x.id===row.id).attribution,
  proposalAvailable:record.proposalAvailable,candidateRgbaSha256:record.candidateRgbaSha256??null,
  maskQuality:evaluateEvidence({reference:null,registry}),featureEvidence:Object.fromEntries(FEATURES.map(f=>[f,'unmeasured-no-independent-reference'])),
  partialWitnessesAreFullTruth:false,darkEdgeDiagnostic:record.darkEdgeDiagnostic??null};
});
const files=['benchmark/verified-mask-quality.mjs','benchmark/dark-edge-diagnostic.cjs','benchmark/reference-mask-evidence/registry.json',
 'benchmark/local-fitting-real-photo-manifest.json','scripts/report-verified-mask-evidence.mjs','scripts/measure-source-guided-boundaries.cjs','scripts/benchmark-source-guided-boundaries.py'];
const report={schemaVersion:1,evidenceClass:'real-licensed-photos-without-independent-full-mask-truth',
 pipelineFiles:Object.fromEntries(files.map(f=>[f,digest(read(f))])),inputBoundaryReportSha256:digest(read('artifacts/source-guided-boundaries/results.json')),
 policy:registry.policy,summary:{licensedRealPhotos:cases.length,proposals:cases.filter(x=>x.proposalAvailable).length,
  independentlyVerifiedFullMasks:0,measuredFalseRemovalCases:0,measuredFalseInclusionCases:0,qualityPasses:0,blocked:cases.length,realPhoneRuns:0},cases};
fs.mkdirSync('artifacts/verified-mask-evidence',{recursive:true});
fs.writeFileSync('artifacts/verified-mask-evidence/results.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/verified-mask-evidence/report.md',`# Real-photo mask evidence\n\n${cases.length} licensed originals; 0 independent full masks; 0 quality passes; all blocked.\n\nFalse removal, false inclusion, boundary retention and named feature quality are **unmeasured**, not zero. Proposed thresholds are unapproved. Binary masks cannot certify transparency or layering.\n\n| Image | Proposal | Quality gate | Dark edge risk pixels (not errors) |\n|---|---|---|---|\n`+cases.map(c=>`| ${c.image} | ${c.proposalAvailable} | BLOCKED | ${c.darkEdgeDiagnostic?.removedDarkPixelsNearRetainedEdge??'unavailable'} |`).join('\n')+'\n\nSee ../source-guided-boundaries/index.html for attributed held proposals and risk overlays. No generated imagery or physical-phone evidence.\n');
console.log(JSON.stringify(report.summary));
