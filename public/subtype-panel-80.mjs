import {
  VERSION,
  evidence80,
  decide80,
  createReview80,
  binding80,
  revision80,
} from "./subtype-review-80.mjs";
import { sourceCodeHash80 } from "./subtype-worker-80.mjs";
const el = (tag, text) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
};
export function mountSubtype80({
  form,
  item,
  getOwner,
  isLive,
  getCategory,
  onChoose,
  request,
  unitAllowed = () => true,
}) {
  const owner = getOwner(),
    sessionId = crypto.randomUUID(),
    sourceAtOpen = revision80(item),
    ownerId = owner?.id;
  let active = true,
    epoch = 0,
    review = null;
  const live = () =>
    active &&
    isLive() &&
    getOwner() === owner &&
    getOwner()?.id === ownerId &&
    !!owner?.id &&
    unitAllowed();
  const panel = el("fieldset"),
    legend = el("legend", "Subtype hypotheses · optional research");
  panel.append(
    legend,
    el(
      "p",
      "Relative model scores are not probabilities. No hypothesis saves clothing or establishes recognition accuracy.",
    ),
  );
  const consentLabel = el("label"),
    consent = el("input");
  consent.type = "checkbox";
  consentLabel.append(
    consent,
    document.createTextNode(
      " I checked the broad category and consent to this local subtype check.",
    ),
  );
  const visibleLabel = el("label"),
    visible = el("input");
  visible.type = "checkbox";
  visibleLabel.append(
    visible,
    document.createTextNode(
      " I can isolate this one garment and see the distinguishing hems, sleeves, ankles or soles.",
    ),
  );
  const check = el("button", "Compare subtype hypotheses");
  check.type = "button";
  const status = el("p"),
    results = el("div");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  panel.append(consentLabel, visibleLabel, check, status, results);
  form.prepend(panel);
  const revoke = () => {
    epoch++;
    review?.close();
    review = null;
    results.replaceChildren();
    consent.checked = false;
    visible.checked = false;
    status.textContent =
      "Hypotheses cleared. Check the current photo and consent again.";
  };
  const onInput = (event) => {
    if (!panel.contains(event.target)) revoke();
  };
  form.addEventListener("input", onInput);
  consent.onchange = () => {
    epoch++;
    review?.close();
    results.replaceChildren();
  };
  visible.onchange = () => {
    epoch++;
    review?.close();
    results.replaceChildren();
  };
  async function inspect() {
    const original =
      item.originalPhoto?.image || item.recognitionPhoto?.image || item.image;
    const decoded = new Image();
    decoded.src = item.recognitionPhoto?.image || item.image;
    await decoded.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(decoded, 0, 0, 32, 32);
    const p = ctx.getImageData(0, 0, 32, 32).data;
    let sum = 0,
      min = 255,
      max = 0;
    for (let i = 0; i < p.length; i += 4) {
      const v = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      sum += v;
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    return {
      detailVisible: visible.checked,
      minimumSide: Math.min(decoded.naturalWidth, decoded.naturalHeight),
      lowLight: sum / 1024 < 30 || max - min < 9,
      clipped: !!item.segmentHint?.clipped,
      occluded: false,
      overlapping: false,
      soft: false,
      source: original,
    };
  }
  check.onclick = async () => {
    if (!live() || !consent.checked || !visible.checked) {
      status.textContent =
        "Check both photo declarations in the current signed session. Unknown is always available in Item type.";
      return;
    }
    const ticket = ++epoch;
    review?.close();
    results.replaceChildren();
    check.disabled = true;
    status.textContent = "Checking this exact garment photo…";
    try {
      const initialRevision = revision80(item),
        category = getCategory(),
        scope = { ownerId: owner.id, sessionId, live },
        before = await evidence80(item, scope),
        quality = await inspect(),
        sourceCodeSha256 = await sourceCodeHash80();
      const metadataResponse = await fetch(
        new URL("./recognition-vectors.json", import.meta.url),
        { cache: "no-store" },
      );
      if (!metadataResponse.ok) throw Error("Model manifest unavailable");
      const metadata = await metadataResponse.json();
      if (!live() || ticket !== epoch || category !== getCategory())
        throw Error("P80_REVOKED");
      const output = await request(item.recognitionPhoto?.image || item.image, {
        schema: VERSION,
        enabled: true,
        consent: true,
        categoryOwnerReviewed: true,
        evidence: before,
      });
      const current = await evidence80(item, scope),
        data = output.subtype80;
      if (
        !live() ||
        ticket !== epoch ||
        category !== getCategory() ||
        !binding80(before, current) ||
        data?.model?.sourceCodeSha256 !== sourceCodeSha256 ||
        data?.model?.name !== metadata.model ||
        data?.model?.revision !== metadata.revision ||
        data?.model?.vectorsSha256 !== metadata.sha256
      )
        throw Error("P80_REVOKED");
      const decision = decide80({
        enabled: true,
        consent: consent.checked,
        categoryOwnerReviewed: true,
        category,
        evidence: before,
        current,
        quality,
        model: data.model,
        receipt: data.receipt,
        views: data.views,
      });
      if (!decision.evidence) {
        status.textContent =
          "Unknown / Needs owner review. " +
          decision.reasons
            .map(
              (reason) =>
                ({
                  "insufficient-visible-photo-detail":
                    "The photograph does not show enough clear detail",
                  "broad-category-or-background-conflict":
                    "The garment category or background checks disagree",
                  "close-score-in-either-framing":
                    "Two clothing types scored too similarly",
                  "weak-or-close-relative-scores":
                    "The alternatives are weak or too close to separate",
                  "same-model-framing-disagreement":
                    "Different views suggest different types",
                  "owner-must-resolve-subtype; same-model-agreement-is-not-independent-proof":
                    "Check each possibility against the photo",
                })[reason] ||
                "A fresh check of this photo and signed session is needed",
            )
            .join(". ") +
          ". Keep Unknown in Item type or review manually.";
        return;
      }
      review = createReview80({
        evidence: before,
        decision,
        live: () => evidence80(item, scope),
      });
      status.textContent =
        (decision.status === "hypotheses"
          ? "Tentative hypotheses. "
          : "Unknown / Needs owner review. ") +
        decision.reasons
          .map(
            (reason) =>
              ({
                "insufficient-visible-photo-detail":
                  "The photograph does not show enough clear detail",
                "broad-category-or-background-conflict":
                  "The garment category or background checks disagree",
                "close-score-in-either-framing":
                  "Two clothing types scored too similarly",
                "weak-or-close-relative-scores":
                  "The alternatives are weak or too close to separate",
                "same-model-framing-disagreement":
                  "Different views suggest different types",
                "owner-must-resolve-subtype; same-model-agreement-is-not-independent-proof":
                  "Check each possibility against the photo",
              })[reason] ||
              "A fresh check of this photo and signed session is needed",
          )
          .join(". ") +
        ". Two framings use the SAME model, not independent verification.";
      const ackLabel = el("label"),
        ack = el("input");
      ack.type = "checkbox";
      ackLabel.append(
        ack,
        document.createTextNode(
          " I inspected the original and want to use this subtype in my unsaved draft.",
        ),
      );
      results.append(ackLabel);
      for (const candidate of [
        "Unknown",
        ...decision.alternatives.map((x) => x.itemType),
      ]) {
        const button = el("button", "Choose " + candidate);
        button.type = "button";
        button.onclick = async () => {
          button.disabled = true;
          try {
            if (
              !live() ||
              ticket !== epoch ||
              !consent.checked ||
              category !== getCategory()
            )
              throw Error("P80_REVOKED");
            const choice = await review.choose(candidate, {
              acknowledged: ack.checked,
            });
            if (
              !live() ||
              ticket !== epoch ||
              initialRevision !== revision80(item)
            )
              throw Error("P80_REVOKED");
            onChoose(choice.itemType);
            revoke();
            status.textContent =
              "Unsaved draft updated by you. Check the normal photo-review box before Save changes.";
          } catch {
            button.disabled = false;
            status.textContent =
              "No subtype applied. Recheck acknowledgment or request fresh hypotheses.";
          }
        };
        results.append(button);
      }
    } catch {
      results.replaceChildren();
      status.textContent =
        "Subtype check unavailable or evidence changed. No suggestion applied. Keep Unknown or adjust the type yourself.";
    } finally {
      check.disabled = false;
    }
  };
  // No timers, persistence, learning, photo uploads, item/pair mutations or save calls.
  return {
    valid() {
      return (
        active &&
        getOwner() === owner &&
        getOwner()?.id === ownerId &&
        !!ownerId &&
        revision80(item) === sourceAtOpen &&
        unitAllowed()
      );
    },
    close() {
      active = false;
      epoch++;
      review?.close();
      form.removeEventListener("input", onInput);
      panel.remove();
    },
    revoke,
  };
}
