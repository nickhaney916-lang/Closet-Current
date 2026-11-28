# Saved outfit organization (Assignment 44)

`readSavedOutfitOrganization()` returns the signed-in owner's saved roster, organization and a session-bound asynchronous `write(nextOrganization)` function. This is the integration point for Assignment 43. The first read with legacy saved outfits assigns durable IDs inside the board transaction. A first organization write can also initialize an empty wardrobe. Until initialization, the ordinary outfit path and v3 backups keep their legacy behavior.

Store `savedOutfitId` in favorites and collection membership. Read a fresh snapshot before composing a change and after a successful write. A stale organization snapshot or a reference absent from the owner's live wardrobe aborts the transaction. Collection IDs are UUIDs. Collection removal changes references only. Outfit and garment deletion remove their organization references atomically.

Once initialized, export uses an owner-bound v5 local backup. Earlier default importers reject the version, and legacy board restore is refused on a v5-initialized destination. The research v4 adapter and ordinary cloud adapter refuse organization data. Keep a v5 backup and use a v5-capable candidate to restore. Reopening the same live organized IndexedDB with an earlier build is unsupported. Existing separate wear history is untouched during migration and local import, and the backup does not include that separate history store.

Cloud organization sync and any hosted schema change are outside this candidate. Family Alpha #255 remains on HOLD.
