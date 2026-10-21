import assert from 'node:assert/strict';

// Intentionally fixed local ports, HTTP origin and database. No hosted override.
export function localConfig(status, acknowledgement){
 assert.equal(acknowledgement,'LOCAL_DISPOSABLE_ONLY','Explicit disposable-local acknowledgement required');
 assert.ok(status && typeof status==='object','Local CLI status required');
 const api=new URL(status.API_URL),database=new URL(status.DB_URL);
 assert.ok(['http://127.0.0.1:54321','http://localhost:54321'].includes(api.origin),'Only the disposable local API is allowed');
 assert.equal(api.pathname,'/');assert.equal(api.search,'');assert.equal(api.hash,'');
 assert.equal(api.username,'');assert.equal(api.password,'');
 assert.ok(['postgres:','postgresql:'].includes(database.protocol));
 assert.ok(['127.0.0.1','localhost'].includes(database.hostname),'Only local PostgreSQL is allowed');
 assert.equal(database.port,'54322');assert.equal(database.pathname,'/postgres');
 assert.equal(database.username,'postgres');assert.equal(database.password,'postgres');
 assert.equal(database.search,'');assert.equal(database.hash,'');
 assert.ok(typeof status.ANON_KEY==='string'&&status.ANON_KEY.length>20,'Local anonymous key missing');
 return {origin:api.origin,anon:status.ANON_KEY};
}

export function localRequestURL(origin,path){
 assert.ok(['http://127.0.0.1:54321','http://localhost:54321'].includes(origin));
 assert.ok(typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//'));
 const url=new URL(path,origin);
 assert.equal(url.origin,origin,'External request refused');
 assert.ok(!url.username&&!url.password);
 return url;
}
