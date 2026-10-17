// Offline research-only gate: a successful inference job is NOT evidence that
// socks, stockings or tights can safely be cataloged from a whole-outfit photo.
// Never imported by the live application; never grants production permission.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function assessRealHosieryReadiness(summary, review) {
  if (!summary || !review || !Array.isArray(summary.cases) ||
      !Array.isArray(review.findings)) throw Error('Missing real-photo evidence');
  const findings = review.findings;
  const unique = new Set(findings.map(f=>f.id));
  const uniqueCases = new Set(summary.cases.map(c=>c.id));
  const modelPinned = summary.modelSha256===review.modelSha256 &&
    typeof summary.modelSha256==='string' &&
    /^[0-9a-f]{64}$/.test(summary.modelSha256);
  const sameCases = findings.length===2 && summary.cases.length===2 &&
    unique.size===2 && uniqueCases.size===2 &&
    findings.every(f=>uniqueCases.has(f.id));
  const countsMatch = sameCases && findings.every(f=>{
    const actual = summary.cases.find(c=>c.id===f.id);
    return actual?.evaluation?.sockPixels===f.sockClassPixels &&
      actual?.evaluation?.shoePixels===f.shoeClassPixels &&
      actual?.sourceSha256 && /^[0-9a-f]{64}$/.test(actual.sourceSha256);
  });
  // An old human review is invalid if a model, source list or its outputs change.
  const reviewMatchesThisRun = Boolean(modelPinned && sameCases && countsMatch &&
    summary.sourceImagesHashVerified===true);
  const observedVisualFailures=findings.filter(f=>f.clothingSeparatedCorrectly!==true)
    .map(f=>f.id);
  const blockers=[];
  if (!reviewMatchesThisRun) blockers.push('model-or-source-output-requires-fresh-review');
  if (observedVisualFailures.length) blockers.push('reviewed-segmentation-failures');
  if (review.groundTruthPixelMasksAvailable!==true ||
      summary.maskGroundTruthAvailable!==true)
    blockers.push('no-independent-reference-masks');
  if (summary.modelHasTightsLabel!==true)
    blockers.push('no-dedicated-tights-label');
  if (summary.realDevicePerformanceMeasured!==true ||
      review.realPhoneSpeedMeasured!==true)
    blockers.push('phone-performance-not-measured');
  if (summary.productionAuthorized!==false ||
      summary.wardrobeEntriesAdded!==0 ||
      review.automaticHosieryCatalogApproved!==false ||
      review.addedClosetEntries!==0)
    blockers.push('unsafe-production-or-inventory-claim');

  return {
    status:'research-only-not-ready',
    reviewMatchesThisRun,
    observedVisualFailures,
    blockers,
    evaluatedPhotoCount:summary.cases.length,
    originalPhotosPreserved:summary.originalPhotoProtected===true,
    automaticClosetSavesAllowed:false,
    extraUserPromptsAdded:0,
    newCustomerTabsAdded:0,
    productionAuthorized:false
  };
}

if (process.argv[1] &&
    import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [, , summaryFile, outFile] = process.argv;
  if (!summaryFile || !outFile) throw Error('Usage: node gate.mjs <summary.json> <readiness.json>');
  const review=JSON.parse(readFileSync('benchmark/LIP-SOCKS-REAL-REVIEW-20261017.json','utf8'));
  const summary=JSON.parse(readFileSync(summaryFile,'utf8'));
  const result=assessRealHosieryReadiness(summary,review);
  writeFileSync(outFile,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
  if (!result.reviewMatchesThisRun ||
      result.automaticClosetSavesAllowed!==false ||
      result.productionAuthorized!==false ||
      !result.blockers.includes('reviewed-segmentation-failures'))
    process.exitCode=1;
}
