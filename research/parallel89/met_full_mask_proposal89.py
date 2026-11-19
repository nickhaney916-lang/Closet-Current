"""Research-only foreground alpha PROPOSALS for four actual Met 70759 skirts.

IMPORTANT: "foreground" is a measured original 2D museum photo proposal, NOT
human-approved full-garment segmentation, side/back identity, object physical
geometry, a wearable mesh, or a fit. Each manually INSPECTED polygon is only
a GrabCut starting prior; the photograph's actual RGB and exact full decoded
image hash determine eligibility. The museum's caption verifies only image
2551406 as "a) front". Never mix Honolulu accession 5152.1.

Two differently seeded full RGB GrabCut solves quantify sensitivity. Export
separate proposed-mask PNG, disagreement metrics, full-source row envelopes
and source-photo 2D fallback. No consumer paths or cloud writes.
"""
import hashlib
import math
import cv2
import numpy as np

cv2.setNumThreads(1)

# Pin source to the exact original images decoded and hashed by Sharp in
# scripts/test-parallel89-met-four-original-photo-silhouettes.mjs.
# ALL polygons are source-specific RESEARCH PRIORS, not expert outlines.
SOURCES = {
  2551406: {
    "height":933,"rgb_sha":"e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec",
    "museum_caption":"a) front","museum_caption_verified":True,
    "provisional_role":"a-front",
    "outer":[(.27,.05),(.81,.03),(.86,.13),(.99,.80),(.84,.89),(.52,.96),(.20,.90),(.01,.82),(.16,.21)],
    "inner":[(.38,.14),(.75,.13),(.86,.36),(.93,.74),(.72,.79),(.52,.86),(.20,.78),(.09,.74),(.24,.37)]
  },
  2551407: {
    "height":945,"rgb_sha":"e59253bef19ccc908b7cb1519c1ef4c92e011e9ae955bca878de14f40a9f9678",
    "museum_caption":None,"museum_caption_verified":False,
    "provisional_role":"a-other-side-candidate",
    "outer":[(.25,.03),(.80,.03),(.89,.18),(.99,.83),(.84,.93),(.50,.99),(.12,.89),(.01,.83),(.13,.20)],
    "inner":[(.35,.14),(.69,.15),(.85,.39),(.94,.79),(.70,.86),(.52,.90),(.25,.83),(.08,.77),(.23,.35)]
  },
  2551408: {
    "height":978,"rgb_sha":"dddbda448c32667a0ab5c1b90a43d139b5917c1b9955dc428987beec035e06c0",
    "museum_caption":None,"museum_caption_verified":False,
    "provisional_role":"b-decorated-side-candidate",
    "outer":[(.30,.05),(.80,.02),(.90,.19),(.99,.82),(.83,.96),(.52,.99),(.15,.95),(.01,.82),(.14,.18)],
    "inner":[(.38,.14),(.70,.14),(.85,.40),(.94,.78),(.72,.84),(.50,.90),(.20,.84),(.08,.80),(.25,.36)]
  },
  2551409: {
    "height":959,"rgb_sha":"1cd4c7f71ebbb00a27f769e46a438a03f19393bd6a6ba200af14a092d1461e3f",
    "museum_caption":None,"museum_caption_verified":False,
    "provisional_role":"b-less-decorated-side-candidate",
    "outer":[(.23,.05),(.77,.05),(.86,.17),(.99,.86),(.85,.95),(.45,.99),(.14,.92),(.01,.84),(.12,.16)],
    "inner":[(.35,.17),(.68,.16),(.85,.38),(.92,.79),(.69,.86),(.52,.88),(.20,.82),(.08,.78),(.24,.40)]
  }
}
CATALOG_PART_MEASUREMENTS_MM = (
 {"part":"a","catalogLengthMm":990.60,"catalogFlatWidthAtBottomMm":1333.50,
  "catalogWaistbandWidthWithoutFastenerMm":723.90},
 {"part":"b","catalogLengthMm":965.20,"catalogFlatWidthAtBottomMm":1301.75,
  "catalogWaistbandWidthWithoutFastenerMm":730.25}
)

def _polygon(poly, width, height, multiplier=1.0):
    cx = sum(x for x, y in poly) / len(poly)
    cy = sum(y for x, y in poly) / len(poly)
    points = [
      (int(round(min(1., max(0., cx+(x-cx)*multiplier))*width)),
       int(round(min(1., max(0., cy+(y-cy)*multiplier))*height)))
      for x,y in poly
    ]
    return np.array([points],dtype=np.int32)

def seeded_grabcut(rgb, outer, inner, variant=0):
    """Source-derived image with fixed, inspectable non-ground-truth seed areas."""
    if not isinstance(rgb,np.ndarray) or rgb.dtype != np.uint8 or rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError("real-8bit-3channel-photo-required")
    if variant not in (0,1):
        raise ValueError("only-two-predeclared-independent-seed-variants")
    height,width = rgb.shape[:2]
    if height < 120 or width < 120:
        raise ValueError("segmentation-image-too-small")
    labels = np.full((height,width),cv2.GC_PR_BGD,dtype=np.uint8)
    cv2.fillPoly(labels,_polygon(outer,width,height,1.+.015*variant),cv2.GC_PR_FGD)
    cv2.fillPoly(labels,_polygon(inner,width,height,1.-.10*variant),cv2.GC_FGD)
    labels[:12,:] = cv2.GC_BGD
    labels[-12:,:] = cv2.GC_BGD
    labels[:,:8] = cv2.GC_BGD
    labels[:,-8:] = cv2.GC_BGD
    cv2.setRNGSeed(23+variant)
    bg_model = np.zeros((1,65),dtype=np.float64)
    fg_model = np.zeros((1,65),dtype=np.float64)
    bgr = cv2.cvtColor(np.ascontiguousarray(rgb),cv2.COLOR_RGB2BGR)
    cv2.grabCut(bgr,labels,None,bg_model,fg_model,6,cv2.GC_INIT_WITH_MASK)
    tentative = np.where(
      (labels==cv2.GC_FGD)|(labels==cv2.GC_PR_FGD),255,0
    ).astype(np.uint8)
    n,components,stats,_ = cv2.connectedComponentsWithStats(tentative,8)
    if n < 2:
        raise ValueError("no-connected-garment-foreground")
    biggest = max(range(1,n),key=lambda j:int(stats[j,cv2.CC_STAT_AREA]))
    retained = np.where(components==biggest,255,0).astype(np.uint8)
    return retained, {"rawForegroundComponents":int(n-1),
      "largestComponentPixelCount":int(stats[biggest,cv2.CC_STAT_AREA]),
      "discardedSmallComponentCount":int(n-2)}

def _chromatic(rgb):
    hi=rgb.max(axis=2).astype(np.int16)
    lo=rgb.min(axis=2).astype(np.int16)
    mean=rgb.astype(np.float32).mean(axis=2)
    return ((hi-lo >= 34)&(mean<230)&(lo<216))|((mean<85)&(hi-lo>=13))

def _bands(mask,rect):
    y0,y1,x0,x1=rect
    height=mask.shape[0]
    span=y1-y0
    out=[]
    for i,p in enumerate((.10,.23,.36,.50,.64,.77,.90)):
        y=min(height-1,max(0,round(y0+p*span)))
        radius=max(2,int(round(span*.012)))
        yy0=max(0,y-radius);yy1=min(height,y+radius+1)
        xs=np.flatnonzero(mask[yy0:yy1,:].any(axis=0))
        if len(xs)<10:
            raise ValueError("true-image-mask-row-foreground-absent")
        out.append({"index":i,"samplePhotoY":int(y),
          "leftPhotoX":int(xs[0]),"rightPhotoX":int(xs[-1]),
          "candidateFullForegroundWidthPixels":int(xs[-1]-xs[0]+1),
          "notPerspectiveOrMetricCalibrated":True})
    return out

def propose_full_mask(rgb,image_id):
    """Admit ONLY exact known decoded source image; all output research-only."""
    source=SOURCES.get(image_id)
    if source is None:
        raise ValueError("wrong-met-source-photo-id")
    if not isinstance(rgb,np.ndarray) or rgb.dtype!=np.uint8 or rgb.shape!=(source["height"],1200,3):
        raise ValueError("source-image-dimensions-or-channels-mismatched")
    rgb=np.ascontiguousarray(rgb)
    sha=hashlib.sha256(rgb.tobytes()).hexdigest()
    if sha!=source["rgb_sha"]:
        raise ValueError("source-gallery-true-original-photo-RGB-SHA256-mismatch")
    candidate,ca=seeded_grabcut(rgb,source["outer"],source["inner"],0)
    challenger,cb=seeded_grabcut(rgb,source["outer"],source["inner"],1)
    a=(candidate>0);b=(challenger>0)
    foreground=int(np.count_nonzero(a))
    intersection=int(np.count_nonzero(a&b))
    union=int(np.count_nonzero(a|b))
    iou=intersection/union if union else 0
    area=foreground/a.size
    yy,xx=np.nonzero(a)
    if len(yy)==0: raise ValueError("source-foreground-empty")
    y0,y1,x0,x1=(int(yy.min()),int(yy.max()),int(xx.min()),int(xx.max()))
    color=_chromatic(rgb)
    coloredPixels=int(np.count_nonzero(color))
    colorRecall=int(np.count_nonzero(color&a))/max(1,coloredPixels)
    mean=rgb.mean(axis=2)
    ch=rgb.max(axis=2).astype(np.int16)-rgb.min(axis=2).astype(np.int16)
    neutral=(mean[:int(.35*rgb.shape[0]),:]>150)&(ch[:int(.35*rgb.shape[0]),:]<45)
    upperNeutral=int(np.count_nonzero(neutral&a[:int(.35*rgb.shape[0]),:]))
    # All thresholds are source-dataset QA, not external human-accepted ground truth.
    if not (.45<area<.78):
        raise ValueError("garment-foreground-area-outside-real-source-range")
    if iou<.97:
        raise ValueError("mask-uncertain-under-independent-seed-perturbation")
    if colorRecall<.93:
        raise ValueError("real-source-color-textile-not-contained-in-mask")
    if upperNeutral<15000:
        raise ValueError("cream-waistband-not-included-in-full-mask-proposal")
    if y0>int(rgb.shape[0]*.20) or y1<int(rgb.shape[0]*.81):
        raise ValueError("full-garment-top-or-bottom-missing")
    if x0>int(rgb.shape[1]*.12) or x1<int(rgb.shape[1]*.85):
        raise ValueError("full-garment-left-or-right-missing")
    meta={
      "schema":"M2-Met-70759-source-attested-4-photo-full-foreground-proposal/v1",
      "status":"PHOTO_FOREGROUND_MASK_CANDIDATE_REVIEW_REQUIRED",
      "sourceMuseumObjectId":70759,
      "sourceMuseumObjectNumber":"1983.21a, b",
      "imageId":image_id,"originalFullDecodedRGBSHA256":sha,
      "sourcePixelDimensions":[int(rgb.shape[1]),int(rgb.shape[0])],
      "museumCaption":source["museum_caption"],
      "museumCaptionExplicitlyVerified":source["museum_caption_verified"],
      "otherPartAndViewLabelsAreProvisional":not source["museum_caption_verified"],
      "provisionalSourcePartView":source["provisional_role"],
      "maskForegroundPixelCount":foreground,
      "maskAreaFraction":round(area,6),
      "rawMaskForegroundComponents":ca["rawForegroundComponents"],
      "discardedDisconnectedImageComponents":ca["discardedSmallComponentCount"],
      "independentlySeededSecondMaskForegroundComponents":cb["rawForegroundComponents"],
      "twoIndependentPhotoSeedMaskIoU":round(iou,6),
      "uncertainBoundaryPixelCount":int(np.count_nonzero(a!=b)),
      "fullMaskContainsEarlierChromaticTextileFraction":round(colorRecall,6),
      "fullMaskContainsLightNeutralUpperGarmentPixels":upperNeutral,
      "garmentCandidateBboxOriginalPixels":[x0,y0,x1,y1],
      "sevenFullMaskSourceImageBands":_bands(a,(y0,y1,x0,x1)),
      "museumCatalogPartMeasurementsMm":CATALOG_PART_MEASUREMENTS_MM,
      "pixelWidthsNotPhysicalMMWithoutIndependentCameraAndFlattening":True,
      "materialBackgroundMayStillLeakAtNearWhiteWaistband":True,
      "sourceSpecificVisualPolygonPriorsAreNotExpertGroundTruth":True,
      "maskNotHumanOrCuratorApproved":True,
      "independentExpertBoundaryReviewRequired":True,
      "notSourceMatched3DPatternOrRearSurface":True,
      "notProven3DFitDrapeOrDynamicCollisionFree":True,
      "sourcePhotosUnmodified":True,
      "originalHonolulu5152_1SourceNotReusedOrCalibrated":True,
      "source2DFallbackRequired":True,
      "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
    }
    return candidate,challenger,meta
