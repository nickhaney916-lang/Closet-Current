"""Export model-produced garment-instance masks as UNREVIEWED editing seeds.

The browser annotation editor can import these masks for a human to correct.
Source SHA and binary run fidelity are enforced; this is not model approval.
"""
import numpy as np

def encode_binary_runs(mask):
    pixels=np.asarray(mask)
    if (pixels.ndim!=2 or not np.issubdtype(pixels.dtype,np.bool_)
        or not 1<=pixels.shape[0]*pixels.shape[1]<=12_000_000):
        raise ValueError("Invalid experimental garment-instance binary mask")
    flat=pixels.reshape(-1).astype(np.uint8)
    changes=np.flatnonzero(flat[1:]!=flat[:-1])+1
    boundaries=np.concatenate(([0],changes,[flat.size]))
    runs=np.diff(boundaries).astype(int).tolist()
    if flat[0]:runs=[0]+runs
    if sum(runs)!=flat.size or len(runs)>flat.size+1:
        raise ValueError("Invalid alternating model-mask runs")
    return runs

def proposal_seed(original, candidate, ordinal, model):
    if (not isinstance(original,dict)
        or not isinstance(original.get("image"),str)
        or not original["image"].endswith((".jpg",".png",".webp"))
        or not isinstance(original.get("sha256"),str)
        or len(original["sha256"])!=64
        or any(c not in "0123456789abcdef" for c in original["sha256"])
        or not isinstance(ordinal,int) or ordinal<1 or ordinal>20
        or not isinstance(model,str) or not model or len(model)>180
        or not isinstance(candidate,dict)
        or not isinstance(candidate.get("itemType"),str)
        or not isinstance(candidate.get("score"),(int,float))
        or not np.isfinite(candidate["score"])
        or not 0<=candidate["score"]<=1):
        raise ValueError("Invalid provenance for unapproved mask seed")
    mask=np.asarray(candidate.get("mask"))
    if mask.ndim!=2 or mask.dtype!=bool:
        raise ValueError("Missing binary instance mask")
    return {
      "schemaVersion":1,"image":original["image"],
      "sourceSha256":original["sha256"],"width":int(mask.shape[1]),
      "height":int(mask.shape[0]),"runs":encode_binary_runs(mask),
      "model":model,"candidateOrdinal":ordinal,
      "modelGarmentLabel":candidate["itemType"],
      "modelConfidence":round(float(candidate["score"]),6),
      "reviewStatus":"prediction-unreviewed",
      "approvedBy":None,"reviewer":None,
      "independentReference":False,"garmentCountVerified":False,
      "canSaveToCustomerCloset":False,
      "sourceRgbChanged":False,
      "instructions":"Open original photo in benchmark/annotate-garment.html; load this JSON as AI seed, correct all fabric edges, export DRAFT; require a different reviewer for approval."
    }
