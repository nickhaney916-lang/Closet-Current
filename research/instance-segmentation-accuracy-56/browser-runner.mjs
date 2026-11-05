const CLASS_NAMES = [
  'short_sleeve_top','long_sleeve_top','short_sleeve_outwear','long_sleeve_outwear',
  'vest','sling','shorts','trousers','skirt','short_sleeve_dress',
  'long_sleeve_dress','vest_dress','sling_dress'
];
const PHOTOS = [
  {id:'commons-0021',title:'Worn outfit, overlapping garments'},
  {id:'commons-0033',title:'Worn shirt and shorts'},
  {id:'commons-0080',title:'Layered outfit'}
];
const sha256 = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');
function jpegDataUrl(bytes){
  const values=new Uint8Array(bytes);let binary='';
  for(let i=0;i<values.length;i+=0x8000)binary+=String.fromCharCode(...values.subarray(i,i+0x8000));
  return 'data:image/jpeg;base64,'+btoa(binary);
}
const status = text => { document.querySelector('#status').textContent = text; };

function makeInput(image) {
  const scale=Math.min(416/image.naturalWidth,416/image.naturalHeight);
  const width=Math.round(image.naturalWidth*scale),height=Math.round(image.naturalHeight*scale);
  const padX=Math.floor((416-width)/2),padY=Math.floor((416-height)/2);
  const canvas=document.createElement('canvas');canvas.width=416;canvas.height=416;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='rgb(114,114,114)';ctx.fillRect(0,0,416,416);
  ctx.drawImage(image,padX,padY,width,height);
  const rgba=ctx.getImageData(0,0,416,416).data;
  const tensor=new Float32Array(3*416*416),area=416*416;
  for(let i=0;i<area;i++){
    tensor[i]=rgba[i*4]/255;tensor[area+i]=rgba[i*4+1]/255;tensor[2*area+i]=rgba[i*4+2]/255;
  }
  return {tensor,width,height,padX,padY};
}

function maskFor(coefficients,prototypes,x1,y1,x2,y2,geometry){
  const maskWidth=104,maskHeight=104,area=maskWidth*maskHeight,mask=new Uint8Array(area);
  const lx=Math.max(0,Math.min(maskWidth,Math.floor((x1-geometry.padX)/geometry.width*maskWidth)));
  const rx=Math.max(0,Math.min(maskWidth,Math.ceil((x2-geometry.padX)/geometry.width*maskWidth)));
  const ty=Math.max(0,Math.min(maskHeight,Math.floor((y1-geometry.padY)/geometry.height*maskHeight)));
  const by=Math.max(0,Math.min(maskHeight,Math.ceil((y2-geometry.padY)/geometry.height*maskHeight)));
  let pixels=0;
  for(let y=ty;y<by;y++)for(let x=lx;x<rx;x++){
    const i=y*maskWidth+x;let logit=0;
    for(let c=0;c<32;c++)logit+=coefficients[c]*prototypes[c*area+i];
    if(1/(1+Math.exp(-Math.max(-30,Math.min(30,logit))))>=.5){mask[i]=1;pixels++;}
  }
  return {mask,pixels,maskWidth,maskHeight};
}

function showPhoto(photo,image,details,geometry,proposals){
  const card=document.createElement('article');card.className='item';
  const title=document.createElement('h2');title.textContent=photo.title+' ('+photo.id+')';
  const overlay=details.overlay;
  const img=document.createElement('img');img.src=overlay.toDataURL('image/png');img.alt='Benchmark fixture with actual model instance proposals overlaid';
  const meta=document.createElement('p');meta.className='meta';
  meta.textContent=`${proposals.length} unreviewed model proposals · model masks: ${details.maskPixels.join(', ')} foreground pixels · source SHA-256 ${details.sourceSha.slice(0,16)}…`;
  card.append(title,img,meta);document.querySelector('#results').append(card);
}

async function run(){
  if(!window.ort)throw Error('ONNX Runtime Web did not load');
  window.ort.env.wasm.numThreads=1;
  window.ort.env.wasm.proxy=false;
  window.ort.env.wasm.wasmPaths='/node_modules/onnxruntime-web/dist/';
  const loadStarted=performance.now();
  const session=await window.ort.InferenceSession.create('/candidate.onnx',{executionProviders:['wasm']});
  const coldLoadMs=performance.now()-loadStarted;
  if(session.inputNames[0]!=='images')throw Error('Unexpected ONNX input name');
  const outputs=[];
  for(const photo of PHOTOS){
    const response=await fetch('/benchmark/fixtures/'+photo.id+'.jpg',{cache:'no-store'});
    if(!response.ok)throw Error('Fixture load failed: '+photo.id);
    const bytes=await response.arrayBuffer(),sourceSha=await sha256(bytes);
    // WebKit can reject createImageBitmap/Blob-backed JPEG decoding with an
    // EncodingError. Decode the same unchanged JPEG bytes as a data URL in the
    // page, then canvas-read those pixels for WASM inference.
    const image=new Image();image.src=jpegDataUrl(bytes);await image.decode();
    const geometry=makeInput(image),input=new window.ort.Tensor('float32',geometry.tensor,[1,3,416,416]);
    const started=performance.now();
    const result=await session.run({images:input});
    const inferenceMs=performance.now()-started;
    const detections=result.output0.data,prototypes=result.output1.data,proposals=[],overlay=document.createElement('canvas');
    overlay.width=416;overlay.height=416;const ctx=overlay.getContext('2d');
    ctx.fillStyle='rgb(114,114,114)';ctx.fillRect(0,0,416,416);ctx.drawImage(image,geometry.padX,geometry.padY,geometry.width,geometry.height);
    for(let n=0;n<300;n++){
      const base=n*38,confidence=detections[base+4],classId=Math.round(detections[base+5]);
      if(confidence<.5||!CLASS_NAMES[classId])continue;
      const [x1,y1,x2,y2]=[...detections.slice(base,base+4)];
      const instance=maskFor(detections.slice(base+6,base+38),prototypes,x1,y1,x2,y2,geometry);
      const [width,height,padX,padY]=[geometry.width,geometry.height,geometry.padX,geometry.padY];
      const bounds={left:Math.max(0,Math.floor((x1-padX)/width*416)),right:Math.min(416,Math.ceil((x2-padX)/width*416)),top:Math.max(0,Math.floor((y1-padY)/height*416)),bottom:Math.min(416,Math.ceil((y2-padY)/height*416))};
      for(let y=0;y<416;y++)for(let x=0;x<416;x++){
        const mx=Math.floor(x/4),my=Math.floor(y/4),mi=my*104+mx;
        if(mx>=104||my>=104||!instance.mask[mi]||x<bounds.left||x>=bounds.right||y<bounds.top||y>=bounds.bottom)continue;
        ctx.fillStyle='rgba(255,48,80,.28)';ctx.fillRect(x,y,1,1);
      }
      ctx.strokeStyle='#ff304f';ctx.lineWidth=1.5;ctx.strokeRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
      ctx.fillStyle='#fff';ctx.font='9px sans-serif';ctx.fillText(`${CLASS_NAMES[classId]} ${Number(confidence).toFixed(2)}`,bounds.left,Math.max(10,bounds.top-2));
      proposals.push({classId,className:CLASS_NAMES[classId],confidence:Number(confidence),box:[x1,y1,x2,y2],maskPixels:instance.pixels,maskSha256:await sha256(instance.mask)});
    }
    const maskPixels=proposals.map(x=>x.maskPixels),details={sourceSha,inferenceMs,maskPixels,overlay};
    showPhoto(photo,image,details,geometry,proposals);
    outputs.push({photo:photo.id,sourceSha256:sourceSha,dimensions:[image.naturalWidth,image.naturalHeight],proposalCount:proposals.length,proposals,coldLoadMs,inferenceMs});
  }
  window.__instance56={done:true,engine:window.navigator.userAgent.includes('AppleWebKit')?'browser':'browser',coldLoadMs,outputs};
  status(`ONNX Runtime Web WASM: loaded in ${coldLoadMs.toFixed(0)} ms; 3 real JPEG inferences complete. Every detection is unreviewed.`);
}

window.__instance56={done:false};
run().catch(error=>{window.__instance56={done:true,error:String(error?.stack||error)};status('Model failed: '+String(error?.message||error));});
