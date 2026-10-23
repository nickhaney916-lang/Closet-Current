const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={URL,encodeURIComponent};vm.createContext(context);
vm.runInContext(fs.readFileSync('public/outfit-matcher.js','utf8'),context);
for(const value of ['https://user:secret@fashion.example.com/look','https://localhost/look','https://shop.local/look','https://127.1/look','https://2130706433/look','https://0x7f000001/look','https://172.16.0.1/look','https://[::1]/look','https://shop.example.com:8443/look','https://example.com\\@localhost/look','https://exam\nple.com/look','https://shop.internal/look','https://shop.example.com./look',null,123,{},'javascript:alert(1)','data:text/html,bad','//shop.example.com/look']){
 test('inspiration URL refuses '+JSON.stringify(value),()=>assert.equal(context.safeInspirationUrl(value),''));
}
test('public inspiration URLs preserve product identity, query and fragment',()=>{
 for(const url of ['https://fashion.example.com/look?color=blue&sku=123#outfit','http://fashion.example.com/look'])assert.equal(context.safeInspirationUrl(url),url);
});
