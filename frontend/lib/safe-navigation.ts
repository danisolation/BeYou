export function safeInternalHref(href: string | null | undefined): string | null {
  const trimmedHref = href?.trim();
  if (!trimmedHref || !trimmedHref.startsWith("/") || trimmedHref.startsWith("//")) {
    return null;
  }
  return trimmedHref;
}
