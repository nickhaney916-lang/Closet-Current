#!/usr/bin/env node
/**
 * P80 private, offline, blinded candidate-set audit. NEVER an accuracy claim or
 * a release authorization. No keys, labels, prediction rows, photos or source
 * IDs may be printed or written by this module.
 *
 * Genuine human identity, source rights and scoring independence are externally
 * adjudicated; a self-created signature alone is NOT human ground truth.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createPublicKey, verify as verifySignature } from "node:crypto";
import {
  CATEGORIES,
  canonical,
  sha256,
  isHex64,
} from "./p75-dataset-core.mjs";
import { loadSession, reviewHandoff, externalPath } from "./p79-workstation-core.mjs";
import {verifyOperatorCategoryLock80, blindTemporalOrder80, strictUtcInstant80} from "./p80-operator-category-lock.mjs";

export const SCHEMA80 = "p80-private-candidate-eval-v1";
export const SEAL80 = "p80-private-scorer-seal-v1";
const SHA40 = /^[a-f0-9]{40}$/;
const MAX_SOURCES = 500;
const MIN_PRIVATE_COHORT = 60;
const bad = (reason) => ({
  schema: SCHEMA80,
  status: "BLOCKED",
  reason,
  scoredSources: 0,
  conditionalCandidateCoverage: null,
  independentlyVerifiedSubtypeAccuracy: null,
  releaseAuthorized: false,
  shouldLiftFamilyAlphaHold: false,
});
const finiteDate = strictUtcInstant80;

export function validCandidatePrediction80(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const keys = [
    "sourceSha256", "modelSha256", "operatorCategory",
    "operatorCategoryProvenance", "status", "itemType",
    "requiresOwnerConfirmation", "automaticallyCertified", "alternatives",
  ];
  if (Object.keys(p).length !== keys.length || !keys.every(k => Object.hasOwn(p,k))) return false;
  if (!isHex64(p.sourceSha256) || !isHex64(p.modelSha256) ||
    !Object.hasOwn(CATEGORIES,p.operatorCategory) ||
    p.operatorCategoryProvenance !== "blind-operator-before-truth-reveal" ||
    !["hypotheses","abstain"].includes(p.status) ||
    p.itemType !== "Unknown" ||
    p.requiresOwnerConfirmation !== true ||
    p.automaticallyCertified !== false ||
    !Array.isArray(p.alternatives) || p.alternatives.length > 3) return false;
  const types = new Set();
  for (let i = 0; i < p.alternatives.length; i++) {
    const a = p.alternatives[i];
    if (!a || typeof a !== "object" || Array.isArray(a) ||
        Object.keys(a).length !== 4 ||
        !["category","itemType","rank","relativeScore"].every(k=>Object.hasOwn(a,k)) ||
        a.category !== p.operatorCategory ||
        !CATEGORIES[a.category]?.includes(a.itemType) || a.itemType === "Other" ||
        types.has(a.itemType) || a.rank !== i + 1 ||
        !Number.isFinite(a.relativeScore) || a.relativeScore < 0 ||
        a.relativeScore > 1 ||
        (i > 0 && a.relativeScore > p.alternatives[i-1].relativeScore)) return false;
    types.add(a.itemType);
  }
  return p.status === "hypotheses" ? p.alternatives.length >= 1 : p.alternatives.length === 0;
}
/**
 * Arithmetic only. Caller MUST first independently validate source bytes,
 * rights/group, two signed human reviews, full-field label consensus,
 * sealed source partitions, and independently sealed model predictions.
 * Tests use GENERATED SYNTHETIC labels: these ratios are never standalone
 * independent accuracy and can never lift the pilot hold.
 */
export function summarizeConditionalCandidates80(verifiedPairs) {
  if (!Array.isArray(verifiedPairs) || !verifiedPairs.length ||
      verifiedPairs.length > MAX_SOURCES) throw Error("P80_NO_VERIFIED_PAIRS");
  let hit = 0, abstained = 0, mismatch = 0, totalAlternatives = 0;
  const perCategory = Object.fromEntries(Object.keys(CATEGORIES).map(k=>[k,{count:0,hit:0}]));
  for (const pair of verifiedPairs) {
    const truth = pair?.labels;
    const pred = pair?.prediction;
    if (!validCandidatePrediction80(pred) ||
        !truth ||
        truth.presence !== "single-garment" ||
        truth.instanceCount !== 1 ||
        truth.wardrobeUnit !== "single-unit" ||
        !Object.hasOwn(CATEGORIES,truth.category) ||
        !CATEGORIES[truth.category].includes(truth.subtype) ||
        truth.subtype === "Other" ||
        Object.values(truth.quality || {}).length !== 4 ||
        Object.values(truth.quality).some(x=>x!=="ok"))
      throw Error("P80_INELIGIBLE_SINGLE_GARMENT_OR_PREDICTION");
    const correctCat = pred.operatorCategory === truth.category;
    if (!correctCat) mismatch++;
    const matched = correctCat && pred.alternatives.some(a=>a.itemType===truth.subtype);
    hit += Number(matched);
    if (pred.status === "abstain") abstained++;
    totalAlternatives += pred.alternatives.length;
    perCategory[truth.category].count++;
    perCategory[truth.category].hit += Number(matched);
  }
  const n = verifiedPairs.length;
  return {
    kind: "CONDITIONAL OWNER-CATEGORY SUBTYPE CANDIDATE COVERAGE ONLY",
    sources: n,
    candidateSetHits: hit,
    candidateSetCoverage: hit / n,
    categoryHintDisagreements: mismatch,
    abstentionStatuses: abstained,
    candidateSuggestions: totalAlternatives,
    noAutomaticCertification: true,
    perCategory: Object.fromEntries(
      Object.entries(perCategory).map(([k,v])=>[k,{
        sourceCount:v.count,
        candidateHitCount:v.hit,
        conditionalCoverage:v.count ? v.hit / v.count : null,
      }])
    ),
    independentlyVerifiedSubtypeAccuracy: null,
    releaseAuthorized: false,
    shouldLiftFamilyAlphaHold: false,
  };
}
export function verifyScorerSeal80(predictions, seal, pinnedScorer, now) {
  if (!Array.isArray(predictions) || !predictions.length || predictions.length > MAX_SOURCES ||
      !seal || seal.schema !== SEAL80 || !SHA40.test(seal.targetCommit || "") ||
      !isHex64(seal.modelSha256) || !isHex64(seal.predictionsSha256) ||
      seal.predictionsSha256 !== sha256(canonical(predictions)) ||
      seal.sourceCount !== predictions.length ||
      !(finiteDate(seal.scoredAt) <= now) ||
      now - finiteDate(seal.scoredAt) > 30 * 86400000 ||
      !isHex64(pinnedScorer) ||
      typeof seal.signature !== "string" ||
      typeof seal.publicKey !== "string") return false;
  try {
    const key = createPublicKey(seal.publicKey);
    if (key.asymmetricKeyType !== "ed25519" ||
        sha256(key.export({type:"spki",format:"der"})) !== pinnedScorer) return false;
    const {signature, publicKey, ...payload} = seal;
    if (Object.keys(payload).length !== 6 ||
        !["schema","targetCommit","modelSha256","predictionsSha256","sourceCount","scoredAt"]
          .every(k=>Object.hasOwn(payload,k)))return false;
    return verifySignature(null,Buffer.from(canonical(payload)),key,Buffer.from(signature,"base64"));
  } catch { return false; }
}
/**
 * The only private entry point. P79 loadSession verifies originals, signed
 * external source approvals, zero known/near-source overlap and historical
 * exposure ledger; reviewHandoff requires exact 2-rater full-label consensus.
 * Predictions are checked against a separately pinned scoring seal.
 *
 * Success is PRIVATE_RESEARCH_ONLY (never real-life accuracy/release approval).
 */
export async function evaluatePrivateBlind80({bundle, receipts, operatorLock, predictions, seal, trusted, now=Date.now()}={}) {
  if (!Number.isFinite(now) || process.env.CI || process.env.GITHUB_ACTIONS)
    return bad("private evidence cannot be scored in CI");
  if (!bundle || bundle.authorization?.access !== "blind" ||
      bundle.synthetic === true || !Array.isArray(bundle.sources) ||
      !Array.isArray(predictions) || !trusted ||
      !isHex64(trusted.registrarFingerprint) ||
      trusted.registrarFingerprint !== bundle.approvedFingerprint ||
      !/^[a-f0-9]{40}$/.test(trusted.targetCommit || "") ||
      !isHex64(trusted.modelSha256) ||
      seal?.targetCommit !== trusted.targetCommit ||
      seal?.modelSha256 !== trusted.modelSha256 ||
      !(finiteDate(trusted.approvedAt) < finiteDate(seal?.scoredAt)) ||
      !verifyScorerSeal80(predictions,seal,trusted.scorerFingerprint,now) ||
      !verifyOperatorCategoryLock80(operatorLock,predictions,trusted,seal?.scoredAt,now))
    return bad("missing independently pinned blind source/reviewer/scoring custody");
  let loaded;
  try {
    loaded = await loadSession(bundle,{now});
  } catch {
    return bad("private blind source/original/exposure gate failed");
  }
  if (loaded.records.length < MIN_PRIVATE_COHORT)
    return bad("private cohort too small for aggregate disclosure or release evidence");
  if (loaded.records.length !== predictions.length ||
      loaded.records.length > MAX_SOURCES ||
      !receipts || typeof receipts !== "object" || Array.isArray(receipts) ||
      Object.keys(receipts).length !== loaded.records.length)
    return bad("incomplete independent source/reviewer/prediction cardinality");
  const byHash = new Map();
  for (const pred of predictions) {
    if (!validCandidatePrediction80(pred) ||
        pred.modelSha256 !== seal.modelSha256 ||
        byHash.has(pred.sourceSha256))
      return bad("invalid or duplicated model candidate receipt");
    byHash.set(pred.sourceSha256,pred);
  }
  const all = [];
  for (const entry of loaded.records) {
    const src=entry.source, pred=byHash.get(src.sha256);
    if (!pred || !Array.isArray(receipts[src.sha256]) ||
        receipts[src.sha256].length !== 2)
      return bad("missing exact source/prediction or two reviewer receipts");
    const reviews=receipts[src.sha256];
    const handoff=reviewHandoff(src,reviews,bundle.registry,bundle.approvedFingerprint);
    if (handoff.status !== "READY FOR P75 CUSTODIAN AUDIT" ||
        !blindTemporalOrder80(trusted.approvedAt,operatorLock.recordedAt,
          seal.scoredAt,reviews.map(r=>r.reviewedAt),now))
      return bad("unverified/discordant reviewers or label-before-score leakage risk");
    all.push({labels:reviews[0].labels,prediction:pred});
  }
  if (Object.keys(receipts).some(hash=>!byHash.has(hash)))
    return bad("foreign reviewer receipt source");
  let metrics;
  try { metrics=summarizeConditionalCandidates80(all); }
  catch { return bad("unknown/non-single unit/uncertain source excluded from candidate scoring"); }
  return {
    schema:SCHEMA80,
    status:"PRIVATE_RESEARCH_ONLY_NOT_RELEASE",
    scoredSources:metrics.sources,
    candidateSetHits:metrics.candidateSetHits,
    conditionalCandidateCoverage:metrics.candidateSetCoverage,
    categoryHintDisagreements:metrics.categoryHintDisagreements,
    abstentionStatuses:metrics.abstentionStatuses,
    candidateSuggestions:metrics.candidateSuggestions,
    // No real label, source ID, photo or metric-by-subtype is disclosed.
    independentlyVerifiedSubtypeAccuracy:null,
    releaseAuthorized:false,
    shouldLiftFamilyAlphaHold:false,
  };
}
async function main() {
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log("P80_PRIVATE_BLIND_SCORING "+JSON.stringify(bad("private data unavailable in CI")));
    return;
  }
  const paths=process.argv.slice(2);
  if (!paths.length) {
    console.log("P80_PRIVATE_BLIND_SCORING "+JSON.stringify(bad("no trusted external evidence supplied")));
    return;
  }
  if (paths.length!==6) throw Error("Usage: p80-private-blind-evaluator.mjs ABS_SOURCE_BUNDLE ABS_REVIEW_RECEIPTS ABS_OPERATOR_CATEGORY_LOCK ABS_PREDICTIONS ABS_SCORER_SEAL ABS_TRUSTED_FINGERPRINTS");
  const data=[];
  for(const p of paths){
    // Requires existing non-symlink-resolved paths genuinely outside checkout.
    const q=await externalPath(p);
    const stat=await import("node:fs/promises").then(m=>m.stat(q));
    if(!stat.isFile() || stat.size>16*1024*1024)throw Error("P80_EXTERNAL_DATA_LIMIT");
    data.push(JSON.parse(await readFile(q,"utf8")));
  }
  const report=await evaluatePrivateBlind80({
    bundle:data[0], receipts:data[1], operatorLock:data[2],
    predictions:data[3], seal:data[4], trusted:data[5],
  });
  console.log("P80_PRIVATE_BLIND_SCORING "+JSON.stringify(report));
  if(report.status==="BLOCKED")process.exitCode=3;
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) await main();
