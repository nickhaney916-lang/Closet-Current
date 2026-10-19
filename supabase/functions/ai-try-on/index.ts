// Undeployed integration. No environment setting can approve paid submission.
import {createPredictionTokens} from './job-tokens.mjs';
import {createTryOnHandler,createRpcTransport} from './http.mjs';
import {createSubmissionLedger} from './submission.mjs';

const {signPrediction,readPrediction}=createPredictionTokens(()=>Deno.env.get('TRYON_JOB_SIGNING_KEY'));

const RESERVED_PAID_INFERENCE_APPROVED=false;
const CHAINED_PAID_INFERENCE_APPROVED=false;
const env=(name:string)=>Deno.env.get(name);
const ledger=createSubmissionLedger(createRpcTransport({env}));
Deno.serve(createTryOnHandler({env,ledger,signPrediction,readPrediction,
 submissionApproved:RESERVED_PAID_INFERENCE_APPROVED,chainedApproved:CHAINED_PAID_INFERENCE_APPROVED}));
