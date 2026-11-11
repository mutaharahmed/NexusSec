"use server";

import { ThreatReport, ThreatSeverity, VendorDetection } from "@/types/threat";

function getSeverityFromScore(score: number): ThreatSeverity {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const COMMON_TAGS_POOL = [
  "Ransomware",
  "Cobalt Strike",
  "Emotet C2",
  "Credential Stealer",
  "Phishing Kit",
  "Tor Exit Node",
  "Crypto Miner",
  "Data Exfiltration",
  "DNS Tunneling",
  "Brute Force",
  "Lateral Movement",
  "Zero-Day Exploit",
];

const REPUTABLE_VENDORS = [
  "CrowdStrike Falcon",
  "Microsoft Defender",
  "Kaspersky",
  "Palo Alto Networks",
  "SentinelOne",
  "Sophos",
  "Fortinet",
  "Symantec",
  "TrendMicro",
  "Mandiant",
  "Google Safe Browsing",
  "Cisco Talos",
];

// Helper to generate deterministic-like realistic mock data for an IOC
function generateMockReport(type: "ip" | "url" | "hash", value: string): ThreatReport {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Derive score (biased towards high/critical for malicious-sounding strings or typical IOCs)
  let score: number;
  const lowerVal = value.toLowerCase();

  if (
    lowerVal.includes("malware") ||
    lowerVal.includes("c2") ||
    lowerVal.includes("emotet") ||
    lowerVal.includes("beacon") ||
    lowerVal.includes("evil") ||
    lowerVal.includes("payload")
  ) {
    score = 92 + (positiveHash % 8); // 92-99
  } else if (
    lowerVal.startsWith("192.168.") ||
    lowerVal.startsWith("10.") ||
    lowerVal.startsWith("127.0.") ||
    lowerVal.includes("google.com") ||
    lowerVal.includes("microsoft.com")
  ) {
    score = 5 + (positiveHash % 25); // 5-29 (Low severity)
  } else {
    // Semi-random distributed across realistic threat tiers
    const tiers = [18, 48, 76, 94];
    const baseTier = tiers[positiveHash % tiers.length];
    score = Math.min(100, Math.max(5, baseTier + (positiveHash % 15) - 7));
  }

  const severity = getSeverityFromScore(score);
  const totalVendors = 72;
  const maliciousVendors =
    severity === "critical"
      ? Math.floor(52 + (score - 90) * 2)
      : severity === "high"
      ? Math.floor(28 + (score - 70) * 1.1)
      : severity === "medium"
      ? Math.floor(7 + (score - 40) * 0.6)
      : Math.floor(score / 15);

  // Pick tags
  const tagsCount = severity === "critical" ? 3 : severity === "high" ? 2 : 1;
  const selectedTags: string[] = [];
  for (let i = 0; i < tagsCount; i++) {
    const tag = COMMON_TAGS_POOL[(positiveHash + i * 3) % COMMON_TAGS_POOL.length];
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }

  // Vendor verdicts
  const vendorList: VendorDetection[] = REPUTABLE_VENDORS.map((v, idx) => {
    const isMalicious = idx < Math.min(maliciousVendors, REPUTABLE_VENDORS.length);
    return {
      vendor: v,
      verdict: isMalicious ? "malicious" : "clean",
      result: isMalicious ? selectedTags[0] || "Trojan.GenericKD" : "Clean",
    };
  });

  const mitreTactics =
    severity === "critical"
      ? ["TA0011: Command and Control", "TA0005: Defense Evasion", "TA0002: Execution"]
      : severity === "high"
      ? ["TA0001: Initial Access", "TA0006: Credential Access"]
      : severity === "medium"
      ? ["TA0007: Discovery"]
      : ["Informational"];

  return {
    id: `threat-${positiveHash}-${Date.now()}`,
    type,
    value,
    confidenceScore: score,
    severity,
    avDetections: {
      total: totalVendors,
      malicious: maliciousVendors,
    },
    tags: selectedTags,
    intel: {
      firstSeen: new Date(Date.now() - (positiveHash % 30) * 86400000).toISOString().split("T")[0],
      lastResolved: new Date().toISOString().split("T")[0],
      asn: type === "ip" ? `AS${15000 + (positiveHash % 30000)} (Nexus Cloud Transit)` : undefined,
      country: type === "ip" ? ["US", "RU", "DE", "NL", "CN", "SG"][positiveHash % 6] : undefined,
      threatActor: severity === "critical" ? "APT29 / Cozy Bear Affiliate" : undefined,
      malwareFamily: selectedTags[0] || "Generic.Heuristic",
      mitreTactics,
      vendorList,
    },
  };
}

/**
 * Section 4: Analyze an individual IOC with simulated realistic latency.
 */
export async function analyzeIoc(ioc: {
  type: "ip" | "url" | "hash";
  value: string;
}): Promise<ThreatReport> {
  // Simulate 1.5 - 2s delay as requested in Section 4
  const delay = 1500 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate occasional realistic error if requested or rare edge case (1% chance handled gracefully)
  if (ioc.value === "trigger_error_ioc") {
    throw new Error("Threat intelligence API timeout. Upstream gateway unreachable.");
  }

  return generateMockReport(ioc.type, ioc.value);
}

/**
 * Section 5: AI Incident Summarization
 * Synthesizes all resolved IOC reports into one unified executive briefing.
 */
export async function summarizeIncident(
  reports: ThreatReport[]
): Promise<{ summary: string; recommendations: string[] }> {
  // Simulate 1.5s delay as specified in Section 5
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!reports || reports.length === 0) {
    return {
      summary: "No indicators were submitted for executive synthesis.",
      recommendations: ["Review log sources for valid indicator artifacts."],
    };
  }

  const criticalCount = reports.filter((r) => r.severity === "critical").length;
  const highCount = reports.filter((r) => r.severity === "high").length;
  const mediumCount = reports.filter((r) => r.severity === "medium").length;
  const lowCount = reports.filter((r) => r.severity === "low").length;

  const topThreat = [...reports].sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
  const allTags = Array.from(new Set(reports.flatMap((r) => r.tags)));

  let summaryText = "";
  const recommendations: string[] = [];

  if (criticalCount > 0 || highCount > 0) {
    summaryText = `This triage batch indicates an active security incident involving ${reports.length} extracted indicators. Primary threat vector is associated with ${
      allTags.slice(0, 2).join(" & ") || "Advanced Persistent Threat activity"
    }. Highest-severity finding (${topThreat.type.toUpperCase()}: ${topThreat.value}) received an elevated confidence score of ${topThreat.confidenceScore}/100 with ${
      topThreat.avDetections.malicious
    }/${topThreat.avDetections.total} security vendors confirming malicious beaconing behavior.`;

    recommendations.push(
      `Immediately quarantine endpoint traffic to ${reports.find((r) => r.type === "ip")?.value || "suspicious C2 infrastructure"}.`,
      `Add hashes [${reports.filter((r) => r.type === "hash").map((r) => r.value.slice(0, 10) + "...").join(", ") || "extracted binaries"}] to EDR global blocklist.`,
      `Revoke compromised authentication tokens and reset credentials for affected users.`,
      `Query SIEM historical proxy logs for past 30 days matching detected domain queries.`
    );
  } else if (mediumCount > 0) {
    summaryText = `The analysis resolved ${reports.length} indicators with moderate risk characteristics (${mediumCount} medium severity). The observed artifacts exhibit heuristic traits of grayware, ad-injection infrastructure, or dual-use administrative tooling without confirmed weaponization.`;
    recommendations.push(
      `Monitor egress connections to highlighted hosts for volume anomalies.`,
      `Cross-reference endpoint process creation logs around the timestamp of the event.`,
      `Enforce DNS-layer filtering for flagged external domains.`
    );
  } else {
    summaryText = `All ${reports.length} submitted indicators were assessed as low-risk or benign (${lowCount} low severity findings). No active malware signatures, C2 infrastructure, or known malicious hashes were identified by global threat feeds.`;
    recommendations.push(
      `No immediate containment action required.`,
      `Archive incident log under routine telemetry auditing.`
    );
  }

  return {
    summary: summaryText,
    recommendations,
  };
}
