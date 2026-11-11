"use client";

import * as React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Copy,
  Check,
  ChevronDown,
  RotateCw,
  ExternalLink,
  Globe,
  Hash,
  Network,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatReport, ThreatSeverity } from "@/types/threat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ThreatCardProps {
  report: ThreatReport;
}

export function getSeverityConfig(severity: ThreatSeverity) {
  switch (severity) {
    case "critical":
      return {
        label: "CRITICAL THREAT",
        badgeVariant: "critical" as const,
        textColor: "text-threat-critical",
        bgColor: "bg-threat-critical",
        borderColor: "border-threat-critical/40",
        shadowColor: "shadow-threat-critical/10",
        icon: AlertOctagon,
        progressColor: "bg-threat-critical",
      };
    case "high":
      return {
        label: "HIGH RISK",
        badgeVariant: "high" as const,
        textColor: "text-threat-high",
        bgColor: "bg-threat-high",
        borderColor: "border-threat-high/40",
        shadowColor: "shadow-threat-high/10",
        icon: ShieldAlert,
        progressColor: "bg-threat-high",
      };
    case "medium":
      return {
        label: "SUSPICIOUS",
        badgeVariant: "medium" as const,
        textColor: "text-threat-medium",
        bgColor: "bg-threat-medium",
        borderColor: "border-threat-medium/40",
        shadowColor: "shadow-threat-medium/10",
        icon: AlertTriangle,
        progressColor: "bg-threat-medium",
      };
    case "low":
    default:
      return {
        label: "CLEAN / BENIGN",
        badgeVariant: "low" as const,
        textColor: "text-threat-low",
        bgColor: "bg-threat-low",
        borderColor: "border-threat-low/40",
        shadowColor: "shadow-threat-low/10",
        icon: ShieldCheck,
        progressColor: "bg-threat-low",
      };
  }
}

export function ThreatCard({ report }: ThreatCardProps) {
  const [copied, setCopied] = React.useState(false);
  const config = getSeverityConfig(report.severity);
  const IconComponent = config.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const TypeIcon =
    report.type === "ip" ? Network : report.type === "url" ? Globe : Hash;

  return (
    <Card
      className={`border ${config.borderColor} bg-card/90 shadow-md ${config.shadowColor} transition-all hover:border-border/80`}
    >
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* IOC Value & Type */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/50 shrink-0">
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground">
                  {report.type}
                </span>
                <Badge variant={config.badgeVariant} className="text-[10px] py-0">
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-mono text-sm sm:text-base font-semibold truncate select-all text-foreground" title={report.value}>
                  {report.value}
                </p>
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
                  title="Copy IOC"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confidence Score Display */}
          <div className="flex items-center gap-4 shrink-0 sm:border-l sm:pl-4 sm:border-border/40">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Confidence
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono leading-none ${config.textColor}`}>
                {report.confidenceScore}
                <span className="text-xs text-muted-foreground font-normal ml-0.5">/100</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-full bg-muted/40 border ${config.borderColor}`}>
              <IconComponent className={`h-6 w-6 ${config.textColor}`} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress bar reflecting score with exact severity color */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-mono">
            <span>Threat Severity Score</span>
            <span className="font-semibold text-foreground">
              {report.avDetections.malicious} of {report.avDetections.total} Security Vendors Flagged
            </span>
          </div>
          <Progress
            value={report.confidenceScore}
            className="h-2 bg-muted/60"
            indicatorClassName={config.progressColor}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Threat Tags:</span>
          {report.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-muted/40 hover:bg-muted font-mono"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Expandable Intelligence Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="intel" className="border-border/40">
            <AccordionTrigger className="text-xs text-muted-foreground hover:text-foreground py-2">
              View Detailed Vendor Breakdown & ATT&CK Tactics
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2 text-xs font-mono">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                {report.intel?.country && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">GEO / COUNTRY</span>
                    <span className="font-semibold">{report.intel.country}</span>
                  </div>
                )}
                {report.intel?.asn && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">ASN NETWORK</span>
                    <span className="font-semibold truncate block" title={report.intel.asn}>
                      {report.intel.asn}
                    </span>
                  </div>
                )}
                {report.intel?.firstSeen && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">FIRST OBSERVED</span>
                    <span className="font-semibold">{report.intel.firstSeen}</span>
                  </div>
                )}
                {report.intel?.threatActor && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">ATTRIBUTED ACTOR</span>
                    <span className="font-semibold text-threat-high truncate block">
                      {report.intel.threatActor}
                    </span>
                  </div>
                )}
              </div>

              {/* MITRE Tactics */}
              {report.intel?.mitreTactics && report.intel.mitreTactics.length > 0 && (
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">MITRE ATT&CK TACTICS:</div>
                  <div className="flex flex-wrap gap-1">
                    {report.intel.mitreTactics.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-muted text-[11px] text-foreground/80 border border-border/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Detection Table */}
              {report.intel?.vendorList && (
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">TOP SECURITY ENGINES:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {report.intel.vendorList.map((v) => (
                      <div
                        key={v.vendor}
                        className="flex items-center justify-between p-1.5 rounded bg-card/60 border border-border/40 text-[11px]"
                      >
                        <span className="text-foreground/80">{v.vendor}</span>
                        <span
                          className={`font-semibold ${
                            v.verdict === "malicious"
                              ? "text-threat-critical"
                              : "text-threat-low"
                          }`}
                        >
                          {v.verdict === "malicious" ? "Malicious" : "Clean"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function ThreatCardSkeleton({ ioc }: { ioc: { type: string; value: string } }) {
  return (
    <Card className="border border-border/50 bg-card/60 shadow-sm animate-pulse">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <div className="font-mono text-sm text-foreground/80">{ioc.value}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:border-l sm:pl-4 sm:border-border/40">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1 font-mono">
          <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
          <span>Querying 70+ threat intelligence feeds & sandbox signatures...</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ThreatCardError({
  ioc,
  onRetry,
}: {
  ioc: { type: "ip" | "url" | "hash"; value: string };
  onRetry: () => void;
}) {
  return (
    <Card className="border border-destructive/40 bg-destructive/5 shadow-sm">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Analysis failed for {ioc.value}
            </div>
            <div className="text-xs text-muted-foreground">
              Threat feed lookup timed out or network error occurred.
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs gap-1.5 border-destructive/30 hover:bg-destructive/10"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Retry Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
