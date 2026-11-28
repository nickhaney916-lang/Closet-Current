const historyKey = 'outfit-wear-history-v1';
const limit = 100;
const supportedSlots = new Set(['top', 'bottom', 'layer', 'layer2', 'layer3', 'shoes', 'bag', 'accessory', 'finish']);
const isRecord = value => !!value && Object.getPrototypeOf(value) === Object.prototype;
const exactFields = (value, fields) => isRecord(value) &&
  Reflect.ownKeys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key));
const boundedString = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;

function combination(event) {
  return JSON.stringify(Object.entries(event.slots).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

function eventKey(event) {
  return event.day + combination(event);
}

function validate(owner, row) {
  if (!boundedString(owner, 160) || !owner.trim()) throw Error('Wear history requires an owner.');
  if (row === undefined) return [];
  if (!exactFields(row, ['id', 'owner', 'events']) || row.id !== historyKey || row.owner !== owner ||
      !Array.isArray(row.events) || row.events.length > limit)
    throw Error('Invalid or foreign wear history.');
  const ids = new Set(), keys = new Set();
  for (const event of row.events) {
    if (!exactFields(event, ['id', 'name', 'day', 'at', 'slots']) ||
        !boundedString(event.id, 80) || !boundedString(event.name, 80) ||
        typeof event.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.day) ||
        !Number.isFinite(Date.parse(event.day)) || new Date(event.day).toISOString().slice(0, 10) !== event.day ||
        !Number.isFinite(event.at) || Math.abs(event.at) > 8.64e15 || !isRecord(event.slots))
      throw Error('Invalid wear event.');
    const slots = Object.entries(event.slots);
    if (!slots.length || Reflect.ownKeys(event.slots).length !== slots.length ||
        slots.some(([key, id]) => !supportedSlots.has(key) || !boundedString(id, 128)) ||
        new Set(slots.map(([, id]) => id)).size !== slots.length)
      throw Error('Invalid wear event slots.');
    const key = eventKey(event);
    if (ids.has(event.id) || keys.has(key)) throw Error('Duplicate wear event.');
    ids.add(event.id);
    keys.add(key);
  }
  return row.events;
}

// This is the history section's own version. The enclosing backup format
// and IndexedDB transaction are the responsibility of the backup adapter.
export function serializeWearHistory(owner, row) {
  return {version: 1, owner, events: structuredClone(validate(owner, row))};
}

export function planWearHistoryRestore(owner, section, existingRow) {
  if (!exactFields(section, ['version', 'owner', 'events']) || section.version !== 1)
    throw Error('Unsupported wear history section.');
  const incoming = validate(owner, {id: historyKey, owner: section.owner, events: section.events});
  const existing = validate(owner, existingRow);
  const ids = new Map(existing.map(event => [event.id, event]));
  const keys = new Set(existing.map(eventKey));
  const additions = [];
  for (const event of incoming) {
    const prior = ids.get(event.id);
    if (prior) {
      if (prior.name !== event.name || prior.at !== event.at || eventKey(prior) !== eventKey(event))
        throw Error('Conflicting wear event ID.');
      continue;
    }
    if (keys.has(eventKey(event))) throw Error('Conflicting wear event for this day and outfit.');
    additions.push(event);
  }
  if (existing.length + additions.length > limit) throw Error('Wear history exceeds 100 events.');
  // Preserve each input's order and give existing events precedence on
  // timestamp ties. A fresh restore reproduces the source order exactly.
  const events = [];
  let sourceIndex = 0;
  for (const event of existing) {
    while (sourceIndex < additions.length && additions[sourceIndex].at > event.at)
      events.push(additions[sourceIndex++]);
    events.push(event);
  }
  events.push(...additions.slice(sourceIndex));
  return {id: historyKey, owner, events: structuredClone(events)};
}
