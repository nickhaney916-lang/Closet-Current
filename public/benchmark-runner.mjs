const $=id=>document.getElementById(id),status=$('status');let output=[];
function workerSession(){
 const worker=new Worker('./local-worker.mjs',{type:'module'});let sequence=0;const pending=new Map();
 worker.onmessage=({data})=>{if(data.type==='progress'||data.type==='identified')return;const p=pending.get(data.id);if(!p)return;if(data.type==='result'||data.type==='ready'){pending.delete(data.id);p.resolve(data);}else if(data.type==='error'){pending.delete(data.id);p.reject(Error(data.code||data.text||'Worker failed'));}};
 worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message||'Worker failed'));pending.clear();};
 return {call(payload){const id=++sequence;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({...payload,id});});},close(){worker.terminate();}};
}
async function jpeg(file){
 const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.94);}finally{bitmap.close();}
}
async function estimateColor(image){const img=new Image();img.src=image;await img.decode();const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,16,16);return window.PhotoColor.estimate(ctx.getImageData(0,0,16,16).data,16,16);}
$('run').onclick=async()=>{
 $('run').disabled=true;$('download').disabled=true;output=[];
 let session;try{
  const manifestFile=$('manifest').files[0];if(!manifestFile)throw Error('Select a manifest first.');
  const manifest=JSON.parse(await manifestFile.text());if(!Array.isArray(manifest)||!manifest.length)throw Error('Manifest must be a nonempty array.');
  const files=new Map([...$('photos').files].map(f=>[f.name,f]));if(!files.size)throw Error('Select photos.');
  session=workerSession();status.textContent='Loading local recognition model…';await session.call({type:'load'});
  for(const [i,item] of manifest.entries()){
   if(!item.id||!item.image||item.mode!=='single'){output.push({id:item.id||'invalid-'+i,error:'Unsupported or invalid entry: single mode only'});continue;}
   const file=files.get(item.image);if(!file){output.push({id:item.id,error:'Image file missing'});continue;}
   status.textContent='Processing '+(i+1)+'/'+manifest.length+': '+item.image;
   const started=performance.now();
   try{const data=await jpeg(file),colorEstimate=await estimateColor(data),result=await session.call({type:'classify',image:data});const framingComparison=['commons-0045','commons-0070'].includes(item.id)?(await session.call({type:'benchmark-frames',image:data,benchmarkId:item.id})).variants:null;const choice=result.choices?.[0];output.push({id:item.id,framingComparison,prediction:{category:choice?.category||null,type:choice?.itemType||null},strong:!!result.strong,categoryConfirmed:!!result.categoryConfirmed,preprocessingRecovery:!!result.preprocessingRecovery,reason:result.reason||null,details:result.details||{},recognitionMemory:result.recognitionMemory||null,colorEstimate,sleeveLength:choice?.sleeveLength||'Unknown',diagnostics:result.diagnostics||null,elapsedMs:Math.round(performance.now()-started)});}
   catch(e){output.push({id:item.id,error:String(e.message||e)});}
  }
  status.textContent='Finished '+output.length+' images. Download results and run the evaluator. '+output.filter(x=>x.error).length+' errors.';$('download').disabled=false;
 }catch(e){status.textContent='Benchmark stopped: '+String(e.message||e);}finally{session?.close();$('run').disabled=false;}
};
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='closet-benchmark-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
