"""Actual museum 70759 four byte-attested Sharp decoded RGB images -> full
Garment alpha mask PROPOSALS only. They are NOT human-reviewed masks or
wearable reconstruction; source-color/background boundaries are uncertain.

CI fetches each exact original museum JPEG, verifies full decoded RGB SHA256,
then writes temporary .rgb bytes which this independent OpenCV estimator reads.
Exports only disposable research image PNG/JSON artifacts; NO product imports.
"""
import hashlib
import json
import os
import sys
from pathlib import Path
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/"research"/"parallel89"))
from met_full_mask_proposal89 import SOURCES,propose_full_mask

SOURCE=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
OUT=ROOT/"benchmark"/"parallel89-met70759-full-alpha-proposals"
OUT.mkdir(parents=True,exist_ok=True)
receipts=[]
for photo_id,meta in sorted(SOURCES.items()):
    width=1200;height=meta["height"]
    original=SOURCE/f"met-70759-gallery-{photo_id}.rgb"
    if not original.is_file():
        raise RuntimeError("missing genuine decoded original museum photo buffer: "+str(original))
    raw=original.read_bytes()
    if len(raw)!=width*height*3:
        raise RuntimeError("inconsistent original photo uncompressed RGB size: "+str(photo_id))
    sha=hashlib.sha256(raw).hexdigest()
    if sha!=meta["rgb_sha"]:
        raise RuntimeError("original Met image content changed; exact SHA attestation required")
    rgb=np.frombuffer(raw,dtype=np.uint8).reshape((height,width,3)).copy()
    primary,challenger,audit=propose_full_mask(rgb,photo_id)
    if hashlib.sha256(rgb.tobytes()).hexdigest()!=sha:
        raise RuntimeError("source original photograph pixels mutated by segmentation")
    assert audit["status"]=="PHOTO_FOREGROUND_MASK_CANDIDATE_REVIEW_REQUIRED"
    assert audit["maskNotHumanOrCuratorApproved"]
    assert audit["independentExpertBoundaryReviewRequired"]
    assert not audit["consumer3DAdmitted"]
    assert not audit["releaseAuthorized"]
    assert audit["source2DFallbackRequired"]
    assert audit["sourceMuseumObjectNumber"]=="1983.21a, b"
    assert len(audit["sevenFullMaskSourceImageBands"])==7
    assert audit["twoIndependentPhotoSeedMaskIoU"]>=.97
    assert audit["exportedMaskIsConservativeIntersectionOfTwoSourceSeededRuns"]
    assert audit["uncertainSourceBoundaryPixelsExcludedFromAlphaButShownInOverlay"]
    assert np.count_nonzero(primary>0)+audit["uncertainBoundaryPixelCount"]==np.count_nonzero(challenger>0)
    assert audit["fullMaskContainsEarlierChromaticTextileFraction"]>=.93
    assert audit["fullMaskContainsLightNeutralUpperGarmentPixels"]>15000
    assert audit["originalHonolulu5152_1SourceNotReusedOrCalibrated"]
    if photo_id==2551406:
        assert audit["museumCaptionExplicitlyVerified"]
        assert audit["museumCaption"]=="a) front"
    else:
        assert not audit["museumCaptionExplicitlyVerified"]
        assert audit["otherPartAndViewLabelsAreProvisional"]
    _,mask_png=cv2.imencode(".png",primary)
    if not _:raise RuntimeError("failed-original-source-mask-png-encoding")
    mask_file=OUT/f"met-70759-{photo_id}-AUTO-UNREVIEWED-foreground-mask.png"
    mask_file.write_bytes(mask_png.tobytes())
    alpha=np.dstack((rgb,primary))
    if not cv2.imwrite(str(OUT/f"met-70759-{photo_id}-AUTO-UNREVIEWED-RGBA.png"),
                       cv2.cvtColor(alpha,cv2.COLOR_RGBA2BGRA)):
        raise RuntimeError("failed-RGBA-original-photo-proposal-output")
    overlay=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
    contours,_=cv2.findContours(primary,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(overlay,contours,-1,(40,230,30),2)
    uncertainty=np.logical_xor(primary>0,challenger>0)
    overlay[uncertainty]=(0,128,255)
    if not cv2.imwrite(str(OUT/f"met-70759-{photo_id}-AUTO-UNREVIEWED-boundary-uncertainty.jpg"),
                       overlay,[cv2.IMWRITE_JPEG_QUALITY,92]):
        raise RuntimeError("failed-overlay-original-photo-proposal-output")
    audit["sourceByteAccuratePixelBufferSuppliedByInstitutionalIIIFSHA"] = True
    audit["outputMaskPngSHA256"]=hashlib.sha256(mask_png.tobytes()).hexdigest()
    audit["originalPixelRGBACompositeNotProductAsset"]=True
    receipts.append(audit)
    print("P89_MET_FULL_SOURCE_PHOTO_MASK_REVIEW_REQUIRED "+json.dumps({
      "id":photo_id,"sourceRGBSHA256":sha,"maskSHA256":audit["outputMaskPngSHA256"],
      "maskForegroundPixels":audit["maskForegroundPixelCount"],
      "maskSeedStabilityIoU":audit["twoIndependentPhotoSeedMaskIoU"],
      "conservativeConsensusAlpha":True,
      "uncertainExcludedBoundaryPixels":audit["uncertainBoundaryPixelCount"],
      "earlierColorTextileInNewMask":audit["fullMaskContainsEarlierChromaticTextileFraction"],
      "upperPaleWaistbandPixelsIncluded":audit["fullMaskContainsLightNeutralUpperGarmentPixels"],
      "sourceFullMaskWidthsPx":[x["candidateFullForegroundWidthPixels"]
                                for x in audit["sevenFullMaskSourceImageBands"]],
      "humanReviewed":False,"fitApproved":False,"familyAlpha":"HOLD"
    },sort_keys=True))
if len(receipts)!=4:
    raise RuntimeError("must-reproduce-four-independent-source-photo-masks")
if sum(x["museumCaptionExplicitlyVerified"] for x in receipts)!=1:
    raise RuntimeError("only-verified-Met-a-front-museum-caption-is-eligible")
report={
  "schema":"M2-source-attested-original-Met-four-foreground-alpha-candidates/v1",
  "source":"https://www.metmuseum.org/art/collection/search/70759",
  "sourceObjectNumber":"1983.21a, b",
  "originalSourceSamePhotographPixelsVerified":True,
  "originalSourcePhotoRGBCanonicalSHA256":{str(i):v["rgb_sha"] for i,v in SOURCES.items()},
  "maskedOriginalPhotoPixels":receipts,
  "allMasksMachineGeneratedAndUnreviewed":True,
  "humanOrCuratorialMaskAcceptanceReceived":False,
  "expertGarmentBoundaryReviewRequired":True,
  "originalPhotoPerspectiveAndPhysicalFlatteningNotCalibrated":True,
  "fullWaistAndBackSewingGeometryNotCertified":True,
  "notIndependentPhysicalWearable3D":True,
  "noUnverifiedViewPromotedToMuseumCertified":True,
  "noConsumerOrOwnerPhotosTouched":True,
  "originalHonoluluSourceAndFallbackUntouched":True,
  "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
}
(OUT/"met-70759-four-photo-AUTO-UNREVIEWED-mask-receipts.json").write_text(
 json.dumps(report,indent=2)+"\n",encoding="utf8")
print("P89_GENUINE_MET_FOUR_FULL_MASK_PROPOSALS_REVIEW_REQUIRED "+
 json.dumps({"sourceImageCount":len(receipts),
  "correctSourceObject":"1983.21a, b",
  "reviewNeeded":True,"consumer3DAdmitted":False,
  "originalPhoto2DRequired":True,"familyAlpha":"HOLD"},sort_keys=True))
