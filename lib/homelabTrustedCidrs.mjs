// Vercel IPv4 allowlist. Missing or malformed input fails closed.
function ipv4Number(value) {
  if (
    typeof value !== "string" ||
    !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value)
  ) {
    return null;
  }
  const octets = value.split(".");
  if (
    octets.some(
      (octet) => (octet.length > 1 && octet[0] === "0") || Number(octet) > 255,
    )
  ) {
    return null;
  }
  return octets.reduce(
    (address, octet) => (address * 256 + Number(octet)) >>> 0,
    0,
  );
}

export function isTrustedHomelabIpv4(clientIp, rawCidrs) {
  const ip = ipv4Number(clientIp);
  if (ip === null || typeof rawCidrs !== "string" || !rawCidrs.trim()) {
    return false;
  }
  const tokens = rawCidrs.split(",").map((item) => item.trim());
  if (tokens.some((item) => !item)) return false;
  let matched = false;
  for (const token of tokens) {
    const parts = token.split("/");
    if (parts.length !== 2 || !/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(parts[1])) {
      return false;
    }
    const network = ipv4Number(parts[0]);
    if (network === null) return false;
    const prefix = Number(parts[1]);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    if ((ip & mask) === (network & mask)) matched = true;
  }
  return matched;
}
