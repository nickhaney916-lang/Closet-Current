'use strict';
const ClosetTroubleshooting = (() => {
 const choices = Object.freeze({
  topic: Object.freeze(['recognition', 'photo-import', 'outfit-3d', 'backup', 'navigation', 'other']),
  browser: Object.freeze(['chromium', 'webkit', 'firefox']),
  viewport: Object.freeze(['compact', 'medium', 'wide']),
  connection: Object.freeze(['offline', 'available']),
  recognition: Object.freeze(['working', 'needs-review', 'failed', 'save-failed']),
  photoImport: Object.freeze(['working', 'review', 'partial', 'failed', 'duplicate', 'batch-limit']),
  outfit: Object.freeze(['loading', 'ready', 'pending', 'failed']),
  presentation: Object.freeze(['checking-2d', 'verified-2d', '2d-available']),
  backup: Object.freeze(['checking', 'pending', 'verified', 'needs-attention']),
  maintenance: Object.freeze(['working', 'managed-library', 'cached-library', 'overdue-library', 'check-failed', 'general-ideas'])
 });

 function field(input, key) {
  try { return Object.getOwnPropertyDescriptor(input ?? {}, key)?.value; }
  catch { return undefined; }
 }

 function createReport(input) {
  const report = {reportVersion: 1};
  for (const [key, allowed] of Object.entries(choices)) {
   const value = field(input, key);
   report[key] = allowed.includes(value) ? value : 'unknown';
  }
  const version = field(input, 'assetVersion');
  report.assetVersion = typeof version === 'string' && /^[a-f0-9]{12}$/.test(version) ? version : 'unknown';
  return Object.freeze(report);
 }

 return Object.freeze({createReport});
})();
if (typeof module !== 'undefined') module.exports = ClosetTroubleshooting;
