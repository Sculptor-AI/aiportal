// Simple worker to serve the React SPA with proper error handling
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Try to fetch the requested path
      try {
        // First try to get the exact path
        const response = await env.ASSETS.fetch(request);
        if (response.status === 200) {
          return response;
        }
      } catch (e) {
        // If exact path fails, continue to fallback
      }
      
      // For any path that doesn't exist, return index.html for client-side routing
      // This handles React Router paths
      const indexRequest = new Request(`${url.origin}/index.html`);
      return await env.ASSETS.fetch(indexRequest);
      
    } catch (error) {
      // If something goes wrong, return a proper error response
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};