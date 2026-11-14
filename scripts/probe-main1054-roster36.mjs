/**
 * MAIN1054 M36, no-deploy synthetic desktop Node probe of the M34 full-roster
 * serialization + cryptographic seal + re-read + synchronous CAS overhead.
 * Never accepts or reads account/photo inputs, never sends anything to a server.
 * NOT A BROWSER, AUTHENTIC USER, OR PHYSICAL PHONE PERFORMANCE CERTIFICATE.
 */
import {performance} from 'node:perf_hooks';
import {webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {sealDurablePrivateWardrobe34} from '../research/main1054-revision34/durable-roster.mjs';

const FIXTURE_PREFIX='SYNTHETIC_NO_PHOTO_';
const SIZE_TIERS=[1,25,100,250,500];
const MAX_ITEMS=500;
const MAX_BYTES=16384;
const ORDERED_ITERATIONS=5;
function percentile(sorted,p){return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];}
function stats(xs){const values=xs.slice().sort((a,b)=>a-b);return {p50Ms:+percentile(values,.5).toFixed(2),p95Ms:+percentile(values,.95).toFixed(2),maxMs:+values.at(-1).toFixed(2)};}
function fixtureRows(count,perRowChars){
 if(!Number.isInteger(count)||count<1||count>MAX_ITEMS||!Number.isInteger(perRowChars)||perRowChars<1||perRowChars>MAX_BYTES)throw Error('M36_INVALID_SYNTHETIC_TIER');
 const payload=FIXTURE_PREFIX+'X'.repeat(perRowChars);
 return Array.from({length:count},(_,i)=>({id:'synthetic-'+String(i).padStart(5,'0'),ownerId:'m36-synthetic-owner',category:'Tops',itemType:'Shirt',originalPhoto:{image:payload,sha256:'0'.repeat(64)},notes:'synthetic benchmark only'}));
}
export async function measureTier36({count,perRowChars=8192,iterations=ORDERED_ITERATIONS}={}){
 if(!Number.isInteger(iterations)||iterations<2||iterations>20)throw Error('M36_INVALID_ITERATIONS');
 const rows=fixtureRows(count,perRowChars);
 const ownerId='m36-synthetic-owner';
 const authRef={user:{id:ownerId},assertCurrent(){}};
 const privateDbRef={name:'closet-current-user-'+ownerId};
 let revision=1;
 const getSession=()=>({ownerId,authenticated:true,epoch:1,operationEpoch:1,authRef,privateDbRef,privateDbName:privateDbRef.name});
 const getRevision=()=>revision;
 const readOwnerItems=async proof=>{proof.assertCurrent();return structuredClone(rows);};
 const durations={seal:[],verify:[],atomicCompare:[]};
 let rssMax=0;
 for(let i=0;i<iterations;i++){
  const start=performance.now();
  const receipt=await sealDurablePrivateWardrobe34({getSession,getRevision,readOwnerItems,records:rows,cryptoProvider:webcrypto});
  durations.seal.push(performance.now()-start);
  if(receipt.itemCount!==count||!/^sha256:[a-f0-9]{64}$/.test(receipt.revision))throw Error('M36_INVALID_RECEIPT');
  const tVerify=performance.now();
  if(await receipt.verify()!==true)throw Error('M36_VERIFICATION_FAILED');
  durations.verify.push(performance.now()-tVerify);
  const tCompare=performance.now();
  if(receipt.matchesRows(rows)!==true)throw Error('M36_CAS_FAILED');
  durations.atomicCompare.push(performance.now()-tCompare);
  if(i===0){
   const altered=rows.slice();altered.push({id:'extra',ownerId,originalPhoto:{image:FIXTURE_PREFIX}});
   if(receipt.matchesRows(altered)!==false)throw Error('M36_ADDED_ROW_UNDETECTED');
   const edited=rows.slice();edited[0]={...edited[0],itemType:'Coat'};
   if(receipt.matchesRows(edited)!==false)throw Error('M36_EDIT_UNDETECTED');
  }
  if(JSON.stringify({status:receipt.status,revision:receipt.revision,itemCount:receipt.itemCount}).includes(FIXTURE_PREFIX))throw Error('M36_PRIVATE_PAYLOAD_LEAK');
  receipt.dispose();
  rssMax=Math.max(rssMax,process.memoryUsage().rss);
 }
 revision++;
 return {itemCount:count,syntheticPayloadCharsPerItem:perRowChars,iterations,seal:stats(durations.seal),verify:stats(durations.verify),transactionRosterCompare:stats(durations.atomicCompare),peakNodeRssMiB:+(rssMax/(1024**2)).toFixed(1)};
}
export async function runProbe36(){
 const results=[];
 for(const count of SIZE_TIERS)results.push(await measureTier36({count}));
 return {gate:'DESKTOP_NODE_SYNTHETIC_BENCHMARK_ONLY_NO_MOBILE_GO',fixture:'fake repeated text, not valid JPEGs',browser:'NOT_TESTED',realIdb:'NOT_TESTED',physicalAndroid:'NOT_TESTED',physicalIphone:'NOT_TESTED',hostedAccounts:'NOT_TESTED',source3d:'NOT_TESTED',results};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const result=await runProbe36();
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
