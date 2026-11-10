"""P793: actually materialize the 24 archived P66/P772/P792 published original
JPEG bytes from the frozen annotation archive. Nothing from private accounts.
No imagery shipped or recorded in Git; runtime bytes erased after visual
fingerprint receipts. Not a new independent holdout or license clearance.
"""
import hashlib
import io
import json
from pathlib import Path
import re
import sys
from urllib.request import urlopen,Request
import zipfile

def sha(data):return hashlib.sha256(data).hexdigest()
def fetch(url):
    with urlopen(Request(url,headers={"User-Agent":"ClosetCurrentOriginalEvidence/1.0"}),timeout=180) as res:
        return res.read()
def go():
    if len(sys.argv)!=3:
        raise RuntimeError("usage: extract-publisher-originals-793.py SIGNED_SOURCE_INDEX_JSON OUTPUT_ROOT")
    expected=json.loads(Path(sys.argv[1]).read_text())
    if expected.get("schema")!="m1-p793-original-24-publisher-source-SHA/v1":
        raise RuntimeError("P793 validated 24 publisher-original source registry required")
    rows=expected["rows"]
    if len(rows)!=24 or len({r["sha256"] for r in rows})!=24 or        sorted((r["group"],int(r["id"])) for r in rows)!=sorted(
           (r["group"],int(r["id"])) for r in rows if r["group"] in ("p66","p772","p792")):
        raise RuntimeError("P793 must register exact 6+8+10 original SHA cohort")
    if {g:sum(r["group"]==g for r in rows) for g in ["p66","p772","p792"]}!={"p66":6,"p772":8,"p792":10}:
        raise RuntimeError("P793 original publisher groups must exactly match registered 24")
    url=expected["annotationURL"];archive_url=expected["archiveURL"]
    if url!="https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_val2020.json" or        archive_url!="https://s3.amazonaws.com/ifashionist-dataset/images/val_test2020.zip":
        raise RuntimeError("P793 publisher domain and archive must remain pinned")
    annotation=fetch(url)
    if sha(annotation)!=expected["annotationSHA256"]:
        raise RuntimeError("P793 actual publisher human annotation archive SHA mismatch")
    images={int(x["id"]):x for x in json.loads(annotation)["images"]}
    blob=fetch(archive_url)
    if len(blob)>280_000_000 or not zipfile.is_zipfile(io.BytesIO(blob)):
        raise RuntimeError("P793 actual publisher JPEG archive invalid/bounded")
    root=Path(sys.argv[2]);root.mkdir(parents=True,exist_ok=True)
    receipts=[]
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        members=set(archive.namelist())
        for row in rows:
            id=int(row["id"]);original=images.get(id)
            if not original or not re.fullmatch(r"[a-f0-9]{32}\.jpg",original["file_name"]):
                raise RuntimeError("P793 registered original publisher photo missing")
            if row.get("file_name") and row["file_name"]!=original["file_name"]:
                raise RuntimeError("P793 photo ID swapped to different publisher JPEG")
            member="test/"+original["file_name"]
            if member not in members:
                raise RuntimeError("P793 actual original missing from publisher archive")
            raw=archive.read(member)
            if sha(raw)!=row["sha256"] or len(raw)<512 or len(raw)>10_000_000 or                not raw.startswith(b"\xff\xd8") or not raw.endswith(b"\xff\xd9"):
                raise RuntimeError("P793 original JPEG content SHA or integrity mismatch")
            destination=root/("p66" if row["group"]=="p66" else "p772-p792")
            destination.mkdir(parents=True,exist_ok=True)
            filename=row["id"]+".jpg" if row["group"]=="p792" else original["file_name"]
            (destination/filename).write_bytes(raw)
            receipts.append({"id":id,"group":row["group"],"sha256":sha(raw),
             "publisherFile":original["file_name"],"bytes":len(raw)})
    assert len(receipts)==24 and len(set(x["sha256"] for x in receipts))==24
    print("M1_P793_TWENTY_FOUR_ACTUAL_PUBLISHER_ORIGINALS_SHA_VERIFIED",
       json.dumps({"photoCount":len(receipts),"cohorts":{"p66":6,"p772":8,"p792":10},
        "userOwnedImages":0,"sourceBytesNeverUploaded":True,
        "familyAlpha":"HOLD","originalDigestSetSHA256":
         sha("\n".join(sorted(x["sha256"] for x in receipts)).encode())},sort_keys=True))
if __name__=="__main__":go()
