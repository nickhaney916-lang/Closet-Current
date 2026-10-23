// Synthetic colored JPEG swatches only, not garment recognition/photo fixtures.
import {createHash} from 'node:crypto';
const BASE=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlKKKK+vPDP//Z','base64');
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function photo(label){
 const text=Buffer.from('issue201-synthetic:'+label),header=Buffer.alloc(4);
 header.writeUInt16BE(0xfffe);header.writeUInt16BE(text.length+2,2);
 return 'data:image/jpeg;base64,'+Buffer.concat([BASE.subarray(0,-2),header,text,BASE.subarray(-2)]).toString('base64');
}
export function wardrobe(owner='synthetic-a'){
 if(!['synthetic-a','synthetic-b'].includes(owner))throw Error('Synthetic owner required');
 const specs=[['new-top','Tops','T-shirt','Blue','Short sleeve'],
 ['long-top','Tops','T-shirt','White','Long sleeve'],
 ['pants','Bottoms','Jeans','Blue'],['shorts','Bottoms','Shorts','Tan'],['skirt','Bottoms','Skirt','Black'],
 ['shoe-1','Shoes','Sneakers','White'],['shoe-2','Shoes','Sneakers','Black'],['shoe-3','Shoes','Sneakers','Gray'],
 ['dress','Dresses','Casual dress','Blue'],['jacket','Outerwear','Jacket','Black'],
 ['jacket-2','Outerwear','Jacket','Tan'],['coat','Outerwear','Coat','Brown']];
 const items=specs.map(([id,category,itemType,color,sleeveLength='Unknown'])=>({
  id,name:id,category,itemType,color,sleeveLength,pattern:'Solid',seasons:['Fall'],
  image:photo(owner+':'+id+':display'),originalPhoto:{image:photo(owner+':'+id+':full-scene')},
  recognitionPhoto:{image:photo(owner+':'+id+':unmasked')},outfitSourceId:'synthetic-'+owner+'-'+id,
  localAnalyzed:true,notes:'Synthetic benchmark swatch, not a photograph of clothing or a person.'
 }));
 const ledger=Object.fromEntries(items.map(x=>[x.id,{owner,sourceId:x.outfitSourceId,
  originalHash:hash(x.originalPhoto.image),recognitionHash:hash(x.recognitionPhoto.image),displayHash:hash(x.image),
  color:x.color,itemType:x.itemType}]));
 return {owner,items,ledger};
}
export function validateSynthetic(fixture){
 if(!['synthetic-a','synthetic-b'].includes(fixture.owner)||!Array.isArray(fixture.items))throw Error('Synthetic owner required');
 const seen=new Set();
 for(const item of fixture.items){
  const allowed=['id','name','category','itemType','color','sleeveLength','pattern','seasons','image','originalPhoto','recognitionPhoto','outfitSourceId','localAnalyzed','notes'];
  if(Object.keys(item).some(k=>!allowed.includes(k))||!/^(new-top|long-top|pants|shorts|skirt|shoe-[123]|dress|jacket(?:-2)?|coat)$/.test(item.id))throw Error('Unexpected personal fixture fields');
  if(!item.id||seen.has(item.id))throw Error('Duplicate or blank fixture ID');seen.add(item.id);
  const row=fixture.ledger[item.id];
  if(row&&Object.keys(row).some(k=>!['owner','sourceId','originalHash','recognitionHash','displayHash','color','itemType'].includes(k)))throw Error('Unexpected personal provenance fields');
  if(!row||row.owner!==fixture.owner||row.sourceId!==item.outfitSourceId)throw Error('Foreign or missing provenance');
  for(const [value,expected]of [[item.image,row.displayHash],[item.originalPhoto?.image,row.originalHash],[item.recognitionPhoto?.image,row.recognitionHash]]){
   if(typeof value!=='string'||!value.startsWith('data:image/jpeg;base64,')||hash(value)!==expected)throw Error('Missing, remote or changed fixture photo');
   const bytes=Buffer.from(value.split(',')[1],'base64');
   if(bytes.readUInt16BE(0)!==0xffd8||bytes.readUInt16BE(bytes.length-2)!==0xffd9||!bytes.includes(Buffer.from('issue201-synthetic:')))throw Error('Not a generated synthetic fixture');
  }
  if(item.image!==photo(fixture.owner+':'+item.id+':display')||item.originalPhoto.image!==photo(fixture.owner+':'+item.id+':full-scene')||item.recognitionPhoto.image!==photo(fixture.owner+':'+item.id+':unmasked'))throw Error('Photo must exactly match generated synthetic swatch');
  if(item.name!==item.id||item.notes!=='Synthetic benchmark swatch, not a photograph of clothing or a person.')throw Error('Unexpected personal fixture fields');
 }
 return true;
}
