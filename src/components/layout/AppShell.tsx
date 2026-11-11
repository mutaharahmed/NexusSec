"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/layout/CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Allow dispatching a custom event when a user selects a sample from the command palette
  const handleSelectSample = (sampleText: string) => {
    window.dispatchEvent(
      new CustomEvent("nexussec:select-sample", { detail: { text: sampleText } })
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      <main className="flex-1">{children}</main>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}
