"""Conservative review warnings for model instance proposals.

These descriptive warnings never infer physical item counts from semantic
labels, overlapping masks or source-photo scenario hints.
"""
from collections import Counter

CLASS_TO_CATEGORY={
 "short_sleeve_top":"Tops","long_sleeve_top":"Tops",
 "short_sleeve_outwear":"Outerwear","long_sleeve_outwear":"Outerwear",
 "vest":"Tops","sling":"Tops",
 "shorts":"Bottoms","trousers":"Bottoms","skirt":"Bottoms",
 "short_sleeve_dress":"Dresses","long_sleeve_dress":"Dresses",
 "vest_dress":"Dresses","sling_dress":"Dresses",
}
HINTS={"shorts":{"shorts"},"trousers":{"trousers"},
 "dress":{name for name in CLASS_TO_CATEGORY if CLASS_TO_CATEGORY[name]=="Dresses"},
 "outerwear":{name for name in CLASS_TO_CATEGORY if CLASS_TO_CATEGORY[name]=="Outerwear"},
 "mixed":set(),"shoes":set()}
EXPECTED=("Tops","Bottoms","Dresses","Outerwear","Shoes","Layered")


def review_instance_scene(proposals, expected_category, expected_type_hint, overlap):
    if (expected_category not in EXPECTED or expected_type_hint not in HINTS
        or not isinstance(proposals,list) or len(proposals)>20
        or not isinstance(overlap,dict)
        or not isinstance(overlap.get("conflicts"),list)
        or not isinstance(overlap.get("ambiguousProposalCount"),int)
        or overlap["ambiguousProposalCount"]<0
        or overlap["ambiguousProposalCount"]>len(proposals)):
        raise ValueError("Invalid garment review scene")
    if expected_category=="Shoes" and expected_type_hint!="shoes":
        raise ValueError("Footwear taxonomy is not supported")
    if expected_category=="Layered" and expected_type_hint!="mixed":
        raise ValueError("Mixed outfit lacks one expected garment type")
    if expected_category not in ("Layered","Shoes") and (
        expected_type_hint in ("mixed","shoes")
        or not any(CLASS_TO_CATEGORY[k]==expected_category for k in HINTS[expected_type_hint])):
        raise ValueError("Expected source context conflicts with taxonomy")
    counts=Counter()
    for p in proposals:
        kind=p.get("itemType")
        if kind not in CLASS_TO_CATEGORY:
            raise ValueError("Unrecognized model class")
        counts[CLASS_TO_CATEGORY[kind]]+=1
    kind_counts=Counter(x["itemType"] for x in proposals)
    supported=None if expected_category=="Layered" else expected_category!="Shoes"
    matches=None if supported is not True else counts[expected_category]
    hint_matches=None if expected_type_hint in ("mixed","shoes") else sum(
        kind_counts[k] for k in HINTS[expected_type_hint])
    flags=[]
    if expected_category=="Shoes":
        flags.append("unsupported-footwear-taxonomy")
    if not proposals:flags.append("no-model-proposals")
    if matches==0:flags.append("no-expected-category-proposal")
    if hint_matches==0:flags.append("no-expected-specific-garment-proposal")
    # Even zero-overlap masks can be sleeves/panels of ONE physical garment.
    if matches is not None and matches>1:
        flags.append("possible-single-garment-fragmentation")
    if overlap["conflicts"]:
        flags.append("potential-duplicate-or-layered-mask-overlap")
    return {
        "expectedCategoryIsSourceContextNotGroundTruth":True,
        "expectedSpecificTypeIsSourceContextNotGroundTruth":True,
        "expectedCategory":expected_category,
        "expectedTypeHint":expected_type_hint,
        "taxonomySupportsCategory":supported,
        "matchingCategoryProposals":matches,
        "matchingSpecificTypeProposals":hint_matches,
        "modelCandidateCount":len(proposals),
        "broadClassProposalCounts":dict(counts),
        "manualReviewFlags":flags,
        "confirmedSeparateGarments":0,
        "categoryAccuracyMeasured":False,
        "pixelAccuracyMeasured":False,
        "allowAutomaticSaving":False,
    }
