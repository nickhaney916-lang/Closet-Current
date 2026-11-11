/**
 * M1 P806: strict PUBLIC FIXTURE-ONLY, immutable P804 real SAM2 ONNX output
 * transport into in-memory native Adjust read-only preview.
 *
 * THIS DOES NOT RUN SAM2 IN THE APP. It consumes an archived P804 Linux
 * ONNX result for a CC BY public JPEG, never private owner photographs.
 * No third-party inference, network, storage, owner approval or cloud writes.
 */
const SOURCE='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const BASE='closet-current-m1-owner-original-rectangle-800/review-only/v1';
const POINT='closet-current-m1-owner-original-point-798/review-only/v1';
const PUBLIC_ARTIFACT=Object.freeze({
 chromium:Object.freeze({
  box:Object.freeze([360,426,1589,2530]),point:Object.freeze([955,1434]),
  pngSHA256:'f8c50688b5932ae8c879b24ea638ade7994b3c1563b501c93d576c7236cb1bf9'
 }),
 webkit:Object.freeze({
  box:Object.freeze([360,432,1589,2535]),point:Object.freeze([955,1440]),
  pngSHA256:'d76ab0fb867270eafc8d76f5a6dc5fa693d342cca049fc226aa8dc661cad7f7e'
 })
});
const fail=why=>{throw Error('M1_P806_PUBLIC_SAM2 '+why);};
const SHA=/^[a-f0-9]{64}$/;
export const SAM2_EVIDENCE_SOURCE_SHA256_806=SOURCE;
export async function verifyPublicOriginalSAM2ResearchMask806({
 originalSource,box,point,actorBrowser,pngBase64,stillCurrent,
 cryptoProvider=globalThis.crypto
}={}){
 const fixed=PUBLIC_ARTIFACT[actorBrowser];
 if(!fixed||typeof stillCurrent!=='function'||stillCurrent()!==true||
    originalSource?.sha256!==SOURCE||
    !originalSource?.image?.startsWith('data:image/jpeg;base64,')||
    !box||box.schema!==BASE||!box.twoVerifiedOriginalJPEGCornerTaps||
    !point||point.schema!==POINT||!point.sourceBytesSHA256Verified||
    !point.capturedFromOriginalJPEG||
    !box.ownerId||!box.sourceId||point.ownerId!==box.ownerId||
    point.sourceId!==box.sourceId||box.sourceSHA256!==SOURCE||
    point.sourceSHA256!==SOURCE||
    ![box.sourceWidth,point.sourceWidth].every(x=>x===1920)||
    ![box.sourceHeight,point.sourceHeight].every(x=>x===2880)||
    !fixed.box.every((v,i)=>v===[box.x0,box.y0,box.x1,box.y1][i])||
    !fixed.point.every((v,i)=>v===[point.pointX,point.pointY][i])||
    !SHA.test(fixed.pngSHA256)||
    typeof pngBase64!=='string'||pngBase64.length<80||
    pngBase64.length>240000||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(pngBase64)||
    typeof cryptoProvider?.subtle?.digest!=='function')
  fail('only pinned public SHA and exact P804 original gesture accepted');
 // A test-supplied PNG is never trusted because it calls itself a model mask.
 // It must match P804's independently downloaded artifact byte for byte.
 let decoded;
 try{decoded=atob(pngBase64);}catch{fail('invalid PNG encoding');}
 if(decoded.length<64||decoded.length>180000)fail('source mask PNG budget exceeded');
 const bytes=Uint8Array.from(decoded,ch=>ch.charCodeAt(0));
 const magic=[137,80,78,71,13,10,26,10];
 if(!magic.every((v,i)=>bytes[i]===v))fail('mask is not a PNG');
 const digest=await cryptoProvider.subtle.digest('SHA-256',bytes);
 const actual=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(actual!==fixed.pngSHA256)fail('original P804 real ONNX mask artifact SHA mismatch');
 if(stillCurrent()!==true)fail('owner draft changed during mask verification');
 return Object.freeze({
  schema:'closet-current-m1-public-original-sam2-artifact-806/preview-only/v1',
  dataURL:'data:image/png;base64,'+pngBase64,
  sourceSHA256:SOURCE,ownerId:box.ownerId,sourceId:box.sourceId,
  sourceWidth:1920,sourceHeight:2880,modelMaskPNG_SHA256:actual,
  actualModel:'cstr/sam2.1-hiera-tiny-ONNX@8cef213',
  actualOnnxWasRunIn:'prior-public-Linux-research-CI-P804',
  currentBrowserDidNotRunSAM2:true,
  originalSourceGestureFromPlaywright:true,
  independentHumanVerified:false,
  maskVerifiedByHuman:false,
  categoryVerified:false,subtypeVerified:false,colorVerified:false,
  previewOnly:true,privateOwnerModelRun:false,
  autoSaveAllowed:false,privatePersisted:false,externalUpload:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 });
}
