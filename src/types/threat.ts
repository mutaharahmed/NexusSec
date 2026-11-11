export type ThreatSeverity = "critical" | "high" | "medium" | "low";

export type IOCType = "ip" | "url" | "hash" | "file";

export type ScanStatus =
  | "Queued"
  | "Uploading"
  | "Scanning"
  | "Complete"
  | "Failed"
  | "Timed out";

export interface VendorDetection {
  vendor: string;
  verdict: "malicious" | "suspicious" | "clean" | "unrated";
  result?: string;
}

export interface ThreatReport {
  id: string;
  type: IOCType;
  value: string;
  confidenceScore: number; // 0–100, HIGHER = more confident the IOC is MALICIOUS
  severity: ThreatSeverity;
  avDetections: {
    total: number;
    malicious: number;
  };
  tags: string[];
  fileName?: string;
  fileSize?: number;
  parentArchive?: string; // set when this file came from inside a ZIP
  scanStatus?: ScanStatus;
  sha256?: string;
  intel?: {
    firstSeen?: string;
    lastResolved?: string;
    asn?: string;
    country?: string;
    threatActor?: string;
    malwareFamily?: string;
    mitreTactics?: string[];
    vendorList?: VendorDetection[];
  };
}

export interface ArchiveScanGroup {
  archiveName: string;
  archiveSize: number;
  totalFiles: number;
  extractedCount: number;
  reports: ThreatReport[];
  status: "Extracting" | "Scanning" | "Complete" | "Failed";
  error?: string;
}

export interface IncidentAnalysisResult {
  summary: string;
  threatLevel: ThreatSeverity;
  affectedAssets: number;
  recommendedActions: string[];
  attribution?: string;
}
