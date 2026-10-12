# Closet Current

A phone-friendly wardrobe app for capturing clothing, reviewing categories,
recreating inspiration looks, and finding useful shopping gaps. This project
is independent of Drive Duel.

## Features

- Continuous camera capture, video imports, and multiple clothing-photo imports.
- Separate clothing cards with category, type, sleeves, color, pattern, fit,
  seasons, brand, size, material, occasion, and notes.
- Optional experimental on-device FashionCLIP recognition. Its first load
  downloads about 154 MB of model weights plus runtime files. No billed AI API.
- Inspiration reference images and links, editable outfit components, closet
  matches, substitutes, and shopping search links.
- IndexedDB storage and export/import of clothing and inspiration backups.
- Home-screen installation and an offline application shell on independent
  hosting. Recognition still needs its model/runtime files available; external
  inspiration links and shopping searches require a connection.

The app does not automatically import articles, verify live prices, sync closets
between devices, or identify every clothing attribute reliably.

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

Keep existing test hosting until data has been transferred successfully. Export
the closet backup from the old app link, then import it at the new link. Browser
storage belongs to each origin and does not migrate with the source code.

## First family pilot

Test importing two photos, saving different clothing details, a short video
scan, local recognition, outfit matching, backup recovery, and installation.
Each visitor has their own device-local closet; there is no shared closet or
server account. Export backups regularly, especially before switching browsers
or reinstalling.

## Source conventions

Edit `public/`, run the build, and deploy `dist/`. Service-worker caches are
versioned by the build's content hash. Private Sites test hosting does not
register the offline service worker, to preserve its sign-in boundary.

Never commit `.env*`, credentials, private model caches, or user clothing photos.
The independent migration checkout excludes Sites identity and Git metadata.

Model: https://huggingface.co/ff13/fashion-clip (MIT).
Runtime: https://github.com/huggingface/transformers.js (Apache-2.0).
