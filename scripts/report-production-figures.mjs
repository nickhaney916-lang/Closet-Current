import fs from 'node:fs';
import {sha,evaluateProductionFigures} from '../benchmark/figure-readiness/production-figure-metrics.mjs';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const evidence=json('benchmark/figure-readiness/production-evidence.json'),policy=json('benchmark/figure-readiness/production-policy.json');
// Current packet contains no reviewed masters. Reject silent metadata promotions.
if(evidence.figures.some(f=>f.masterPath||f.rightsReview||f.visualReview||f.alignmentReview||f.nativeResolutionEvidence))throw Error('Reviewed master/proof importer must be implemented and reviewed before admitting assets');
const decoded=json('artifacts/production-figures/decoded.json');
const result=evaluateProductionFigures(policy,evidence,decoded.measurements);
const paths=['benchmark/figure-readiness/production-evidence.json','benchmark/figure-readiness/production-policy.json','benchmark/figure-readiness/production-figure-metrics.mjs','scripts/benchmark-production-figures.py','scripts/report-production-figures.mjs'];
const report={...result,decoder:decoded.decoder,policyStatus:policy.status,pipelineFiles:Object.fromEntries(paths.map(p=>[p,sha(read(p))])),summary:{assets:2,mastersPresent:0,approvedLicenses:0,reviewedAnchorPairs:0,productionReady:0},
 existingPr37AuditSha256:sha(read('benchmark/figure-readiness/asset-evidence.json'))};
fs.writeFileSync('artifacts/production-figures/results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
