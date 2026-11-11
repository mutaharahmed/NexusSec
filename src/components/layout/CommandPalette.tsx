"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Hash, Network, FileWarning, Shield, Terminal, ArrowRight } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSample?: (sampleText: string) => void;
}

const MOCK_RECENT_HASHES = [
  {
    name: "Emotet Loader Dropper",
    value: "8d9c1a5b82e21e25e98f061298c3e80927df58a4369e9f6920f69a9415664121",
    tag: "SHA256",
  },
  {
    name: "Cobalt Strike Stager",
    value: "4a2b9e1c7f8a3d6b5e4c2a1b0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e",
    tag: "SHA256",
  },
  {
    name: "Mimikatz Dump Utility",
    value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    tag: "SHA256",
  },
];

const MOCK_IP_ADDRESSES = [
  {
    name: "C2 Red Team Beacon Server",
    value: "198.51.100.42",
    tag: "Malicious IP",
  },
  {
    name: "Tor Exit Node (Relay #94)",
    value: "203.0.113.195",
    tag: "Tor Relay",
  },
  {
    name: "Corporate Internal Gateway",
    value: "192.168.1.105",
    tag: "Private Range",
  },
];

const MOCK_THREAT_REPORTS = [
  {
    title: "APT29 Cozy Bear Spearphishing Campaign",
    id: "TR-2026-098",
    severity: "Critical",
  },
  {
    title: "BlackBasta Ransomware Lateral Movement Spike",
    id: "TR-2026-092",
    severity: "High",
  },
  {
    title: "CVE-2026-3198 Zero-Click RCE Advisory",
    id: "TR-2026-088",
    severity: "Critical",
  },
];

export function CommandPalette({
  open,
  onOpenChange,
  onSelectSample,
}: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (text: string) => {
    if (onSelectSample) {
      onSelectSample(text);
    }
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search hashes, IPs, threat reports, or commands..." />
      <CommandList>
        <CommandEmpty>No results found for that query.</CommandEmpty>

        <CommandGroup heading="Recent Hashes">
          {MOCK_RECENT_HASHES.map((item) => (
            <CommandItem
              key={item.value}
              onSelect={() => handleSelect(item.value)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {item.value.slice(0, 16)}...
                  </span>
                </div>
              </div>
              <CommandShortcut>{item.tag}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="IP Addresses">
          {MOCK_IP_ADDRESSES.map((item) => (
            <CommandItem
              key={item.value}
              onSelect={() => handleSelect(item.value)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-orange-400 shrink-0" />
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {item.value}
                  </span>
                </div>
              </div>
              <CommandShortcut>{item.tag}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Threat Reports">
          {MOCK_THREAT_REPORTS.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() =>
                handleSelect(
                  `INCIDENT AUDIT LOG: ${item.title} (${item.id})\nSource: 198.51.100.42\nPayload: 8d9c1a5b82e21e25e98f061298c3e80927df58a4369e9f6920f69a9415664121\nTarget: hxxp://c2-beacon-command.top/endpoint`
                )
              }
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-threat-critical shrink-0" />
                <div>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {item.id}
                  </span>
                </div>
              </div>
              <CommandShortcut>{item.severity}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
