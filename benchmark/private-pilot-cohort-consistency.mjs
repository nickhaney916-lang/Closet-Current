// LOCAL ONLY: reconcile independent pilot diagnostics without pretending that
// separate anonymous rows identify the same original garment or phone.
import {reviewPrivatePilotEvidence} from './private-end-to-end-pilot-review.mjs';
import {reviewSavedClosetReports} from './private-saved-closet-review.mjs';

export function reviewPrivatePilotCohort(android,iphone,modelReports,savedReports){
 // Each existing validator independently rejects forged summary counters,
 // raw image bytes, unexpected personal fields, invalid enum values and replay.
 const model=reviewPrivatePilotEvidence(android,iphone,modelReports);
 const saved=reviewSavedClosetReports(savedReports);
 if(model.appRelease!==saved.appRelease ||
    model.android.build!==saved.appRelease ||
    model.iphone.build!==saved.appRelease)
  throw Error('Different app builds across device, model and saved-closet reports');
 // These are different self-reported groups of observations. Without a
 // privacy-preserving source join, never calculate model-to-saved accuracy.
 const diagnosticBlockers=[
  ...model.studyBlockers.map(k=>'model:'+k),
  ...saved.studyBlockers.map(k=>'saved:'+k)
 ];
 return {
  format:'closet-current-private-pilot-cohort-consistency',
  version:1,
  appRelease:model.appRelease,
  allThreeReportFamiliesSameBuild:true,
  operatorReportedPlatforms:['Android','iPhone/iPad'],
  deviceCheck:{
   androidChecks:model.android.checksCompleted,
   iphoneChecks:model.iphone.checksCompleted,
   requiredEach:model.android.totalChecks,
   androidSelfReportedComplete:model.android.localSelfReportedComplete,
   iphoneSelfReportedComplete:model.iphone.localSelfReportedComplete,
   recordedScannerErrors:model.android.scannerErrors+model.iphone.scannerErrors
  },
  modelProposalDiagnostics:{
   reportSessions:model.modelSuggestionStudy.reportSessions,
   labeledGarments:model.modelSuggestionStudy.garmentPhotoEntries,
   nonclothingControls:model.modelSuggestionStudy.nonclothingControls,
   automaticProposals:model.modelSuggestionStudy.automaticModelProposals,
   proposedCategoryAndColorPrecision:model.modelSuggestionStudy.categoryColorProposalPrecision,
   modelProposalCoverage:model.modelSuggestionStudy.proposalCoverage,
   diagnosticThresholdsMet:model.proposedDiagnosticThresholdsMet
  },
  savedClosetDiagnostics:{
   reportSessions:saved.sessionCount,
   labeledGarmentAttempts:saved.observations,
   savedRecords:saved.attemptsWithSavedClosetRecord,
   correctedSaves:saved.correctedSaves,
   wrongAutomaticallySaved:saved.wrongAutomaticallySaved,
   reportedSavedCategoryTypeColorPrecision:saved.selfReportedFinalSavedExactAccuracy,
   reportedAutomaticCategoryTypeColorPrecision:saved.selfReportedInitialAutomaticExactAccuracy,
   photoClarityProblems:saved.photoClarityProblems,
   backupPendingOrFailed:saved.backupPendingOrFailed,
   diagnosticThresholdsMet:saved.proposedDiagnosticThresholdsMet
  },
  bothDiagnosticThresholdsMet:model.proposedDiagnosticThresholdsMet&&saved.proposedDiagnosticThresholdsMet,
  diagnosticBlockers,
  // A shared 12-digit app build does NOT provide a common original photo ID.
  // Anonymous worksheets can describe entirely different garments.
  originalPhotosLinkedAcrossReportFamilies:false,
  independentlyUniqueOriginalPhotosVerified:false,
  authenticatedIndependentReviewers:0,
  genuinePhysicalPhoneEvidenceAuthenticated:false,
  physicalAndroidVerified:false,
  physicalIPhoneVerified:false,
  liveTwoAccountSupabaseRestorationVerified:false,
  reportedRecognitionModelAccuracyNotProductionAccuracy:true,
  verifiedProductionSavedClosetAccuracy:null,
  verifiedOriginalCategoryColorAccuracy:null,
  realCommercialFigureRightsApproved:false,
  externalEmailPrivacyTermsAndDeletionApproved:false,
  productionReleaseApproved:false,
  productionPromotion:'BLOCKED',
  releaseBlockers:[
   'No authenticated physical Android or iPhone evidence',
   'Model-proposal entries cannot be joined to actual saved-closet entries',
   'No independently verified unique original-photo labels or human mask reviews',
   'Live disposable two-account Supabase/Auth/restore and SMTP not verified',
   'Customer privacy/terms, deletion, figure rights and owner release approval outstanding'
  ],
  noPrivateImageNamesEmailsTokensOrAccountIdsIncluded:true,
  warning:'Independent anonymous operator reports are not proof of a real device, same photo, actual saved color, cloud isolation, genuine human validation or authorization to launch.'
 };
}
