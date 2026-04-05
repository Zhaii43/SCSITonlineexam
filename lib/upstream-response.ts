export function extractUpstreamMessage(text: string, fallback: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return fallback;
  }

  if (/<(?:!doctype|html|head|body)\b/i.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
