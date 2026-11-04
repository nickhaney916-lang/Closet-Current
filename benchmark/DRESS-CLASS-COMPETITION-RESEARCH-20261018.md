# Class competition: can the dress label be subdivided?

An actual full-body photo (`validation-0031`) containing a blazer,
shirt, skirt, tights and shoes produced one composite upper/lower clothing
region and one contaminated footwear region. The baseline class-7 dress
prediction is a *semantic class* and may span several garments.

This new offline experiment evaluates the ORIGINAL pinned SegFormer logits on
nine independently licensed SHA-256 verified photographs, including the
failed full-body case. For pixels previously assigned to Dress (class 7),
the runner-up pre-softmax logits for upper clothing (class 4), skirt (5),
and bottoms (6) are compared. A marginal difference of at most 2 is recorded
as **a model-disagreement lead, not a garment label**. The overlay highlights
these weak alternatives in pink/blue/amber and reports which photo bands
contain each, alongside the unmodified source.

A colored overlay is NOT a segmentation mask, garment count, human approval,
or automatic category recovery. If scores lack useful separation on the
failed photo, this model alone cannot fix the issue by simple relabeling.
Source photos, save behavior, original RGB recognition and the production
clipping method remain unchanged. Unapproved physical instance masks are
still excluded from automatic closet saves. No paid inference.
