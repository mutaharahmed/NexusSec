import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "NexusSec — Next-Gen Threat Resolution Platform",
  description:
    "Omni-triage security ingestion engine. Auto-extracts IOCs, conducts parallel sandbox intelligence checks, and generates executive AI incident briefings.",
  keywords: [
    "Threat Intelligence",
    "VirusTotal Alternative",
    "IOC Extractor",
    "SOC Triage",
    "Incident Response",
    "Cybersecurity",
    "Next.js",
  ],
  authors: [{ name: "NexusSec SecOps" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
