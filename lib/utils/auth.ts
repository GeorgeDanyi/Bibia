export function sanitizeRedirectUrl(url: string | null): string {
  if (!url || typeof url !== "string") return "/dashboard";

  const trimmed = url.trim();

  // Must start with a single "/" and NOT with "//"
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }

  const lower = trimmed.toLowerCase();

  // Disallow obvious dangerous schemes or absolute URLs
  // Check for "http" anywhere (not just at start) to catch things like "/redirect?url=http://..."
  if (lower.includes("http")) {
    return "/dashboard";
  }

  const forbiddenPrefixes = ["javascript:", "data:", "mailto:", "tel:"];
  if (forbiddenPrefixes.some((p) => lower.startsWith(p))) {
    return "/dashboard";
  }

  // Basic sanity: limit length
  if (trimmed.length > 2048) {
    return "/dashboard";
  }

  return trimmed;
}

/**
 * Get default redirect URL based on user role
 */
export function getDefaultRedirectUrl(role: string | undefined | null): string {
  if (role === 'therapist') {
    // Check if therapist dashboard exists, otherwise redirect to pro-terapeuty
    return '/pro-terapeuty'
  }
  if (role === 'admin') {
    return '/admin/consultations'
  }
  // Default for patient or unknown role
  return '/dashboard'
}


