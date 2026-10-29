/**
 * Audit policy for the public, non-indexed React homepage review.
 * This classifies browser requests. It does not alter live request handling.
 * Keep the policy deliberately stricter than a known-tracker denylist:
 * a newly introduced third-party host must not silently escape the audit.
 *
 * @param {string} requestUrl
 * @param {string} applicationUrl
 * @param {string} [method]
 * @returns {boolean} true when the request must fail the privacy audit
 */
export function isUnexpectedReviewRequest(requestUrl, applicationUrl, method = "GET") {
  try {
    const request = new URL(requestUrl);
    const application = new URL(applicationUrl);
    // WebSocket handshakes are observed separately from HTTP requests by
    // Playwright. A read-only homepage does not require either WS protocol.
    if (request.protocol === "ws:" || request.protocol === "wss:") return true;
    // Local inline assets do not initiate an outbound network connection.
    if (request.protocol === "data:" || request.protocol === "blob:") return false;
    if (!["http:", "https:"].includes(request.protocol)) return true;
    // The read-only homepage has no form or server action: any POST/beacon
    // is suspicious, even when sent to an unknown first-party endpoint.
    if (!["GET", "HEAD"].includes(String(method).toUpperCase())) return true;
    if (request.origin !== application.origin) return true;
    return /^\/(?:_vercel\/(?:insights|speed-insights)(?:\/|$)|cdn-cgi\/rum(?:\/|$))/i.test(
      request.pathname,
    );
  } catch {
    // A malformed request URL is inconclusive, not a privacy PASS.
    return true;
  }
}
