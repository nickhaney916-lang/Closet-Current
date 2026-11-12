import {assertAcceptance68} from '../research/parallel68/acceptance-guard.mjs';
// Replay actual SAM masks, changing only foreground selection. The original
// pixel-family estimator remains an explicit baseline, never a text guess.
import {RawImage} from '@huggingface/transformers';
import {readFile,writeFile} from 'node:fs/promises';import {gunzipSync,gzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import {pixelColor67} from '../research/parallel67/color.mjs';
import {measureMaskedColors68} from '../research/parallel68/color.mjs';
import {selectColorForeground68} from '../research/parallel68/color-mask.mjs';
const split=process.argv[2]||'development';const acceptanceReceipt=split==='acceptance'?await assertAcceptance68('color','research/parallel68/color-data/acceptance.json'):null;
const manifest=JSON.parse(await readFile('research/parallel68/color-data/'+split+'.json')),raw=JSON.parse(await readFile('research/parallel68/results/color-'+split+'.json'));
const records=new Map(manifest.rows.map(x=>[x.id,x]));const rows=[];
for(const row of raw.rows){
 const record=records.get(row.id),path=record.localPath||'benchmark/parallel68-color-photos/'+record.image;
 const bytes=await readFile(path);if(createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('Changed color source');
 const image=await RawImage.read(path),rawMask=gunzipSync(await readFile(row.maskFile));if(createHash('sha256').update(rawMask).digest('hex')!==row.maskSha256)throw Error('Changed actual model mask');
 const selected=selectColorForeground68({data:image.data,width:image.width,height:image.height,channels:image.channels,mask:new Uint8Array(rawMask)});
 let proposal={color:null,requiresReview:true,verified:false,reason:selected.reason},newEstimator=proposal,maskFile=null;
 if(selected.mask){
  const counts={};let n=0;for(let i=0;i<selected.mask.length;i++)if(selected.mask[i]){n++;const p=i*image.channels,c=pixelColor67(image.data[p],image.data[p+1],image.data[p+2]);counts[c]=(counts[c]||0)+1;}
  const palette=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([color,k])=>({color,fraction:k/n}));
  proposal={color:palette[0]?.fraction>=.72?palette[0].color:'Multicolor',palette,requiresReview:true,verified:false,reason:'selected_object_pixel_proposal_unverified'};
  newEstimator=measureMaskedColors68({data:image.data,width:image.width,height:image.height,channels:image.channels,mask:selected.mask,maskStatus:'model-proposed',sourceSha256:row.sha256});
  maskFile='benchmark/parallel68-masks/color-selected-'+split+'-'+row.id+'.bin.gz';await writeFile(maskFile,gzipSync(selected.mask));
 }
 const {mask,...selection}=selected,truth=record.humanColor.toLowerCase()==='grey'?'Gray':record.humanColor[0].toUpperCase()+record.humanColor.slice(1).toLowerCase();
 rows.push({...row,expectedColor:truth,foregroundSelection:selection,selectedMaskFile:maskFile,selectedMaskSha256:selected.mask?createHash('sha256').update(selected.mask).digest('hex'):null,selectedProposal:proposal,selectedProposalCorrect:proposal.color===truth,selectedNewEstimator:newEstimator,selectedNewEstimatorCorrect:newEstimator.color===truth});
 console.log(row.id,truth,row.baseline.color,'->',proposal.color,'new',newEstimator.color);
}
const stats=key=>({correct:rows.filter(r=>r[key]?.color===r.expectedColor).length,total:rows.length,proposed:rows.filter(r=>r[key]?.color!==null).length,wrongProposed:rows.filter(r=>r[key]?.color!==null&&r[key]?.color!==r.expectedColor).length,unreported:rows.filter(r=>r[key]?.color===null).length});
const report={schema:'closet-current-parallel68-color-foreground-comparison/v1',split,manifestSha256:raw.manifestSha256,acceptanceReceipt,scope:'human-validated predominant-object image colors; no human per-instance masks',baseline:stats('baseline'),maskSelectionWithExistingEstimator:stats('selectedProposal'),maskSelectionWithNewEstimator:stats('selectedNewEstimator'),automaticColorSaveAllowed:false,rows};
await writeFile('research/parallel68/results/color-selected-'+split+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({baseline:report.baseline,selected:report.maskSelectionWithExistingEstimator,newEstimator:report.maskSelectionWithNewEstimator}));
