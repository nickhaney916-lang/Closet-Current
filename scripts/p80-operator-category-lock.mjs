/**
 * P80 OFFLINE research-only evidence admission for a separately pinned,
 * pre-model/pre-label OPERATOR-CATEGORY lock. Signatures prove key custody,
 * not human identity, absence of leaked labels, or independent accuracy.
 *
 * All rows/receipts remain private and outside Git and CI. No file I/O.
 */
import {createPublicKey, verify as ed25519Verify} from "node:crypto";
import {CATEGORIES, canonical, sha256, isHex64} from "./p75-dataset-core.mjs";

export const CATEGORY_LOCK80 = "p80-independent-operator-category-lock-v1";
const COMMIT = /^[a-f0-9]{40}$/;
/**
 * Evidence custody uses one canonical, unambiguous UTC clock representation.
 * Date.parse alone normalizes impossible calendar dates (e.g. February 31)
 * and accepts timezone-ambiguous strings. Neither may certify chronology.
 */
export function strictUtcInstant80(x){
  if(typeof x!=="string" ||
     !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(x))return NaN;
  const ms=Date.parse(x);
  return Number.isFinite(ms) && new Date(ms).toISOString()===x ? ms : NaN;
}
const ownsExactly = (v, expected) =>
  v && typeof v === "object" && !Array.isArray(v) &&
  Object.keys(v).length === expected.length &&
  expected.every(k => Object.hasOwn(v,k) &&
    Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),"value"));

/**
 * Preconditions are independently owner-pinned registrar, operator and scorer
 * keys, frozen source/model/commit, and a registrar-vetted distinct operator.
 * The same source-set must be used by the locked operator and sealed scorer.
 *
 * Blind category declarations must be timestamped after owner policy approval
 * but BEFORE the model is run; reviewer labels must follow sealed model output.
 * Wall-clock statements are not trusted time attestations; an external
 * custodian must independently validate real-world execution order.
 */
export function verifyOperatorCategoryLock80(
  lock, predictions, trusted, scoredAt, now = Date.now()
) {
  const fields=[
    "schema","targetCommit","modelSha256","sourceSetSha256",
    "recordedAt","rows","publicKey","signature",
  ];
  if (!ownsExactly(lock,fields) || lock.schema!==CATEGORY_LOCK80 ||
      !COMMIT.test(lock.targetCommit) || !isHex64(lock.modelSha256) ||
      !isHex64(lock.sourceSetSha256) ||
      !Array.isArray(lock.rows) || lock.rows.length < 60 ||
      lock.rows.length > 500 ||
      !Array.isArray(predictions) ||
      predictions.length !== lock.rows.length ||
      !trusted || !isHex64(trusted.operatorFingerprint) ||
      !isHex64(trusted.scorerFingerprint) ||
      !isHex64(trusted.registrarFingerprint) ||
      new Set([trusted.operatorFingerprint,trusted.scorerFingerprint,
        trusted.registrarFingerprint]).size !== 3 ||
      trusted.targetCommit !== lock.targetCommit ||
      trusted.modelSha256 !== lock.modelSha256 ||
      !Number.isFinite(now) ||
      !(strictUtcInstant80(trusted.approvedAt) < strictUtcInstant80(lock.recordedAt) &&
        strictUtcInstant80(lock.recordedAt) < strictUtcInstant80(scoredAt) &&
        strictUtcInstant80(scoredAt) <= now &&
        now-strictUtcInstant80(lock.recordedAt) <= 30*86400000)) return false;

  const rowsBySha=new Map();
  for(const entry of lock.rows){
    if(!ownsExactly(entry,[
      "sourceSha256","operatorCategory","predictionsHidden",
      "blindLabelsHidden",
    ]) || !isHex64(entry.sourceSha256) ||
       !Object.hasOwn(CATEGORIES,entry.operatorCategory) ||
       entry.predictionsHidden!==true || entry.blindLabelsHidden!==true ||
       rowsBySha.has(entry.sourceSha256))return false;
    rowsBySha.set(entry.sourceSha256,entry);
  }
  const predSeen=new Set();
  for(const pred of predictions){
    const sha=pred?.sourceSha256, operator=rowsBySha.get(sha);
    if(!isHex64(sha) || predSeen.has(sha) || !operator ||
       pred.operatorCategory!==operator.operatorCategory ||
       pred.operatorCategoryProvenance!=="blind-operator-before-truth-reveal" ||
       pred.modelSha256!==lock.modelSha256)return false;
    predSeen.add(sha);
  }
  if(sha256(canonical([...rowsBySha.keys()].sort()))!==lock.sourceSetSha256)
    return false;
  const {publicKey,signature,...payload}=lock;
  try{
    if(typeof publicKey!=="string" || typeof signature!=="string" ||
       !/^[A-Za-z0-9+/=]+$/.test(signature))return false;
    const key=createPublicKey(publicKey);
    return key.asymmetricKeyType==="ed25519" &&
      sha256(key.export({type:"spki",format:"der"}))===
        trusted.operatorFingerprint &&
      ed25519Verify(null,Buffer.from(canonical(payload)),key,
        Buffer.from(signature,"base64"));
  }catch{return false;}
}

/** Signed clocks are insufficient to prove human independence, but the
 * machine contract must not accept scoring AFTER human truth was recorded. */
export function blindTemporalOrder80(approvedAt, categoryAt, scoredAt, reviewTimes, now=Date.now()){
  if(!Array.isArray(reviewTimes) || reviewTimes.length<2 ||
     !Number.isFinite(now))return false;
  const a=strictUtcInstant80(approvedAt), c=strictUtcInstant80(categoryAt), s=strictUtcInstant80(scoredAt);
  return Number.isFinite(a) && Number.isFinite(c) && Number.isFinite(s) &&
    a<c && c<s && s<=now &&
    reviewTimes.every(r=>Number.isFinite(strictUtcInstant80(r)) && s<strictUtcInstant80(r) &&
      strictUtcInstant80(r)<=now);
}
