import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function assertAcceptance68(scope,manifestPath){
 const path='research/parallel68/'+scope+'-protocol-lock.json',bytes=await readFile(path),lock=JSON.parse(bytes);
 if(lock.scope!==scope||lock.status!=='FROZEN_BEFORE_ACCEPTANCE_INFERENCE')throw Error('No prospective acceptance protocol');
 if(!Object.hasOwn(lock.manifests,manifestPath)||digest(await readFile(manifestPath))!==lock.manifests[manifestPath])throw Error('Sealed source manifest changed');
 for(const [file,sha]of Object.entries(lock.codeSha256))if(digest(await readFile(file))!==sha)throw Error('Candidate changed after freeze: '+file);
 return {protocolPath:path,protocolSha256:digest(bytes),frozenAtUTC:lock.frozenAtUTC};
}
