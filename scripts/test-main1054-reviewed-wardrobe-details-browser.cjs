'use strict';
// Actual ordinary chooser, owner-reviewed save and durable metadata check.
// Reuse the existing containment harness, never change it or its security assertions.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const path='scripts/test-parallel99-normal-app-browser.mjs',output='scripts/.main1054-review-details-runner.mjs';
let source=fs.readFileSync(path,'utf8');
function replace(before,after){if(source.split(before).length!==2)throw Error('P99 anchor mismatch');source=source.replace(before,after);}
replace(" await editor.getByLabel('Color',{exact:true}).fill(color);",` await editor.getByLabel('Color',{exact:true}).fill(color);
 const season=category==='Tops'?'Winter':'All seasons';
 await editor.locator('fieldset.season-picker input[value="'+season+'"]').check();
 await editor.getByLabel('Pattern',{exact:true}).selectOption('Solid');
 await editor.getByLabel('Fit',{exact:true}).selectOption('Regular');
 await editor.getByLabel('Brand',{exact:true}).fill('Example');
 await editor.getByLabel('Size',{exact:true}).fill('M');
 await editor.getByLabel('Material',{exact:true}).fill('Cotton');
 await editor.getByLabel('Occasion',{exact:true}).fill('Casual');`);
replace(' assert.equal(await rowCount(),before+1);\n}',` assert.equal(await rowCount(),before+1);
 const actual=await page.evaluate(async label=>{
  const rows=await new Promise((yes,no)=>{const req=db.transaction('items').objectStore('items').getAll();req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error);});
  const item=rows.find(x=>x.name===label);
  return item&&{seasons:item.seasons,pattern:item.pattern,fit:item.fit,brand:item.brand,size:item.size,material:item.material,occasion:item.occasion,notes:typeof item.notes==='string',originalPreserved:item.originalPhoto?.sha256===item.sourceSHA256};
 },name);
 assert.deepEqual(actual,{seasons:[season],pattern:'Solid',fit:'Regular',brand:'Example',size:'M',material:'Cotton',occasion:'Casual',notes:true,originalPreserved:true});
 console.log('MAIN1054_REVIEW_DETAILS '+engine+' '+width+' '+category+' durable owner-entered metadata retained');
}`);
try{fs.writeFileSync(output,source,{flag:'wx'});const result=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1'}});if(result.error)throw result.error;process.exitCode=result.status??1;}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
