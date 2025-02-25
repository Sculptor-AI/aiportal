// This is a basic worker script to serve your React SPA
// It handles client-side routing by returning index.html for any path that doesn't match a static asset

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Check if this is a request for a static asset
    if (url.pathname.startsWith('/assets/') || 
        url.pathname.startsWith('/images/') ||
        url.pathname.includes('.')) {
      // Let Cloudflare serve the static asset from your dist directory
      return env.ASSETS.fetch(request);
    }

    // For all other requests, serve index.html to handle client-side routing
    return env.ASSETS.fetch(`${url.origin}/index.html`);
  }
};