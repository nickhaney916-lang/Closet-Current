// OFFLINE candidate only: no public source rewrite, build, release or service action.
export function abortSynchronousWriteFailure(source){
 for(const name of ['writeAll','savePiece']){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);
  if(start<0||end<0||source.indexOf('function '+name+'(',start+1)>=0)throw Error('Storage source changed: '+name);
  const fn=source.slice(start,end);
  const match=fn.match(/const tx=db\.transaction\(([^;]+)\);([\s\S]+?)tx\.oncomplete=resolve;tx\.onerror=\(\)=>reject\(tx\.error\);tx\.onabort=\(\)=>reject\(tx\.error\);/);
  if(!match||match[1]!== (name==='writeAll'?"'items','readwrite'":"['items','state'],'readwrite'")||fn.includes('SYNC_WRITE_ABORT_28'))throw Error('Storage transaction source changed: '+name);
  const expected=name==='writeAll'?["for(const v of values)tx.objectStore('items').put(v);"]:[
   "tx.objectStore('items').put(value);tx.objectStore('state').put({id:'draft',batch:structuredClone(nextBatch)});",
   "tx.objectStore('items').put(value);tx.objectStore('state').put({id:'draft',batch:structuredClone(typeof nextBatch==='function'?nextBatch():nextBatch)});"
  ];
  if(!expected.includes(match[2]))throw Error('Storage operation source changed: '+name);
  const guarded=`const tx=db.transaction(${match[1]});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);try{${match[2]}}catch(error){/* SYNC_WRITE_ABORT_28 */try{tx.abort();}catch{}reject(error);}`;
  source=source.slice(0,start)+fn.replace(match[0],guarded)+source.slice(end);
 }
 return source;
}
