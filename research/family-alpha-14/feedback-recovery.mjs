/** Family Alpha #14: independent, offline and synthetic-testable UI contract.
 * This module does not read photos, accounts, device identifiers or persistence.
 * It never submits reports. Main app integration requires separate owner approval.
 */
export const categories = Object.freeze([
  'Photo Capture', 'Clothing Recognition', 'My Closet', 'Outfit Builder', '2D Avatar', 'Other'
]);

const failures = Object.freeze({
  photo_rejected: {
    title: 'This photo was not accepted',
    message: 'The photo was not added. Try a clear JPEG or PNG of one garment in good light.',
    detail: 'Check that the file is a supported image and is not too large.',
    actions: ['retry']
  },
  unrecognized: {
    title: 'We could not identify this clothing',
    message: 'The clothing type or color could not be confirmed. Check the original photo and use Adjust to correct the details.',
    detail: 'Do not treat an uncertain guess as a confirmed garment.',
    actions: ['review', 'retry']
  },
  blank_image: {
    title: 'This image looks blank or invalid',
    message: 'No garment was added from that image. Retake the photo with the whole piece visible.',
    detail: 'No placeholder garment will be substituted.',
    actions: ['retry']
  },
  photo_missing: {
    title: 'The saved clothing photo is unavailable',
    message: 'This clothing image cannot be loaded. Check My Closet and your saved-photo status before trying another capture.',
    detail: 'An expired or missing image must not be replaced with a sample photo.',
    actions: ['closet', 'retry']
  },
  mask_failed: {
    title: 'Background removal did not work',
    message: 'The transparent garment image could not be prepared. You can inspect a verified original, or try again.',
    detail: 'The original photo is not a masked avatar layer; its appearance is different.',
    actions: ['original', 'retry']
  },
  outfit_failed: {
    title: 'This outfit could not be created',
    message: 'We could not make an outfit with the available verified clothes. Review My Closet or try again.',
    detail: 'Your saved wardrobe should not be overwritten by a failed recommendation.',
    actions: ['closet', 'retry']
  },
  avatar_failed: {
    title: 'A clothing layer could not be shown',
    message: 'This saved garment is not displayed on the 2D avatar. View it in My Closet or retry the layer.',
    detail: 'An illustration or different garment must not silently replace the missing layer.',
    actions: ['closet', 'retry']
  },
  cancelled: {
    title: 'Action canceled',
    message: 'The canceled step is not complete. You can try again when ready.',
    detail: 'Check My Closet to confirm which earlier items were already saved.',
    actions: ['closet', 'retry']
  },
  unknown: {
    title: 'Something did not finish',
    message: 'This step could not be completed. Try again, or check My Closet before making another change.',
    detail: 'Check that your previous photos or outfits are still present.',
    actions: ['closet', 'retry']
  }
});

export function recoveryFor(code) {
  const key = Object.hasOwn(failures, code) ? code : 'unknown';
  return { code: key, ...failures[key], actions: [...failures[key].actions] };
}

export function makeReport({category='Other', description=''}={}) {
  if (!categories.includes(category)) throw new TypeError('Choose a listed problem category.');
  if (typeof description !== 'string') throw new TypeError('Description must be text.');
  const note = description.trim();
  if (note.length > 500) throw new RangeError('Keep the description within 500 characters.');
  // User-entered text is never auto-sent. Remove common accidental identifiers
  // before a manual copy, but still ask the tester to review their own wording.
  const safeNote = note
    .replace(/data:image\/[\w+.-]+;base64,[A-Za-z0-9+/=]+/gi, '[photo removed]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
    .replace(/https?:\/\/\S+/gi, '[link removed]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone removed]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,'[identifier removed]');
  return \`Closet Current Family Alpha — problem report\nCategory: \${category}\nDescription: \${safeNote || '(not provided)'}\n\nNo photo or account information was attached. Review this text before sharing.\`;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Mount an intentionally local, manual-copy-only feedback dialog. */
export function mountFeedback(root) {
  if (!root || typeof root.append !== 'function') throw new TypeError('A UI container is required.');
  const start = element('button', 'fa14-button fa14-primary', 'Report a Problem');
  start.type = 'button';
  const launchStatus = element('p', 'fa14-launch-status');
  launchStatus.setAttribute('role', 'status');
  launchStatus.setAttribute('aria-live', 'polite');
  const dialog = element('dialog', 'fa14-dialog');
  dialog.setAttribute('aria-label', 'Report a Problem');
  const heading = element('h2', null, 'Report a Problem');
  const privacy = element('p', 'fa14-note', 'No photos or account details are attached. You choose what to write and whether to share it. Do not enter names or other private details.');
  const label = element('label', 'fa14-field', 'What went wrong?');
  const select = element('select', 'fa14-input');
  select.setAttribute('aria-label','Problem category');
  for (const name of categories) { const option = element('option', null, name); option.value = name; select.append(option); }
  label.append(select);
  const descLabel = element('label', 'fa14-field', 'What happened? (optional)');
  const description = element('textarea', 'fa14-input');
  description.rows = 4;
  description.maxLength = 500;
  description.placeholder = 'For example: The shirt layer did not appear.';
  description.setAttribute('aria-label', 'Optional description');
  descLabel.append(description);
  const status = element('p', 'fa14-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const outputLabel = element('label', 'fa14-field fa14-preview', 'Your report (review before sharing)');
  const preview = element('textarea', 'fa14-input');
  preview.setAttribute('aria-label','Prepared report');
  preview.readOnly = true;
  preview.rows = 7;
  outputLabel.append(preview);
  outputLabel.hidden = true;
  const actions = element('div', 'fa14-actions');
  const prepare = element('button', 'fa14-button fa14-primary', 'Prepare report'); prepare.type = 'button';
  const copy = element('button', 'fa14-button fa14-primary', 'Copy report'); copy.type = 'button'; copy.hidden = true;
  const cancel = element('button', 'fa14-button', 'Cancel'); cancel.type = 'button';
  const done = element('button', 'fa14-button', 'Done'); done.type = 'button'; done.hidden = true;
  actions.append(prepare, copy, cancel, done);
  dialog.append(heading, privacy, label, descLabel, outputLabel, status, actions);
  root.append(start, launchStatus, dialog);
  let phase = 'idle';
  function setPhase(next, message) { phase = next; dialog.dataset.state = next; status.textContent = message; }
  function closeCancelled() {
    select.value = 'Photo Capture'; description.value = ''; preview.value = '';
    outputLabel.hidden = true; copy.hidden = true; done.hidden = true; prepare.hidden = false; cancel.hidden = false;
    select.disabled = false; description.disabled = false;
    setPhase('cancelled', 'Report canceled. Nothing was sent or saved.');
    launchStatus.textContent = 'Report canceled. Nothing was sent.';
    dialog.close(); start.focus();
  }
  start.addEventListener('click', () => {
    select.value = 'Photo Capture'; description.value = ''; preview.value = '';
    outputLabel.hidden = true; copy.hidden = true; done.hidden = true; prepare.hidden = false; cancel.hidden = false;
    select.disabled = false; description.disabled = false;
    launchStatus.textContent = '';
    setPhase('editing', 'Only the details you choose will appear in this report.');
    dialog.showModal(); select.focus();
  });
  cancel.addEventListener('click', closeCancelled);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeCancelled(); });
  prepare.addEventListener('click', () => {
    try {
      preview.value = makeReport({category:select.value, description:description.value});
      outputLabel.hidden = false; copy.hidden = false; prepare.hidden = true;
      select.disabled = true; description.disabled = true;
      setPhase('prepared', 'Report ready to review. Nothing has been sent.');
      preview.focus();
    } catch { setPhase('invalid', 'Please choose a category and a description of 500 characters or fewer.'); }
  });
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Copy not supported');
      await navigator.clipboard.writeText(preview.value);
      copy.hidden = true; done.hidden = false;
      setPhase('copied', 'Copied. Nothing was sent automatically. Share only if you choose.');
    } catch {
      setPhase('copy-failed', 'Could not copy automatically. Select the report text above and copy it manually.');
      preview.focus(); preview.select();
    }
  });
  done.addEventListener('click', () => {
    dialog.close(); launchStatus.textContent = 'Report copied. Nothing was sent automatically.';
    start.focus();
  });
  return {start, dialog, select, description, preview, status, launchStatus, get phase() { return phase; }};
}

const actionLabels = Object.freeze({
  retry: 'Try again', review: 'Adjust clothing details',
  closet: 'Open My Closet', original: 'View verified original'
});
/**
 * Context-free recovery message; consumer supplies callback functions.
 * The original action is shown only with separately verified source permission.
 * No mutation, fallback image or automatic retry occurs in this module.
 */
export function renderRecovery(root, code, {callbacks={}, verifiedOriginal=false}={}) {
  if (!root || typeof root.replaceChildren !== 'function') throw new TypeError('A UI container is required.');
  const failure = recoveryFor(code);
  root.replaceChildren();
  root.setAttribute('role', 'alert');
  root.dataset.failure = failure.code;
  root.append(element('h2', null, failure.title), element('p', null, failure.message), element('p', 'fa14-note', failure.detail));
  const actions = element('div', 'fa14-actions');
  for (const key of failure.actions) {
    if (key === 'original' && !verifiedOriginal) continue;
    if (typeof callbacks[key] !== 'function') continue;
    const button = element('button', 'fa14-button', actionLabels[key]); button.type = 'button';
    button.dataset.action = key;
    button.addEventListener('click', () => callbacks[key]());
    actions.append(button);
  }
  root.append(actions);
  return {code:failure.code, actions:[...actions.querySelectorAll('button')].map(x=>x.dataset.action)};
}
