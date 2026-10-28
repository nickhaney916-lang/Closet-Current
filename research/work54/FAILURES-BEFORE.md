# Work54 fitting inspection before implementation

Base: PR382 d8d95bf7297b91bdde2a5cfa274203ca12cbc1f1. Work53 isolation files are in a separate worktree and are not changed.

The protected renderer initially contains each full PNG within a generic slot box. Even its bounded visible-alpha adjustment centers the visible rectangle; it does not identify a shoulder or waistband. Manual landmark fitting later uses validated rigid transforms, source coverage checks, anatomical foreground and source-bound recipe recovery.

Observed sources and separation of concerns:

- commons-0043 skirt: a dependable waistband row exists near the cutout's top. Generic bottom-slot centering does not anchor it to the anatomical waist. The manually calibrated waist fit is already better and must remain available. Pleats/hem outline are isolation issues, not reasons to stretch the skirt.
- commons-0003 long sleeves: the source has a visible upper shoulder span and mostly straight sleeves. Slot containment wastes transparent margins and does not align the shoulders. Existing manual fit is the stronger reference; clipped cuffs are Work53's isolation issue and are not repaired here.
- commons-0001 printed shirt: automatic containment can float the collar/shoulder region. Source perspective, retained mannequin collar and long hem remain limitations even after positioning. Do not shorten the photographed design by nonuniform scaling.
- commons-0016 blouse: containment cannot infer neckline or hand alignment. Existing verified sleeve panels/rotations must not be replaced by new guessed panels. Pale embroidery/background ambiguity is isolation work.
- commons-0053 dress: source contours retain support residue. Waist/hem placement must preserve the photographed proportions and suppress conflicting top/bottom combinations. Existing face/neck protection must remain. No missing cloth is fabricated.
- Available single-shoe references cannot be rendered as a fictional pair. Jackets/coats, pants/shorts and the difficult dress lack dependable masks/front-facing profiles; preserve source-photo fallback, not made-up fit success.

Chosen scope: conservative category-aware starting landmarks from already reviewed cutout alpha, reuse the existing rigid fitter and optional existing verified source landmarks, retain manual controls and source-bound recovery. Compare previous automatic containment, new starting fit, and previous best manual calibration separately. Do not claim the new automatic guess outperforms verified manual landmarks.
