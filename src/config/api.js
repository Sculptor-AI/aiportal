const API_URL = import.meta.env.VITE_BACKEND_API_URL ?
  (import.meta.env.VITE_BACKEND_API_URL.endsWith('/api') ?
    import.meta.env.VITE_BACKEND_API_URL :
    `${import.meta.env.VITE_BACKEND_API_URL}/api`) :
  '';

export { API_URL };
