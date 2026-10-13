import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
const {localCandidates,clothingChoices,strongMatch,sleeveChoices,detailMatch}=await import('./local-catalog.mjs'+new URL(import.meta.url).search);
env.allowLocalModels=false;
env.useBrowserCache=true;
env.backends.onnx.wasm.numThreads=1;
let classifier;
async function load(){
 if(!classifier)classifier=await pipeline('zero-shot-image-classification','ff13/fashion-clip',{device:'wasm',dtype:'q8',progress_callback:event=>{
  const percent=Number.isFinite(event.progress)?Math.round(event.progress):null;
  self.postMessage({type:'progress',text:percent===null?'Loading local recognition model…':`Downloading recognition model · ${percent}%`});
 }});
 return classifier;
}
let chain=Promise.resolve();
self.onmessage=event=>{const request=event.data;chain=chain.then(async()=>{
 try{
  const model=await load();
  if(request.type==='load'){self.postMessage({type:'ready',id:request.id});return;}
  if(request.type!=='classify'||typeof request.image!=='string'||!request.image.startsWith('data:image/jpeg;base64,'))throw Error('Invalid captured image.');
  const results=await model(request.image,localCandidates.map(c=>c.label),{hypothesis_template:'A photo of {}.'});
  const choices=clothingChoices(results);
  const first=choices[0];
  const strong=strongMatch(choices),details={};
  if(strong&&['Tops','Dresses','Outerwear'].includes(first.category)&&first.sleeveLength==='Unknown'){
   const sleeves=sleeveChoices(first.itemType),ranked=await model(request.image,sleeves.map(x=>x.label),{hypothesis_template:'A photo of {}.'});
   first.sleeveLength=detailMatch(ranked,sleeves)||'Unknown';
  }
  if(strong){
   for(const [key,values]of Object.entries({color:['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'],pattern:['Solid','Striped','Floral','Plaid','Checked','Polka dot','Animal print','Graphic']})){
    const options=values.map(value=>({value,label:'a '+value.toLowerCase()+' '+first.itemType.toLowerCase()}));
    options.push({value:'Unknown',label:'a garment with an unclear '+key});
    const ranked=await model(request.image,options.map(x=>x.label),{hypothesis_template:'A photo of {}.'});
    const value=detailMatch(ranked,options);if(value&&value!=='Unknown')details[key]=value;
   }
  }
  self.postMessage({type:'result',id:request.id,choices,strong,details});
 }catch{self.postMessage({type:'error',id:request.id,text:'Local recognition could not load or run on this device. Try Chrome with Wi-Fi, or use the category fields.'});}
});};
