import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

// Simple worker to serve the React SPA with proper error handling
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    try {
      // Attempt to serve the asset from KV
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      // If the asset is not found, serve index.html for client-side routing
      if (e.status === 404) {
        try {
          const indexRequest = new Request(`${url.origin}/index.html`, request);
          return await getAssetFromKV(
            {
              request: indexRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            }
          );
        } catch (e) {
          return new Response('Page not found', { status: 404 });
        }
      }
      
      // For any other error, return a 500
      return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
  }
};