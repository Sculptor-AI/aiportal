export function shouldIncludeMessageInModelHistory(message) {
  if (!message || message.role === 'system') {
    return false;
  }

  if (message.isError || message.isLoading) {
    return false;
  }

  return true;
}
