"""Non-invasive DAST: limit ZAP requests before the packaged spider starts.

The ZAP Network add-on is required. Fail closed when rate limiting cannot be
enabled, rather than accidentally flooding Vercel or masking WAF challenges.
Never log URLs, cookies, request bodies, tokens or full scan evidence.
"""
from urllib.parse import urlsplit

MAX_RPS = "1"


def zap_started(zap, target):
    parsed = urlsplit(target)
    host = parsed.hostname
    if parsed.scheme != "https" or not host:
        raise RuntimeError("ZAP_THROTTLE_INVALID_TARGET")
    if host != "www.bababou.com" and not (
        host.endswith(".vercel.app") and host != "vercel.app"
    ):
        raise RuntimeError("ZAP_THROTTLE_OUT_OF_SCOPE")
    response = zap.network.add_rate_limit_rule(
        description="bababou-ci-1rps",
        enabled="true",
        matchregex="false",
        matchstring=host,
        requestspersecond=MAX_RPS,
        groupby="rule",
    )
    if str(response).strip().lower() != "ok":
        raise RuntimeError("ZAP_THROTTLE_NOT_ENABLED")
    return zap, target
