/**
 * Release-specific and fail-closed homepage cutover policy.
 *
 * This does NOT make editorial or browser approval automatic. Operators must
 * provide all three approvals in Vercel Preview first, then explicitly
 * redeploy the reviewed commit with the same exact SHA.
 *
 * Never accept arbitrary client-provided headers, cookies or query strings.
 */
export function isHomeCutoverEnabled(env = process.env) {
  const approvedSha = env.BABABOU_HOME_CUTOVER_SHA ?? "";
  const actualSha = env.VERCEL_GIT_COMMIT_SHA ?? "";

  return (
    env.BABABOU_HOME_CUTOVER === "approved" &&
    env.BABABOU_HOME_EDITORIAL_APPROVED === "true" &&
    env.BABABOU_HOME_BROWSER_GATES_APPROVED === "true" &&
    /^[a-f0-9]{40}$/.test(approvedSha) &&
    approvedSha === actualSha
  );
}
