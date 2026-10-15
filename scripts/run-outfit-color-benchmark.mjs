// Real Segformer + FashionCLIP workers. No mocked masks or predictions.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const output=resolve(process.argv[2]||'benchmark/outfit-color'),root=resolve('dist'),photos=resolve('benchmark/photos');
const manifest=JSON.parse(await readFile('benchmark/manifest-outfit-color-7.json','utf8'));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),base=path.startsWith('/fixtures/')?photos:root,relative=path.startsWith('/fixtures/')?path.slice(10):path,name=resolve(base,'.'+(relative.startsWith('/')?relative:'/'+relative));if(!name.startsWith(base+'/'))throw Error('Invalid path');const data=await readFile(name);res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
await mkdir(output,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({args:['--no-sandbox']});const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/benchmark.html');
 const results=await page.evaluate(async manifest=>{
  function session(url){const worker=new Worker(url,{type:'module'});let seq=0;const pending=new Map();worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p||['progress','identified'].includes(data.type))return;if(data.type==='piece'){p.pieces.push(data.piece);return;}clearTimeout(p.timer);pending.delete(data.id);if(data.type==='error')p.reject(Error(data.code||data.text));else p.resolve(data.type==='done'?p.pieces:data);};worker.onerror=e=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(e.message));}pending.clear();};return {call(payload){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('Real worker timed out'));},300000);pending.set(id,{resolve,reject,timer,pieces:[]});worker.postMessage({...payload,id});});},close(){worker.terminate();}};}
  const segment=session('/outfit-worker.mjs'),recognition=session('/local-worker.mjs'),rows=[];
  try{
   await recognition.call({type:'load'});
   for(const photo of manifest.photos){
    const blob=await(await fetch('/fixtures/'+photo.image)).blob(),bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas'),scale=Math.min(1,3072/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const pieces=await segment.call({image:canvas.toDataURL('image/jpeg',.94)});
    for(const piece of pieces){const r=await recognition.call({type:'classify',image:piece.recognitionPhoto.image,hint:piece.hint});piece.classification={strong:!!r.strong,categoryConfirmed:!!r.categoryConfirmed,choices:r.choices,reason:r.reason||null};}
    rows.push({id:photo.id,pieces});
   }
   return rows;
  }finally{segment.close();recognition.close();}
 },manifest);
 const summary={photos:results.length,expectedPieces:0,matchedPieces:0,correctMaskColors:0,tentativeMaskColors:0,missing:[],colorErrors:[],unexpected:[]};
 for(const row of results){const expected=manifest.photos.find(x=>x.id===row.id).expectedPieces;summary.expectedPieces+=expected.length;
  for(const [i,p]of row.pieces.entries()){
   for(const [field,suffix]of [['image','display'],['recognitionPhoto','recognition']]){const url=field==='image'?p.image:p.recognitionPhoto.image,bytes=Buffer.from(url.split(',')[1],'base64');await writeFile(output+'/'+row.id+'-'+i+'-'+suffix+'.jpg',bytes);p[field==='image'?'displaySha256':'recognitionSha256']=createHash('sha256').update(bytes).digest('hex');}
   delete p.image;delete p.recognitionPhoto;
   const e=expected.find(x=>x.label===p.label);if(!e){summary.unexpected.push({id:row.id,label:p.label});continue;}summary.matchedPieces++;if(p.colorEstimate?.color===e.color)summary.correctMaskColors++;else summary.colorErrors.push({id:row.id,label:p.label,expected:e.color,actual:p.colorEstimate?.color||null});if(p.colorEstimate?.needsConfirmation)summary.tentativeMaskColors++;
  }
  for(const e of expected)if(!row.pieces.some(x=>x.label===e.label))summary.missing.push({id:row.id,label:e.label});
 }
 await writeFile(output+'/results.json',JSON.stringify({manifest,summary,results},null,2));console.log(JSON.stringify(summary,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
