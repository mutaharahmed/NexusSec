export interface ExtractedIOCs {
  ips: string[];
  urls: string[];
  hashes: string[];
  all: Array<{ type: "ip" | "url" | "hash"; value: string; raw: string }>;
}

/**
 * Normalizes defanged IOC representations commonly found in SOC logs:
 * e.g. "hxxp://", "192[.]168[.]1[.]1", "evil(.)com"
 */
export function refang(value: string): string {
  return value
    .replace(/\bhxxps?:\/\//gi, (match) =>
      match.toLowerCase().startsWith("hxxps") ? "https://" : "http://"
    )
    .replace(/\[\.\]|\(\.\)|\{\.\}/g, ".")
    .replace(/\[:\]|\(:\]/g, ":");
}

/**
 * Regex for IPv4 with optional defanged brackets:
 * Matches 0.0.0.0 through 255.255.255.255 with optional [.] or (.)
 */
const IPV4_REGEX =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\[\.\]|\(\.\)|\.)){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

/**
 * Regex for URLs with http, https, hxxp, hxxps or domains with paths
 */
const URL_REGEX =
  /\b(?:(?:https?|hxxps?):\/\/[^\s"'<>]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|ru|cn|top|xyz|cc|biz|info|me|live|club)(?:[\[\].\/][^\s"'<>]*)?)\b/gi;

/**
 * Regex for SHA256 (64 hex), SHA1 (40 hex), and MD5 (32 hex)
 * Surrounded by word boundaries and not preceded/followed by hex
 */
const SHA256_REGEX = /\b[a-fA-F0-9]{64}\b/g;
const SHA1_REGEX = /\b[a-fA-F0-9]{40}\b/g;
const MD5_REGEX = /\b[a-fA-F0-9]{32}\b/g;

export function extractIocs(rawText: string): ExtractedIOCs {
  if (!rawText || !rawText.trim()) {
    return { ips: [], urls: [], hashes: [], all: [] };
  }

  const raw = rawText;

  // 1. Extract IPv4
  const foundIps = new Set<string>();
  const ipMatches = raw.match(IPV4_REGEX) || [];
  for (const match of ipMatches) {
    const normalized = refang(match.trim());
    // Filter out common false positives like version numbers or single digit octets that aren't IPs
    const octets = normalized.split(".").map(Number);
    if (octets.length === 4 && octets.every((o) => !isNaN(o) && o >= 0 && o <= 255)) {
      foundIps.add(normalized);
    }
  }

  // 2. Extract URLs
  const foundUrls = new Set<string>();
  const urlMatches = raw.match(URL_REGEX) || [];
  for (const match of urlMatches) {
    let clean = match.replace(/[.,;!?)]+$/, ""); // strip trailing punctuation
    const normalized = refang(clean);
    // Ensure it doesn't match an IP address directly as a URL unless it has a protocol
    if (!IPV4_REGEX.test(clean) || clean.includes("://")) {
      foundUrls.add(normalized);
    }
  }

  // 3. Extract Hashes (SHA256 priority, plus MD5 and SHA1)
  const foundHashes = new Set<string>();
  const sha256Matches = raw.match(SHA256_REGEX) || [];
  for (const h of sha256Matches) {
    foundHashes.add(h.toLowerCase());
  }

  const sha1Matches = raw.match(SHA1_REGEX) || [];
  for (const h of sha1Matches) {
    // Avoid capturing substrings of sha256
    const lower = h.toLowerCase();
    const isSub = Array.from(foundHashes).some((s) => s.includes(lower));
    if (!isSub) {
      foundHashes.add(lower);
    }
  }

  const md5Matches = raw.match(MD5_REGEX) || [];
  for (const h of md5Matches) {
    const lower = h.toLowerCase();
    const isSub = Array.from(foundHashes).some((s) => s.includes(lower));
    if (!isSub) {
      foundHashes.add(lower);
    }
  }

  const ips = Array.from(foundIps);
  const urls = Array.from(foundUrls);
  const hashes = Array.from(foundHashes);

  const all: Array<{ type: "ip" | "url" | "hash"; value: string; raw: string }> = [
    ...ips.map((v) => ({ type: "ip" as const, value: v, raw: v })),
    ...urls.map((v) => ({ type: "url" as const, value: v, raw: v })),
    ...hashes.map((v) => ({ type: "hash" as const, value: v, raw: v })),
  ];

  return { ips, urls, hashes, all };
}
