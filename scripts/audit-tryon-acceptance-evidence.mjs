import {readFile} from 'node:fs/promises';
import {auditTryOnAcceptance} from '../benchmark/tryon-acceptance-evidence.mjs';
const args=process.argv.slice(2),options={};
const flags=new Set(['--branch-sha','--android','--iphone','--fidelity']);
let requireComplete=false;
for(let i=0;i<args.length;i++){
 if(args[i]==='--require-complete'){requireComplete=true;continue;}
 if(!flags.has(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid acceptance-audit arguments');
 options[args[i].slice(2)]=args[++i];
}
async function read(path){try{return JSON.parse(await readFile(path,'utf8'));}catch{throw Error('Acceptance record could not be read or parsed');}}
const phone='benchmark/MULTIGARMENT-PHONE-EVIDENCE-TEMPLATE.json';
const [android,iphone,fidelity]=await Promise.all([
 read(options.android||phone),read(options.iphone||phone),
 read(options.fidelity||'benchmark/MULTIGARMENT-LIVE-FIDELITY-TEMPLATE.json')
]);
const result=auditTryOnAcceptance({branchSha:options['branch-sha'],android,iphone,fidelity});
console.log(JSON.stringify(result,null,2));
if(requireComplete&&!result.evidenceRecordsComplete)process.exitCode=1;
