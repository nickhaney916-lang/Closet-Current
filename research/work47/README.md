# Work47: actual garment landmark fitting — development HOLD

Existing source: PR358 `ba55bf7ede6c621ae6e012004b67aa2f8c6e4339` includes PR349 original-source boundary, Work44 boards, Work46 retry guidance and PR358 mobile navigation. Original-photo/recognition, private IndexedDB, account/session ownership, atomic save, favorite and backup assets are unchanged by the builder. Only the offline UI and boot gain a guarded fitting entry point; two new volatile modules handle placement. Production public sources are untouched.

Reused: existing articulated humanoid, frozen Work30 model alpha proposals and border-connected background method, Work35 explicit eraser review, Work36/40 manual/source-scoped previews, Work38 skirt outline, existing three-look engine and private saved-board renderer. Work32/37 anchor planners were inspected: they did not include a verified real-photo rendered solution and their normalized scale gates cannot directly map native-photo coordinates into a 360×600 frame. Work41 hands-in-front layering failed visual review and is not imported.

New: uniform rotation/scale from two native source landmarks to body shoulders or waist; independently rotated rigid sleeve panels for the manually annotated blouse. Prints are resampled for display but never synthesized, recolored or locally stretched. The original JPEG is never overwritten. RGB in the native cutouts is copied unchanged from the licensed original; only alpha changes. Model output and manual traces remain provisional.

The separate local prototype has five manually calibrated profiles, nine provisional transparent cutouts and six unavailable cutouts in the frozen fifteen-photo cohort. Single side-view shoes remain references; no mirroring, duplication or fabricated pair. Jackets, back-view coats, occluded pants/shorts and the clipped dress remain original-photo fallbacks. Generic offline app users can mark two landmarks only after the existing source/owner checks and explicit mask review; benchmark annotations do not authorize user images. Sleeve panel calibration is currently benchmark-only.

Reproduce:

```
node scripts/build-work47-parent.mjs
node scripts/build-work47-benchmark.mjs
node --test tests/work47*.test.mjs
node scripts/test-work47-integration-browser.mjs
node scripts/test-family-alpha-51-mobile-nav-browser.mjs
node scripts/test-work47-browser.mjs
```

Serve the repo on localhost and open `/research/work47/index.html` for the functional licensed prototype, or the disabled `dist-work47-garment-fit-HOLD` with the inherited offline QA harness for app integration. No deployment. Browser test matrix: 15 photos × Chromium/WebKit × 320/390/430 = 90 comparisons. Browser emulation is not a physical-phone test. Automated checks cannot award visual acceptance. Exact results and assistant visual grades will be recorded after execution.

Remaining: robust automatic garment-only segmentation, accurate cuff/underarm contact, source-pose changes, self-occlusion, cloth drape, occluded fabric, front-facing footwear pairs, persistent reviewed fit, real accounts and phone validation. Family Alpha HOLD; zero owner approvals. No changes to Supabase, Cloudflare, staging, production or Drive Duel; no paid services, private family photos, merge or deploy.
