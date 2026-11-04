export function isPinnedModelAsset(url) {
  const {hostname, pathname} = new URL(url);
  return (hostname === 'cdn.jsdelivr.net' &&
    pathname.startsWith('/npm/@huggingface/transformers@3.8.1/dist/')) ||
    (hostname === 'huggingface.co' &&
    pathname.startsWith('/Xenova/segformer_b0_clothes/resolve/a2489ea8e7ec1ee912190546bad31a4906ccca76/'));
}

export async function routePinnedModelAsset(route, downloads) {
  if (!process.env.MULTI16_RELAY_MODEL) return route.continue();
  const url = route.request().url();
  if (!downloads.has(url)) {
    downloads.set(url, fetch(url, {signal: AbortSignal.timeout(90_000)}).then(async response => {
      if (!response.ok) throw Error('Pinned model asset HTTP ' + response.status);
      return {
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'application/octet-stream',
        body: Buffer.from(await response.arrayBuffer()),
      };
    }));
  }
  try {
    const asset = await downloads.get(url);
    return await route.fulfill({...asset, headers: {
      'access-control-allow-origin': '*', 'content-type': asset.contentType,
    }});
  } catch {
    downloads.delete(url);
    return route.abort();
  }
}
