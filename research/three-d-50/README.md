# 3D-50 — source-safe detached female cap coverage (DRAFT HOLD)

## Independently verified failure

[PR #455 exact-head CI run #41097093517](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41097093517) finished **FAIL** at `tests/three-d-47-upper-arm-volume.test.mjs`, *not* at a stale workflow guard. Female source `commons-public-domain-jeans-2005` and `commons-cc-by-sa-denimjeans2-2008` both fail in the real original anatomical rig. Actual error values for each female source:

```json
{
 "changed": 4884, "depthMoves": 2472, "maxMove": 0.0214663,
 "perSide": {
  "L": {"changed":2442,"caps":0,"torso":2442},
  "R": {"changed":2442,"caps":0,"torso":2442}
 },
 "seamGroups": 0
}
```

Both male photo-source cases were green in that same dedicated run. The 3D47 original shoulder-volume algorithm used an overly narrow male-scale gate `x > 0.35` and `dy > -0.30`, which could move only the torso shirt and not the genuine female **separate 3D45 sleeve caps**. A zero `maxGap` with `seamGroups: 0` proves nothing about seam stability — also motivating separate [PR #457](https://github.com/nickhaney916-lang/Closet-Current/pull/457) seam witnesses.

## Real code change

In `research/three-d-47/upper-arm-fabric-volume.mjs`, keep all existing source image and skeleton attributes unchanged, but dynamically detect if any vertex group belongs to an **actual** independent shoulder cap. Use a broader cap-specific source-safe lateral/y envelope while retaining the original torso-only shaping domain. Cap/torso **shared vertex groups move as one** with the same inverse world transform; no synthetic photo, no new generic garment mesh, no paid AI.

- Original central photographed chest/print remains gated by `x <= 0.235` for detached panels, consistent with 3D45's no-cut region `x < 0.227`; torso-only center remains `x <= 0.35`.
- Retain hard maximum 0.023 model-unit movement and existing original photo, rig skin-weight, symmetric left/right and seam-gap checks.
- Keep the existing four genuine female/male × two original denim source tests and poses; **do not weaken the female tests to obtain green**.
- Localhost experimental optional `volume47=after` only; regular customer app unchanged.

## Required verification and limitations

**Current state: implementation committed; dedicated CI on this exact branch and 3D-QA-49 genuine real screenshot approval are pending.** Do not call PASS on the strength of this commit alone. Test the actual female cap vertex count (both sides >10), real shared seam witnesses, 28 pose records, browser screenshot coverage, and retained original photo bytes. If the existing tests still fail, **leave HOLD** and inspect real cap geometry; do not remove assertions.

No merge, deploy, staging, production, customer/family photos, account/billing, external network calls or Drive Duel modification. Family Alpha Issue #255 HOLD.
