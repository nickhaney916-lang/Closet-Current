import {readFile,writeFile} from 'node:fs/promises';
const [manifestPath,oldPath,newPath,outPath]=process.argv.slice(2);
if(!outPath)throw Error('Usage: compare-photo-resolutions.mjs MANIFEST 2048_RESULTS 4096_RESULTS OUTPUT');
const [manifest,oldRows,newRows]=await Promise.all([manifestPath,oldPath,newPath].map(p=>readFile(p,'utf8').then(JSON.parse)));
if(!Array.isArray(manifest)||manifest.length<5)throw Error('Expected a labeled independent benchmark sample');
const old=new Map(oldRows.map(x=>[x.id,x])),updated=new Map(newRows.map(x=>[x.id,x]));
const compare=({id,expectedCategory,expectedType})=>{
 const a=old.get(id),b=updated.get(id);
 if(!a||!b||a.error||b.error)throw Error('Missing or errored paired inference: '+id);
 return {id,expectedCategory,expectedType,oldCategory:a.prediction?.category||null,newCategory:b.prediction?.category||null,oldType:a.prediction?.type||null,newType:b.prediction?.type||null,oldCategoryCorrect:a.prediction?.category===expectedCategory,newCategoryCorrect:b.prediction?.category===expectedCategory,oldTypeCorrect:a.prediction?.type===expectedType,newTypeCorrect:b.prediction?.type===expectedType,oldElapsedMs:a.elapsedMs,newElapsedMs:b.elapsedMs};
};
const rows=manifest.map(compare),count=key=>rows.filter(x=>x[key]).length;
const stats={samples:rows.length,categoryCorrect2048:count('oldCategoryCorrect'),categoryCorrect4096:count('newCategoryCorrect'),typeCorrect2048:count('oldTypeCorrect'),typeCorrect4096:count('newTypeCorrect'),categoryChanged:rows.filter(x=>x.oldCategory!==x.newCategory).map(x=>x.id),typeChanged:rows.filter(x=>x.oldType!==x.newType).map(x=>x.id),categoryRegressions:rows.filter(x=>x.oldCategoryCorrect&&!x.newCategoryCorrect).map(x=>x.id),categoryRecoveries:rows.filter(x=>!x.oldCategoryCorrect&&x.newCategoryCorrect).map(x=>x.id),rows};
await writeFile(outPath,JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify({...stats,rows:undefined},null,2));
