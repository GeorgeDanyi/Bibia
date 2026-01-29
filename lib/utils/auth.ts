export function sanitizeRedirectUrl(url: string | null): string {
  if (!url || typeof url !== "string") return "/dashboard";

  const trimmed = url.trim();

  // Must start with a single "/" and NOT with "//"
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }

  const lower = trimmed.toLowerCase();

  // Disallow obvious dangerous schemes or absolute URLs
  const forbiddenPrefixes = ["http://", "https://", "javascript:"];
  if (forbiddenPrefixes.some((p) => lower.startsWith(p))) {
    return "/dashboard";
  }

  // Basic sanity: limit length
  if (trimmed.length > 2048) {
    return "/dashboard";
  }

  return trimmed;
}


