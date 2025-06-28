export function handleCORS(request) {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  return new Response(null, { status: 204, headers });
}

export function wrapResponse(response, request) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', getAllowedOrigin(request));
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://ai.kaileh.dev',
    'http://localhost:3009',
    'http://localhost:3010'
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  return allowedOrigins[0];
}
