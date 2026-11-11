"use client";

import * as React from "react";
import { OmniTriage } from "@/components/features/OmniTriage";
import { FileUploadZone } from "@/components/features/FileUploadZone";
import {
  ShieldAlert,
  Zap,
  Cpu,
  Binary,
  Terminal,
  Activity,
  UploadCloud,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function HomePage() {
  const [activeSample, setActiveSample] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<string>("triage");

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.text) {
        setActiveSample(e.detail.text);
        setActiveTab("triage");
      }
    };
    window.addEventListener("nexussec:select-sample", handler);
    return () => window.removeEventListener("nexussec:select-sample", handler);
  }, []);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Hero Section */}
      <section className="relative text-center max-w-3xl mx-auto space-y-4">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -top-12 -z-10 mx-auto max-w-lg h-44 bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-indigo-500/20 blur-3xl opacity-60 pointer-events-none" />

        {/* Live status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>CYBER THREAT INTELLIGENCE ENGINE ONLINE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-sans">
          Instant Threat Triage &{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            AI Incident Resolution
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Drop messy Splunk dumps, defanged logs, or upload suspicious files and ZIP archives.
          Auto-extract IOCs, execute parallel multi-engine sandbox inspection, and generate
          plain-English executive summaries.
        </p>
      </section>

      {/* Main Mode Selector Tabs */}
      <section className="max-w-5xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md h-11 bg-muted/60 p-1 border border-border/70 rounded-xl">
              <TabsTrigger
                value="triage"
                className="flex items-center gap-2 font-mono text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-foreground rounded-lg transition-all"
              >
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Omni-Triage Bar</span>
              </TabsTrigger>
              <TabsTrigger
                value="scanner"
                className="flex items-center gap-2 font-mono text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-foreground rounded-lg transition-all"
              >
                <UploadCloud className="h-4 w-4 text-cyan-400" />
                <span>File & ZIP Scanner</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="triage" className="space-y-6 focus-visible:outline-none">
            <OmniTriage initialLog={activeSample} key={activeSample || "initial"} />
          </TabsContent>

          <TabsContent value="scanner" className="space-y-6 focus-visible:outline-none">
            <FileUploadZone />
          </TabsContent>
        </Tabs>
      </section>

      {/* Security Engine Metric Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-border/50">
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            PARALLEL LATENCY
          </div>
          <div className="text-xl font-bold font-mono text-foreground">~1.8s</div>
          <div className="text-[11px] text-muted-foreground">Sub-second multi-thread queries</div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
            VIRUSTOTAL V3
          </div>
          <div className="text-xl font-bold font-mono text-foreground">4 Req/Min</div>
          <div className="text-[11px] text-muted-foreground">Shared rate-limited queue</div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ZIP-SLIP & BOMB
          </div>
          <div className="text-xl font-bold font-mono text-foreground">Hardened</div>
          <div className="text-[11px] text-muted-foreground">Path traversal & bomb caps</div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-threat-high" />
            THREAT FEEDS
          </div>
          <div className="text-xl font-bold font-mono text-foreground">72 Vendors</div>
          <div className="text-[11px] text-muted-foreground">Integrated sandbox engines</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 pt-8 pb-12 text-center text-xs text-muted-foreground font-mono space-y-2">
        <p>NexusSec SOC Triage Platform · Modern VirusTotal Alternative</p>
        <p className="text-[11px] text-muted-foreground/80">
          Built with Next.js 14 App Router, TypeScript Strict, and Tailwind CSS Design Tokens.
        </p>
      </footer>
    </div>
  );
}
