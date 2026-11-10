"""P792: deterministic, source-SHA logged additional real publisher test photos.

This is a research-intake selection, not newly blinded human ground truth.
Selection keys depend ONLY on publisher ID/annotations/rights metadata and
registered previously exposed source digests, NEVER on model outputs.
Actual publisher annotation archive SHA is pinned to P66's existing source.
"""
import hashlib
import io
import json
import pathlib
import re
import sys
import urllib.request
import zipfile

BASE = pathlib.Path("research/real-garment-acceptance-66/fashionpedia-sample.json")
OUTPUT = pathlib.Path("benchmark/mission1-additional-publisher-originals-792")
LIMIT = 10
GROUP = "closet-current-M1-P792-full-source-eligible-census-v3"
ALLOWED = {0,1,2,3,4,5,6,7,8,9,10,23}
VALID_NAME = re.compile(r"^[a-f0-9]{32}\.jpg$")
SHA = lambda content: hashlib.sha256(content).hexdigest()

def eligible(image, anns):
    if image.get("license") != 8:
        return False
    w,h=image.get("width"),image.get("height")
    if not (isinstance(w,int) and isinstance(h,int) and 256<=w<=3072 and 256<=h<=3072):
        return False
    if not VALID_NAME.fullmatch(str(image.get("file_name",""))):
        return False
    if not 1<=len(anns)<=8:return False
    for a in anns:
        if not isinstance(a.get("segmentation"),list) or not a["segmentation"]:
            return False
        if any(not isinstance(poly,list) or len(poly)<6 or len(poly)%2
               for poly in a["segmentation"]):
            return False
    return True

def deterministic_rank(image_id):
    return SHA((GROUP+":"+str(image_id)).encode())

def prepare(publisher,archive,exposed):
    images={im["id"]:im for im in publisher["images"]}
    excluded_ids={9029,10395,11321,10904,10775,12042}
    by_image={}
    for a in publisher["annotations"]:
        if a.get("category_id") in ALLOWED:
            by_image.setdefault(a["image_id"],[]).append(a)
    candidates=sorted(
        ((images[id],a) for id,a in by_image.items()
         if id in images and id not in excluded_ids and eligible(images[id],a)),
        key=lambda z:(deterministic_rank(z[0]["id"]),z[0]["id"])
    )
    # This publisher release offers exactly TEN additional SHA-distinct
    # sources under the strict original source-license/polygon criteria after
    # the 73-image research exposure registry. Evaluate the entire available
    # pool: no model-adaptive sampling and no favorable-source cherry picking.
    members=set(archive.namelist())
    rows=[]
    for photo,anns in candidates:
        member="test/"+photo["file_name"]
        if member not in members:
            continue
        raw=archive.read(member)
        digest=SHA(raw)
        if digest in exposed or digest in {r["sha256"] for r in rows}:
            continue
        if len(raw)<512 or len(raw)>10_000_000 or not raw.startswith(b"\xff\xd8"):
            continue
        row={
            "id":photo["id"],"width":photo["width"],"height":photo["height"],
            "file_name":photo["file_name"],"license":photo["license"],
            "time_captured":photo.get("time_captured"),
            "original_url":photo.get("original_url"),"isstatic":photo.get("isstatic"),
            "kaggle_id":photo.get("kaggle_id"),
            "sha256":digest,"bytes":len(raw),"archiveMember":member,
            "annotations":anns,
            "sourceSelectionStratum":"multi" if len(anns)>=2 else "single",
            "groundTruthProvenance":"Pre-existing Fashionpedia publisher human polygons only, no independent blinded review",
            "primaryColor":None,"exactAppSubtype":None
        }
        rows.append(row)
        (OUTPUT/"originals"/photo["file_name"]).write_bytes(raw)
        if len(rows)==LIMIT:break
    if len(rows)!=LIMIT:
        archive_entries=archive.namelist()
        matching_test=sum(("test/"+photo["file_name"]) in archive_entries for photo,_ in candidates)
        print("M1_P792_PUBLISHER_INTAKE_DIAGNOSTIC",json.dumps({
            "publisherImages":len(images),
            "publisherPolygonCandidateImages":len(by_image),
            "rightsAndGeometryEligible":len(candidates),
            "testPathCandidates":matching_test,
            "archiveEntries":len(archive_entries),
            "archiveExamples":archive_entries[:5],
            "firstCandidates":[{"id":im["id"],"file_name":im["file_name"],
              "knownTestMember":("test/"+im["file_name"]) in archive_entries}
             for im,_ in candidates[:8]],
            "actuallyDistinctUnexposedRows":len(rows),
        },sort_keys=True))
        raise RuntimeError("P792 cannot find 10 distinct previously unexposed publisher originals")
    return rows

def run():
    base=json.loads(BASE.read_text())
    exposure_file=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else "/tmp/m1-p792-exposed.json")
    old=json.loads(exposure_file.read_text())
    if not isinstance(old,list) or len(old)<73 or any(not re.fullmatch("[0-9a-f]{64}",str(x)) for x in old):
        raise RuntimeError("P792 exact 73+ source exposure quarantine missing")
    exposed=set(old)
    if any(row["sha256"] not in exposed for row in base["rows"]):
        raise RuntimeError("Old six source images missing from quarantine")
    annotation=urllib.request.urlopen(base["annotationURL"],timeout=180).read()
    if SHA(annotation)!=base["annotationSHA256"]:
        raise RuntimeError("Publisher annotation archive silently changed")
    publisher=json.loads(annotation)
    if not isinstance(publisher.get("images"),list) or not isinstance(publisher.get("annotations"),list):
        raise RuntimeError("Invalid real original Fashionpedia publisher release")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    (OUTPUT/"originals").mkdir(parents=True,exist_ok=True)
    blob=urllib.request.urlopen(base["archiveURL"],timeout=900).read()
    if not zipfile.is_zipfile(io.BytesIO(blob)):
        raise RuntimeError("Original photo source is not an archive")
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        rows=prepare(publisher,archive,exposed)
    manifest={
        "schema":"m1-p792-additional-publisher-originals-research-not-holdout/v1",
        "selectionAlgorithm":GROUP,
        "annotationURL":base["annotationURL"],
        "annotationSHA256":base["annotationSHA256"],
        "archiveURL":base["archiveURL"],
        "sourcePublisherLicenseMetadataOnly":True,
        "publisherAnnotatedImageRightsIndependentlyCleared":False,
        "blindHumanReviewIndependentlyVerified":False,
        "newToEarlierExposedSourceHashRegistry":True,
        "selectionCensusNotModelChosen":True,
        "trainingCorpusOverlapIndependentlyExcluded":False,
        "exactAppSubtypeHumanTruthAvailable":False,
        "humanPrimaryColorTruthAvailable":False,
        "releaseAuthorized":False,"familyAlpha":"HOLD",
        "rows":rows
    }
    (OUTPUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print("M1_P792_REAL_PUBLISHER_ADDITIONAL_ORIGINALS",json.dumps({
        "sourcePhotos":len(rows),
        "publisherPolygonInstances":sum(len(x["annotations"]) for x in rows),
        "distinctSourceSHA256":len({x["sha256"] for x in rows}),
        "multiGarmentSourcePhotos":sum(r["sourceSelectionStratum"]=="multi" for r in rows),
        "singleGarmentSourcePhotos":sum(r["sourceSelectionStratum"]=="single" for r in rows),
        "imageIds":[x["id"] for x in rows],
        "exposureSHA256":[x["sha256"] for x in rows],
        "unsupportedOwnerHumanTruth":True,
        "releaseAuthorized":False,"familyAlpha":"HOLD"
    },sort_keys=True))
if __name__=="__main__":run()
