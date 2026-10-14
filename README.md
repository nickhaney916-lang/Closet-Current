# Closet Current

A phone-friendly wardrobe app for capturing clothing, reviewing categories,
recreating inspiration looks, and finding useful shopping gaps. This project
is independent of Drive Duel.

## Features

- Continuous camera capture, video imports, and multiple clothing-photo imports.
- Separate clothing cards with category, type, sleeves, color, pattern, fit,
  seasons, brand, size, material, occasion, and notes.
- Automatic experimental on-device FashionCLIP recognition. Its first load
  downloads about 89 MB of vision weights plus runtime files. High-precision
  clothing text vectors (2.36 MB) are included in the app. Category, type and
  image-view checks must agree before automatic saving. No billed AI API.
- Inspiration reference images and links, editable outfit components, closet
  matches, substitutes, and shopping search links.
- Private account cloud backup, an IndexedDB offline mirror, and export/import of clothing and inspiration backups.
- Home-screen installation and an offline application shell on independent
  hosting. Recognition still needs its model/runtime files available; external
  inspiration links and shopping searches require a connection.

The app signs users in through Supabase Auth. Clothing photos and outfit data back up privately to that account, with a
per-account IndexedDB mirror for offline use and automatic recovery across devices. The outfit builder and Style my collection use a shared,
weekly researched trend dataset. Retailer prices and stock are not live guarantees,
and recognition cannot reliably identify every clothing attribute.

Use More → Help & device check for an optional local pilot checklist and sanitized
scanner diagnostics. Reports are downloaded manually; no photos, email addresses,
credentials, garment names or account IDs are included, and no report is sent
automatically. See [project priorities](docs/ROADMAP.md) for email-delivery setup,
real-phone validation, cloud-backup follow-up, and subscription readiness. See [cloud backup](docs/CLOUD-BACKUP.md) for migration, privacy and validation details.

Device help also links to an optional [phone photo recognition check](docs/PHONE-PHOTO-VALIDATION.md). Supply expected category/type labels before inference, then download a report containing those generic labels, recognition results and timings. Photos and filenames stay out of that report. This uses the production local worker without adding wardrobe items.

## Build and checks

Requires Node.js 20 or newer. No dependency installation is needed to build.

```sh
node scripts/build.mjs
node tests/capture.test.cjs
node tests/photo-import.test.cjs
node tests/taxonomy.test.cjs
node tests/local-recognition.test.mjs
node tests/outfit-matcher.test.cjs
node tests/pwa.test.mjs
```

The generated `dist/` directory is the deployment output. The local recognition
worker downloads Transformers.js 3.8.1 and the FashionCLIP ONNX model from public
CDN/model hosts. Clothing images are processed locally.

## GitHub + Cloudflare Pages

1. Create a separate private GitHub repository named `Closet-Current`.
2. Push the clean migration checkout to that repository.
3. In Cloudflare, choose Workers & Pages → Create application → Pages →
   Connect to Git, then authorize just this repository.
4. Select `main` as the production branch.
5. Set the build command to `node scripts/build.mjs` and output directory to
   `dist`. No environment variables or API keys are needed.
6. Deploy and test the generated HTTPS link on Android and iPhone.

Keep the existing browser until My account reports Cloud backup up to date.
Then sign into the same account at the new app link to restore its cloud closet.
Browser caches remain separate per origin; export/import remains an optional fallback.

## First family pilot

Test importing two photos, saving different clothing details, a short video
scan, local recognition, outfit matching, backup recovery, and installation.
Each authenticated account has a private cloud closet and a device-local mirror.
Check cloud backup status before switching browsers or reinstalling. Shared
household profiles are not implemented; optional export backups remain available.

## Source conventions

Edit `public/`, run the build, and deploy `dist/`. Service-worker caches are
versioned by the build's content hash. Private Sites test hosting does not
register the offline service worker, to preserve its sign-in boundary.

Never commit `.env*`, credentials, private model caches, or user clothing photos.
The independent migration checkout excludes Sites identity and Git metadata.

See [staged recognition results](docs/STAGED-RECOGNITION-RESULTS.md) for accuracy,
coverage tradeoffs and remaining phone-validation work.

Model: https://huggingface.co/ff13/fashion-clip (MIT).
Runtime: https://github.com/huggingface/transformers.js (Apache-2.0).

## Outfit photo capture (experimental)

Add clothes → Whole outfit accepts a new camera photo
or an existing image of one person. SegFormer B0 isolates visible clothing
regions into separate white-background photos. FashionCLIP checks each cutout;
uncertain types and attributes stay unknown. A complete strong mask may retain
a broad category when the classifier is uncertain, but confident disagreements
and clipped clothing require Adjust. Outfit pieces require an explicit Add to
my closet action before they become owned items. Saved pieces can open in the
existing Outfit builder for alternatives and gaps.

The original outfit frame is kept only in memory for retry. Cutouts use the
account-specific local storage and the private cloud backup when connected. Body
parts are excluded and left/right shoes form one pair. Overlapping garments
of the same segmentation class can merge; this is semantic parsing rather
than reliable instance segmentation. Physical phone validation remains open.

Parser: https://huggingface.co/Xenova/segformer_b0_clothes
Original model: https://huggingface.co/mattmdjaga/segformer_b0_clothes (MIT).
Pinned conversion revision: a2489ea8e7ec1ee912190546bad31a4906ccca76.
See [outfit capture validation](docs/OUTFIT-CAPTURE-RESULTS.md).
