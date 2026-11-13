/** Actual Adjust panel + genuine two WASM models, PUBLIC photo and synthetic owner/storage. */
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {server82} from './p82-browser-server.mjs';
const app=await readFile('public/app.js','utf8'),test=await readFile('scripts/test-p82-review-browser.mjs','utf8');
const between=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return s.slice(i,j);};
const source=between(app,'function node(','function cropClothingPhoto(')+between(app,'function unit70Receipts(','function renderRecognitionNotice(')+between(app,'function snap()','function beep()')+between(app,'function candidate(','function queueAutomatic(');
const harness=between(test,'const harness=`','`;\nconst {server').slice('const harness=`'.length);
const index=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')),receipt=index.find(x=>x.id==='commons-0035'),bytes=await readFile('benchmark/photos/'+receipt.image);assert.equal(createHash('sha256').update(bytes).digest('hex'),receipt.sha256);
const image='data:image/jpeg;base64,'+bytes.toString('base64'),{server,origin}=await server82();let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(240000);const requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto(origin+'/?dual82=1');for(const path of ['public/taxonomy.js','public/clothing-details.js'])await page.addScriptTag({content:await readFile(path,'utf8')});await page.addScriptTag({content:harness+source});
 const fixture=async(photo=image)=>{await page.evaluate(image=>{window.fixture82();document.querySelector('dialog').close();document.querySelector('dialog').remove();window.current82.image=image;adjustPhoto(window.current82);},photo);await page.locator('[data-dual82]').waitFor();};
 await fixture();await page.getByRole('checkbox',{name:/I consent to a local/}).check();await page.getByRole('checkbox',{name:/One garment is isolated/}).check();await page.getByRole('button',{name:'Compare with two models'}).click();
 await page.getByRole('button',{name:/Use Shorts/}).waitFor();assert.equal((await page.evaluate(()=>window.state82())).writes,0);
 await page.getByRole('checkbox',{name:/I compared the original photo/}).check();await page.getByRole('button',{name:/Use Shorts/}).click();
 assert.equal(await page.getByRole('combobox',{name:'Item type',exact:true}).inputValue(),'Shorts');assert.equal(await page.getByRole('checkbox',{name:/I checked the clothing photo/}).isChecked(),false);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
 await page.getByRole('checkbox',{name:/I checked the clothing photo/}).check();await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.waitForTimeout(120);
 const saved=await page.evaluate(()=>window.savedValue);assert.equal(saved.image,image);assert.equal(saved.itemType,'Shorts');assert.equal(saved.color,'Blue');assert.equal(await page.evaluate(()=>window.writes),1);
 console.log('P82_REAL_MODELS_OWNER_REVIEW_PASS',JSON.stringify({photo:receipt.id,sourceSha256:receipt.sha256,realModels:2,explicitSuggestionChoice:true,normalPhotoAcknowledgement:true,originalUnchanged:true,colorUnchanged:true,saves:1,storage:'mock',owner:'synthetic',physicalDevices:0}));
 const jacketReceipt=index.find(x=>x.id==='commons-0062'),jacket=await readFile('benchmark/photos/'+jacketReceipt.image);assert.equal(createHash('sha256').update(jacket).digest('hex'),jacketReceipt.sha256);
 await fixture('data:image/jpeg;base64,'+jacket.toString('base64'));await page.getByRole('checkbox',{name:/I consent to a local/}).check();await page.getByRole('checkbox',{name:/One garment is isolated/}).check();await page.getByRole('button',{name:'Compare with two models'}).click();await page.getByRole('button',{name:/Use Jacket/}).waitFor();await page.getByRole('checkbox',{name:/I compared the original photo/}).check();await page.getByRole('button',{name:/Use Jacket/}).click();
 assert.equal(await page.getByRole('combobox',{name:'Main category',exact:true}).inputValue(),'Outerwear');assert.equal(await page.getByRole('combobox',{name:'Item type',exact:true}).inputValue(),'Jacket');assert.equal((await page.evaluate(()=>window.state82())).writes,0);console.log('P82_REAL_CROSS_CATEGORY_UNSAVED_PASS',jacketReceipt.id);
 // Actual corrupt/failed local model delivery fails closed in the real worker.
 for(const failure of ['offline','corrupt']){
  await fixture();const target=origin+'/_dual82/models/ff13/fashion-clip/preprocessor_config.json';
  await page.route(target,route=>failure==='offline'?route.abort():route.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.getByRole('checkbox',{name:/I consent to a local/}).check();await page.getByRole('checkbox',{name:/One garment is isolated/}).check();await page.getByRole('button',{name:'Compare with two models'}).click();
  await page.getByText(/Comparison unavailable, cancelled, or photo evidence changed/).waitFor();assert.equal((await page.evaluate(()=>window.state82())).writes,0);assert.equal((await page.evaluate(()=>window.state82())).photo,image);await page.unroute(target);console.log('P82_REAL_ASSET_FALLBACK_PASS',failure);
 }
 assert.ok(requests.every(r=>r.url.startsWith(origin)&&r.method==='GET'));
}finally{await browser?.close();server.close();}
