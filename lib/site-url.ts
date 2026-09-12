const PRODUCTION_SITE_URL = "https://nobgfc-points.vercel.app";

export function getConfiguredSiteUrl(
  configuredUrl = process.env.NEXT_PUBLIC_SITE_URL,
) {
  const candidate = configuredUrl?.trim() || PRODUCTION_SITE_URL;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return PRODUCTION_SITE_URL;
    }

    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}
