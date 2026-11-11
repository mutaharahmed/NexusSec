"use client";

import * as React from "react";
import {
  FileCode,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Network,
  Globe,
  Hash,
  Shield,
  Layers,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { extractIocs, ExtractedIOCs } from "@/lib/extractors";
import { analyzeIoc, summarizeIncident } from "@/app/actions/analyze";
import { ThreatReport } from "@/types/threat";
import { ThreatCard, ThreatCardSkeleton, ThreatCardError } from "@/components/features/ThreatCard";
import { AIInsightBox } from "@/components/features/AIInsightBox";

const SAMPLE_LOGS = [
  {
    name: "Ransomware & C2 Beaconing",
    icon: Flame,
    content: `[ALERT] CrowdStrike EDR Agent Detected Malicious PowerShell Activity
Timestamp: 2026-09-20T08:14:22.412Z
Host: SEC-CORP-WS09
Process: powershell.exe -NoP -NonI -W Hidden -Enc aW52b2tlLW1pbWlrYXR6...
Remote Socket Connection Outbound:
  Target IP: 198.51.100.42:443 (Established)
  Reverse Proxy Defanged: 185[.]220[.]101[.]5
  C2 Payload Retrieval: hxxps://c2-infrastructure-update.top/stage2/loader.bin
  Drop Hash SHA256: 8d9c1a5b82e21e25e98f061298c3e80927df58a4369e9f6920f69a9415664121
  Secondary Stager MD5: 5d41402abc4b2a76b9719d911017c592
  Local Subnet: 192.168.1.105
Status: Injected into svchost.exe memory space`,
  },
  {
    name: "Phishing Header & Delivery",
    icon: Globe,
    content: `Received: from mail-gateway.defensive.org (192.0.2.77) by mx.corp.com
Authentication-Results: spf=fail (sender IP is 203.0.113.195)
X-Originating-IP: [203.0.113.195]
X-Malicious-Redirect: hxxp://account-verification-portal[.]info/login.php
Attachment Name: invoice_urgent_sept2026.iso
Attachment SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Subject: Action Required: Overdue Vendor Payment Verification`,
  },
  {
    name: "Clean Internal Telemetry",
    icon: Shield,
    content: `[AUDIT] Internal Routine Healthcheck & Syslog Telemetry
Timestamp: 2026-09-20T08:30:00Z
Source Node: 10.0.4.12
Gateway: 192.168.1.1
Resolved DNS query: https://www.google.com
Resolved DNS query: https://login.microsoft.com
No anomalies reported by perimeter firewall.`,
  },
];

interface IOCStatus {
  ioc: { type: "ip" | "url" | "hash"; value: string };
  status: "pending" | "resolved" | "error";
  report?: ThreatReport;
  error?: string;
}

interface OmniTriageProps {
  initialLog?: string;
}

export function OmniTriage({ initialLog = "" }: OmniTriageProps) {
  const [logInput, setLogInput] = React.useState(initialLog);
  const [extracted, setExtracted] = React.useState<ExtractedIOCs>({
    ips: [],
    urls: [],
    hashes: [],
    all: [],
  });
  const [hasSearched, setHasSearched] = React.useState(false);

  // Per-IOC resolution states for parallel independent replacement
  const [iocStates, setIocStates] = React.useState<IOCStatus[]>([]);

  // AI Summary states
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = React.useState<string[]>([]);

  // Update live extraction preview whenever text changes
  React.useEffect(() => {
    if (!logInput.trim()) {
      setExtracted({ ips: [], urls: [], hashes: [], all: [] });
      return;
    }
    const result = extractIocs(logInput);
    setExtracted(result);
  }, [logInput]);

  // Handle setting sample log
  const handleLoadSample = (content: string) => {
    setLogInput(content);
    setHasSearched(false);
    setIocStates([]);
    setAiSummary(null);
    setAiRecommendations([]);
  };

  // Run the incident triage
  const handleTriage = async () => {
    setHasSearched(true);
    const iocList = extracted.all;

    if (iocList.length === 0) {
      setIocStates([]);
      setAiSummary(null);
      setAiRecommendations([]);
      return;
    }

    // Initialize all IOCs as pending (skeletons)
    const initialStatuses: IOCStatus[] = iocList.map((item) => ({
      ioc: { type: item.type, value: item.value },
      status: "pending",
    }));
    setIocStates(initialStatuses);
    setAiSummary(null);
    setAiRecommendations([]);
    setIsSummarizing(true);

    // Call analyzeIoc for each unique IOC IN PARALLEL
    // Results replace skeletons independently as each resolves
    const resolvedReports: ThreatReport[] = [];

    const promises = iocList.map(async (item, index) => {
      try {
        const report = await analyzeIoc({ type: item.type, value: item.value });
        resolvedReports.push(report);

        // Update this specific IOC state immediately
        setIocStates((prev) => {
          const updated = [...prev];
          const foundIdx = updated.findIndex((s) => s.ioc.value === item.value);
          if (foundIdx !== -1) {
            updated[foundIdx] = {
              ioc: { type: item.type, value: item.value },
              status: "resolved",
              report,
            };
          }
          return updated;
        });
      } catch (err: any) {
        setIocStates((prev) => {
          const updated = [...prev];
          const foundIdx = updated.findIndex((s) => s.ioc.value === item.value);
          if (foundIdx !== -1) {
            updated[foundIdx] = {
              ioc: { type: item.type, value: item.value },
              status: "error",
              error: err?.message || "Analysis failed",
            };
          }
          return updated;
        });
      }
    });

    // Wait for all individual calls to settle, then run incident summarization once
    await Promise.allSettled(promises);

    if (resolvedReports.length > 0) {
      try {
        const summaryResult = await summarizeIncident(resolvedReports);
        setAiSummary(summaryResult.summary);
        setAiRecommendations(summaryResult.recommendations);
      } catch (err) {
        setAiSummary("AI summarization failed due to an upstream engine timeout.");
        setAiRecommendations([]);
      } finally {
        setIsSummarizing(false);
      }
    } else {
      setIsSummarizing(false);
    }
  };

  // Retry an individual failed IOC
  const handleRetryIoc = async (ioc: { type: "ip" | "url" | "hash"; value: string }) => {
    // Set to pending
    setIocStates((prev) =>
      prev.map((s) =>
        s.ioc.value === ioc.value ? { ...s, status: "pending", error: undefined } : s
      )
    );

    try {
      const report = await analyzeIoc(ioc);
      setIocStates((prev) =>
        prev.map((s) =>
          s.ioc.value === ioc.value ? { ...s, status: "resolved", report } : s
        )
      );
    } catch (err: any) {
      setIocStates((prev) =>
        prev.map((s) =>
          s.ioc.value === ioc.value
            ? { ...s, status: "error", error: err?.message || "Analysis failed" }
            : s
        )
      );
    }
  };

  const hasIOCs = extracted.all.length > 0;
  const isPendingAny = iocStates.some((s) => s.status === "pending");

  return (
    <div className="space-y-8">
      {/* Omni-Triage Bar Card */}
      <Card className="border-border/80 bg-card/80 shadow-xl backdrop-blur-sm overflow-hidden">
        {/* Editor Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
              Omni-Triage Ingestion Console
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
              {"// Auto-IOC Extraction & Defang Normalization"}
            </span>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">
              Load Preset:
            </span>
            <div className="flex gap-1.5 overflow-x-auto">
              {SAMPLE_LOGS.map((sample) => {
                const Icon = sample.icon;
                return (
                  <button
                    key={sample.name}
                    onClick={() => handleLoadSample(sample.content)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-background hover:bg-muted border border-border/60 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all shrink-0"
                    title={sample.name}
                  >
                    <Icon className="h-3 w-3 text-cyan-400" />
                    <span>{sample.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Textarea code-editor style */}
          <div className="relative rounded-lg overflow-hidden border border-input focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all bg-zinc-950/90 dark:bg-black/80">
            <Textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste a raw log, email header, hash, or URL..."
              rows={8}
              className="border-0 bg-transparent text-emerald-400/90 placeholder:text-muted-foreground/60 font-mono text-xs sm:text-sm focus-visible:ring-0 focus-visible:outline-none resize-y min-h-[160px] p-4 leading-relaxed tracking-wide selection:bg-emerald-500/30 selection:text-emerald-200"
            />

            {/* In-editor bottom status line */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/80 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      hasIOCs ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                    }`}
                  />
                  {hasIOCs
                    ? `${extracted.all.length} Unique Indicators Extracted`
                    : "Awaiting Log Input"}
                </span>
              </div>
              {logInput && (
                <button
                  onClick={() => {
                    setLogInput("");
                    setIocStates([]);
                    setAiSummary(null);
                    setHasSearched(false);
                  }}
                  className="hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear Console
                </button>
              )}
            </div>
          </div>

          {/* Extracted IOC Badges grouped by category */}
          {hasIOCs && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-2.5 transition-all">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Detected Indicators of Compromise (Deduplicated):
                </span>
                <span className="text-[11px]">
                  {extracted.ips.length} IPs · {extracted.urls.length} URLs · {extracted.hashes.length} Hashes
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {extracted.ips.map((ip) => (
                  <Badge
                    key={ip}
                    variant="outline"
                    className="font-mono text-xs gap-1 bg-cyan-950/20 text-cyan-300 border-cyan-800/40"
                  >
                    <Network className="h-3 w-3" />
                    IP: {ip}
                  </Badge>
                ))}

                {extracted.urls.map((url) => (
                  <Badge
                    key={url}
                    variant="outline"
                    className="font-mono text-xs gap-1 bg-indigo-950/20 text-indigo-300 border-indigo-800/40 truncate max-w-xs"
                    title={url}
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    URL: {url.replace(/^https?:\/\//, "")}
                  </Badge>
                ))}

                {extracted.hashes.map((hash) => (
                  <Badge
                    key={hash}
                    variant="outline"
                    className="font-mono text-xs gap-1 bg-amber-950/20 text-amber-300 border-amber-800/40"
                  >
                    <Hash className="h-3 w-3 shrink-0" />
                    HASH: {hash.slice(0, 10)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Row & Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              {hasIOCs
                ? "Click below to execute parallel threat sandbox feeds & confidence scoring."
                : "Enter raw logs, email headers, or IOC values above to activate triage."}
            </p>

            <Button
              onClick={handleTriage}
              disabled={!logInput.trim() || isPendingAny}
              variant="cyber"
              size="lg"
              className="w-full sm:w-auto h-11 px-8 gap-2 font-bold tracking-wide"
            >
              <Play className="h-4 w-4 fill-current" />
              {isPendingAny ? "Triaging Incident..." : "Triage Incident"}
            </Button>
          </div>

          {/* Empty state message per Section 3 spec */}
          {hasSearched && !hasIOCs && (
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-3 text-sm font-mono animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
              <span>No indicators detected in the pasted text.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5: AI Incident Summary at top of results */}
      {(isSummarizing || aiSummary) && (
        <section aria-label="AI Incident Summary" className="space-y-4 animate-in fade-in duration-300">
          <AIInsightBox
            isLoading={isSummarizing}
            summary={aiSummary}
            recommendations={aiRecommendations}
            iocCount={iocStates.length}
          />
        </section>
      )}

      {/* SECTION 4: Threat Dashboard & Cards */}
      {iocStates.length > 0 && (
        <section aria-label="Extracted Indicators Dashboard" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold tracking-tight">
                Threat Indicator Breakdown
              </h2>
              <Badge variant="outline" className="font-mono text-xs">
                {iocStates.filter((s) => s.status === "resolved").length} / {iocStates.length} Resolved
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground font-mono">
              Parallel Real-Time Analysis
            </div>
          </div>

          {/* Grid of Threat Cards / Skeletons / Errors */}
          <div className="grid grid-cols-1 gap-4">
            {iocStates.map((state) => {
              if (state.status === "pending") {
                return (
                  <ThreatCardSkeleton key={state.ioc.value} ioc={state.ioc} />
                );
              }
              if (state.status === "error") {
                return (
                  <ThreatCardError
                    key={state.ioc.value}
                    ioc={state.ioc}
                    onRetry={() => handleRetryIoc(state.ioc)}
                  />
                );
              }
              if (state.status === "resolved" && state.report) {
                return (
                  <ThreatCard key={state.report.id} report={state.report} />
                );
              }
              return null;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
