// Read-only pre-upload probe. Never sends credentials or follows redirects.
import {pathToFileURL} from 'node:url';
export const PATHS = ['/', '/index.html', '/app.js', '/auth.js', '/cloud-backup.js', '/sw.js', '/recognition-vectors.json', '/phone-photo-check.html', '/saved-closet-audit.html', '/app.js?v=anonymous-access-probe'];
export function stagingOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash || u.pathname !== '/' ||
      !/^(?:[a-z0-9-]+\.)?closet-current-staging\.pages\.dev$/.test(u.hostname))
    throw Error('Use the exact separate closet-current-staging.pages.dev origin or one of its preview origins.');
  return u.origin;
}
export async function probeAnonymousAccess(origins, {request = fetch} = {}) {
  if (!Array.isArray(origins) || origins.length < 2 || origins.length > 10) throw Error('Supply staging origin and all known deployment preview origins (2–10).');
  const checked = origins.map(stagingOrigin);
  if (new Set(checked).size !== checked.length || !checked.includes('https://closet-current-staging.pages.dev'))
    throw Error('Supply distinct origins including the staging project hostname and deployment previews.');
  const results = [];
  for (const origin of checked) for (const path of PATHS) {
    let outcome = 'INCONCLUSIVE', status = null;
    try {
      const response = await request(origin + path, {method:'GET', redirect:'manual', credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(10000), headers:{'Cache-Control':'no-cache'}});
      try {
        status = response.status;
        if (status >= 200 && status < 300) outcome = 'PUBLIC_RESPONSE';
        else if ([301,302,303,307,308].includes(status)) {
          const location = new URL(response.headers.get('location') || '', origin + path);
          if (location.protocol === 'https:' && !location.username && !location.password && !location.port &&
              /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(location.hostname) &&
              location.pathname.startsWith('/cdn-cgi/access/login/')) outcome = 'ACCESS_LOGIN_REQUIRED';
        }
      } finally { await response.body?.cancel(); }
    } catch { /* No response is never evidence of access protection. */ }
    results.push({origin, path, status, outcome});
  }
  return {anonymousProbePassed:results.every(r => r.outcome === 'ACCESS_LOGIN_REQUIRED'), results,
    privateCloudflareAccessPolicyVerified:false, previewInventoryComplete:false,
    authorizedTesterAccessVerified:false, restrictedStagingDeployed:false, productionPromotion:'BLOCKED'};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await probeAnonymousAccess(process.argv.slice(2));
    console.log(JSON.stringify(report, null, 2));
    if (!report.anonymousProbePassed) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
