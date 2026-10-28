/**
 * Audit policy for the public, non-indexed React homepage review.
 * This classifies browser requests. It does not alter live request handling.
 * Keep the policy deliberately stricter than a known-tracker denylist:
 * a newly introduced third-party host must not silently escape the audit.
 *
 * @param {string} requestUrl
 * @param {string} applicationUrl
 * @returns {boolean} true when the request must fail the privacy audit
 */
export function isUnexpectedReviewRequest(requestUrl, applicationUrl) {
  try {
    const request = new URL(requestUrl);
    const application = new URL(applicationUrl);
    if (!["http:", "https:"].includes(request.protocol)) return false;
    if (request.origin !== application.origin) return true;
    return /^\/(?:_vercel\/(?:insights|speed-insights)(?:\/|$)|cdn-cgi\/rum(?:\/|$))/i.test(
      request.pathname,
    );
  } catch {
    // A malformed request URL is inconclusive, not a privacy PASS.
    return true;
  }
}
