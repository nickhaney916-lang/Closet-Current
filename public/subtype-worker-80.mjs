/** Research adapter around the EXISTING model. No replacement model or training. */
import { localCandidates } from "./local-catalog.mjs";
import {
  VERSION,
  hash80,
  jpeg80,
  canonical,
  SHA,
} from "./subtype-review-80.mjs";
export const SOURCE_FILES80 = [
  "local-worker.mjs",
  "recognition-engine.mjs",
  "recognition-confusion-guard.mjs",
  "recognition-photo.mjs",
  "vector-scorer.mjs",
  "local-catalog.mjs",
  "subtype-review-80.mjs",
  "subtype-worker-80.mjs",
];
export async function sourceCodeHash80(fetcher = fetch) {
  const entries = [];
  for (const name of SOURCE_FILES80) {
    const response = await fetcher(new URL(name, import.meta.url), {
      cache: "no-store",
    });
    if (!response.ok) throw Error("P80_SOURCE_CODE_UNAVAILABLE");
    const text = await response.text();
    if (text.length > 250000) throw Error("P80_SOURCE_CODE_LIMIT");
    entries.push([name, await hash80(text)]);
  }
  return hash80(canonical(entries));
}
export async function subtypeModel80({
  request,
  image,
  whole,
  confirmation,
  metadata,
  sourceCodeSha256,
}) {
  const context = request.subtype80;
  if (
    context?.schema !== VERSION ||
    context.enabled !== true ||
    context.consent !== true ||
    context.categoryOwnerReviewed !== true ||
    !context.evidence?.ownerId ||
    !SHA.test(context.evidence.sourceSha256 || "") ||
    (await hash80(jpeg80(request.image))) !== context.evidence.inputSha256
  )
    throw Error("P80_OPT_IN_SOURCE_REQUIRED");
  const model = {
    name: metadata.model,
    revision: metadata.revision,
    vectorsSha256: metadata.sha256,
    sourceCodeSha256,
  };
  const labels = localCandidates.map((c) => c.label);
  const [a, b] = await Promise.all([
    whole(image, labels),
    confirmation(image, labels),
  ]);
  // Never report "identified" or a strong result from this path.
  return {
    subtype80: {
      schema: VERSION,
      model,
      receipt: {
        evidence: context.evidence,
        modelKey: canonical(model),
        createdAt: Date.now(),
      },
      views: { whole: a, confirmation: b },
    },
    strong: false,
    choices: [],
    details: {},
    reason: "subtype80_owner_review_only",
  };
}
