# Conservative LIP boundary evidence — research only

The second human-parsing model provides distinct Coat and Skirt semantic
regions for the licensed `validation-0031` person photograph but omits major
portions of the real skirt. Previous visual review also showed contamination
of the coat by brown clothing. Expanding a mask without checking its source
would worsen false positive inventory.

This experiment inspects the raw, pinned 20-class model logits at each
garment boundary. An alternate class (Coat, Skirt or shoe pair) is highlighted
only when already classified as **a different garment class**, within two
coarse pixels of that target class, and at most 1.5 pre-softmax logit units
behind the original label. All currently identified body, hair, arms,
face, legs and background pixels remain excluded.

Output for each verified source photograph includes the unmodified original,
the strict Skirt label mask, and a magenta **model-conflict overlay**. Overlay
pixels are *not* independently verified garment, a customer-visible cutout,
pixel-level recall improvement, or an automatic inventory entry. Even an
apparently useful band could be clothing from a different item.

This compares `validation-0031` (worn blazer/skirt) against
`commons-0059` (flat-laid jacket/dress). The parser's outright failure on
the flat lay remains release-blocking for any universal replacement.
No production model or backend changes and no new paid services.
