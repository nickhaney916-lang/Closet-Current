"""Independent *method* check of two authentic Met-70759 photo mask risks.

Instead of the prior global RGB sample-distance comparisons, use nearest
locally established stable-mask foreground and stable-exterior source photo
pixels, independently from both sides of each disputed edge. Euclidean
distance in OpenCV's uint8 Lab encoding is a source-image diagnostic, not
CIEDE2000, camera calibration, pixelwise ground truth, 3D, or human review.

"Independent" here means a different *algorithm and source color samples*,
NOT independent human labels: the reference classes are inherited from the
original conservative GrabCut core and outside its uncertainty union. It can
disagree with an earlier 549-pixel candidate and must then VETO approval.

Four fixed, predeclared Gaussian smoothing scales measure sensitivity:
0, 1.5, 3, 5 original source pixels. A high-chroma original mask pair alone
must NEVER authorize filling a 3D garment or accepting any recovered pixel.
"""
import hashlib

import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt

from met_full_mask_proposal89 import SOURCES
from met_source_component_correction89 import REGIONS

SIGMAS=(0.0,1.5,3.0,5.0)
ROI_PADDING_PIXELS=25


def sha256_ndarray(data):
    return hashlib.sha256(np.ascontiguousarray(data).tobytes()).hexdigest()


def independent_nearest_label_lab_votes89(rgb,core,union,component,bbox,
                                         smoothing=SIGMAS,pad=ROI_PADDING_PIXELS):
    """Pure source-photo image method, accepts synthetic arrays for controls.

    Labels core/exterior are priors from the FIRST algorithm. Its four
    predictions are not external truth and are NOT "four model votes".
    """
    if (not isinstance(rgb,np.ndarray) or rgb.ndim!=3 or
        rgb.shape[2]!=3 or rgb.dtype!=np.uint8):
        raise ValueError("three-channel-original-photo-RGB-required")
    h,w=rgb.shape[:2]
    for name,a in (("core",core),("union",union),("component",component)):
        if (not isinstance(a,np.ndarray) or a.shape!=(h,w) or
            a.dtype!=np.bool_):
            raise ValueError(name+"-exact-photo-size-boolean-mask-required")
    if np.any(core&~union) or np.any(component&~(union&~core)):
        raise ValueError("real-component-must-stay-within-original-mask-uncertainty")
    if (not isinstance(bbox,(list,tuple)) or len(bbox)!=4 or
        any(type(v)!=int for v in bbox)):
        raise ValueError("original-photo-component-bbox-required")
    x0,y0,x1,y1=bbox
    if not(0<=x0<=x1<w and 0<=y0<=y1<h):
        raise ValueError("bbox-outside-source-photo")
    if (not isinstance(smoothing,(tuple,list)) or
        not smoothing or len(smoothing)>8 or
        any(not isinstance(v,(int,float)) or v<0 or v>8 for v in smoothing)
        or not isinstance(pad,int) or pad<5 or pad>100):
        raise ValueError("bounded-specified-smoothing-and-ROI-required")
    X0=max(0,x0-pad);X1=min(w,x1+pad+1)
    Y0=max(0,y0-pad);Y1=min(h,y1+pad+1)
    im=rgb[Y0:Y1,X0:X1]
    c=core[Y0:Y1,X0:X1]
    u=union[Y0:Y1,X0:X1]
    m=component[Y0:Y1,X0:X1]
    if (not c.any() or not (~u).any() or not m.any() or
        np.any(m[0,:]) or np.any(m[-1,:]) or
        np.any(m[:,0]) or np.any(m[:,-1])):
        raise ValueError("must-have-local-source-cloth-background-and-unclipped-dispute")
    source_rgb_sha=sha256_ndarray(rgb)
    source_core_sha=sha256_ndarray(core)
    source_union_sha=sha256_ndarray(union)
    # Use exact nearest spatial SOURCE pixels in each stable-reference class.
    # ~core is 0 at known core; union is 0 at stable background exterior.
    cloth_dist,cloth_idx=distance_transform_edt(~c,return_indices=True)
    paper_dist,paper_idx=distance_transform_edt(u,return_indices=True)
    ys,xs=np.where(m)
    mask_votes=[]
    scale_receipts=[]
    for sigma in smoothing:
        visible=(cv2.GaussianBlur(im,(0,0),float(sigma))
                 if sigma else im)
        lab=cv2.cvtColor(visible,cv2.COLOR_RGB2LAB).astype(np.float32)
        source=lab[ys,xs,:]
        cloth=lab[cloth_idx[0,ys,xs],cloth_idx[1,ys,xs],:]
        paper=lab[paper_idx[0,ys,xs],paper_idx[1,ys,xs],:]
        dcloth=np.linalg.norm(source-cloth,axis=1)
        dpaper=np.linalg.norm(source-paper,axis=1)
        decided=dcloth<dpaper  # exact ties cannot mean proved garment
        mask_votes.append(decided)
        eligible=(cloth_dist[m]<=8)&(paper_dist[m]<=8)
        scale_receipts.append({
         "sourceGaussianSigmaPixels":float(sigma),
         "sourceDisputedPixels":len(ys),
         "nearestColorClassClothVoteCount":int(decided.sum()),
         "nearestColorClassClothVoteFraction":round(float(decided.mean()),6),
         "originalSourceClothLABDistanceMedian":round(float(np.median(dcloth)),4),
         "originalSourceBackgroundLABDistanceMedian":round(float(np.median(dpaper)),4),
         "nearBothSidesWithinEightPixelsCount":int(eligible.sum()),
         "nearBothSidesClothVoteFraction":(
            round(float(decided[eligible].mean()),6)
            if np.any(eligible) else None),
         "sameAlgorithmTwoMaskPriorsNotGroundTruth":True
        })
    v=np.array(mask_votes,dtype=bool)
    cloth_all=v.all(axis=0)
    background_all=(~v).all(axis=0)
    mixed=~(cloth_all|background_all)
    cloth_n=int(cloth_all.sum())
    paper_n=int(background_all.sum())
    mixed_n=int(mixed.sum())
    count=int(m.sum())
    if cloth_n+paper_n+mixed_n!=count:
        raise ValueError("four-source-smoothing-classifier-votes-do-not-reconcile")
    if [sha256_ndarray(x) for x in (rgb,core,union)]!=[
            source_rgb_sha,source_core_sha,source_union_sha]:
        raise ValueError("original-photo-or-inherited-mask-was-modified")
    masks={}
    for name,votes in (("all_cloth",cloth_all),
                       ("all_background",background_all),("mixed",mixed)):
        new=np.zeros((h,w),dtype=np.uint8)
        new[Y0+ys[votes],X0+xs[votes]]=255
        masks[name]=new
    return masks,{
      "originalRealPhotoFullRGBSHA256":source_rgb_sha,
      "originalResearchCoreSHA256":source_core_sha,
      "originalResearchUncertaintyUnionSHA256":source_union_sha,
      "originalPhotoSourceBBoxPixels":[x0,y0,x1,y1],
      "numberOfSmoothingScales":len(smoothing),
      "smoothingScaleReceipt":scale_receipts,
      "originalConnectedDisputedPixelCount":count,
      "allSmoothingClothVotePixels":cloth_n,
      "allSmoothingBackgroundVotePixels":paper_n,
      "smoothingSensitiveMixedVotePixels":mixed_n,
      "sourceRegionTotalVoteCountsReconcile":True,
      "maskDerivedStableCoreAndExteriorReferenceLabelsNotExpertGT":True,
      "independentAlternativeMethodNotIndependentHumanSegmentation":True,
      "originalRGBAndBothMaskArraysBitIdenticalAfterAudit":True,
      "sourcePixelCandidatesAreDiagnosisOnlyNotAcceptedMasks":True
    }


def audit_real_met_boundary_stability89(rgb,core,union,receipt,id):
    """Require EXACT original 1406/1408 pixels and original source review SHA.

    This is a *veto* of premature approving the entire 1408 uncertain set.
    A research candidate can still be saved as a nonaccepted experiment.
    """
    source=SOURCES.get(id);case=REGIONS.get(id)
    if not source or not case or id not in (2551406,2551408):
        raise ValueError("unverified-Met-photo-source")
    if (not isinstance(rgb,np.ndarray) or rgb.shape!=(source["height"],1200,3)
        or rgb.dtype!=np.uint8 or
        sha256_ndarray(rgb)!=source["rgb_sha"]):
        raise ValueError("actual-exact-genuine-museum-source-decoded-RGB-required")
    if (not isinstance(core,np.ndarray) or not isinstance(union,np.ndarray)
        or core.shape!=rgb.shape[:2] or union.shape!=rgb.shape[:2]
        or core.dtype!=np.uint8 or union.dtype!=np.uint8
        or not np.isin(core,[0,255]).all()
        or not np.isin(union,[0,255]).all()
        or np.any((core>0)&(union==0))):
        raise ValueError("genuine-original-conservative-binary-mask-required")
    if (not isinstance(receipt,dict) or receipt.get("imageId")!=id
        or receipt.get("originalMuseumSourceRGBSHA256")!=source["rgb_sha"]
        or receipt.get("originalMaskCoreSHA256")!=sha256_ndarray(core)
        or receipt.get("uncertaintyUnionSHA256")!=sha256_ndarray(union)
        or receipt.get("externalQualifiedAnnotatorReviewActuallyProvided") is not False
        or receipt.get("consumer3DAdmitted") is not False
        or receipt.get("releaseAuthorized") is not False
        or receipt.get("status")!=
           "SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED"
        or receipt.get("museumVerifiedExactViewCaption")!=
           case["museumExactViewCaption"]):
        raise ValueError("source-original-mask-canonically-verified-review-receipt-required")
    disputed=((union>0)&(core==0)).astype(np.uint8)
    count,labels,stats,_=cv2.connectedComponentsWithStats(disputed,8)
    component=None
    for index in range(1,count):
        x,y,w,h,area=(int(z) for z in stats[index])
        if ([x,y,x+w-1,y+h-1]==case["expectedBBox"]
            and area==case["expectedUncertainPixels"]):
            if component is not None:
                raise ValueError("duplicate-source-region")
            component=labels==index
    if component is None:
        raise ValueError("original-pixel-connected-component-size-or-box-drift")
    mask_data,diagnosis=independent_nearest_label_lab_votes89(
      rgb,core>0,union>0,component,case["expectedBBox"])
    votes=diagnosis["smoothingScaleReceipt"]
    n=diagnosis["originalConnectedDisputedPixelCount"]
    f=[x["nearestColorClassClothVoteFraction"] for x in votes]
    if id==2551406:
        # A broad pale photographic exterior region stays closer to
        # background under every alternative smoothing scale.
        if (max(f)>=.15 or
            diagnosis["allSmoothingBackgroundVotePixels"]<n*.80):
            raise ValueError("original-1406-background-robustness-not-proven")
        interpretation="RETAIN_EXCLUDED_BACKGROUND_SENSITIVITY_SUPPORT_ONLY"
    else:
        # 1408 has split source-image evidence. Reject an earlier
        # overconfident proposal to recover ALL 549 uncertain pixels.
        if (min(f)<.20 or max(f)>.80 or
            diagnosis["smoothingSensitiveMixedVotePixels"]<n*.15
            or diagnosis["allSmoothingBackgroundVotePixels"]<n*.15):
            raise ValueError("true-source-1408-mixed-color-evidence-drifted")
        interpretation="QUARANTINE_ALL_549_UNREVIEWED_FABRIC_RECOVERY_NO_AUTO_APPROVAL"
    diagnosis.update({
      "schema":"M2-Met-original-source-alternative-local-Lab-robustness-HOLD/v1",
      "status":"ALTERNATIVE_SOURCE_METHOD_RESEARCH_ONLY",
      "museumOriginalObjectNumber":"1983.21a, b",
      "originalImageId":id,
      "museumVerifiedViewCaption":case["museumExactViewCaption"],
      "interpretation":interpretation,
      "sourcePhotoOriginalCorePixelsChanged":0,
      "sourceOriginalPhotoPixelsChanged":0,
      "previous549PixelRecoveryDoesNotPassIndependentRobustnessApproval":
         id==2551408,
      "allPriorConservativePhotoMasksRetainedAsSourceOfTruth":True,
      "noExternalHumanSegmentationGroundTruth":True,
      "noAuthenticGarmentCameraCalibration":True,
      "doesNotTestReal3DClothOrOwnerDevice":True,
      "sourceOriginal2DFallbackRequired":True,
      "consumer3DAdmitted":False,"releaseAuthorized":False,
      "familyAlpha":"HOLD"
    })
    return mask_data,diagnosis
