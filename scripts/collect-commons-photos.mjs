#!/usr/bin/env node
// Fetch Wikimedia Commons garment photos with license/source metadata.
// Candidate labels come from search terms and MUST be human-verified before evaluation.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const categories=[['Tops','T-shirt','t shirt clothing garment'],['Tops','Blouse','blouse clothing'],['Bottoms','Jeans','blue jeans clothing'],['Bottoms','Shorts','shorts garment clothing'],['Bottoms','Skirt','skirt clothing'],['Dresses','Dress','dress garment'],['Outerwear','Jacket','jacket clothing'],['Outerwear','Coat','coat clothing'],['Shoes','Sneakers','sneakers shoes'],['Shoes','Boots','boots footwear']];
const target=Number(process.argv[2]||10);
if(!Number.isInteger(target)||target<1||target>30)throw Error('Usage: node scripts/collect-commons-photos.mjs [1-30 images per query]');
const api='https://commons.wikimedia.org/w/api.php';
const manifest=[],attributions=[],seen=new Set();
await mkdir('benchmark/photos',{recursive:true});
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const [category,type,query] of categories){
 const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:String(Math.min(50,target*4)),prop:'imageinfo',iiprop:'url|extmetadata|mime|size',iiurlwidth:'1600',format:'json',origin:'*'});
 let data;try{const res=await fetch(api+'?'+params);if(!res.ok)throw Error('HTTP '+res.status);data=await res.json();}catch(e){console.error('Search failed:',query,e.message);continue;}
 let collected=0;
 for(const page of Object.values(data.query?.pages||{})){
  if(collected>=target)break;
  const info=page.imageinfo?.[0],meta=info?.extmetadata||{},license=clean(meta.LicenseShortName?.value),licenseUrl=clean(meta.LicenseUrl?.value);
  if(!info?.url||!info.mime?.startsWith('image/')||!['image/jpeg','image/png','image/webp'].includes(info.mime)||!license||!/CC|public domain|PD-/i.test(license))continue;
  if(seen.has(info.url))continue;
  const url=info.thumburl||info.url;
  try{
   const response=await fetch(url);if(!response.ok)continue;
   const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>8*1024*1024||bytes.length<10000)continue;
   const ext=info.mime==='image/png'?'png':info.mime==='image/webp'?'webp':'jpg';
   const id='commons-'+String(manifest.length+1).padStart(4,'0'),filename=id+'.'+ext;
   await writeFile(path.join('benchmark/photos',filename),bytes);
   manifest.push({id,image:filename,mode:'single',expectedCategory:category,expectedType:type,verified:false,conditions:['commons-public-photo'],source:info.descriptionurl||info.url});
   attributions.push({id,title:page.title,source:info.descriptionurl||info.url,license,licenseUrl,author:clean(meta.Artist?.value),credit:clean(meta.Credit?.value)});
   seen.add(info.url);collected++;
  }catch(e){console.error('Skipped',page.title,e.message);}
 }
 console.log(query+': '+collected+' candidates');
}
await writeFile('benchmark/candidates.json',JSON.stringify(manifest,null,2));
await writeFile('benchmark/attributions.json',JSON.stringify(attributions,null,2));
console.log('Downloaded '+manifest.length+' candidate photos. Review images and labels before creating benchmark/manifest.json. No unverified labels should be scored as ground truth.');
