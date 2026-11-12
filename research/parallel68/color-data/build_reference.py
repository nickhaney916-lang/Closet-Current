import collections,concurrent.futures,hashlib,html,json,pathlib,re,tarfile,time,urllib.request,os
ROOT=pathlib.Path(__file__).resolve().parents[3];DEST=ROOT/'research/parallel68/color-data';PHOTOS=ROOT/'benchmark/parallel68-color-photos';PHOTOS.mkdir(parents=True,exist_ok=True)
SOURCE=pathlib.Path(os.environ.get('AI4C_COLOR_SOURCE_DIR','/tmp/p68-color-sources/color_detection_dataset'));REV='767169b2b053485ee7b909fd19b96e98f6be0453'
x=json.load(open(SOURCE/'AI4C_Fashion_Color_Dataset_2024-06-01_0.json'));cats={r['id']:r['label'] for r in x['categories']};ann=collections.defaultdict(list)
for a in x['annotations']:ann[a['image_id']].append(a)
archives={};members={}
for n in ['col1.tar.gz','col2.tar.gz','col3.tar.gz']:
 p=SOURCE/n;archives[n]={'url':f'https://raw.githubusercontent.com/datable-be/AI4_C_datasets/{REV}/color_detection_dataset/{n}','sha256':hashlib.sha256(p.read_bytes()).hexdigest()};t=tarfile.open(p)
 for member in t.getmembers():
  if member.isfile():members[pathlib.PurePosixPath(member.name).name]=(t,member,n)

# Prospective metadata-only selection, before color algorithm or mask inference.
classes=['white','black','grey','red','blue','brown','green','yellow','pink','orange','purple','beige','multicoloured'];quotas={c:(4 if c in ['white','black','grey'] else 2) for c in classes}
selected={'development':[],'acceptance':[]};audit=[];seen=set()
for group in ['development','acceptance']:
 for color in classes:
  candidates=[]
  for row in x['images']:
   labels=[cats[a['category_id']] for a in ann[row['id']]]
   if labels!=[color] or not row.get('landing_page'):continue
   source=row.get('source') or '';momu='Antwerp' in source or 'Antwerpen' in source or 'Modemuseum' in source
   if (group=='development')!=momu:continue
   if not any(v in str(row.get('license')) for v in ['licenses/by/4.0/','publicdomain/mark/1.0/','publicdomain/zero/1.0/']):continue
   candidates.append(row)
  for row in sorted(candidates,key=lambda r:r['id'])[:35]:
   if sum(r['humanColor']==color for r in selected[group])>=quotas[color]:break
   landing=row['landing_page'];
   if landing in seen:continue
   try:
    request=urllib.request.Request(landing,headers={'User-Agent':'ClosetCurrentColorResearch/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/909)'})
    with urllib.request.urlopen(request,timeout=25) as response:page=response.read().decode()
    title_match=re.search(r'<meta[^>]*name="title"[^>]*content="([^"]+)"',page)
    title=html.unescape(title_match.group(1)) if title_match else ''
    license_match=re.search(r'href="([^"]+)"[^>]*class="[^"]*rights-statement-button',page)
    actual_license=html.unescape(license_match.group(1)) if license_match else ''
    norm=lambda s:s.replace('http:','https:').rstrip('/')
    if norm(actual_license)!=norm(row['license']):audit.append({'id':row['id'],'decision':'exclude','reason':'primary license mismatch','title':title});continue
    if re.search(r'\b(and|with|matching|pair|set|ensemble|illustration|drawing|print|fashion plate|photograph)\b',title,re.I):audit.append({'id':row['id'],'decision':'exclude','reason':'compound object or non-object title','title':title});continue
    if group=='acceptance' and not re.search(r'\b(dress|coat|jacket|shirt|blouse|skirt|trousers|waistcoat|sweater|robe|kimono|cape|mantle|bodice|gown|tunic|japon|jas|rok|broek|vest|mantel|hemd|jurk)\b',title,re.I):audit.append({'id':row['id'],'decision':'exclude','reason':'garment identity not established in publisher title','title':title});continue
    t,member,archive=members[row['file_name']];data=t.extractfile(member).read();sha=hashlib.sha256(data).hexdigest()
    if sha in seen:continue
    image='ai4culture-'+row['id']+'.jpg';(PHOTOS/image).write_bytes(data)
    frozen={**row,'image':image,'sha256':sha,'archive':archive,'archiveMember':member.name,'humanColor':color,'humanAnnotations':ann[row['id']],'primaryTitle':title,'primaryLicense':actual_license,'primaryPageSha256':hashlib.sha256(page.encode()).hexdigest(),'annotationScope':'human-validated color(s) of predominant depicted object; NOT per-instance boundaries or ranked multi-color truth','humanValidated':True,'split':group,'labelModified':False,'photoPixelReviewedByUs':False,'providedDatasetJPEGNotCameraOriginal':True}
    selected[group].append(frozen);seen.update([landing,sha]);audit.append({'id':row['id'],'decision':'included '+group,'title':title,'color':color});print(group,color,row['id'],title,flush=True)
   except Exception as e:audit.append({'id':row['id'],'decision':'exclude','reason':type(e).__name__})
   time.sleep(.1)
 metadata={'schema':'closet-current-parallel68-human-validated-color-object-reference/v1','sourceRepository':'https://github.com/datable-be/AI4_C_datasets','sourceRevision':REV,'sourceAnnotationPath':'color_detection_dataset/AI4C_Fashion_Color_Dataset_2024-06-01_0.json','annotationFileSha256':hashlib.sha256((SOURCE/'AI4C_Fashion_Color_Dataset_2024-06-01_0.json').read_bytes()).hexdigest(),'annotationDatasetLicense':'CC0-1.0; image rights separate','humanValidationProvenance':'Dataset publisher README: prepredicted colors approved, corrected or rejected by a human validator. Per-record adjudication action/timestamp are NOT supplied; release filename 2024-06-01 is not an individual annotation timestamp.','splitPolicy':'Development MoMu/Antwerp; acceptance other institutions. No shared landing page, source image SHA or metadata identity. Metadata/title/license screening only, no pixel algorithm or inference on acceptance before freeze.','unseenToOurAlgorithm':True,'individualAnnotationTimeAvailable':False,'releaseCommitDate':'2024-07-22T08:55:01+02:00','notSealedAgainstFoundationPretraining':True,'fineCategoryTruth':False,'perInstanceMaskTruth':False,'offWhiteTruthAvailable':False,'archives':archives,'split':group,'rows':selected[group]}
 p=DEST/('candidate-'+group+'.json');p.write_text(json.dumps(metadata,indent=2)+'\n');(DEST/('candidate-'+group+'.sha256')).write_text(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n')
(DEST/'selection-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
for group,rows in selected.items():print(group,len(rows),collections.Counter(r['humanColor'] for r in rows))
