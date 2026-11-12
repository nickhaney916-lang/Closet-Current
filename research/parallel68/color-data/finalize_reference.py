"""Document metadata/development-relevance exclusions, never relabel human colors.
Not used during benchmark inference. Reproduce JPEGs with download_reference.py.
"""
import collections,datetime,hashlib,json,re,sys
from pathlib import Path
META=Path(__file__).parent;ROOT=META.parents[2]
# Development-only AI garment-relevance screen; these IDs never enter prediction.
DEVELOPMENT_IDS={'03998294de6d88e280af849eb9131eb4','15497e28250cc5bcfa1aca808181905c','1c6b2c592d79ad6699bee7089b230cda','9b80a4fec8fc64c6e1c38bf5c1a734ee','0293f9b6c15dfcad06c5f5d96f27c8d6','03de8a72670a391ad5ff80a6e0b38f36','065b6d3aa8ab29fa1475d05d4cc1db87','531620274919cd53c0ccebbbde565a6f','139e6afe4c004dfba0f87b1ce7532c48'}
COLORS=[('white',r'\b(?:wit(?:te)?|white)\b'),('black',r'\b(?:zwart(?:e)?|black)\b'),('grey',r'\b(?:grijs|grijze|gr[ae]y)\b'),('blue',r'\b(?:(?:licht|donker)?blauw(?:e)?|blue)\b'),('red',r'\b(?:rood|rode|red)\b'),('brown',r'\b(?:bruin(?:e)?|brown)\b'),('green',r'\b(?:groen(?:e)?|green)\b'),('yellow',r'\b(?:geel|gele|yellow)\b'),('purple',r'\b(?:paars(?:e)?|purple)\b'),('pink',r'\b(?:roze|pink)\b'),('orange',r'\b(?:oranje|orange)\b'),('beige',r'\bbeige\b')]
seen=set();audit=[];splits=sys.argv[1:] or ['development','acceptance']
if any(x not in ['development','acceptance'] for x in splits):raise ValueError('Invalid color split')
if 'development' not in splits:
    for row in json.loads((META/'development.json').read_text())['rows']:seen.update([row['sha256'],row['landing_page']])
for split in splits:
    source=json.loads((META/('candidate-'+split+'.json')).read_text());kept=[]
    for row in source['rows']:
        reason=None;title=row['primaryTitle']
        if split=='development' and row['id'] not in DEVELOPMENT_IDS:reason='AI visual development relevance screen: not isolated actual garment photo (swatch/accessory/trim/feather/package); human color unchanged'
        if split=='acceptance':
            if re.search(r'\b(fragment|fragments|bestaande uit)\b',title,re.I):reason='Publisher title indicates fragment or compound ensemble; primary-object scope uncertain'
            named=[(m.start(),color) for color,pattern in COLORS if (m:=re.search(pattern,title,re.I))]
            if named and sorted(named)[0][1]!=row['humanColor']:reason='First explicitly publisher-named material color conflicts with source human single-color label; requires independent adjudication, not relabeling'
        if row['sha256'] in seen or row['landing_page'] in seen:reason='Duplicate object/source across final groups'
        if reason:audit.append({'id':row['id'],'split':split,'reason':reason,'primaryTitle':title,'sourceHumanColor':row['humanColor']});continue
        if split=='development':row['photoPixelReviewedByUs']=True;row['selectionReview']='AI visual screening for garment relevance only; source HUMAN color unchanged. Not human geometry/category truth.'
        kept.append(row);seen.update([row['sha256'],row['landing_page']])
    source['rows']=kept;source['frozenAtUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat();source['estimatorAtFreezeSha256']=hashlib.sha256((ROOT/'research/parallel68/color.mjs').read_bytes()).hexdigest();source['individualAnnotationTimeAvailable']=False;source['releaseCommitDate']='2024-07-22T08:55:01+02:00';source['actualPixelAlgorithmEvaluationBeforeFreeze']=False
    p=META/(split+'.json');p.write_text(json.dumps(source,indent=2)+'\n');(META/(split+'.sha256')).write_text(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n');print(split,len(kept),collections.Counter(r['humanColor'] for r in kept))
(META/'scope-quality-exclusions.json').write_text(json.dumps(audit,indent=2)+'\n')
