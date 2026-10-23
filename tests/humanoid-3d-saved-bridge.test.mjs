import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deflateSync} from 'node:zlib';
import {prepareWardrobeFor3D,bridgeSavedOutfit,recommendOwnedOutfits,swapOwnedGarment,snapshotOwnedOutfit,restoreOwnedOutfit} from '../public/humanoid-3d-saved-bridge.mjs';
function crc(bytes){
 let n=0xffffffff;for(const v of bytes){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}
 return (n^0xffffffff)>>>0;
}
function chunk(kind,data){
 const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
 const raw=Buffer.concat([Buffer.from(kind),data]),sum=Buffer.alloc(4);sum.writeUInt32BE(crc(raw));
 return Buffer.concat([length,raw,sum]);
}
function image(rgb=[61,93,166]){
 const width=64,height=80,info=Buffer.alloc(13);
 info.writeUInt32BE(width,0);info.writeUInt32BE(height,4);info[8]=8;info[9]=2;
 const rows=[];
 for(let y=0;y<height;y++){
  const row=Buffer.alloc(1+width*3);row[0]=0;
  for(let x=0;x<width;x++)for(let c=0;c<3;c++)row[1+x*3+c]=rgb[c]+((x+y)%2);
  rows.push(row);
 }
 const bytes=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',info),chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);
 return 'data:image/png;base64,'+bytes.toString('base64');
}
const owner='synthetic-a';
const item=(id,category,kind,color='#3164b0',pattern='Striped',account=owner)=>({
 id,ownerId:account,category,itemType:kind,colorHex:color,pattern,
 originalPhoto:{id:'original-'+id,ownerId:account,image:image(),blank:false},
 recognitionPhoto:{id:'crop-'+id,ownerId:account},
 cropIdentity:'crop-'+id,image:'display-thumbnail-which-may-stay-the-same'
});
function closet(){return [
 item('t1','Tops','T-shirt'),item('t2','Tops','Blouse','#ae4455'),item('new','Tops','Blouse','#338855'),
 item('b1','Bottoms','Jeans','#334455'),item('b2','Bottoms','Skirt','#998877'),
 item('s1','Shoes','Sneakers','#eeeeee'),item('s2','Shoes','Flats','#111111'),
 item('j1','Outerwear','Jacket','#aa7755'),item('j2','Outerwear','Blazer','#222222'),
 item('dress','Dresses','Casual dress','#b55588')]};
test('3 owned recommendations use unique actual IDs, without inventing pieces',()=>{
 const wardrobe=closet(),choices=recommendOwnedOutfits(wardrobe,owner);
 assert.equal(choices.length,3);
 assert.equal(new Set(choices.map(v=>JSON.stringify(v.slots))).size,3);
 for(const choice of choices){
  const view=bridgeSavedOutfit(choice,wardrobe,owner);
  assert.equal(view.accountId,owner);
  assert.equal(view.syntheticGeometryOnly,true);
  assert.equal(view.originalPixelsRenderedAs3D,false);
  assert.ok(view.references.top.originalPhoto.startsWith('data:image/png'));
 }
});
test('new top anchor stays pinned across three distinct owned outfits',()=>{
 const wardrobe=closet(),looks=recommendOwnedOutfits(wardrobe,owner,{pinId:'new'});
 assert.equal(looks.length,3);
 assert.ok(looks.every(x=>x.slots.top==='new'));
 assert.throws(()=>swapOwnedGarment(looks[0],'top','t1',wardrobe,owner,{pinnedId:'new'}),/pinned/);
 const swapped=swapOwnedGarment(looks[0],'shoes','s2',wardrobe,owner,{pinnedId:'new'});
 assert.equal(swapped.slots.top,'new');assert.equal(swapped.slots.shoes,'s2');
 assert.equal(looks[0].slots.shoes,'s1');
});
test('snapshot stores no pixels; restore preserves chosen original source and pattern',()=>{
 const wardrobe=closet(),board=recommendOwnedOutfits(wardrobe,owner)[0];
 const saved=snapshotOwnedOutfit(board,wardrobe,owner);
 assert.ok(!JSON.stringify(saved).includes('data:image'));
 const restored=restoreOwnedOutfit(saved,wardrobe,owner);
 assert.equal(restored.references.top.pattern,'Striped');
 assert.equal(restored.references.top.originalPhoto,wardrobe[0].originalPhoto.image);
 assert.equal(saved.signatures.top,restored.signatures.top);
});
test('original-photo byte changes invalidate saved board although display crop is identical',()=>{
 const wardrobe=closet(),board=recommendOwnedOutfits(wardrobe,owner)[0];
 const saved=snapshotOwnedOutfit(board,wardrobe,owner);
 const original=wardrobe[0].originalPhoto.image;
 wardrobe[0].originalPhoto.image=image([71,93,166]);
 assert.notEqual(wardrobe[0].originalPhoto.image,original);
 assert.throws(()=>restoreOwnedOutfit(saved,wardrobe,owner),/changed/);
});
test('owner swap, foreign selected item, and cross-account saved state are rejected',()=>{
 const wardrobe=closet(),board=recommendOwnedOutfits(wardrobe,owner)[0],saved=snapshotOwnedOutfit(board,wardrobe,owner);
 assert.throws(()=>restoreOwnedOutfit(saved,wardrobe,'synthetic-b'),/Foreign/);
 wardrobe[0].ownerId='synthetic-b';
 assert.throws(()=>bridgeSavedOutfit(board,wardrobe,owner),/foreign|invalid/i);
 assert.throws(()=>bridgeSavedOutfit({...board,ownerId:'synthetic-b'},closet(),owner),/Foreign/);
});
test('all supported types reject malformed photos, blank originals, invalid flags and URL/SVG injection',()=>{
 const base=closet(),board=recommendOwnedOutfits(base,owner)[0];
 for(const replacement of ['', 'https://example.com/photo.jpg','data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,AAAA']){
  const clothes=closet();clothes[0].originalPhoto.image=replacement;
  assert.throws(()=>bridgeSavedOutfit(board,clothes,owner),/invalid|unknown|foreign/i);
 }
 for(const defect of ['scanFailed','invalidPhoto']){
  const clothes=closet();clothes[0][defect]=true;
  assert.throws(()=>bridgeSavedOutfit(board,clothes,owner),/invalid|unknown|foreign/i);
 }
 const clothes=closet();clothes[0].originalPhoto.blank=true;
 assert.throws(()=>bridgeSavedOutfit(board,clothes,owner),/invalid|unknown|foreign/i);
});
test('duplicate wardrobe garment id is rejected even when one copy belongs to another user',()=>{
 const clothes=closet(),board=recommendOwnedOutfits(clothes,owner)[0];
 clothes.push({...clothes[0],ownerId:'synthetic-b'});
 assert.throws(()=>bridgeSavedOutfit(board,clothes,owner),/invalid|foreign|unknown/i);
});
test('same outfit photo supports separately cropped garments; same crop twice fails',()=>{
 const clothes=closet(),board=recommendOwnedOutfits(clothes,owner)[0];
 const bottom=clothes.find(x=>x.id===board.slots.bottom);
 bottom.originalPhoto.id=clothes[0].originalPhoto.id;
 assert.equal(Object.keys(bridgeSavedOutfit(board,clothes,owner).references).length>=3,true);
 bottom.cropIdentity=clothes[0].cropIdentity;
 assert.throws(()=>bridgeSavedOutfit(board,clothes,owner),/Duplicate source/);
});
test('dress removes trousers and outer overlays, never fabricates rear geometry',()=>{
 const clothes=closet(),look={slots:{top:'dress',shoes:'s1'}};
 const view=bridgeSavedOutfit(look,clothes,owner);
 assert.ok(view.colors.dress&&!view.colors.top&&!view.colors.bottom);
 assert.throws(()=>bridgeSavedOutfit({slots:{top:'dress',bottom:'b1',shoes:'s1'}},clothes,owner),/Dresses/);
});
test('known outerwear jacket, coat and cardigan remain separate body layers',()=>{
 const clothes=closet();
 const coat=item('coat2','Outerwear','Coat','#998877');
 const cardigan=item('cardi','Outerwear','Cardigan','#eeeeee');
 clothes.push(coat,cardigan);
 const view=bridgeSavedOutfit({slots:{top:'t1',bottom:'b1',shoes:'s1',layer:'cardi',layer2:'j1',layer3:'coat2'}},clothes,owner);
 assert.ok(view.colors.layer&&view.colors.layer2&&view.colors.layer3);
 assert.throws(()=>bridgeSavedOutfit({slots:{top:'t1',layer3:'j1'}},clothes,owner),/incompatible/);
});
test('nonexistent garment, invalid color and incomplete wardrobe do not invent outfits',()=>{
 const clothes=closet(),chosen=recommendOwnedOutfits(clothes,owner)[0];
 assert.throws(()=>bridgeSavedOutfit({slots:{top:'not-a-piece'}},clothes,owner),/Unknown/);
 clothes[0].colorHex='transparent';
 assert.throws(()=>bridgeSavedOutfit(chosen,clothes,owner),/Unknown/);
 assert.equal(recommendOwnedOutfits(clothes.filter(x=>x.category!=='Shoes'),owner).length,0);
});
test('isolated incomplete outfits reject multiple use and external identifiers',()=>{
 const clothes=closet();
 assert.throws(()=>bridgeSavedOutfit({slots:{top:'t1',bottom:'t1'}},clothes,owner),/Duplicate/);
 assert.throws(()=>prepareWardrobeFor3D(clothes,''),/Account/);
 assert.throws(()=>recommendOwnedOutfits(clothes,owner,{limit:4}),/At most/);
});
