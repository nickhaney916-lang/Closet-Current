export function normalizeSuggestion42(result, schema, palette, categories) {
 const choice=result?.choices?.[0];
 const types=schema.types[choice?.category];
 const category=(result?.strong===true||result?.categoryConfirmed===true)&&
  categories.includes(choice?.category)&&Object.hasOwn(schema.types,choice?.category)&&Array.isArray(types)?choice.category:null;
 return {
  category,
  itemType:category&&result.strong===true&&!result.categoryOnly&&types.includes(choice.itemType)&&
   choice.itemType!=='Unknown'?choice.itemType:null,
  color:palette.includes(result?.details?.color)?result.details.color:null
 };
}

export async function recognizeReviewedCrop42({original,crop,version,signal,schema,palette,categories}) {
 signal.throwIfAborted();
 const worker=new Worker('local-worker.mjs'+(version?'?v='+encodeURIComponent(version):''),{type:'module'});
 try {
  const request=image=>new Promise((resolve,reject)=>{
   signal.throwIfAborted();
   const id=crypto.randomUUID();
   const cleanup=()=>{
    clearTimeout(timer);
    signal.removeEventListener('abort',abort);
    worker.onmessage=null;
    worker.onerror=null;
   };
   const fail=()=>{cleanup();reject(Error('Local recognition unavailable'));};
   const abort=()=>{cleanup();reject(signal.reason);};
   const timer=setTimeout(fail,120000);
   signal.addEventListener('abort',abort,{once:true});
   worker.onerror=fail;
   worker.onmessage=({data})=>{
    if(data?.id!==id)return;
    if(data.type==='error')fail();
    if(data.type==='result'){cleanup();resolve(data);}
   };
   try{worker.postMessage({type:'classify',id,image});}catch{fail();}
  });
  const originalContext=normalizeSuggestion42(await request(original),schema,palette,categories);
  const suggestion=normalizeSuggestion42(await request(crop),schema,palette,categories);
  // The full-frame result is context only. It cannot supply a missing crop label.
  return {source:'local-fashionclip',originalContext,...suggestion};
 } finally {
  worker.terminate();
 }
}
