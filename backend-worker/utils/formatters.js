export function formatError(message, error = null) {
  const formattedError = {
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    formattedError.details = error.message || error.toString();
    if (error.stack && process.env.NODE_ENV !== 'production') {
      formattedError.stack = error.stack;
    }
  }
  
  return formattedError;
}

export function formatResponsePacket(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}
