"use client";

import * as React from "react";
import {
  UploadCloud,
  FileText,
  FileArchive,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  RotateCw,
  FolderArchive,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Binary,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreatReport, ArchiveScanGroup, ScanStatus } from "@/types/threat";
import { ThreatCard } from "@/components/features/ThreatCard";

const MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024; // 32MB
const ALLOWED_EXTS = [".pdf", ".zip", ".doc", ".docx", ".exe", ".js", ".txt"];

interface FileUploadZoneProps {
  onScanComplete?: (reports: ThreatReport[]) => void;
}

export function FileUploadZone({ onScanComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ScanStatus | "Idle">("Idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [activeFileName, setActiveFileName] = React.useState<string | null>(null);
  const [activeFileSize, setActiveFileSize] = React.useState<number | null>(null);

  // Scanning results
  const [scanReports, setScanReports] = React.useState<ThreatReport[]>([]);
  const [archiveGroup, setArchiveGroup] = React.useState<ArchiveScanGroup | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Reset file input value so selecting the same file consecutively triggers onChange
    e.target.value = "";
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(
        1
      )}MB) exceeds the maximum 32MB limit.`;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return `File extension '${ext}' is not supported. Allowed formats: ${ALLOWED_EXTS.join(
        ", "
      )}`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);
    setCurrentStatus("Uploading");
    setActiveFileName(file.name);
    setActiveFileSize(file.size);
    setScanReports([]);
    setArchiveGroup(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setCurrentStatus("Scanning");

      const response = await fetch("/api/scan-file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Malware scan request failed.");
      }

      setCurrentStatus("Complete");

      if (data.isArchive && data.archiveGroup) {
        setArchiveGroup(data.archiveGroup);
        setScanReports(data.archiveGroup.reports || []);
        onScanComplete?.(data.archiveGroup.reports || []);
      } else {
        setScanReports(data.reports || []);
        onScanComplete?.(data.reports || []);
      }
    } catch (err: any) {
      setCurrentStatus("Failed");
      setErrorMessage(err?.message || "Failed to scan file.");
    } finally {
      setIsScanning(false);
    }
  };

  // Generate test sample files for immediate evaluation
  const handleLoadSample = (sampleType: "eicar" | "clean_pdf" | "multi_zip") => {
    setErrorMessage(null);
    let sampleFile: File;

    if (sampleType === "eicar") {
      const eicarString =
        'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      const blob = new Blob([eicarString], { type: "text/plain" });
      sampleFile = new File([blob], "eicar_antivirus_test.txt", {
        type: "text/plain",
      });
    } else if (sampleType === "clean_pdf") {
      const pdfContent = "%PDF-1.4 ... Corporate Security Standard Operating Procedure ...";
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      sampleFile = new File([blob], "quarterly_secops_audit.pdf", {
        type: "application/pdf",
      });
    } else {
      // Create a valid multi-file ZIP test archive (contains audit_manifest.txt and suspicious_script.js)
      const validZipBase64 =
        "UEsDBBQAAAgIAAlAPl12o2GoKAAAACYAAAASAAAAYXVkaXRfbWFuaWZlc3QudHh0c84vKsgvSixJVShOTS4tyiypVEgsTcksUShJzUnNTS0pqlTIyU8HAFBLAwQUAAAICAAJQD5dAGLNHTEAAAAvAAAAFAAAAHN1c3BpY2lvdXNfc2NyaXB0LmpzSy1LzNEILinKzEvXSyvKz3XOSCxyzk9J1bA01zE0sNAxNDDUMTQ00TE0NNPU1LQGAFBLAQIUChQAAAgIAAlAPl12o2GoKAAAACYAAAASAAAAAAAAAAAAAACkgQAAAABhdWRpdF9tYW5pZmVzdC50eHRQSwECFAoUAAAICAAJQD5dAGLNHTEAAAAvAAAAFAAAAAAAAAAAAAAApIFYAAAAc3VzcGljaW91c19zY3JpcHQuanNQSwUGAAAAAAIAAgCCAAAAuwAAAAAA";
      const binaryString = atob(validZipBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      sampleFile = new File([blob], "incident_evidence_bundle.zip", {
        type: "application/zip",
      });
    }

    processFile(sampleFile);
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone Card */}
      <Card className="border-border/80 bg-card/80 shadow-xl backdrop-blur-sm overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border/60">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
              VirusTotal File & Archive Scanner
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
              {"// Public API v3 · Safe Multi-File Decompression"}
            </span>
          </div>

          {/* Quick preset test buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">
              Test Sample:
            </span>
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                disabled={isScanning}
                onClick={() => handleLoadSample("eicar")}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-background hover:bg-muted border border-border/60 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all shrink-0 disabled:opacity-50"
              >
                <ShieldAlert className="h-3 w-3 text-threat-critical" />
                <span>EICAR Test</span>
              </button>
              <button
                disabled={isScanning}
                onClick={() => handleLoadSample("clean_pdf")}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-background hover:bg-muted border border-border/60 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all shrink-0 disabled:opacity-50"
              >
                <FileText className="h-3 w-3 text-emerald-400" />
                <span>Clean PDF</span>
              </button>
              <button
                disabled={isScanning}
                onClick={() => handleLoadSample("multi_zip")}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-background hover:bg-muted border border-border/60 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all shrink-0 disabled:opacity-50"
              >
                <FileArchive className="h-3 w-3 text-amber-400" />
                <span>Sample ZIP</span>
              </button>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragging
                ? "border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 scale-[0.99]"
                : "border-border/80 hover:border-cyan-500/50 bg-zinc-950/40 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              onClick={(e) => e.stopPropagation()}
              accept=".pdf,.zip,.doc,.docx,.exe,.js,.txt"
              className="hidden"
            />

            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3 animate-pulse-subtle pointer-events-none">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-base font-semibold text-foreground mb-1 pointer-events-none">
              Drag & drop any suspicious file or archive here
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-md mb-3 pointer-events-none">
              Supports <span className="font-mono text-foreground/80">.pdf, .zip, .doc/.docx, .exe, .js, .txt</span> up to 32MB.
              ZIP archives are decompressed safely with zip-slip & zip-bomb protection.
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground/80 pointer-events-none">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Hash-Lookup First
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                4-Req/Min Queue Safe
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Per-File Inspection
              </span>
            </div>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2.5 text-xs font-mono animate-in fade-in duration-200">
              <AlertOctagon className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Active File Scanning Progress Card */}
          {isScanning && activeFileName && (
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                    <RotateCw className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold truncate text-foreground">
                      {activeFileName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {activeFileSize ? `${(activeFileSize / 1024).toFixed(1)} KB` : "Analyzing"}
                    </div>
                  </div>
                </div>

                {/* State badge: Queued → Uploading → Scanning → Complete */}
                <Badge
                  variant="outline"
                  className="font-mono text-xs uppercase px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                >
                  {currentStatus}
                </Badge>
              </div>

              <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  {currentStatus === "Uploading"
                    ? "Streaming file payload to secure scanning staging..."
                    : currentStatus === "Scanning"
                    ? "Querying VirusTotal v3 multi-engine intelligence & sandbox..."
                    : "Enqueuing across rate-limited dispatch queue..."}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Grouping Header (when ZIP was scanned) */}
      {archiveGroup && (
        <Card className="border-indigo-500/40 bg-gradient-to-r from-indigo-950/20 via-card to-card shadow-md animate-in fade-in duration-300">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FolderArchive className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {archiveGroup.archiveName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
                      Zip-Slip Verified Safe
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Extracted {archiveGroup.extractedCount} files (Total Archive Size:{" "}
                    {(archiveGroup.archiveSize / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </div>

              <Badge variant="secondary" className="font-mono text-xs w-fit">
                {archiveGroup.reports.length} Individual Reports
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Results Section: ThreatCards for each file / archive entry */}
      {scanReports.length > 0 && (
        <section aria-label="Malware Scan Reports" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold tracking-tight">
                File Malware Analysis Results
              </h2>
              <Badge variant="outline" className="font-mono text-xs">
                {scanReports.length} File{scanReports.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              VirusTotal API v3 Multi-Engine Verdicts
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {scanReports.map((report) => (
              <ThreatCard key={report.id} report={report} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
