/**
 * Mission 1 P774 — immutable known-development-photo source exposure.
 * Original bytes/identities independently recovered from the successful
 * genuine two-browser publisher-photo result artifact for P772:
 * https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42743671008
 * artifact ID 13730830952, research/real-garment-acceptance-66/fashionpedia-sample.json.
 *
 * These eight real source JPEGs were all measured on SegFormer for P772/P773.
 * None is an untouched prospective validation image anymore. The photo with
 * publisher image ID 10927 also triggered P769 near-similarity quarantine.
 *
 * This is source exclusion metadata, NOT genuine new two-human ground truth.
 */
import {readFileSync} from 'node:fs';
const HISTORIC_59=JSON.parse(readFileSync(new URL('../../benchmark/locked-photo-sources.json',import.meta.url),'utf8'));
if(!Array.isArray(HISTORIC_59)||HISTORIC_59.length!==59||
  new Set(HISTORIC_59.map(x=>x.sha256)).size!==59||
  HISTORIC_59.some(x=>!/^[a-f0-9]{64}$/.test(x.sha256||'')))
 throw Error('MISSION1_EXPOSURE_774: canonical 59 original source identities unavailable');
export const P59_EXPOSED_DIGESTS_774=Object.freeze(HISTORIC_59.map(x=>x.sha256));

export const MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774=Object.freeze([
 Object.freeze({id:17971,image:'feaf57ce6d6018c613fc1e6646eb8d61.jpg',sha256:'4bbcc7740056454ba02db56c37b386d526d9b7a1fe5d397dfea7225befbf4583',targetPublisherCategory:0,visualSimilarityQuarantined:false}),
 Object.freeze({id:18204,image:'c0a478558194a03c19b1ac9d61d5777c.jpg',sha256:'fcbf6213998dba4aabd876a1b14b78626a13d5bd07537ddc1bd0fe50cb28bb6d',targetPublisherCategory:1,visualSimilarityQuarantined:false}),
 Object.freeze({id:12246,image:'20bdefcd48f74c927cca2870e52176b1.jpg',sha256:'3faa4f0b25e389805375c3ad466e9199c2a3457b111c76823d01aa4b422b8b28',targetPublisherCategory:4,visualSimilarityQuarantined:false}),
 Object.freeze({id:18179,image:'b5c8c768b2bc55ca312ffcbdabbc4acd.jpg',sha256:'c081698bdc9674a400c717793960ed046d654bef49a6a911d949081ddbe227a0',targetPublisherCategory:6,visualSimilarityQuarantined:false}),
 Object.freeze({id:18418,image:'c035ab1c7504b8e89f22f3b2f06abec4.jpg',sha256:'c93af8f2b80c47eadd490855a0ce25b2ee4bfe4d3aa5906e37570d6c8b04e651',targetPublisherCategory:7,visualSimilarityQuarantined:false}),
 Object.freeze({id:18406,image:'91d2989ccce4a5b3e4789f48b4e05a68.jpg',sha256:'43af263e68507b989369920606663a238509516037c5dd271a174833b30bcc42',targetPublisherCategory:8,visualSimilarityQuarantined:false}),
 Object.freeze({id:9973,image:'7064070549ca197a6bbf5be963dd3550.jpg',sha256:'a567fdeb4bc9939096d78a8460cfb7f9e0ce230107ea165f8fb078755ecc3004',targetPublisherCategory:10,visualSimilarityQuarantined:false}),
 Object.freeze({id:10927,image:'9899405b768a99e31657ccf8d2931e92.jpg',sha256:'65a19ff801f1aa4d4450344f86689ab5edb7a4b71608dfb07a9f45ee2cc00280',targetPublisherCategory:23,visualSimilarityQuarantined:true})
]);
export const P772_EXPOSED_DIGESTS_774=Object.freeze(
 MISSION1_P772_PUBLISHED_DEVELOPMENT_SOURCES_774.map(x=>x.sha256)
);
export const MISSION1_MINIMUM_KNOWN_EXPOSED_ORIGINALS_774=73; // 59+6+8
