/**
 * Returns a same-origin path that is safe to redirect to after authentication.
 * Browsers treat "\" like "/", so "/\evil.example" would otherwise become a
 * protocol-relative URL that leaves the site.
 */
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
