// Source-provenance audit, not a color benchmark: no invented human labels/masks.
// Emits only public IDs, SHA-256 and numbers. Original photographs never enter artifacts.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const ids=(process.env.P76_PHOTO_IDS||'commons-0003,commons-0021,commons-0049,commons-0082').split(',');
const rows=[];
for(const id of ids){
 const row=manifest.find(x=>x.id===id);
 if(!row?.verified||!row.attribution?.license||!row.attribution?.source||!row.sha256)throw Error('Unverified lawful source '+id);
 const buffer=await readFile('benchmark/photos/'+row.image);
 const hash=createHash('sha256').update(buffer).digest('hex');
 if(hash!==row.sha256)throw Error('Original SHA drift: '+id);
 rows.push({id,sourceSha256:hash,license:row.attribution.license,bytes:buffer.length});
}
console.log('P76_VERIFIED_PUBLIC_ORIGINALS_NONACCURACY '+JSON.stringify({
 count:rows.length,exactSourceHashMatches:rows.length,
 providedIndependentInstanceMasks:0,independentlyHumanRatedInstanceColors:0,
 accuracyBefore:null,accuracyAfter:null,
 note:'Original public JPEGs are verified for provenance only. Neither mask nor per-instance human color truth may be fabricated.',
 rows
}));
