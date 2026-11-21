const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const source = app.slice(app.indexOf('function stopRecognitionWorker('), app.indexOf('async function enableLocal('));

test('an unreadable Worker reply releases pending requests and permits a fresh retry', async () => {
 const workers = [], timers = new Set(), batch = [{id:'photo', image:'original', category:'Uncategorized'}];
 let id = 0;
 class Worker {
  constructor() { workers.push(this); }
  postMessage(request) { this.request = request; }
  terminate() { this.terminated = true; }
  emit(type, event) { this['on' + type]?.(event); }
 }
 const c = vm.createContext({
  Worker, batch, localWorker:null, localReady:true, recognitionUnavailable:false,
  recognitionState:{phase:'ready'}, recognitionAssetVersion:'', localJobs:new Map(),
  renderRecognitionNotice(){}, crypto:{randomUUID:()=>String(++id)},
  setTimeout(){ const token = {}; timers.add(token); return token; },
  clearTimeout(token){ timers.delete(token); },
 });
 vm.runInContext(source, c);
 const pending = c.localRequest('classify', batch[0].image, batch[0].id);
 const rejected = assert.rejects(pending, /could not be read/i);
 const first = workers[0];
 first.emit('messageerror', {});
 assert.equal(c.localJobs.size, 0, 'decode failure must release the request before the timeout');
 await rejected;
 assert.equal(timers.size, 0);
 assert.equal(first.terminated, true);
 assert.equal(c.recognitionState.phase, 'failed');
 assert.equal(c.localReady, false);
 assert.deepEqual(batch, [{id:'photo', image:'original', category:'Uncategorized'}]);

 const retry = c.localRequest('load');
 const second = workers[1];
 first.emit('messageerror', {});
 first.emit('message', {data:{id:second.request.id,type:'error',text:'stale'}});
 assert.equal(second.terminated, undefined);
 assert.equal(c.localJobs.size, 1);
 second.emit('message', {data:{id:second.request.id,type:'loaded'}});
 assert.equal((await retry).type, 'loaded');
 assert.equal(timers.size, 0);
});
