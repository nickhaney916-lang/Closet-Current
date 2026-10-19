// Offline interpretation of the real production-worker outfit flow.
// This is a readiness GATE, never an accuracy estimator or garment classifier.
// Caption-derived expected categories are reference prompts, not human ground truth.
const allowed = new Set(['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes']);
const sha256 = /^[a-f0-9]{64}$/;
export function evaluateWholeOutfitHandoff(report) {
 if (!report || typeof report !== 'object' || Array.isArray(report)) throw Error('Invalid real-outfit report');
 if (typeof report.sourceId !== 'string' || !report.sourceId || !sha256.test(report.sourceSha256 || '')) throw Error('Missing verified source ID/hash');
 if (!Array.isArray(report.automaticSaved) || !Array.isArray(report.pendingReview) || !Array.isArray(report.expectedSupportedCategories)) throw Error('Incomplete real-outfit report');
 if (new Set(report.expectedSupportedCategories).size !== report.expectedSupportedCategories.length ||
     !report.expectedSupportedCategories.length || report.expectedSupportedCategories.some(c => !allowed.has(c))) throw Error('Invalid supported-category reference set');
 const saved = report.automaticSaved, pending = report.pendingReview, all = [...saved, ...pending];
 if (all.some(x => !x || typeof x !== 'object' || typeof x.category !== 'string')) throw Error('Malformed garment observations');
 if (saved.length !== report.automaticSaveCount || pending.length !== report.reviewPendingCount ||
     all.length !== report.emittedPieceCount) throw Error('Inconsistent actual worker counts');
 if (!report.actualSegmentationWorker || !report.actualRecognitionWorker) throw Error('A real-model report is required');
 const sourceIntegrity = all.every(x => x.originalPreserved === true && x.recognitionCropPresent === true);
 const reportedCats = new Set(saved.map(x => x.category));
 const referenceMissing = report.expectedSupportedCategories.filter(c => !reportedCats.has(c));
 const referenceUnexpected = [...reportedCats].filter(c => !report.expectedSupportedCategories.includes(c));
 const unsafeSaved = saved.filter(x => x.segmentHint?.displayFallback === 'original-crop' ||
    x.segmentHint?.clipped || x.scanFailed || x.saveFailed || x.possibleDuplicate ||
    !allowed.has(x.category) || !x.color);
 const blockers = [];
 if (report.status !== 'complete' || report.splitFailed || (report.pageErrors?.length || 0) > 0) blockers.push('worker-or-browser-failure');
 if (!sourceIntegrity) blockers.push('original-or-recognition-crop-not-preserved');
 if (!saved.length) blockers.push('zero-automatic-garments');
 if (referenceMissing.length) blockers.push('reference-categories-not-automatically-covered');
 if (referenceUnexpected.length) blockers.push('unrecognized-automatic-category');
 if (pending.length) blockers.push('regions-still-need-review');
 if (unsafeSaved.length) blockers.push('unsafe-automatic-saves');
 const referenceHandoffComplete = blockers.length === 0;
 return {
  schemaVersion: 1,
  sourceId: report.sourceId,
  sourceSha256: report.sourceSha256,
  evidence: 'actual-browser-segmentation-and-recognition-workers',
  referenceLabelStatus: report.expectedLabelsFromSourceDescription ? 'source-description-not-independent-ground-truth' : 'source-of-reference-labels-not-independently-verified',
  automaticSavedCount: saved.length,
  reviewPendingCount: pending.length,
  sourcePreserved: sourceIntegrity,
  referenceExpectedCategories: [...report.expectedSupportedCategories],
  referenceMissingAutomaticCategories: referenceMissing,
  referenceUnexpectedAutomaticCategories: referenceUnexpected,
  unapprovedAutomaticSaves: unsafeSaved.length,
  referenceHandoffComplete,
  status: referenceHandoffComplete ? 'reference-category-handoff-complete-not-accuracy' : 'blocked',
  blockers,
  independentHumanGroundTruthVerified: false, // independent masks must be validated by the dedicated mask scorer
  physicalPhoneVerified: false,
  measuredMaskPrecision: null,
  measuredMaskRecall: null,
  measuredPhysicalGarmentCountRecall: null,
  measuredCategoryCorrectGarmentRecall: null,
  measuredColorAccuracy: null,
  productionReady: false,
  note: 'A green CI job is not a customer-accurate outfit. Reference categories come from source descriptions; only independently approved full-scene garment masks can establish real-photo accuracy.'
 };
}
