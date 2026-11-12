import {photoCategories,photoTypes,photoColors,lockPhotoLabels,phonePhotoResult,photoFailure,scorePhonePhotos,phonePhotoColorTrialReadout} from './phone-photo-benchmark.mjs';
import {photoTestSession} from './photo-test-session.mjs';
import {prepareTrialPhotoJPEG832} from './phone-photo-prep-832.mjs';
const $=id=>document.getElementById(id);let rows=[],report=null,session=null,decodeController=null,generation=0,locked=false;
function option(select,text,value){const item=document.createElement('option');item.textContent=text;item.value=value;select.append(item);}
function readiness(){ $('run').disabled=locked||!rows.length||rows.some(r=>!r.category.value); }
function reset({preserveFiles=false}={}){
 generation++;decodeController?.abort();decodeController=null;session?.close();session=null;for(const row of rows){URL.revokeObjectURL(row.url);}rows=[];report=null;locked=false;
 $('photoRows').replaceChildren();if(!preserveFiles)$('photos').value='';$('photos').disabled=false;$('run').textContent='Check recognition';$('run').disabled=true;$('restart').hidden=true;$('download').hidden=true;$('summary').hidden=true;$('status').textContent='Choose your photos to begin.';
}
$('restart').onclick=reset;
$('photos').onchange=()=>{
 const files=[...$('photos').files];reset({preserveFiles:true});if(!files.length)return;
 if(files.length>20||files.some(f=>f.size>10*1024*1024)){$('status').textContent='Choose up to 20 photos, each smaller than 10 MB.';return;}
 for(const [i,file] of files.entries()){
  const card=document.createElement('section');card.className='photo';const url=URL.createObjectURL(file),image=document.createElement('img');image.src=url;image.alt='Photo '+(i+1);card.append(image);
  const fields=document.createElement('div'),title=document.createElement('strong');title.textContent='Photo '+(i+1);fields.append(title);
  const category=document.createElement('select'),type=document.createElement('select'),color=document.createElement('select');category.id='category-'+i;type.id='type-'+i;color.id='color-'+i;
  const a=document.createElement('label');a.textContent='What is it?';a.append(category);option(category,'Choose a category','');for(const value of photoCategories)option(category,value,value);option(category,'Not clothing','Uncategorized');
  const b=document.createElement('label');b.textContent='Clothing type (optional)';b.append(type);option(type,'Check category only','');type.disabled=true;
  const d=document.createElement('label');d.textContent='Primary color (optional)';d.append(color);option(color,'Do not check color','');for(const value of photoColors)option(color,value,value);color.disabled=true;
  category.onchange=()=>{type.replaceChildren();option(type,'Check category only','');for(const value of photoTypes(category.value))option(type,value,value);type.disabled=!category.value||category.value==='Uncategorized';color.disabled=type.disabled;if(color.disabled)color.value='';readiness();};
  const result=document.createElement('p');result.className='result';result.id='result-'+i;fields.append(a,b,d,result);card.append(fields);$('photoRows').append(card);rows.push({file,url,category,type,color,result});
 }
 $('restart').hidden=false;$('status').textContent='Choose the labels yourself. They will stay locked while recognition runs.';readiness();
};
$('run').onclick=async()=>{
 const mine=generation;let labels;
 try{labels=lockPhotoLabels(rows.map(r=>({category:r.category.value,type:r.type.value,color:r.color.value})));}catch(e){$('status').textContent=e.message;return;}
 locked=true;decodeController?.abort();decodeController=new AbortController();report=null;$('download').hidden=true;$('summary').hidden=true;$('run').disabled=true;$('photos').disabled=true;for(const row of rows){row.category.disabled=true;row.type.disabled=true;row.color.disabled=true;row.result.textContent='Waiting…';}
 const results=[];
 try{
  $('status').textContent='Preparing recognition…';
  session=photoTestSession({workerUrl:'./local-worker.mjs'+new URL(import.meta.url).search,onProgress:data=>{if(mine===generation&&data.stage==='weights'&&Number.isFinite(data.percent))$('status').textContent='Preparing recognition… '+Math.max(0,Math.min(100,data.percent))+'%';}});
  await session.call({type:'load'});
  for(const [i,row] of rows.entries()){
   if(mine!==generation)return;$('status').textContent='Checking photo '+(i+1)+' of '+rows.length+'…';row.result.textContent='Checking…';const started=performance.now();let result;
   try{
    const image=await prepareTrialPhotoJPEG832(row.file,{signal:decodeController.signal});
    if(mine!==generation)return;
    const raw=await session.call({type:'classify',image});result=phonePhotoResult(labels[i].id,raw,performance.now()-started);
   }catch(e){result=photoFailure(labels[i].id,e.code||'image');}
   if(mine!==generation)return;results.push(result);
   row.result.textContent=result.error?'Could not finish this photo.':!result.strong&&!result.categoryConfirmed?(labels[i].expectedCategory==='Uncategorized'?'No clothing label accepted':'Needs review'):result.prediction.category+' · '+(result.prediction.type||'Unknown')+(result.categoryConfirmed&&!result.strong?' · Review type':'');
  }
  report=scorePhonePhotos(labels,results,{release:document.querySelector('meta[name="closet-release"]').content,indexHash:document.querySelector('meta[name="recognition-index"]').content});
  // Show a verdict only after ALL original pre-inference human labels are locked
  // and scored. Never mistake an abstention for an automatic recognition match.
  for(const [i,scored] of report.photos.entries()){
   const verdict=phonePhotoColorTrialReadout(scored);
   rows[i].result.textContent=verdict.title+'\n'+verdict.detail;
   rows[i].result.closest('.photo').dataset.resultState=verdict.state;
  }
  const s=report.summary;
  $('summary').textContent=s.categoryMatches+' of '+s.garments+' labeled garment categories matched (including results that require review). '+s.typeMatches+' of '+s.typesChecked+' labeled types matched. '+s.colorMatches+' of '+s.colorsChecked+' labeled primary colors matched; '+s.colorUnreported+' were not verified. '+s.incorrectAutomaticColors+' incorrect automatic colors. '+s.incorrectAutomaticCategories+' wrong automatic category results. '+s.uncertain+' uncertain results. '+s.errors+' photos could not finish.'+(s.negativePhotos?' '+s.negativeRejected+' of '+s.negativePhotos+' nonclothing photos rejected.':'');
  $('summary').hidden=false;$('download').hidden=false;$('status').textContent='Finished. Review each photo below and download the photo-free result report, or start over.';
 }catch(e){if(mine===generation){$('status').textContent='Recognition could not start. Try again, or start over with different photos.';$('run').textContent='Try again';$('run').disabled=false;}}
 finally{if(mine===generation){decodeController?.abort();decodeController=null;session?.close();session=null;}}
};
$('download').onclick=()=>{
 if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='closet-phone-photo-results.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('pagehide',()=>{decodeController?.abort();session?.close();for(const row of rows){URL.revokeObjectURL(row.url);}});
