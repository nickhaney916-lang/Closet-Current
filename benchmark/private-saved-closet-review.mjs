// PRIVATE offline diagnostic. Never claim that user-entered phone observations
// attest to actual camera hardware, independently unique originals or production.
import savedEngine from '../public/saved-closet-audit-engine.js';
const {categories,validateReport}=savedEngine;
const percent=(n,d)=>d?Number((n/d).toFixed(4)):null;
export function reviewSavedClosetReports(reports){
 if(!Array.isArray(reports)||reports.length<2||reports.length>40)
  throw Error('Provide 2–40 independent small phone-session reports');
 const parsed=reports.map(validateReport);
 if(new Set(reports.map(r=>JSON.stringify(r))).size!==reports.length)
  throw Error('Do not replay identical session reports to inflate the pilot');
 const builds=new Set(parsed.map(r=>r.appRelease));
 if(builds.size!==1)throw Error('Phone sessions must use the same exact app release');
 const platforms=new Set(parsed.map(r=>r.platform));
 if(!platforms.has('Android')||!platforms.has('iPhone/iPad'))
  throw Error('Require both Android and iPhone/iPad operator-reported sessions');
 const rows=parsed.flatMap(r=>r.rows),saved=rows.filter(r=>r.saved),
  automatic=rows.filter(r=>r.disposition==='saved-auto');
 const exact=(a,b)=>a.category===b.category&&a.type===b.type&&a.color===b.color;
 const right=saved.filter(r=>exact(r.saved,r.expected)).length,
  rightAutomatic=automatic.filter(r=>exact(r.saved,r.expected)).length;
 const wrongAutomaticallySaved=automatic.length-rightAutomatic;
 const categoriesCount=Object.fromEntries(categories.map(c=>{
  const rowsOfType=rows.filter(r=>r.expected.category===c),
   savedRows=rowsOfType.filter(r=>r.saved);
  return [c,{labeled:rowsOfType.length,saved:savedRows.length,
   exactCategoryTypeColorSavedCorrect:savedRows.filter(r=>exact(r.expected,r.saved)).length}];
 }));
 const fail=rows.filter(r=>r.disposition==='failed').length,
  held=rows.filter(r=>r.disposition==='held').length,
  poorPhoto=saved.filter(r=>r.quality!=='clear').length,
  backlog=saved.filter(r=>['failed','pending'].includes(r.backup)).length,
  restored=saved.filter(r=>r.backup==='restored').length;
 const coverage=percent(saved.length,rows.length),
  autoCoverage=percent(automatic.length,rows.length),
  actualSavedExact=percent(right,saved.length),
  initialAutoExact=percent(rightAutomatic,automatic.length);
 const studyBlockers=[
  ...(rows.length<50?['fewer-than-50-labeled-originals']:[]),
  ...categories.filter(c=>categoriesCount[c].labeled<10).map(c=>'under-ten-'+c.toLowerCase()),
  ...(saved.length<45?['saved-clothing-coverage-below-90-percent']:[]),
  ...(autoCoverage===null||autoCoverage<.7?['automatic-save-coverage-below-70-percent']:[]),
  ...(initialAutoExact===null||initialAutoExact<.95?['initial-automatic-category-type-color-below-95-percent']:[]),
  ...(actualSavedExact===null||actualSavedExact<.95?['final-saved-category-type-color-below-95-percent']:[]),
  ...(wrongAutomaticallySaved>0?['wrong-garment-saved-without-user-correction']:[]),
  ...(fail>0?['observed-save-failure']:[]),
  ...(poorPhoto>0?['soft-or-pixelated-saved-photo']:[]),
  ...(backlog>0?['cloud-restore-failed-or-pending']:[]),
  ...(restored===0?['no-real-restoration-check-reported']:[])
 ];
 // "No wrong autosave" alone cannot be extrapolated to general production
 // reliability from self-selected clothing or operator-entered labels.
 const blockerTags=[...studyBlockers,
  'self-reported-observations-not-independently-audited',
  'original-photos-not-provably-unique-or-from-physical-hardware',
  'live-two-account-isolation-and-supabase-policies-unverified',
  'customer-email-and-deletion-not-independently-approved',
  'independent-two-human-masks-and-figure-rights-unapproved',
  'no-owner-authorization-for-production'];
 return {format:'closet-current-private-saved-closet-review',version:1,
  appRelease:[...builds][0],sessionCount:parsed.length,
  operatorReportedPlatforms:[...platforms].sort(),
  observations:rows.length,attemptsWithSavedClosetRecord:saved.length,
  rejectedOrUnfinished:held+fail,saveFailures:fail,autoSaves:automatic.length,
  wrongAutomaticallySaved,correctedSaves:rows.filter(r=>r.disposition==='saved-corrected').length,
  savedCorrectCategoryTypeColor:right,automaticCorrectCategoryTypeColor:rightAutomatic,
  selfReportedSavedCoverage:coverage,selfReportedAutoSaveCoverage:autoCoverage,
  selfReportedFinalSavedExactAccuracy:actualSavedExact,
  selfReportedInitialAutomaticExactAccuracy:initialAutoExact,
  photoClarityProblems:poorPhoto,backupPendingOrFailed:backlog,restorationChecksMarked:restored,
  categories:categoriesCount,proposedDiagnosticThresholdsMet:studyBlockers.length===0,
  studyBlockers,releaseBlockers:blockerTags,productionSavedClosetAccuracy:null,
  independentlyVerifiedPhysicalAndroid:false,independentlyVerifiedPhysicalIPhone:false,
  releaseAuthorized:false,productionReleaseApproved:false,
  rawPhotosOrAccountIdsRead:false,
  warning:'Operator-entered outcomes cannot prove physical phone identity, independently verified original labels, live account isolation, customer storage permissions or production readiness.'};
}
