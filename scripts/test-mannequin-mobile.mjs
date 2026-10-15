import {chromium} from 'playwright';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const css=await readFile('public/style.css','utf8');
const js=await readFile('public/outfit-figure.js','utf8');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const shots=resolve('benchmark/mannequin-mobile');
await mkdir(shots,{recursive:true});
try{
 for(const [label,width,height] of [['android',360,800],['iphone',390,844],['small',320,700]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.setContent('<style>'+css+'</style><article class="styled-outfit"><div id="figure"></div></article><dialog class="styled-outfit-detail"><h2>Outfit preview</h2><div id="detail"></div><button id="close">Close</button></dialog>');
  await page.addScriptTag({content:js});
  const result=await page.evaluate(()=>{
   const svg=(fill)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="300"><rect width="220" height="300" fill="'+fill+'"/></svg>');
   const items=[{id:'shirt',category:'Tops',itemType:'Shirt',image:svg('#a66')},{id:'pants',category:'Bottoms',itemType:'Shorts',image:svg('#46a')},{id:'coat',category:'Layers',itemType:'Coat',image:svg('#6a6')},{id:'shoe',category:'Shoes',itemType:'Sneakers',image:svg('#444')}];
   const board={slots:{top:'shirt',bottom:'pants',layer:'coat',shoes:'shoe'}};
   OutfitFigure.render(document.querySelector('#figure'),board,items,{size:'card'});
   OutfitFigure.render(document.querySelector('#detail'),board,items,{size:'detail'});
   const dialog=document.querySelector('dialog');dialog.showModal();document.querySelector('#close').onclick=()=>dialog.close();
   return {pieces:document.querySelectorAll('#detail .outfit-mannequin-garment').length,dialogOpen:dialog.open};
  });
  if(result.pieces!==4||!result.dialogOpen)throw Error(label+': missing garment or dialog');
  await page.screenshot({path:resolve(shots,label+'-detail.png')});
  const cardBox=await page.locator('#figure').boundingBox();
  if(!cardBox||cardBox.x<0||cardBox.x+cardBox.width>width+1)throw Error(label+': card overflows viewport '+JSON.stringify(cardBox));
  const box=await page.locator('#detail').boundingBox();
  if(!box||box.x<0||box.x+box.width>width+1)throw Error(label+': figure overflows viewport '+JSON.stringify(box));
  const variants=await page.evaluate(()=>{
   const svg=(color)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="240"><rect width="120" height="240" fill="'+color+'"/></svg>');
   const cases=[
    {name:'dress',items:[{id:'dress',category:'Dresses',itemType:'Dress',image:svg('#e95')},{id:'trousers',category:'Bottoms',itemType:'Trousers',image:svg('#369')}],slots:{top:'dress',bottom:'trousers'},expected:1},
    {name:'skirt',items:[{id:'skirt',category:'Bottoms',itemType:'Skirt',image:svg('#e95')}],slots:{bottom:'skirt'},expected:1},
    {name:'broken-image',items:[{id:'broken',category:'Tops',itemType:'Shirt',image:'data:image/png;base64,not-an-image'}],slots:{top:'broken'},expected:1}
   ];
   return cases.map(test=>{
    OutfitFigure.render(document.querySelector('#detail'),{slots:test.slots},test.items,{size:'detail'});
    return {name:test.name,expected:test.expected,actual:document.querySelectorAll('#detail .outfit-mannequin-garment').length,bottom:document.querySelector('#detail .outfit-mannequin-bottom')!==null};
   });
  });
  for(const variant of variants){if(variant.actual!==variant.expected)throw Error(label+': '+variant.name+' expected '+variant.expected+' garments, found '+variant.actual);if(variant.name==='dress'&&variant.bottom)throw Error(label+': dress conflicts with trousers');}
  await page.waitForFunction(()=>{const el=document.querySelector('#detail .outfit-mannequin-fallback');return el&&!el.hidden&&el.textContent==='Shirt';},{timeout:5000});
  await page.screenshot({path:resolve(shots,label+'-broken-image.png')});
  await page.locator('#close').click();
  if(await page.locator('dialog').evaluate(el=>el.open))throw Error(label+': detail failed to close');
  await page.close();
 }
 console.log('Mannequin mobile smoke: 3 viewport sizes passed');
}finally{await browser.close();}
