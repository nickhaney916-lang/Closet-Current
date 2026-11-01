/** 3D72 independent offline visual review of real 3D71 WebGL evidence. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
import {WIDTHS,KINDS,ANGLES,createReviewManifest} from '../research/three-d-72/review-gate.mjs';
const sourceDir=resolve('benchmark/three-d-71'),outDir=resolve('benchmark/three-d-72');
const pad=n=>String(n).padStart(3,'0');
const names=[];
for(const width of WIDTHS)for(const kind of KINDS)for(const mode of ['before','after'])
 for(const angle of ANGLES)names.push(width+'-'+kind+'-'+mode+'-'+pad(angle)+'.png');
const files=new Map();
for(const name of names){
 const bytes=await readFile(join(sourceDir,name));
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid source PNG '+name);
 const m=await sharp(bytes).metadata();
 if(m.format!=='png'||!Number.isInteger(m.width)||!Number.isInteger(m.height))throw Error('PNG metadata invalid');
 files.set(name,{width:m.width,height:m.height,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const prior=JSON.parse(await readFile(join(sourceDir,'browser-results.json'),'utf8'));
const manifest=createReviewManifest(prior,files);
await mkdir(outDir,{recursive:true});
await writeFile(join(outDir,'verified-review-manifest.json'),JSON.stringify(manifest,null,2));
const panels=manifest.comparisons.map(c=>
 '<section class="pair"><h2>'+c.kind+' · '+c.width+' px · '+c.angle+'°</h2>'+
 '<div class="images"><figure><img loading="lazy" src="../three-d-71/'+c.before+'" alt="Baseline real 3D70 neutral trousers"><figcaption>3D70 original baseline</figcaption></figure>'+
 '<figure><img loading="lazy" src="../three-d-71/'+c.after+'" alt="3D71 real skinned rear seat and thigh"><figcaption>3D71 actual skinned geometry</figcaption></figure></div>'+
 '<label>Human visual judgment <select data-rating="'+c.id+'"><option value="">Not reviewed</option>'+
 '<option value="improved">More natural</option><option value="unchanged">Unchanged</option>'+
 '<option value="worse">Less natural</option><option value="unclear">Unclear</option></select></label>'+
 '<label>Observed seat, thigh, fabric, silhouette issues <textarea data-note="'+c.id+'" rows="2" maxlength="2000"></textarea></label></section>'
 ).join('\n');
const safeManifest=JSON.stringify({source:manifest.source,comparisons:manifest.comparisons.map(c=>
 ({id:c.id,width:c.width,kind:c.kind,angle:c.angle,beforeSHA256:c.sha256Before,afterSHA256:c.sha256After})
)}).replaceAll('<','\\u003c');
const head='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Closet Current 3D72 — real 360 visual review</title>'+
 '<style>:root{font:15px system-ui;color:#1e372c;background:#eff1ec}*{box-sizing:border-box}body{margin:0}'+
 'header{background:white;border-bottom:1px solid #d6ded4;padding:18px}main{max-width:1100px;margin:auto;padding:14px}'+
 'h1{font:normal 27px Georgia,serif;margin:0 0 8px}h2{font-size:16px;margin:2px 0 13px}'+
 '.instructions{line-height:1.55;max-width:850px}.hold{font-weight:700;color:#994b22}'+
 '.pairs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:12px}'+
 '.pair,.review{border:1px solid #d0dad0;background:white;padding:14px;border-radius:12px}'+
 '.images{display:grid;grid-template-columns:1fr 1fr;gap:9px}figure{margin:0;min-width:0}'+
 'img{display:block;width:100%;height:auto;border:1px solid #d9dfd9;border-radius:5px;background:#edece5}'+
 'figcaption{font-size:11px;line-height:1.4;padding:6px 0}label{display:block;font-size:12px;font-weight:600;margin:9px 0}'+
 'select,textarea,input,button{font:inherit;width:100%;padding:10px;margin-top:5px;border:1px solid #b5c6bb;border-radius:7px;background:white;color:#193829}'+
 'button{width:auto;min-height:44px;background:#254f37;color:white;cursor:pointer}small{color:#5f7064}.review{margin:16px 0}'+
 '</style></head><body><header><h1>Closet Current · 3D72 independent 360° human review</h1>'+
 '<span class="hold">DRAFT HOLD · NO DEPLOY · NO AUTOMATIC AESTHETIC APPROVAL</span></header><main>'+
 '<p class="instructions">These 72 genuine WebGL screenshots compare real CC0 163-joint male/female rigs at 320/390 mobile widths and nine camera angles. Before is green 3D70; after is 3D71 measured rear neutral trouser geometry. <strong>These are neutral trousers, NOT genuine photographed denim on the body.</strong> No personal photos, actual handset measurements, or release approval are implied. Judge all 36 paired views yourself; pixel change is not beauty.</p>'+
 '<section class="review"><label>Reviewer identifier <input id="reviewer" maxlength="100" placeholder="Needed to finish"></label>'+
 '<div id="progress" role="status">0 of 36 views assessed</div><button id="export" type="button">Export local human review JSON</button>'+
 '<p><small>Regardless of ratings, Family Alpha and production remain HOLD. Final human/phone approval belongs to main thread.</small></p></section>'+
 '<div class="pairs">';
const foot='</div></main><script>const manifest='+safeManifest+';'+
 'const ratings=["improved","unchanged","worse","unclear"];'+
 'const selects=[...document.querySelectorAll("select[data-rating]")];'+
 'const update=()=>document.getElementById("progress").textContent=selects.filter(x=>ratings.includes(x.value)).length+" of 36 views assessed";'+
 'selects.forEach(s=>s.addEventListener("change",update));'+
 'document.getElementById("export").addEventListener("click",()=>{'+
 'const entries=manifest.comparisons.map(c=>({id:c.id,rating:document.querySelector("[data-rating="+c.id+"]").value,'+
 'note:document.querySelector("[data-note="+c.id+"]").value})).filter(r=>ratings.includes(r.rating));'+
 'const reviewer=document.getElementById("reviewer").value.trim().slice(0,100);'+
 'const complete=entries.length===36&&reviewer.length>=2;'+
 'const out={title:"Closet Current 3D72 visual review",source:manifest.source,reviewer,'+
 'status:complete?"SUBMITTED_FOR_MAIN_THREAD_REVIEW":"INCOMPLETE_HUMAN_REVIEW",rated:entries.length,total:36,ratings:entries,'+
 'sourceSHA256Evidence:manifest.comparisons,humanPhotorealismApproved:false,releaseAuthorized:false,'+
 'physicalAndroidVerified:false,physicalIphoneVerified:false,familyAlpha:"HOLD"};'+
 'const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});'+
 'const url=URL.createObjectURL(blob),a=document.createElement("a");'+
 'a.href=url;a.download="closet-current-3d72-review-HOLD.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),0);'+
 '});</script></body></html>';
await writeFile(join(outDir,'index.html'),head+panels+foot);
console.log('THREE_D72_OFFLINE_HUMAN_REVIEW',JSON.stringify({pairs:manifest.caseCount,images:manifest.imageCount,
  humanStatus:manifest.visualReviewStatus,releaseAuthorized:manifest.releaseAuthorized}));
