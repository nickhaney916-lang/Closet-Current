(async () => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    { strictLabel } = await import("./validator.js");
  const response = await fetch("session", { cache: "no-store" });
  if (!response.ok) throw Error("Session unavailable");
  const { uprightDisplay } = await import("./display.mjs");
  const session = await response.json(),
    drafts = new Map(),
    history = new Map(),
    completed = new Set();
  let index = 0,
    viewEpoch = 0,
    photoURL = null,
    ready = false;
  const fields = {
    presence: [
      "uncertain",
      "single-garment",
      "multiple-garments",
      "whole-outfit",
      "nonclothing",
    ],
    category: ["Unknown", ...Object.keys(session.categories)],
    subtype: ["Unknown"],
    primaryColor: ["Unknown", ...session.colors.filter((x) => x !== "Unknown")],
    secondaryColor: [
      "Unknown",
      ...session.colors.filter((x) => x !== "Unknown"),
    ],
    wardrobeUnit: [
      "unknown",
      "single-unit",
      "matching-pair",
      "separate-items",
      "multiple-pairs",
    ],
    lighting: ["unknown", "ok", "dim", "overbright"],
    focus: ["unknown", "ok", "soft"],
    framing: ["unknown", "ok", "clipped"],
    background: ["unknown", "ok", "busy"],
  };
  const names = {
    presence: "Presence",
    category: "Category",
    subtype: "Subtype",
    primaryColor: "Primary color",
    secondaryColor: "Secondary color",
    wardrobeUnit: "Physical wardrobe unit",
    lighting: "Lighting",
    focus: "Focus",
    framing: "Framing",
    background: "Background",
  };
  function blank() {
    return {
      presence: "uncertain",
      category: "Unknown",
      subtype: "Unknown",
      primaryColor: "Unknown",
      secondaryColor: "Unknown",
      multicolor: false,
      colorCast: false,
      wardrobeUnit: "unknown",
      instanceCount: 0,
      instances: [],
      quality: {
        lighting: "unknown",
        focus: "unknown",
        framing: "unknown",
        background: "unknown",
      },
    };
  }
  const current = () => drafts.get(index);
  const tell = (s) => ($("errors").textContent = s);
  function snapshot() {
    resetArmed = false;
    const h = history.get(index) || [];
    h.push(structuredClone(current()));
    if (h.length > 100) h.shift();
    history.set(index, h);
    completed.delete(index);
    $("inspected").checked = false;
  }
  function selectOptions(select, values, value) {
    select.replaceChildren(
      ...values.map((v) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        return o;
      }),
    );
    select.value = value;
  }
  for (const [key, values] of Object.entries(fields)) {
    const label = document.createElement("label");
    label.textContent = names[key] + " ";
    const select = document.createElement("select");
    select.id = key;
    select.setAttribute("aria-label", names[key]);
    selectOptions(select, values, values[0]);
    label.append(select);
    $("fields").append(label);
    select.addEventListener("change", () => {
      snapshot();
      const d = current();
      if (Object.hasOwn(d.quality, key)) d.quality[key] = select.value;
      else d[key] = select.value;
      if (key === "category") d.subtype = "Unknown";
      render();
    });
  }
  for (const [key, text] of [
    ["multicolor", "Multicolor fabric"],
    ["colorCast", "Lighting color cast"],
  ]) {
    const label = document.createElement("label"),
      input = document.createElement("input");
    input.type = "checkbox";
    input.id = key;
    label.append(input, document.createTextNode(" " + text));
    $("fields").append(label);
    input.onchange = () => {
      snapshot();
      current()[key] = input.checked;
    };
  }
  $("declaration").textContent = session.declaration;
  function render() {
    const d = current();
    for (const key of Object.keys(fields)) {
      const value = Object.hasOwn(d.quality, key) ? d.quality[key] : d[key];
      if (key === "subtype")
        selectOptions(
          $(key),
          ["Unknown", ...(session.categories[d.category] || [])],
          value,
        );
      else $(key).value = value;
    }
    for (const k of ["multicolor", "colorCast"]) $(k).checked = d[k];
    $("regions").replaceChildren();
    $("boxes").replaceChildren();
    d.instances.forEach((region, n) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "region";
      const legend = document.createElement("legend");
      legend.textContent = "Region " + (n + 1);
      fieldset.append(legend);
      const coords = document.createElement("div");
      coords.className = "coordinates";
      ["x", "y", "width", "height"].forEach((name, k) => {
        const label = document.createElement("label");
        label.textContent = "Region " + (n + 1) + " " + name;
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "1";
        input.step = "0.001";
        input.value = region.box[k];
        input.onchange = () => {
          snapshot();
          region.box[k] = Number(input.value);
          draw();
        };
        label.append(input);
        coords.append(label);
      });
      fieldset.append(coords);
      if (region.observed)
        for (const key of [
          "category",
          "subtype",
          "primaryColor",
          "secondaryColor",
        ]) {
          const label = document.createElement("label");
          label.textContent = "Region " + (n + 1) + " " + names[key];
          const select = document.createElement("select"),
            values =
              key === "category"
                ? ["Unknown", ...Object.keys(session.categories)]
                : key === "subtype"
                  ? [
                      "Unknown",
                      ...(session.categories[region.observed.category] || []),
                    ]
                  : session.colors;
          select.setAttribute(
            "aria-label",
            "Region " + (n + 1) + " " + names[key],
          );
          selectOptions(select, values, region.observed[key]);
          select.onchange = () => {
            snapshot();
            region.observed[key] = select.value;
            if (key === "category") region.observed.subtype = "Unknown";
            render();
          };
          label.append(select);
          fieldset.append(label);
        }
      for (const key of ["clipped", "occluded"]) {
        const label = document.createElement("label"),
          input = document.createElement("input");
        input.type = "checkbox";
        input.checked = region[key];
        input.onchange = () => {
          snapshot();
          region[key] = input.checked;
        };
        label.append(
          input,
          document.createTextNode(" Region " + (n + 1) + " " + key),
        );
        fieldset.append(label);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove region " + (n + 1);
      remove.onclick = () => {
        snapshot();
        d.instances.splice(n, 1);
        d.instanceCount = d.instances.length;
        render();
      };
      fieldset.append(remove);
      $("regions").append(fieldset);
    });
    draw();
    $("previous").disabled = index === 0;
    $("next").disabled = index === session.photos.length - 1;
    updateProgress();
  }
  function updateProgress() {
    $("status").textContent =
      `Photo ${index + 1} of ${session.photos.length} · ${completed.size} unsigned drafts exported · not human acceptance`;
  }
  function draw() {
    $("boxes").replaceChildren();
    current().instances.forEach((r, n) => {
      const box = document.createElement("div");
      box.className = "box";
      const [x, y, w, h] = r.box;
      Object.assign(box.style, {
        left: x * 100 + "%",
        top: y * 100 + "%",
        width: w * 100 + "%",
        height: h * 100 + "%",
      });
      const text = document.createElement("span");
      text.textContent = n + 1;
      box.append(text);
      const handle = document.createElement("div");
      handle.className = "handle";
      box.append(handle);
      box.onpointerdown = (e) => {
        e.preventDefault();
        snapshot();
        box.setPointerCapture(e.pointerId);
        const start = [...r.box],
          rect = $("scene").getBoundingClientRect(),
          px = e.clientX,
          py = e.clientY,
          resize = e.target === handle;
        box.onpointermove = (move) => {
          const dx = (move.clientX - px) / rect.width,
            dy = (move.clientY - py) / rect.height;
          if (resize) {
            r.box[2] = Math.max(0.001, Math.min(1 - start[0], start[2] + dx));
            r.box[3] = Math.max(0.001, Math.min(1 - start[1], start[3] + dy));
          } else {
            r.box[0] = Math.max(0, Math.min(1 - start[2], start[0] + dx));
            r.box[1] = Math.max(0, Math.min(1 - start[3], start[1] + dy));
          }
          Object.assign(box.style, {
            left: r.box[0] * 100 + "%",
            top: r.box[1] * 100 + "%",
            width: r.box[2] * 100 + "%",
            height: r.box[3] * 100 + "%",
          });
        };
        box.onpointerup = () => {
          box.onpointermove = null;
          render();
        };
      };
      $("boxes").append(box);
    });
  }
  async function show(i) {
    resetArmed = false;
    const epoch = ++viewEpoch;
    ready = false;
    index = i;
    tell("");
    $("inspected").checked = false;
    $("photo").removeAttribute("src");
    if (photoURL) URL.revokeObjectURL(photoURL);
    if (!drafts.has(i)) drafts.set(i, blank());
    render();
    const p = session.photos[i];
    $("rights").textContent = "Read-only rights receipt: " + p.rights;
    try {
      const res = await fetch("original/" + i, { cache: "no-store" });
      if (!res.ok) throw Error("Original changed, expired or unavailable");
      const bytes = await res.arrayBuffer();
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      if (hash !== p.sha256 || bytes.byteLength !== p.byteLength)
        throw Error("Original SHA/length mismatch");
      if (epoch !== viewEpoch) return;
      const display = await uprightDisplay(bytes, p);
      if (epoch !== viewEpoch) return;
      photoURL = URL.createObjectURL(display);
      $("photo").src = photoURL;
      await $("photo").decode();
      if (epoch !== viewEpoch) return;
      const swap = p.orientation >= 5,
        expectedW = swap ? p.height : p.width,
        expectedH = swap ? p.width : p.height;
      if (
        $("photo").naturalWidth !== expectedW ||
        $("photo").naturalHeight !== expectedH
      )
        throw Error(
          "Decoded dimensions/orientation mismatch; curator correction required",
        );
      ready = true;
    } catch (e) {
      if (epoch === viewEpoch) {
        ready = false;
        $("photo").removeAttribute("src");
        tell(e.message);
      }
    }
  }
  $("previous").onclick = () => show(index - 1);
  $("next").onclick = () => show(index + 1);
  $("fit").onclick = () => {
    $("scene").style.width = "100%";
  };
  $("zoom").onclick = () => {
    $("scene").style.width =
      Math.min(400, parseFloat($("scene").style.width || "100") + 50) + "%";
  };
  $("add").onclick = () => {
    if (current().instances.length >= 20) return tell("Maximum 20 regions");
    snapshot();
    const id = crypto.randomUUID().slice(0, 12);
    current().instances.push({
      id,
      box: [0.1, 0.1, 0.3, 0.3],
      clipped: false,
      occluded: false,
      maskSha256: null,
      observed: {
        category: "Unknown",
        subtype: "Unknown",
        primaryColor: "Unknown",
        secondaryColor: "Unknown",
      },
    });
    current().instanceCount = current().instances.length;
    render();
  };
  $("undo").onclick = () => {
    const h = history.get(index);
    if (h?.length) {
      drafts.set(index, h.pop());
      completed.delete(index);
      $("inspected").checked = false;
      render();
    }
  };
  let resetArmed = false;
  $("reset").onclick = () => {
    if (!resetArmed) {
      resetArmed = true;
      return tell(
        "Press Reset this draft again to confirm. Undo will recover the draft.",
      );
    }
    resetArmed = false;
    snapshot();
    drafts.set(index, blank());
    render();
    tell("Draft reset. Undo can recover it.");
  };
  function exportErrors(labels) {
    return strictLabel(labels);
  }
  $("form").onsubmit = async (e) => {
    e.preventDefault();
    const at = index,
      epoch = viewEpoch;
    let fresh;
    try {
      fresh = await fetch("original/" + index, { cache: "no-store" });
      if (!fresh.ok) throw Error("Original changed or session expired");
      const bytes = await fresh.arrayBuffer();
      const digest = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      if (
        digest !== session.photos[index].sha256 ||
        epoch !== viewEpoch ||
        at !== index
      )
        throw Error("Original or active photo changed");
    } catch (error) {
      return tell(error.message);
    }
    const errors = exportErrors(current());
    if (!ready) errors.push("Original must be decoded and verified");
    if (Date.parse(session.expiresAt) <= Date.now())
      errors.push("Session expired");
    if (!$("inspected").checked)
      errors.push("Personal inspection acknowledgment required");
    if (errors.length) return tell(errors.join("\n"));
    const p = session.photos[index],
      draft = {
        schema: "p75-v1",
        workstationVersion: "p79-v1",
        method: "independent-human",
        predictionsExposed: false,
        reviewerId: session.reviewerId,
        sessionId: session.sessionId,
        sourceSha256: p.sha256,
        sourceReceiptSha256: p.receiptSha256,
        reviewedAt: new Date().toISOString(),
        declaration: session.declaration,
        personallyInspected: true,
        coordinateSpace: "exif-upright-normalized-v1",
        labels: structuredClone(current()),
      };
    const url = URL.createObjectURL(
        new Blob([canonical(draft) + "\n"], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "unsigned-review-" +
      String(index + 1).padStart(3, "0") +
      "-" +
      Date.now() +
      ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    completed.add(index);
    updateProgress();
    tell(
      "Unsigned draft exported. Validate with P79 CLI before P75 signing; no human acceptance established.",
    );
  };
  function canonical(v) {
    if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
    if (v && typeof v === "object")
      return (
        "{" +
        Object.keys(v)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
          .join(",") +
        "}"
      );
    return JSON.stringify(v);
  }
  $("restore").onchange = async () => {
    try {
      const f = $("restore").files[0];
      if (!f) return;
      if (f.size > 100000) throw Error("Draft too large");
      const d = JSON.parse(await f.text()),
        p = session.photos[index];
      if (
        d.schema !== "p75-v1" ||
        d.workstationVersion !== "p79-v1" ||
        d.signature ||
        d.sessionId !== session.sessionId ||
        d.reviewerId !== session.reviewerId ||
        d.sourceSha256 !== p.sha256 ||
        d.sourceReceiptSha256 !== p.receiptSha256 ||
        d.predictionsExposed !== false ||
        d.method !== "independent-human" ||
        d.coordinateSpace !== "exif-upright-normalized-v1" ||
        !Number.isFinite(Date.parse(d.reviewedAt)) ||
        Date.now() - Date.parse(d.reviewedAt) > 86400000 ||
        Date.parse(d.reviewedAt) > Date.now() + 60000 ||
        strictLabel(d.labels).length
      )
        throw Error("Corrupt, stale, conflicting, or wrong-session draft");
      snapshot();
      drafts.set(index, structuredClone(d.labels));
      render();
      tell("Draft restored; inspect and acknowledge again before export.");
    } catch (e) {
      tell(e.message);
    } finally {
      $("restore").value = "";
    }
  };
  addEventListener("pagehide", () => {
    drafts.clear();
    history.clear();
    $("form").reset();
    $("regions").replaceChildren();
    $("boxes").replaceChildren();
    $("photo").removeAttribute("src");
    if (photoURL) URL.revokeObjectURL(photoURL);
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
  await show(0);
})().catch((e) => {
  document.getElementById("errors").textContent = "Blocked: " + e.message;
});
