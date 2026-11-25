'use strict';
(() => {
 const script = document.currentScript;
 const assetVersion = new URL(script.src).searchParams.get('v');
 const get = id => document.getElementById(id);
 const dialog = get('troubleshooting');
 const opener = get('openTroubleshooting');
 const topic = get('troubleshootingTopic');
 const preview = get('troubleshootingPreview');
 const report = get('troubleshootingReport');
 let activeAuth, activeOwner, snapshot = '';

 const backupCodes = new Map([
  ['Checking cloud backup…', 'checking'],
  ['Restoring your cloud closet…', 'checking'],
  ['Backing up your closet…', 'pending'],
  ['Saved on this device · cloud backup pending', 'pending'],
  ['Saved on this device · cloud backup pending. Retrying when connected.', 'pending'],
  ['Your closet will back up automatically', 'pending'],
  ['Cloud backup up to date', 'verified']
 ]);
 const rows = {
  connection: ['Connection', {offline:'Browser is offline', available:'Browser reports a connection'}],
  recognition: ['Recognition', {working:'Preparing or checking photos', 'needs-review':'Check suggestions before saving', failed:'Scanner needs attention', 'save-failed':'Device storage needs attention'}],
  photoImport: ['Photo import', {working:'Import in progress', review:'Check Review for imported photos', partial:'Some photos need another try', failed:'Import needs attention', duplicate:'Duplicate photos skipped', 'batch-limit':'Too many photos selected'}],
  outfit: ['Outfits', {loading:'Outfit status pending', ready:'Outfit Builder available', pending:'Outfit changes waiting to save', failed:'Outfit changes need attention'}],
  presentation: ['Outfit preview', {'checking-2d':'Checking original photos for 2D', 'verified-2d':'Original photos verified for 2D', '2d-available':'Use the 2D outfit board when 3D is unavailable'}],
  backup: ['Cloud backup', {checking:'Checking or restoring', pending:'Backup pending', verified:'App last reported backup up to date', 'needs-attention':'See backup details in My account'}],
  maintenance: ['Trend updates', {working:'Checking for a library update', 'managed-library':'Using a validated managed library', 'cached-library':'Using the available trend library', 'overdue-library':'Using an older trend library', 'check-failed':'Latest library check failed', 'general-ideas':'Showing general styling ideas'}]
 };
 const guidance = {
  recognition: 'If scanning is stuck, keep Review open. Reconnect for scanner setup or use Adjust to enter details manually. Check each suggestion before saving.',
  'photo-import': 'Check Review before retrying. Try one supported photo at a time. If your phone’s photo won’t open, export a JPEG copy and keep the original.',
  'outfit-3d': 'Keep Outfit Builder open if changes are still saving. If 3D is unavailable, use the 2D outfit board and check the pieces in My Closet.',
  backup: 'Keep this app and browser data intact while backup is pending or unverified. Reconnect and check the backup status in My account. Review the latest backup status before switching devices.',
  navigation: 'Use the app’s tabs or More menu to reopen a section. Finish reviewing or saving changes before reloading.',
  other: 'Choose the closest topic and check the app’s status. Review the report before sharing.'
 };

 function discardPreview() {
  snapshot = '';
  report.value = '';
  preview.hidden = true;
 }
 function reset() {
  discardPreview();
  activeAuth = activeOwner = null;
  topic.selectedIndex = 0;
  get('troubleshootingStatus').replaceChildren();
  get('troubleshootingGuidance').textContent = '';
 }
 function ownerIsCurrent() {
  if (!activeOwner || activeAuth !== window.closetAuth || activeAuth.user?.id !== activeOwner) return false;
  try {
   activeAuth.assertCurrent();
   return true;
  } catch {
   return false;
  }
 }
 function readPhotoImportStatus() {
  if (photoImportActive) return 'working';
  if (get('message').textContent === 'Choose up to 20 clothing photos per batch.') return 'batch-limit';
  const result = window.__lastPhotoImportResult;
  if (!result || result.cancelled || !Array.isArray(result.errors) ||
      !Number.isInteger(result.added) || result.added < 0) return 'unknown';
  if (result.errors.length) return result.added ? 'partial' : 'failed';
  return result.added ? 'review' : 'duplicate';
 }
 function readStatus() {
  const ua = navigator.userAgent;
  const browser = /Chrome\/|Chromium\/|Edg\//.test(ua) ? 'chromium' :
   /FxiOS|CriOS|EdgiOS|AppleWebKit/.test(ua) ? 'webkit' :
   /Firefox/.test(ua) ? 'firefox' : 'unknown';
  const recognition = recognitionState.phase;
  const cloud = get('cloudStatus');
  const offline = navigator.onLine === false;
  return ClosetTroubleshooting.createReport({
   topic: topic.value, browser, assetVersion,
   viewport: innerWidth < 360 ? 'compact' : innerWidth <= 480 ? 'medium' : 'wide',
   connection: offline ? 'offline' : 'available',
   recognition: ['failed','save-failed'].includes(recognition) ? recognition :
    recognition === 'loading' || localPending.size ? 'working' :
    recognition === 'ready' ? 'needs-review' : 'unknown',
   photoImport: readPhotoImportStatus(),
   outfit: !get('retryBoardDraft').hidden ? 'failed' : boardPendingWrites || boardDraftTimer ? 'pending' :
    boardInitialized ? 'ready' : db ? 'loading' : 'unknown',
   presentation: mission4Preview1054Viewer?.status.phase === 'visible' ? 'verified-2d' :
    get('mission4Preview1054Status')?.previousElementSibling?.disabled ? 'checking-2d' :
    boardInitialized ? '2d-available' : 'unknown',
   backup: cloud.hidden ? 'unknown' : backupCodes.get(cloud.textContent) || 'needs-attention',
   maintenance: offline ? (activeTrendLibrary ? 'cached-library' : 'general-ideas') :
    trendLoading ? 'working' : trendCheckFailed ? 'check-failed' :
    !activeTrendLibrary ? 'general-ideas' :
    Date.now() - Date.parse(activeTrendLibrary.updatedAt) > 8 * 86400000 ? 'overdue-library' :
    managedTrends ? 'managed-library' : 'cached-library'
  });
 }
 function refresh() {
  if (!dialog.open) return;
  if (!ownerIsCurrent()) {
   dialog.close();
   reset();
   return;
  }
  const status = readStatus();
  const list = get('troubleshootingStatus');
  list.replaceChildren();
  for (const [key, [label, descriptions]] of Object.entries(rows)) {
   const term = document.createElement('dt');
   const description = document.createElement('dd');
   term.textContent = label;
   description.textContent = descriptions[status[key]] || 'Status unverified';
   list.append(term, description);
  }
  get('troubleshootingGuidance').textContent = status.topic === 'recognition' && status.recognition === 'save-failed'
   ? 'Keep Review open. Check available device storage, then try saving again. You can still inspect the photo and use Adjust.'
   : guidance[status.topic] || guidance.other;
  return status;
 }
 opener.onclick = () => {
  reset();
  activeAuth = window.closetAuth;
  activeOwner = activeAuth?.user?.id;
  if (!ownerIsCurrent()) return reset();
  dialog.showModal();
  refresh();
 };
 get('closeTroubleshooting').onclick = () => { dialog.close(); reset(); };
 dialog.addEventListener('close', () => { if (!dialog.open) reset(); });
 dialog.addEventListener('cancel', reset);
 topic.onchange = () => { discardPreview(); refresh(); };
 get('previewTroubleshooting').onclick = () => {
  const status = refresh();
  if (!status) return;
  snapshot = JSON.stringify(status, null, 2);
  report.value = snapshot;
  preview.hidden = false;
  report.focus();
 };
 get('cancelTroubleshooting').onclick = () => {
  discardPreview();
  get('previewTroubleshooting').focus();
 };
 get('exportTroubleshooting').onclick = () => {
  if (!snapshot || preview.hidden || !dialog.open) return;
  if (!ownerIsCurrent()) {
   if (dialog.open) dialog.close();
   reset();
   return;
  }
  const url = URL.createObjectURL(new Blob([snapshot], {type:'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'closet-current-troubleshooting.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
 };
 window.addEventListener('closet:session-locked', () => {
  delete window.__lastPhotoImportResult;
  if (dialog.open) dialog.close();
  reset();
 });
 window.addEventListener('pagehide', () => {
  if (dialog.open) dialog.close();
  reset();
 });
 for (const type of ['online','offline']) window.addEventListener(type, () => {
  if (!dialog.open) return;
  discardPreview();
  refresh();
 });
})();
