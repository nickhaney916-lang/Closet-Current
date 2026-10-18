# Conservative source-fallback gate (independent of segmentation labels)

The real whole-outfit benchmark showed that a single unmasked crop can contain
a blazer, skirt and exposed leg, or shoes plus chair and floor. An original
RGB crop safeguards source pixels but does not establish a garment boundary.

Any full-outfit `displayFallback:'original-crop'` candidate is now review-only,
regardless of reason (fragmented mask, unexplained void, clipped image or
insufficient silhouette). Model confidence, apparent color or color-only
confirmation cannot make it one independent owned garment. User-controlled
Adjust remains available; ordinary individual photos and genuinely isolated
outfit garment cutouts retain their streamlined save paths.

This is a source-photo fidelity and false-positive prevention change. It
does not improve measured extraction accuracy. Independent reference masks,
mobile performance and real-photo quality acceptance remain outstanding.
