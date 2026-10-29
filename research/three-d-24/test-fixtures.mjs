/** Offline licensed-fixture helpers for regression/measurement scripts only. */
import * as T from 'three';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../three-d-06/fetch-licensed-avatars.mjs';
globalThis.ProgressEvent=class{};
export async function person(kind){
 const bytes=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 if(createHash('sha256').update(bytes).digest('hex')!==SOURCES[kind].sha256)throw Error('Original model hash mismatch');
 const {scene:r}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');r.updateMatrixWorld(true);
 const b=new T.Box3().setFromObject(r),s=2/b.getSize(new T.Vector3()).y,c=b.getCenter(new T.Vector3());r.scale.multiplyScalar(s);r.position.set(-c.x*s,-b.min.y*s,-c.z*s);r.updateMatrixWorld(true);return r;
}
export const candidate=type=>({id:type==='dress'?'commons-0053':'commons-0003',type,sourceSHA256:'a'.repeat(64),ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,cutout:{width:1280,height:1920,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
