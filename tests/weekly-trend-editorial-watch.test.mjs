import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditTrendResearch,trendWatchIssue,WATCH_MARKER} from '../scripts/audit-weekly-trend-readiness.mjs';
const seed=JSON.parse(readFileSync('public/trend-data.json','utf8'));
const time=s=>new Date(s);
test('Oct 19 reviewed public catalog is valid and not yet due on Oct 21',()=>{
 const r=auditTrendResearch(seed,time('2026-10-21T18:00:00Z'));
 assert.equal(r.errors.length,0);assert.equal(r.overdue,false);
 assert.equal(r.needsAttention,false);assert.equal(r.updatedAt,new Date(seed.updated_at).toISOString());
 assert.ok(r.counts.publicationSites>=6);assert.ok(r.counts.retailerSites>=6);
 assert.equal(r.automaticPublication,false);assert.equal(r.linksLiveChecked,false);
 assert.equal(r.sourceRotationVerifiedAgainstPriorWeeks,false);
 assert.equal(trendWatchIssue(r),null);
});
test('a reviewed weekly catalog becomes overdue only after its recorded next refresh',()=>{
 const atDue=auditTrendResearch(seed,time('2026-10-26T15:11:36.941Z'));
 assert.equal(atDue.overdue,false);
 const past=auditTrendResearch(seed,time('2026-10-28T20:00:00Z'));
 assert.equal(past.overdue,true);assert.equal(past.needsAttention,true);
 assert.ok(past.overdueDays>=2);
 assert.ok(past.warnings.some(s=>s.includes('overdue')));
 const issue=trendWatchIssue(past);
 assert.ok(issue.body.includes(WATCH_MARKER));
 assert.ok(issue.body.includes('rotating set of publications'));
 assert.ok(issue.body.includes('not an automatic publication'));
 assert.equal(issue.title,'Closet Current: weekly fashion research refresh required');
});
test('unsafe user-info or private-network retailer URL triggers maintainer action without rewriting source',()=>{
 const bad=structuredClone(seed);
 bad.products[0].url='https://127.0.0.1/internal';
 const before=JSON.stringify(bad);
 const result=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(result.errors.some(s=>s.includes('retailer link')));
 assert.equal(result.needsAttention,true);
 assert.equal(JSON.stringify(bad),before,'Readonly audit must not mutate catalog');
 assert.ok(trendWatchIssue(result).body.includes('retailer'));
});
test('broken catalog refresh cadence is an error even before content is due',()=>{
 const bad=structuredClone(seed);
 bad.next_refresh_at='2027-03-11T12:00:00Z';
 const r=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(r.errors.some(s=>s.includes('approximately one week')));
 assert.equal(r.needsAttention,true);
});
test('future or invalid timestamps never pass as a verified weekly editorial review',()=>{
 const bad=structuredClone(seed);
 bad.updated_at='2999-12-01T00:00:00Z';
 const r=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(r.errors.some(s=>s.includes('future')||s.includes('Invalid')));
 assert.equal(r.needsAttention,true);
 const missing=structuredClone(seed);delete missing.next_refresh_at;
 assert.ok(auditTrendResearch(missing,time('2026-10-21T18:00:00Z')).errors.some(s=>s.includes('next_refresh_at')));
});
test('mixed duplicated source IDs and missing evidence for a garment direction are rejected',()=>{
 const bad=structuredClone(seed);
 bad.sources[1].id=bad.sources[0].id;
 bad.directions[0].source_id='unreviewed-fabric-report';
 const r=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(r.errors.some(s=>s.includes('Duplicate fashion source ID')));
 assert.ok(r.errors.some(s=>s.includes('not backed by a recorded source')));
});
test('missing diversity appears as a coverage warning, not fabricated source rotation',()=>{
 const bad=structuredClone(seed);
 for(let i=1;i<bad.sources.length;i++)bad.sources[i].url='https://www.gq-magazine.co.uk/article/'+i;
 const r=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(r.warnings.some(s=>s.includes('six independent fashion publication')));
 assert.equal(r.sourceRotationVerifiedAgainstPriorWeeks,false);
 assert.equal(r.needsAttention,false,'An operator warning cannot pretend the weekly catalog is overdue');
});
test('bad publication dates and stale source verification are independently flagged',()=>{
 const bad=structuredClone(seed);
 bad.sources[0].published_at='2027-01-01';
 bad.sources[1].checked_at='2026-09-03T00:00:00Z';
 const r=auditTrendResearch(bad,time('2026-10-21T18:00:00Z'));
 assert.ok(r.warnings.some(s=>s.includes('Publication date')));
 assert.ok(r.warnings.some(s=>s.includes('out-of-window')));
 assert.equal(r.overdue,false);
});
test('report reveals no customer accounts, garment photo content, fake current retailer prices, or live-link claims',()=>{
 const report=auditTrendResearch(seed,time('2026-11-03T12:00:00Z'));
 const issue=trendWatchIssue(report);
 assert.ok(issue.body.includes('retailer product pages'));
 assert.equal(issue.body.includes('verified current prices'),false);
 assert.equal(report.actualProductAvailabilityVerified,false);
 assert.equal(report.automaticPublication,false);
 assert.equal(report.linksLiveChecked,false);
 assert.ok(!issue.body.includes('customer photo:'));
});
test('invalid audit clocks are refused and never treated as a fresh source approval',()=>{
 assert.throws(()=>auditTrendResearch(seed,new Date('invalid')),/Invalid audit clock/);
 assert.throws(()=>auditTrendResearch(seed,'2026-10-21'),/Invalid audit clock/);
});
