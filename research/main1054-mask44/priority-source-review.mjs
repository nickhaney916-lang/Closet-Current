/**
 * MAIN1054 M44 — explainable, source-only pixel-review navigation.
 *
 * No automatic segmentation, reviewer vote, changed alpha, original RGB
 * mutation, garment geometry, source-to-owner link or 3D authorization.
 * Every "candidate" is a warm-color near-transparent P93 source sample,
 * which MAY BE GENUINE FABRIC. Counts never establish ground truth.
 */
import {auditSourceAlphaContours41} from '../main1054-mask41/original-rgb-alpha-audit.mjs';
export const M44_SOURCE=Object.freeze({
 id:'commons-0053',
 originalJpegSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 baselinePngSHA256:'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4',
 p93ProposalSHA256:'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31',
 dimensions:Object.freeze([1920,2880]),tileSize:64,
 humanQualityApproved:false,consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const fail=why=>{throw Error('M44 LICENSED PHOTO REVIEW BLOCKED: '+why)};
const warm=(r,g,b)=>r>=90&&g>=75&&b>=60&&r-g>=4&&g-b>=3&&r+g+b>=280;
const white=(r,g,b)=>r>=160&&g>=160&&b>=160&&Math.abs(r-g)<4&&Math.abs(g-b)<4;
/**
 * The caller must independently hash actual source JPEG and derived PNG
 * BEFORE passing decoded bytes; these source-string fields are not a proof
 * that user-supplied bytes were hashed. M41 RGB and alpha audits are separate.
 */
export function locateOriginalSourceReviewRegions44({
 sourceRGBA,baselineRGBA,p93RGBA,width,height,
 originalJpegSHA256,baselinePngSHA256,p93ProposalSHA256
}={}){
 if(originalJpegSHA256!==M44_SOURCE.originalJpegSHA256||
    baselinePngSHA256!==M44_SOURCE.baselinePngSHA256||
    p93ProposalSHA256!==M44_SOURCE.p93ProposalSHA256||
    width!==M44_SOURCE.dimensions[0]||height!==M44_SOURCE.dimensions[1]||
    ![sourceRGBA,baselineRGBA,p93RGBA].every(a=>a instanceof Uint8Array&&
     a.length===width*height*4))
  fail('expected exact licensed original JPEG and source-P93 decoded RGBA');
 const audit=auditSourceAlphaContours41({
  sourceRGBA,baselineRGBA,candidateRGBA:p93RGBA,width,height
 });
 if(audit.sourceOriginalRGBMismatchPixels!==0||
    audit.candidateOriginalRGBMismatchPixels!==0||
    audit.alphaIncreasePixels!==0||audit.removedProtectedNearWhiteSamples!==0)
  fail('original RGB or protected source changed');
 let sourceTop=height;
 for(let y=0;y<height;y++){
  let found=false;
  for(let x=0;x<width;x++)if(baselineRGBA[(y*width+x)*4+3]>=128){
   sourceTop=y;found=true;break;
  }
  if(found)break;
 }
 if(sourceTop>=height||audit.sourceUpperBoundRow<sourceTop)fail('actual source silhouette absent');
 const tiles=new Map(),tileSize=M44_SOURCE.tileSize;
 let candidates=0;
 for(let y=sourceTop;y<=audit.sourceUpperBoundRow;y++){
  for(let x=0;x<width;x++){
   const i=(y*width+x)*4;
   if(p93RGBA[i+3]<128||
      !warm(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))continue;
   let near=false;
   for(let dy=-2;dy<=2&&!near;dy++){
    const yy=y+dy;if(yy<0||yy>=height)continue;
    for(let dx=-2;dx<=2;dx++){
     const xx=x+dx;if(xx<0||xx>=width)continue;
     if(p93RGBA[(yy*width+xx)*4+3]<16){near=true;break;}
    }
   }
   if(!near)continue;
   let brightNeighbor=false;
   for(let dy=-1;dy<=1&&!brightNeighbor;dy++){
    const yy=y+dy;if(yy<0||yy>=height)continue;
    for(let dx=-1;dx<=1;dx++){
     const xx=x+dx;if(xx<0||xx>=width)continue;
     const j=(yy*width+xx)*4;
     if(baselineRGBA[j+3]>=128&&
       white(sourceRGBA[j],sourceRGBA[j+1],sourceRGBA[j+2])){
       brightNeighbor=true;break;
     }
    }
   }
   const tx=Math.floor(x/tileSize),ty=Math.floor(y/tileSize);
   const key=tx+':'+ty;
   let record=tiles.get(key);
   if(!record){
    record={tx,ty,pixels:0,nearProtectedWhite:0,
     sumX:0,sumY:0,minX:width,minY:height,maxX:-1,maxY:-1};
    tiles.set(key,record);
   }
   record.pixels++;candidates++;
   if(brightNeighbor)record.nearProtectedWhite++;
   record.sumX+=x;record.sumY+=y;
   record.minX=Math.min(record.minX,x);
   record.minY=Math.min(record.minY,y);
   record.maxX=Math.max(record.maxX,x);
   record.maxY=Math.max(record.maxY,y);
  }
 }
 if(candidates!==audit.possibleWarmContourResidues)
  fail('candidate pixels did not match independently audited M41 count');
 if(candidates<1||candidates>10000||tiles.size>100)
  fail('unexpected source review target volume');
 const ordered=[...tiles.values()].sort((a,b)=>
  b.pixels-a.pixels||a.ty-b.ty||a.tx-b.tx);
 const groups=ordered.map((t,i)=>Object.freeze({
  id:'inspection-'+String(i+1).padStart(2,'0'),
  // Center of actually flagged real-pixel samples, not an invented garment
  // boundary. Used for camera navigation only, NEVER exported as alpha edits.
  x:Math.round(t.sumX/t.pixels),y:Math.round(t.sumY/t.pixels),
  tileBounds:Object.freeze([
   t.tx*tileSize,t.ty*tileSize,
   Math.min(tileSize,width-t.tx*tileSize),
   Math.min(tileSize,height-t.ty*tileSize)
  ]),
  flaggedSourceSamples:t.pixels,
  samplesNearProtectedBrightPixels:t.nearProtectedWhite,
  sampledSourceBounds:Object.freeze([
   t.minX,t.minY,t.maxX-t.minX+1,t.maxY-t.minY+1
  ]),
  actualPhotoRegionNeedsHumanInspection:true,
  pixelsProvenBackground:0,
  pixelsApprovedForMaskChange:0
 }));
 return Object.freeze({
  schema:'MAIN1054_M44_ORIGINAL_LICENSED_EDGE_REVIEW_TARGETS/v1',
  status:'UNREVIEWED_REAL_SOURCE_P93_AMBIGUOUS_EDGE_SAMPLE_GROUPS',
  sourceId:M44_SOURCE.id,
  originalJpegSHA256:M44_SOURCE.originalJpegSHA256,
  baselinePngSHA256:M44_SOURCE.baselinePngSHA256,
  p93ProposalSHA256:M44_SOURCE.p93ProposalSHA256,
  dimensions:M44_SOURCE.dimensions,
  tilesCount:groups.length,
  totalFlaggedWarmEdgeSamples:candidates,
  sourceUpperBoundRow:audit.sourceUpperBoundRow,
  removedP93AlphaPixels:audit.candidateChangedAlphaPixels,
  unchangedOriginalRGB:true,
  samplingIsNotImageSegmentationGroundTruth:true,
  noAlphaPixelsModified:true,
  noHumanAnnotationsProduced:true,
  reviewerIndependentlyVerified:false,
  maskApproved:false,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  targets:Object.freeze(groups)
 });
}
