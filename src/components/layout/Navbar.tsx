"use client";

import * as React from "react";
import {
  Shield,
  Search,
  Sun,
  Moon,
  Laptop,
  User,
  Settings,
  LogOut,
  Radio,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Left: Shield icon + NexusSec wordmark */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10">
            <Shield className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent font-sans">
                Nexus<span className="text-emerald-400">Sec</span>
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-muted text-muted-foreground border border-border/50">
                v1.0-SOC
              </span>
            </div>
            <span className="hidden sm:block text-[10px] text-muted-foreground font-mono">
              Omni-Threat Triage Engine
            </span>
          </div>
        </div>

        {/* Middle: Search button (opens Command Palette on click) */}
        {/* On screens <768px (md), collapses to icon-only button per Section 2 spec */}
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={onOpenCommandPalette}
            className="relative h-9 rounded-lg border-border/70 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-mono transition-all sm:w-64 md:w-80 justify-between px-3"
          >
            {/* Desktop & Tablet (>768px): text label + shortcut */}
            <div className="hidden md:flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span>Search hashes, IPs, CVEs...</span>
            </div>

            {/* Mobile (<768px): Icon-only button per spec */}
            <div className="flex md:hidden items-center gap-1.5">
              <Search className="h-4 w-4 text-cyan-400" />
              <span className="text-[11px]">Search</span>
            </div>

            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right: Dark mode toggle & User Avatar dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Moon className="h-4 w-4 text-cyan-400" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Moon className="h-4 w-4 text-cyan-400" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Laptop className="h-4 w-4 text-muted-foreground" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar Dropdown (Placeholder items: Profile, Settings, Sign out) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full ring-1 ring-border/70 hover:ring-foreground/30 p-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Analyst"
                  />
                  <AvatarFallback className="bg-emerald-950 text-emerald-400 font-mono text-xs">
                    SO
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">Security Analyst</p>
                  <p className="text-xs leading-none text-muted-foreground font-mono">
                    analyst@nexussec.internal
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
