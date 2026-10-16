import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const output=process.argv[2]||'benchmark/model-visual-comparison';await mkdir(output,{recursive:true});
const cases=[['commons-0065','Jacket'],['commons-0079','Sneakers'],['commons-0094','Boots']];
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage();for(const [id,label] of cases){
 const entry=manifest.cases.find(x=>x.id===id);if(!entry)throw Error('Missing verified case '+id);
 const bytes=await readFile(join('benchmark/photos',entry.image));
 const seg=JSON.parse(await readFile('benchmark/segmentation-predictions/'+id+'.prediction.json','utf8'));
 const mod=JSON.parse(await readFile('benchmark/modnet-predictions/'+id+'.modnet-prediction.json','utf8'));
 if(seg.sourceSha256!==entry.sourceSha256||mod.sourceSha256!==entry.sourceSha256||seg.width!==mod.width||seg.height!==mod.height)throw Error('Source or dimensions differ');
 const png=await page.evaluate(async ({photo,seg,mod,label})=>{
  const image=new Image();image.src='data:image/jpeg;base64,'+photo;await image.decode();
  const decode=p=>{const bits=new Uint8Array(p.width*p.height);let index=0,fg=0;for(const count of p.runs){if(!Number.isInteger(count)||count<0||index+count>bits.length)throw Error('Invalid runs');if(fg)bits.fill(1,index,index+count);index+=count;fg=1-fg;}if(index!==bits.length)throw Error('Truncated runs');return bits;};
  const a=decode(seg),b=decode(mod),w=image.naturalWidth,h=image.naturalHeight;
  const panelWidth=540,panelHeight=Math.round(panelWidth*h/w),header=56;
  const sheet=document.createElement('canvas');sheet.width=panelWidth*3;sheet.height=panelHeight+header;
  const ctx=sheet.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.fillStyle='#222';ctx.font='bold 22px sans-serif';
  for(const [n,title] of ['Original','SegFormer garment','MODNet foreground'].entries()){ctx.fillText(label+' · '+title,n*panelWidth+15,37);}
  const original=document.createElement('canvas');original.width=w;original.height=h;const oc=original.getContext('2d',{willReadFrequently:true});oc.drawImage(image,0,0);
  ctx.drawImage(original,0,header,panelWidth,panelHeight);
  const src=oc.getImageData(0,0,w,h);
  for(const [index,mask] of [a,b].entries()){
   const panel=document.createElement('canvas');panel.width=w;panel.height=h;const pc=panel.getContext('2d');
   pc.fillStyle='#f0edf3';pc.fillRect(0,0,w,h);pc.putImageData((()=>{const data=new ImageData(new Uint8ClampedArray(src.data),w,h);for(let i=0;i<mask.length;i++)data.data[i*4+3]=mask[i]?255:0;return data;})(),0,0);
   // Draw masked pixels onto an opaque light neutral surface.
   const composed=document.createElement('canvas');composed.width=w;composed.height=h;const cc=composed.getContext('2d');cc.fillStyle='#f0edf3';cc.fillRect(0,0,w,h);cc.drawImage(panel,0,0);
   ctx.drawImage(composed,(index+1)*panelWidth,header,panelWidth,panelHeight);
  }
  return sheet.toDataURL('image/png').split(',')[1];
 },{photo:'data:image/jpeg;base64,'+bytes.toString('base64'),seg,mod,label});
 await writeFile(join(output,id+'-three-way.png'),Buffer.from(png,'base64'));console.log('THREE_WAY_VISUAL '+id);
}}finally{await browser.close();}
