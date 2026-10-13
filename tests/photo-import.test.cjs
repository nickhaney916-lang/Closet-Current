const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const ctx={crypto:{randomUUID},busy:false,localReady:false,session:0,items:[],batch:[],queueAutomatic(){},view:'scan',stopCamera(){},controls(){},message(t){ctx.messageText=t;},switchView(v){ctx.view=v;},persistDraft(){},$:()=>({}),photoToJPEG:async file=>{if(file.name==='bad.heic')throw Error('decode');return 'data:image/jpeg;base64,'+file.name;}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/photo-import.js','utf8').split('async function readPhotoBatch')[1].replace(/^\(files/, 'async function readPhotoBatch(files'),ctx);
const source=fs.readFileSync('public/app.js','utf8');
vm.runInContext(source.slice(source.indexOf('function candidate('),source.indexOf('function queueAutomatic(')),ctx);
vm.runInContext(source.slice(source.indexOf('async function importClothingPhotos('),source.indexOf("$('clothingPhotos').onchange")),ctx);
(async()=>{
 await ctx.importClothingPhotos([{name:'one.jpg',type:'image/jpeg',size:100},{name:'two.png',type:'image/png',size:200}]);
 assert.equal(ctx.batch.length,2);assert.notEqual(ctx.batch[0].id,ctx.batch[1].id);assert.equal(ctx.view,'review');assert.equal(ctx.batch[0].category,'Uncategorized');assert.equal(ctx.busy,false);
 ctx.batch[0].category='Tops';assert.equal(ctx.batch[1].category,'Uncategorized');
 await ctx.importClothingPhotos([{name:'bad.heic',type:'image/heic',size:100},{name:'three.jpg',type:'image/jpeg',size:200},{name:'large.png',type:'image/png',size:11000000}]);
 assert.equal(ctx.batch.length,3);assert.equal(ctx.batch[0].category,'Tops');assert.match(ctx.messageText,/could not open/);assert.match(ctx.messageText,/larger than 10 MB/);
 console.log('Multiple photos create independent review entries; partial failures preserve imported and existing items.');
})().catch(e=>{console.error(e);process.exitCode=1});
