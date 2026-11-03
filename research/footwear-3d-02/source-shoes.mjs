/** FOOTWEAR-3D-02: isolated, non-production, source-honest anatomical shoe research.
 * Geometry represents two independently fitted PROVISIONAL low-top envelopes.
 * CC0 photos are reference cards, NOT projected onto unphotographed views.
 * Never convert these into an authenticated customer's photographed 3D shoes.
 */
import * as THREE from 'three';
const LOCKED=Object.freeze({
 'commons-0080':Object.freeze({sha:'4675887ee36dbaeb894faf1e0879b05473f39fb555024424d52fcdce37d35bb9',name:'Houston patterned low-top',upper:0x72777b,sole:0xe3e0d9,view:'one lateral on-foot view; no underside, paired reverse or rear'}),
 'commons-0081':Object.freeze({sha:'72b53abd07e9438fd5a11631f6595c10d2abc98fda432d22611a58ba3b289952',name:'Black and white low-tops',upper:0x222529,sole:0xe6e6e2,view:'on-foot partial pair; no clean reverse, underside or rear'})
});
export const FOOTWEAR02_SOURCES=LOCKED;
const verified=new WeakSet();
const hex=async ab=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',ab))].map(x=>x.toString(16).padStart(2,'0')).join('');
const assertLocal=()=>{if(typeof location!=='undefined'&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Research footwear prohibited outside loopback');};
export async function loadApprovedFootwear02(id,{fetcher=fetch}={}){
 assertLocal();
 const pin=LOCKED[id];if(!pin)throw Error('No approved source: original-photo/2D fallback required');
 const manifestResponse=await fetcher('/benchmark/locked-photo-sources.json',{cache:'no-store'});
 if(!manifestResponse?.ok)throw Error('Locked source manifest unavailable');
 const entries=await manifestResponse.json(),row=entries.find(x=>x.id===id);
 if(!row?.verified||row.sha256!==pin.sha||row.image!==id+'.jpg'||row.attribution?.license!=='CC0'||
    !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(row.attribution.source)||!row.attribution.author)
  throw Error('License/source/hash mismatch; original-photo/2D fallback required');
 const url='/benchmark/fixtures/'+id+'.jpg';
 const response=await fetcher(url,{cache:'no-store'});
 if(!response?.ok)throw Error('Original CC0 photo unavailable; original-photo fallback required');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength<1000||bytes.byteLength>8_000_000||await hex(bytes)!==pin.sha)
  throw Error('Original JPEG SHA-256 mismatch; never generate authenticated shoes');
 const cap=Object.freeze({id,sourceSHA256:pin.sha,photoUrl:url,attribution:row.attribution,
  bytes:bytes.byteLength,observedView:pin.view,provisionalGeometry:true,
  originalPhotoPreserved:true,photoProjectedOn3D:false,secondSidePhotographed:false,
  releaseAuthorized:false});
 verified.add(cap);
 return cap;
}
const isCap=c=>!!c&&verified.has(c)&&LOCKED[c.id]?.sha===c.sourceSHA256;
function sampleActualRigFeet(root){
 if(!root?.isObject3D)throw Error('Loaded anatomical rig required');
 root.updateMatrixWorld(true);
 const rows=[[],[]],high=[[],[]],p=new THREE.Vector3();
 let skinned=0,bones=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.userData.work56Garment||mesh.userData.work60Pants)return;
  skinned++;bones=Math.max(bones,mesh.skeleton?.bones?.length||0);
  const count=mesh.geometry?.getAttribute('position')?.count||0;
  for(let i=0;i<count;i+=Math.max(1,Math.floor(count/45000))){
   mesh.getVertexPosition(i,p);mesh.localToWorld(p);
   if(!Number.isFinite(p.x+p.y+p.z))continue;
   if(Math.abs(p.x)<.012||Math.abs(p.x)>.6)continue;
   const side=p.x<0?0:1;
   if(p.y>=-.018&&p.y<.205)rows[side].push([p.x,p.y,p.z]);
   if(p.y>=.195&&p.y<.33)high[side].push([p.x,p.y,p.z]);
  }
 });
 if(bones!==163||skinned===0||rows.some(a=>a.length<15)||high.some(a=>a.length<5))
  throw Error('Real 163-bone rig foot points insufficient; no fake footwear');
 return rows.map((points,side)=>{
  const ys=points.map(p=>p[1]),xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
  const lo=a=>Math.min(...a),hi=a=>Math.max(...a);
  const ankleZ=high[side].reduce((s,p)=>s+p[2],0)/high[side].length;
  const front=hi(zs),back=lo(zs),length=front-back,width=hi(xs)-lo(xs);
  if(!(length>.09&&length<.48&&width>.045&&width<.27))
   throw Error('Original rig shoe anatomy out of measured bounds');
  // Original model has anterior toes in +Z; never silently reverse an unverified rig.
  if(front-ankleZ<.025||front-ankleZ<ankleZ-back)
   throw Error('Anatomical toe direction not demonstrated; 2D fallback');
  return Object.freeze({side:side===0?'left':'right',x:(lo(xs)+hi(xs))/2,
   heelZ:back, toeZ:front,footMinY:lo(ys),footMaxY:hi(ys),
   footWidth:width,footLength:length,sampledPoints:points.length,
   ankleZ, minX:lo(xs),maxX:hi(xs)});
 });
}
function curvedShoeShape(foot,pin){
 const width=foot.footWidth+.025, len=foot.footLength+.035;
 const mid=(foot.heelZ+foot.toeZ)/2+.006, x=foot.x, y0=.006, soleH=.028;
 const group=new THREE.Group();group.name='FOOTWEAR02-'+foot.side;
 group.userData={shoeSide:foot.side,sourceHash:pin.sha,photographicTexture:false};
 const material=(color,roughness=.84)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0,side:THREE.DoubleSide});
 const upperM=material(pin.upper),soleM=material(pin.sole),edgeM=material(pin.upper);
 const segments=26,half=12,vertices=[],indices=[];
 for(let j=0;j<=segments;j++){
  const t=j/segments, z=mid-len/2+len*t;
  const taper=Math.max(.10,Math.pow(Math.max(0,1-(2*t-1)**4),.27));
  for(let i=0;i<=half;i++){
   const a=Math.PI*i/half;
   const w=width*.5*taper;
   vertices.push(x+Math.cos(a)*w,y0+soleH+(.065+(.032*t))*Math.sin(a),z);
  }
 }
 for(let j=0;j<segments;j++)for(let i=0;i<half;i++){
  const a=j*(half+1)+i,b=a+half+1;indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.setIndex(indices);geom.computeVertexNormals();
 const upper=new THREE.Mesh(geom,upperM);upper.name='independent-physical-upper-'+foot.side;group.add(upper);
 const sole=new THREE.Mesh(new THREE.SphereGeometry(1,22,12),soleM);
 sole.scale.set(width*.53,soleH*.52,len*.5);sole.position.set(x,y0+soleH*.5,mid);
 sole.name='independent-sole-'+foot.side;group.add(sole);
 // No fabricated logos, printed lace design, tread or source-invisible details.
 const collar=new THREE.Mesh(new THREE.TorusGeometry(Math.min(.045,width*.33),.006,8,24),edgeM);
 collar.rotation.x=Math.PI/2;collar.position.set(x,.077,foot.heelZ+.040);
 collar.name='source-neutral-collar-'+foot.side;group.add(collar);
 group.userData.foot=foot;group.userData.soleBottom=y0-.0007;
 group.userData.soleTop=y0+soleH;
 group.userData.collarY=.077;
 return group;
}
const disposeGroup=g=>{g?.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});};
export function createFootwear02Session({viewer,checkOwner,ownerId,generation,enabled=false}={}){
 if(enabled!==true||!viewer?.getResearchFootwearAnchor||typeof checkOwner!=='function'||
    typeof ownerId!=='string'||!Number.isSafeInteger(generation))
  throw Error('Explicit isolated research + owner-epoch binding required; OFF by default');
 assertLocal();
 const anchor=viewer.getResearchFootwearAnchor();
 if(!anchor?.root?.isObject3D||typeof anchor.add!=='function'||typeof anchor.remove!=='function'||
    viewer.getState().stats?.bones!==163)throw Error('Real rig anchor unavailable');
 let nodes=[],closed=false,swaps=0,current=null,baseline=null;
 const session=()=>{if(closed)throw Error('Disposed footwear research session');const s=checkOwner();
  if(s?.ownerId!==ownerId||s?.generation!==generation){clear();closed=true;throw Error('Owner changed; private shoe preview invalidated');}
 };
 function clear(){for(const n of nodes){anchor.remove(n);disposeGroup(n);}nodes=[];current=null;}
 function swap(cap){
  session();if(!isCap(cap)){clear();return Object.freeze({status:'PHOTO_ONLY_FALLBACK',sourceAuthenticated:false,releaseAuthorized:false});}
  // Build before clearing previous shoes: failed builds cannot remove valid outfit.
  const feet=sampleActualRigFeet(anchor.root),pin=LOCKED[cap.id];
  const fresh=feet.map(foot=>curvedShoeShape(foot,pin));
  try{
   const widths=fresh.map(f=>f.userData.foot.footWidth);
   if(fresh[0].userData.shoeSide===fresh[1].userData.shoeSide||fresh[0].children[0].geometry===fresh[1].children[0].geometry||
      widths.some(x=>x<.045||x>.27))throw Error('Shoes must be independent anatomically fitted meshes');
   // Use bounds as bounded measurements, NOT an assertion of mesh-mesh contact certification.
   const groundErrors=fresh.map(n=>Math.abs(n.userData.soleBottom));
   if(groundErrors.some(x=>x>.012))throw Error('Sole floor clearance exceeds static 12mm tolerance');
   clear();for(const n of fresh)anchor.add(n);nodes=fresh;current=cap;swaps++;
   return Object.freeze({status:'PROVISIONAL_SOURCE_INFORMED_MESH',sourceAuthenticated:true,
    originalSHA256:cap.sourceSHA256,footMeasurements:feet.map(x=>({...x,footMinY:x.footMinY})),
    groundErrors,independentLeftRight:true,onePhotographedViewOnly:true,
    sourceColorApproximation:true,noRealPhotoTexture:true,noReversePhotoClaim:true,
    visiblePenetrationHumanReviewRequired:true,continuousCollisionCertified:false,
    releaseAuthorized:false});
  }catch(e){fresh.forEach(disposeGroup);throw e;}
 }
 function state(){session();return Object.freeze({current:current?.id||null,swaps,
  meshCount:nodes.reduce((v,n)=>v+n.children.filter(x=>x.isMesh).length,0),
  pairCount:nodes.length,geometryIds:nodes.map(n=>n.children[0].geometry.uuid),
  camera:viewer.getState().cameraPosition,figure:viewer.getState().kind,
  releaseAuthorized:false});}
 function dispose(){if(closed)return;clear();closed=true;}
 return Object.freeze({swap,clear:()=>{session();clear();},state,dispose});
}
