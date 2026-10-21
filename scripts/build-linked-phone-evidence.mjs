// Build a fully offline, self-contained 24-scene / 30-garment worksheet.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const engine=fs.readFileSync(new URL('./linked-phone-garment-evidence.mjs',import.meta.url),'utf8').replaceAll('export ','');
const client=[
"const $=id=>document.getElementById(id);let form=blankTrial(),downloadURL=null;",
"const options=(id,a)=>{const s=$(id);s.replaceChildren();for(const v of a){const o=document.createElement('option');o.value=v;o.textContent=v;s.append(o);}};",
"const revoke=()=>{if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=null;$('download').hidden=true;$('download').removeAttribute('href');};",
"const current=()=>form.rows.find(r=>r.id===$('phone').value+'/'+$('scene').value+'/'+$('garment').value);",
"const progress=()=>{const s=summarizeTrial(form);$('progress').textContent='Reviewed '+s.reviewedOriginalScenes+'/24 source scenes, '+s.reviewedGarmentEntries+'/30 garment entries. Operator-entered initial model exact category/color: '+(s.modelExactPercentOfReviewed===null?'not measured':s.modelExactPercentOfReviewed+'%')+'. Actually saved exact category/color: '+(s.savedExactPercentOfReviewed===null?'not measured':s.savedExactPercentOfReviewed+'%')+'. Independently verified accuracy: UNMEASURED. Verified real phones: ZERO. Release BLOCKED.';};",
"const load=()=>{const row=current(),s=scenes.find(x=>x.id===$('scene').value);$('note').textContent=s.label+' — garment '+s.garments[Number($('garment').value)-1];$('truthCategory').value=row.phase==='unlabeled'?'unknown':row.truthCategory;$('truthColor').value=row.phase==='unlabeled'?'unknown':row.truthColor;const locked=row.phase!=='unlabeled';$('truthCategory').disabled=locked;$('truthColor').disabled=locked;$('lock').disabled=locked;$('results').hidden=!locked;$('record').disabled=row.phase==='recorded';for(const k of ['modelCategory','modelColor','savedCategory','savedColor','savedPhoto']){$(k).value=row[k];$(k).disabled=row.phase==='recorded';}progress();};",
"const items=()=>{const s=scenes.find(x=>x.id===$('scene').value);options('garment',s.garments.map((_,i)=>String(i+1)));load();};",
"options('phone',platforms);options('scene',scenes.map(s=>s.id));options('truthCategory',['unknown',...categories]);options('truthColor',['unknown',...colors]);options('modelCategory',['not_tested','unrecognized',...categories]);options('modelColor',['not_tested','unrecognized',...colors]);options('savedCategory',['not_tested','not_saved',...categories]);options('savedColor',['not_tested','not_saved',...colors]);options('savedPhoto',['not_tested','not_saved','clear','pixelated','missing']);",
"for(const id of ['phone','scene','garment'])$(id).addEventListener('change',()=>{revoke();id==='scene'?items():load();});",
"$('build').addEventListener('input',()=>{revoke();$('message').textContent='App build changed; export again after review.';});",
"$('lock').onclick=()=>{revoke();const r=current(),c=$('truthCategory').value,color=$('truthColor').value;if(!categories.includes(c)||!colors.includes(color)){$('message').textContent='Choose original category and color first.';return;}r.phase='locked';r.truthCategory=c;r.truthColor=color;validateTrial(form);$('message').textContent='Original label locked. Only now view app prediction.';load();};",
"$('record').onclick=()=>{revoke();const r=current(),before={...r};for(const k of ['modelCategory','modelColor','savedCategory','savedColor','savedPhoto'])r[k]=$(k).value;r.phase='recorded';try{validateTrial(form);$('message').textContent='Recorded separately: initial model and saved result.';}catch{Object.assign(r,before);$('message').textContent='Finish model and saved fields. If not saved, set all saved fields to not_saved.';}load();};",
"$('reset').onclick=()=>{revoke();const r=current();Object.assign(r,blankTrial().rows.find(x=>x.id===r.id));$('message').textContent='This item reset. Label original first.';load();};",
"$('export').onclick=()=>{revoke();form.appRelease=$('build').value.trim()||'unavailable';try{validateTrial(form);downloadURL=URL.createObjectURL(new Blob([JSON.stringify(form,null,2)],{type:'application/json'}));$('download').href=downloadURL;$('download').hidden=false;$('message').textContent='Anonymous fixed-choice JSON prepared locally; nothing uploaded.';}catch{$('message').textContent='Build must be 12 lowercase hexadecimal characters or blank.';}progress();};",
"$('import').onchange=async()=>{revoke();try{const f=$('import').files[0];if(!f||f.size>131072)throw Error();form=parseTrial(await f.text());$('build').value=form.appRelease==='unavailable'?'':form.appRelease;$('phone').value='Android';$('scene').value=scenes[0].id;items();$('message').textContent='Validated private report loaded.';}catch{$('message').textContent='Import rejected. No private data displayed.';}$('import').value='';};",
"window.addEventListener('pagehide',()=>{if(downloadURL)URL.revokeObjectURL(downloadURL);});items();"
].join('\n');
export function linkedPhoneHTML(){
 const choice=(id,label)=>'<label>'+label+'<select id="'+id+'"></select></label>';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39;; style-src &#39;unsafe-inline&#39;; connect-src &#39;none&#39;; img-src &#39;none&#39;; object-src &#39;none&#39;; form-action &#39;none&#39;">'+
 '<title>Closet Current phone original-first trials</title><style>body{font:18px/1.5 system-ui;max-width:700px;margin:0 auto;padding:16px;background:#f7f9f7;color:#163629}*{box-sizing:border-box}section{background:white;margin:14px 0;padding:16px;border:1px solid #b4c7bb;border-radius:12px}label{display:block;margin:12px 0}input,select,button,a{font:inherit;display:block;width:100%;min-height:48px;padding:10px;margin:8px 0;border-radius:8px}button,a.action{background:#1c5e49;color:white;text-align:center;border:0}button:disabled{opacity:.5}[hidden]{display:none!important}.warn{background:#fff2dc;border-left:5px solid #a86830;padding:12px}</style></head>'+
 '<body><h1>Closet Current — 24 phone scenes</h1><p class="warn">Offline worksheet only. Test app only after protected staging is independently approved. No photos, names, emails or accounts are collected. This is operator-reported diagnostic accuracy, NOT verified production accuracy.</p>'+
 '<section><h2>Select phone / untouched original</h2><label>App build (optional)<input id="build" maxlength="12" autocomplete="off" placeholder="12 lowercase hex"></label>'+choice('phone','Platform')+choice('scene','Original scene')+choice('garment','Garment in original')+'<p id="note"></p></section>'+
 '<section><h2>1. Label the ORIGINAL before seeing the model result</h2>'+choice('truthCategory','Original category')+choice('truthColor','Original color')+'<button id="lock">Lock original label</button></section>'+
 '<section id="results" hidden><h2>2. Record initial prediction then saved item</h2>'+choice('modelCategory','Initial model category')+choice('modelColor','Initial model color')+choice('savedCategory','Actually saved category')+choice('savedColor','Actually saved color')+choice('savedPhoto','Actually saved photo sharpness')+'<button id="record">Record garment</button></section>'+
 '<section><button id="reset">Reset this garment only</button><h2>3. Review evidence</h2><p id="progress" role="status" aria-live="polite"></p><button id="export">Prepare private report</button><a class="action" id="download" download="closet-phone-trials.json" hidden>Download fixed-choice JSON</a><label>Resume previous worksheet<input id="import" type="file" accept=".json,application/json"></label><p id="message" role="status"></p></section>'+
 '<p>12 untouched original scenes per platform, 15 garment observations per platform. The full-outfit scene has four garments. A corrected save never changes whether the initial prediction was correct. No browser upload or storage.</p>'+
 '<script>'+engine+';'+client+'</script></body></html>';
}
export function writeLinkedPhoneHTML(output){
 const name=path.resolve(output);fs.mkdirSync(path.dirname(name),{recursive:true,mode:0o700});
 fs.writeFileSync(name,linkedPhoneHTML(),{flag:'wx',mode:0o600});
 return {output:name,networkRequests:0,physicalHardwareVerified:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node scripts/build-linked-phone-evidence.mjs NEW-OUTPUT.html');
 console.log(JSON.stringify(writeLinkedPhoneHTML(process.argv[2])));
}
