'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/index.html','utf8');
const js=fs.readFileSync('public/app.js','utf8');

test('saved clothing edit dialog announces a distinguishable accessible label',()=>{
 const code=js.slice(js.indexOf("edit.onclick=()=>{const dialog=document.createElement('dialog')"),js.indexOf("del.onclick=async()=>",js.indexOf("edit.onclick=()=>{const dialog=document.createElement('dialog')")));
 assert.ok(code.includes("dialog.setAttribute('aria-label','Adjust saved clothing details')"));
 assert.ok(code.includes("dialog.showModal();"));
 assert.ok(code.includes("dialog.onclose=()=>dialog.remove()"),'Native close must remove unused editor without trapping keyboard focus');
});
test('photo review dialog announces a distinguishable accessible label and keeps native Escape handling',()=>{
 const block=js.slice(js.indexOf('function adjustPhoto(item){'),js.indexOf('function renderRecognitionNotice(){'));
 assert.ok(block.includes("dialog.setAttribute('aria-label','Review clothing photo details')"));
 assert.ok(block.includes("dialog.showModal();"));
 assert.ok(block.includes('dialog.onclose=()=>{'));
 assert.ok(block.includes('dialog.remove();'));
});
test('outfit picker is associated with its visible title rather than unnamed modal',()=>{
 const tag=html.match(/<dialog id="boardPicker"[^>]*>/)?.[0];
 assert.ok(tag);
 assert.match(tag,/aria-labelledby="boardPickerTitle"/);
 assert.match(html,/<h2 id="boardPickerTitle">Choose from your closet<\/h2>/);
});
test('bulk review category control is explicitly named for screen-reader users',()=>{
 const tag=html.match(/<select id="batchCategory"[^>]*>/)?.[0];
 assert.ok(tag);
 assert.match(tag,/aria-label="Choose a category for unfinished photos"/);
});
test('no hidden field, customer photo, model or wardrobe payload added to naming attributes',()=>{
 for(const token of ["dialog.setAttribute('aria-label','Review clothing photo details')",
 "dialog.setAttribute('aria-label','Adjust saved clothing details')"])
  assert.ok(js.includes(token));
 assert.ok(!/aria-label="[^"]*(?:account id|user id|email address|customer name)[^"]*"/i.test(html));
});
