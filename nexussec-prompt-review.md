# NexusSec Prompt Review

---

## SECTION 1 — Project Foundation

### 1. Problems found
- **Undefined tool versions**: No package manager specified (npm/pnpm/yarn/bun) and no Tailwind version specified. shadcn/ui setup differs meaningfully between Tailwind v3 and v4 — this is a real fork in the road, not a stylistic detail.
- **Vague color spec**: "Red/Orange/Yellow/Green" for threat levels gives no exact values. The AI will invent hex codes, which may clash with the Zinc palette or fail contrast requirements.
- **No `--src-dir` / import alias confirmation**: You reference `src/app/globals.css` and a `src` folder structure, but never explicitly instruct `create-next-app` to use the `src/` directory or set up the `@/*` import alias — easy to get a mismatched project skeleton.
- **Weak success criterion**: "ensure the app compiles cleanly" isn't testable. Compiles per what command? (`next build`, `tsc --noEmit`, `eslint`?)
- **Mild tension, not a real contradiction**: Rule 2 says "DO NOT write raw CSS for components" while Rule 5 asks for custom CSS variables in `globals.css`. This is fine (global design tokens ≠ component CSS) but worth stating explicitly so the intent isn't misread.
- **No TypeScript strictness setting** specified.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect.

TASK: Execute SECTION 1 — Project Foundation for "NexusSec," a next-gen threat
resolution platform (think: a modern VirusTotal alternative).

STACK REQUIREMENTS:
- Next.js 14, App Router, TypeScript (strict mode), Tailwind CSS, ESLint.
- Use `npm` as the package manager.
- Use `create-next-app` with the `src/` directory enabled and the `@/*` import alias configured.
- Tailwind v3 (confirm this matches your shadcn/ui CLI version — flag me if the CLI defaults to v4).

RULES:
1. Initialize the project per the stack requirements above.
2. Set up `shadcn/ui` (Zinc base color, CSS variables enabled). Do not hand-roll
   component styling — shadcn/ui components handle their own internal styles.
   Global design tokens (Rule 5) are the one exception to "no raw CSS."
3. Install `next-themes` and `lucide-react`.
4. In `src/app/globals.css`, define these CSS variables for threat severity,
   as HSL triplets compatible with the shadcn theming convention:
   - `--threat-critical` (red)
   - `--threat-high` (orange)
   - `--threat-medium` (yellow)
   - `--threat-low` (green)
   Choose values that meet WCAG AA contrast against both light and dark backgrounds.
5. Configure root `layout.tsx` with the `next-themes` ThemeProvider:
   default theme = dark, `attribute="class"`, `enableSystem`, and
   `suppressHydrationWarning` on the `<html>` tag.
6. Create this folder structure under `src/`:
   `/components/ui`, `/components/layout`, `/components/features`, `/lib`, `/types`.
7. Create `src/lib/utils.ts` with the standard `cn()` Tailwind class-merge helper
   (clsx + tailwind-merge).

DEFINITION OF DONE:
- `npm run build` succeeds with zero TypeScript errors.
- `npm run lint` passes with zero errors.
- No UI features are built beyond this foundation — no pages, no components
  other than the utility/config files listed above.
```

### 3. Why this version is better
- Locks package manager, Tailwind version, and `src/`+alias setup — the three things most likely to cause silent divergence between runs.
- Converts "ensure it compiles cleanly" into two testable commands.
- Explicitly separates "no raw CSS for components" from "global design tokens are fine," removing the only ambiguity in the original.
- Gives the AI a contrast requirement instead of leaving color choice fully open.

### 4. Optional improvements (need your input)
- Exact hex/HSL values for the four threat colors, if you have brand guidelines.
- Confirm Next.js 14 is intentional — framework versions move fast; if you want "whatever is current," say so explicitly instead of pinning 14.
- Do you want dark mode to be *forced*, or just default-with-toggle? (Section 2 adds a toggle, so "default dark" is the right call here — just confirming.)

---

## SECTION 2 — Global UI & Navigation

### 1. Problems found
- **Dead-end interaction**: The Navbar's "Press Cmd+K to search" button is described only as a "placeholder" — it's unclear if clicking it should also open the Command Palette, or if it's purely decorative until later. Leaving this unstated risks a button that does nothing, which reads as broken.
- **"Must be responsive" is untestable**: no breakpoint behavior specified (does the navbar collapse into a hamburger menu on mobile? Do the middle/right sections stack or hide?).
- **Avatar dropdown "placeholder" has no defined contents** — even placeholder menu items should be specified so the AI doesn't invent unrelated ones (e.g., "Profile," "Settings," "Sign out" vs. something random).
- **Forward dependency not flagged**: The Command Palette's mock groups ("Recent Hashes," "IP Addresses," "Threat Reports") are static now but will presumably need real data once Sections 3–4 exist. Not a problem today, but worth a one-line note so future-you knows this is intentionally temporary.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect.

TASK: Execute SECTION 2 — Global UI & Navigation for NexusSec.

RULES:
1. Install shadcn/ui components: `button`, `dropdown-menu`, `avatar`, `command`, `dialog`.
2. Create `src/components/layout/Navbar.tsx`:
   - Left: shield icon (lucide-react) + "NexusSec" wordmark.
   - Middle: a button reading "Search... ⌘K" that OPENS the Command Palette on click
     (same action as the Cmd+K shortcut — this is not decorative).
   - Right: dark mode toggle (dropdown with Light/Dark/System) and a User Avatar
     dropdown with placeholder items: "Profile," "Settings," "Sign out."
   - Responsive behavior: on screens <768px, collapse the middle search button to
     an icon-only button; keep left and right sections visible.
3. Create `src/components/layout/CommandPalette.tsx`:
   - Opens on Cmd+K (Mac) / Ctrl+K (Windows/Linux), and via the Navbar button.
   - Include mock groups: "Recent Hashes," "IP Addresses," "Threat Reports"
     (static mock data for now — this will be wired to real state in a later section).
4. Integrate `Navbar` into `src/app/layout.tsx`, above `{children}`.

DEFINITION OF DONE:
- Navbar renders correctly and collapses per the responsive spec above.
- Dark mode toggle switches themes.
- Cmd+K AND the Navbar search button both open the Command Palette.
- Do not build the core application yet.
```

### 3. Why this version is better
- Closes the "does the button do anything" gap — a common source of visibly broken demos.
- Gives one concrete breakpoint and behavior instead of a vague "responsive" instruction.
- Specifies avatar dropdown contents so the output is deterministic.
- Flags the mock-data-for-now nature of the Command Palette so nobody's surprised later.

### 4. Optional improvements (need your input)
- Confirm 768px is your intended mobile breakpoint (or specify your own).
- Do you want the dark mode toggle as a dropdown (Light/Dark/System) or a simple two-state switch? I assumed dropdown since you're already using `next-themes` with `enableSystem`.

---

## SECTION 3 — Omni-Triage Bar

### 1. Problems found
- **Hash scope is narrow and unconfirmed**: only SHA256 is extracted, but real-world logs commonly contain MD5/SHA1 too. This may be intentional scope control — but it's worth confirming rather than assuming.
- **No dedupe rule**: if the same IP appears 10 times in a pasted log, does it show 10 badges or 1? This materially affects both UX and the Section 4 data flow (would you fire 10 redundant analysis calls?).
- **No defanged-IOC handling**: security logs frequently defang indicators (`192[.]168[.]1[.]1`, `hxxp://`). Not addressed — flagging as a realistic gap rather than assuming you want it handled.
- **No empty/invalid input behavior**: what happens if the user clicks "Triage Incident" with no IOCs found, or an empty textarea?
- **"Visually stunning and hacker-aesthetic" is subjective and untestable** — needs to be translated into concrete, checkable specifications.
- **Downstream ambiguity**: it's not stated whether clicking "Triage Incident" analyzes *all* found IOCs automatically, or whether the user selects a subset. This directly determines how Section 4 should be built, so it needs to be resolved here, not left implicit.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect and UX Engineer.

TASK: Execute SECTION 3 — The Omni-Triage Bar for NexusSec.

CONTEXT: Instead of separate tabs for files/URLs, users paste raw, messy logs
(Splunk logs, email headers, etc.) into one text area. We auto-extract IOCs
(Indicators of Compromise) from the pasted text.

RULES:
1. Install shadcn/ui components: `textarea`, `card`, `tabs`, `badge`.
2. Create `src/components/features/OmniTriage.tsx` as a Client Component.
3. UI: a large, centered, code-editor-style textarea using a monospaced font,
   on a dark-gray background consistent with the Zinc theme from Section 1.
   Placeholder text: "Paste a raw log, email header, hash, or URL..."
4. Add a "Triage Incident" submit button. It is disabled when the textarea is
   empty or contains no extractable IOCs.
5. Create `src/lib/extractors.ts` with regex-based extraction functions for:
   - IPv4 addresses
   - URLs
   - SHA256 hashes
   Deduplicate results within each category (same IOC value shown once).
6. On "Triage Incident" click, run the extractors on the full pasted text and
   analyze ALL unique IOCs found (no manual sub-selection in this version).
7. Below the textarea, render a "Found IOCs" section using shadcn `badge`
   components, grouped by type (e.g., `IP: 192.168.1.1`, `HASH: 8d9c...`).
8. If zero IOCs are found after clicking Triage, show an inline message:
   "No indicators detected in the pasted text."

DEFINITION OF DONE:
- Regex extraction works correctly and deduplicates results.
- The submit button correctly disables/enables based on input state.
- The empty-result state is handled gracefully, not silently.
- Do not connect this to any backend/mock analysis yet — that's Section 4.
```

### 3. Why this version is better
- Resolves the "analyze all vs. select some" ambiguity now, before Section 4 has to guess.
- Adds dedupe and empty-state handling — both are common real-world triggers that were previously undefined.
- Replaces "visually stunning" with concrete, checkable specs (monospace font, Zinc-consistent dark background) tied back to Section 1's tokens instead of inventing a new aesthetic.

### 4. Optional improvements (need your input)
- Do you want MD5/SHA1 support in addition to SHA256, or is SHA256-only intentional?
- Do you want defanged-IOC support (`192[.]168[.]1[.]1`, `hxxp://`)? This is a very common real-world need for a tool like this, but it's a scope decision only you can make.

---

## SECTION 4 — Threat Dashboard & Confidence Scoring

### 1. Problems found
- **Unspecified field types** in `ThreatReport`: `avDetections` and `tags` have no defined shape (is `avDetections` a number, or an array of vendor results? Is `tags` `string[]`?). This will produce inconsistent output if regenerated.
- **Critical semantic ambiguity**: does a higher `confidenceScore` mean "more confident this is malicious" or "more confident this is safe"? Everything downstream (color mapping, sorting, UX tone) depends on this being unambiguous, and it currently isn't stated at all.
- **No severity thresholds defined**: you reference "utilizing the CSS variables we made in Section 1" but never state which score ranges map to critical/high/medium/low. The AI will have to invent a mapping.
- **Serial-vs-parallel ambiguity**: if multiple IOCs are found, does the mock server action get called once per IOC (each with its own 2s delay, run in parallel or serially)? This changes the loading UX significantly and isn't specified.
- **No error state**: what renders if the (mock) analysis fails or the IOC type is unrecognized? Not addressed.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect.

TASK: Execute SECTION 4 — Threat Dashboard & Confidence Scoring for NexusSec.

CONTEXT: Once IOCs are extracted, we display whether each one is dangerous.

RULES:
1. Install shadcn/ui components: `progress`, `accordion`, `separator`, `skeleton`.
2. Create `src/types/threat.ts`:
   ```ts
   interface ThreatReport {
     id: string;
     type: "ip" | "url" | "hash";
     value: string;
     confidenceScore: number; // 0–100, HIGHER = more confident the IOC is MALICIOUS
     severity: "critical" | "high" | "medium" | "low";
     avDetections: { total: number; malicious: number }; // e.g. 12 vendors flagged out of 70
     tags: string[]; // e.g. ["Ransomware", "Cobalt Strike"]
   }
   ```
3. Severity mapping (confidenceScore → severity → CSS variable from Section 1):
   - 90–100 → critical → `--threat-critical`
   - 70–89  → high     → `--threat-high`
   - 40–69  → medium   → `--threat-medium`
   - 0–39   → low      → `--threat-low`
4. Create a mock Server Action `src/app/actions/analyze.ts` exporting
   `analyzeIoc(ioc: { type: string; value: string }): Promise<ThreatReport>`.
   Simulate a 2-second delay and return a randomized mock `ThreatReport`.
5. Create `src/components/features/ThreatCard.tsx` displaying:
   - The IOC value.
   - A large, color-coded confidence score (colored per the severity mapping above).
   - A progress bar reflecting the score.
   - Tags as badges.
6. In `OmniTriage.tsx`: when IOCs are submitted, call `analyzeIoc` for each
   unique IOC IN PARALLEL (Promise.all), show one skeleton `ThreatCard` per
   pending IOC, and replace each skeleton with its `ThreatCard` as results
   resolve independently (not all-at-once).
7. If any individual `analyzeIoc` call fails, render an error state on that
   specific card ("Analysis failed — retry") without blocking the others.

DEFINITION OF DONE:
- Data flow works end-to-end: Input → Extraction → Parallel mock analysis → UI render.
- Severity colors match the defined score thresholds exactly.
- One IOC's failure/delay never blocks the others from rendering.
- No real AI or database integration yet.
```

### 3. Why this version is better
- Removes the single biggest silent-failure risk in the original: the undefined direction of `confidenceScore`. Now it's pinned down and impossible to misinterpret.
- Gives explicit score→severity→color thresholds instead of leaving the mapping to chance.
- Specifies parallel resolution with independent skeleton-to-card replacement, which is both better UX and removes an unstated design decision.
- Adds a minimal per-card error state so failures aren't undefined behavior.

### 4. Optional improvements (need your input)
- Confirm the 90/70/40 thresholds match your intended risk model — these are reasonable defaults, not something you specified.
- Do you want retry logic wired up now, or just the visual error state (with real retry logic deferred to a later section)?

---

## SECTION 5 — AI Incident Summarization

### 1. Problems found — this is the most important one in the whole set
- **Architectural mismatch with Section 4**: Section 4's `analyzeIoc` action is designed to be called *once per individual IOC*. Section 5 asks you to "update the mock server action... to also return a mock paragraph" of AI summary text — but an **incident summary is inherently about the whole submission**, not a single IOC. If you literally follow the instruction as written, you'd get a duplicated, per-IOC "AI summary" repeated on every card, which contradicts the stated UX ("Paste log → AI Executive Summary → individual breakdowns," singular summary, one time). This needs to be resolved before implementation, not discovered after.
- **Loose color spec**: "perhaps a subtle purple or blue border" is non-committal wording that produces inconsistent results across runs, and it also breaks the CSS-variable/design-token discipline established in Section 1 (new color, not added as a token).
- **No loading state defined** for the AI summary specifically — it presumably needs its own skeleton, separate from the per-IOC card skeletons in Section 4, but this isn't stated.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect.

TASK: Execute SECTION 5 — AI Incident Summarization for NexusSec.

CONTEXT: Translate the full set of analyzed IOCs into one plain-English
executive summary for junior analysts, shown once per incident (not once per IOC).

RULES:
1. Add a second Server Action to `src/app/actions/analyze.ts`:
   `summarizeIncident(reports: ThreatReport[]): Promise<{ summary: string }>`.
   This is separate from `analyzeIoc` — it runs ONCE, after all individual IOC
   analyses have resolved, taking the full array of results as input.
   Simulate a 1.5-second delay and return a mock paragraph referencing the
   highest-severity finding(s) (e.g., "This log indicates an encoded PowerShell
   script attempting to reach a known C2 server associated with Emotet.").
2. Add a new CSS variable to `src/app/globals.css`: `--ai-accent` (a distinct
   purple or blue, your choice, consistent with the Zinc dark theme). Do not
   hardcode the color directly in the component — use the token.
3. Create `src/components/features/AIInsightBox.tsx`:
   - Border/accent colored via `--ai-accent`, with a Sparkles icon (lucide-react).
   - Header: "AI Incident Summary."
   - Body: the summary text in clean typography.
   - Footer: "Generated by NexusSec AI."
   - Shows its own skeleton state while `summarizeIncident` is pending —
     independent of the per-IOC `ThreatCard` skeletons from Section 4.
4. In `OmniTriage.tsx`: once ALL individual `analyzeIoc` calls have resolved,
   call `summarizeIncident` with the full results array, and render
   `AIInsightBox` at the top of the results, above the `ThreatCard` list.

DEFINITION OF DONE:
- The AI summary appears exactly once per submission, not once per IOC.
- The `--ai-accent` token is defined in globals.css and used (not hardcoded).
- The summary box has its own loading state, independent of the ThreatCards.
- Full UX: Paste log → wait → AI Executive Summary → individual IOC breakdowns.
- Responsive design holds on mobile.
```

### 3. Why this version is better
- Fixes the per-IOC vs. per-incident mismatch, which was the single largest structural risk in the original five prompts — left as-is, it would have produced a confusing, repeated "summary" on every card.
- Keeps the "AI accent" color inside the design-token system from Section 1 instead of introducing an inconsistent one-off hardcoded color.
- Makes the loading sequencing explicit (summary fires after all individual analyses resolve), matching the UX narrative you described.

### 4. Optional improvements (need your input)
- Confirm you're fine with the AI summary firing only *after* all IOC analyses resolve (vs. firing in parallel and just appearing whenever it's ready — plausible alternative UX, your call).

---

## SECTION 6 — File & Archive Malware Scanning

### 1. Problems found
- **Rate limiting collisions**: VirusTotal Public API strictly enforces a 4 requests/minute ceiling (1 request every 15 seconds). Unzipping an archive with multiple files can quickly exhaust this quota or throw 429 Too Many Requests errors if not governed by a shared sequential queue.
- **Archive decompression attack vectors**: Unrestricted extraction exposes systems to "zip-slip" path traversal (overwriting host files via `../` path components) and "zip bombs" (highly compressed archives consuming gigabytes of RAM/disk).
- **Client exposure of secrets**: API keys passed through client components or query params risk credential leakage and unauthorized quota drainage.
- **Stale disk state**: Failing to clean up decompressed files upon failure or completion causes local storage leaks.

### 2. Improved prompt
```
ROLE: You are an expert Senior Next.js Architect and Security Engineer.

TASK: Execute SECTION 6 — File & Archive Malware Scanning for NexusSec.

CONTEXT: Users can upload a file (PDF, ZIP, or other common types) and NexusSec
scans it for malware using the VirusTotal Public API v3, including scanning
each file INSIDE a ZIP individually, not just the ZIP as a whole.

DEPENDENCY: Requires a VirusTotal API key, stored server-side only as
`VT_API_KEY` in `.env.local`. Never exposed to the client, never sent as a
query parameter — always in the `x-apikey` request header.

RULES:

1. UPLOAD UI
   - Create `src/components/features/FileUploadZone.tsx` (Client Component):
     a drag-and-drop + click-to-browse zone using shadcn `card` styling
     consistent with the Zinc dark theme.
   - Accept: .pdf, .zip, .doc/.docx, .exe, .js, .txt (adjust list if you want
     it broader — this is a reasonable starting allowlist).
   - Reject files over 32MB (VirusTotal Public API's standard upload limit)
     with an inline error, not a silent failure.

2. UPLOAD ROUTE
   - Create a Route Handler at `src/app/api/scan-file/route.ts` (POST).
     Use a Route Handler here, not a Server Action, since this needs to
     stream file uploads (`multipart/form-data`).
   - Reject any file failing MIME-type or extension validation.
   - Store the upload in a temp directory with a randomly generated filename
     (never trust or use the original filename for storage paths).

3. ZIP EXTRACTION SAFETY
   - If the upload is a `.zip`, extract it into a unique temp subfolder using
     a library that resolves and validates each entry's path stays within
     that subfolder (reject/skip any entry attempting path traversal —
     "zip-slip").
   - Enforce hard caps: max 50 files extracted, max 200MB total uncompressed
     size, max 20MB per individual extracted file. Abort extraction and
     return an error if any cap is exceeded ("zip bomb" protection).
   - Delete the temp folder (original zip + extracted contents) after
     scanning completes or fails — nothing persists on disk afterward.

4. SCAN LOGIC — `src/lib/virustotal.ts`
   For the uploaded file, and for each file extracted from a ZIP, run this
   sequence:
   a. Compute SHA256 of the file.
   b. `GET https://www.virustotal.com/api/v3/files/{sha256}` — if VirusTotal
      already has a report (200 response), use it immediately. This is the
      common case and costs 1 request regardless of file size.
   c. If not found (404), upload the file:
      `POST https://www.virustotal.com/api/v3/files` (multipart), which
      returns an analysis ID.
   d. Poll `GET https://www.virustotal.com/api/v3/analyses/{id}` every 15
      seconds until `attributes.status === "completed"`, with a 5-minute
      timeout after which the item is marked "scan timed out."
   e. Respect the 4-requests-per-minute limit across ALL files in a single
      upload (including every file extracted from a ZIP) using a shared
      request queue — do not fire requests for multiple files in parallel.

5. DATA MODEL
   Extend `ThreatReport` (from Section 4) with:
   ```ts
   type?: "ip" | "url" | "hash" | "file";
   fileName?: string;
   fileSize?: number;
   parentArchive?: string; // set when this file came from inside a ZIP
   ```
   Map VirusTotal's `last_analysis_stats` (malicious/suspicious/harmless/
   undetected vendor counts) into the existing `avDetections` and
   `confidenceScore` fields using the same severity thresholds from Section 4.

6. UI STATES
   Each uploaded/extracted file shows one of: `Queued` → `Uploading` →
   `Scanning` → `Complete` → `Failed` / `Timed out`, rendered as a
   `ThreatCard` once complete, consistent with Section 4's card layout.
   For a ZIP, show the archive name as a group header with its extracted
   files listed underneath.

DEFINITION OF DONE:
- A PDF or standalone file scans via hash-lookup-first, upload-as-fallback.
- A ZIP is safely extracted (zip-slip and zip-bomb protections both verified
  with a deliberately malicious test zip) and each contained file is scanned
  individually.
- The shared 4-req/min queue is respected even when a ZIP contains many files.
- No uploaded file is ever executed, opened, or rendered — only hashed,
  uploaded to VirusTotal, and deleted from local temp storage afterward.
- API key never appears in client-side code or network requests visible
  in the browser.
```

### 3. Why this version is better
- Explicitly safeguards against the two deadliest archive threats: zip-slip and zip-bombs.
- Establishes a shared request queue to prevent 429 quota exhaustion on VirusTotal's 4 req/min tier.
- Implements hash-first resolution saving bandwidth and quota before attempting large uploads.
- Ensures zero disk persistence with strict cleanup in `finally` blocks.

---

## Project-Wide Issues

1. **The Section 4 ↔ Section 5 data-flow mismatch is the most important issue in the whole set.** Section 4 defines a single-IOC analysis action; Section 5 assumes an incident-level summary. As originally written, following Section 5 literally would have produced a broken or repeated summary. This is now resolved by splitting `analyzeIoc` and `summarizeIncident` into two distinct actions — but it's exactly the kind of thing that's invisible when prompts are written and reviewed in isolation, which is why cross-prompt review matters here.

2. **Design-token discipline is inconsistently applied.** Section 1 sets a clear rule (colors as CSS variables, no raw CSS for components) but Section 5's original wording ("perhaps a subtle purple or blue") would have broken that rule with a one-off hardcoded color. Every later section should inherit this constraint rather than needing it restated.

3. **The ROLE line is repeated five times with drift** ("Senior Next.js Architect" vs. "Senior Next.js Architect and UX Engineer" in Section 3). Small wording differences like this are exactly what tends to cause subtly different behavior between otherwise-identical sessions. This belongs in one place.

4. **No shared "Definition of Done" standard existed** — each prompt used different vague closing language ("ensure it compiles," "works flawlessly," "looks professional"). I standardized this into an explicit, checkable list per prompt, but it would be stronger as a single shared template referenced by all five.

5. **No shared edge-case policy.** Empty states, error states, and loading states were handled inconsistently (or not at all) across the original five prompts. Each section reinvented this instead of inheriting one rule.

6. **Terminology drifts slightly across sections** — "Triage," "Analyze," and "Incident" are used somewhat interchangeably. Not a functional bug, but worth locking down a small glossary so future sections use consistent naming.

7. **The STOP CONDITION pattern itself is good and should be kept** — it's an effective, simple guardrail against scope creep between sections, and nothing about it needs to change.

---

## Recommended Prompt Structure

Right now you have five flat, self-contained prompts with heavy duplication. I'd split this into a **global prompt + five lean task prompts**:

**Global/System prompt (write once, reference in every section):**
- Role definition: "Senior Next.js Architect" (single canonical phrasing).
- Stack pinning: Next.js version, Tailwind version, package manager, TS strict mode, `src/` + `@/*` alias.
- shadcn/ui conventions: Zinc base, CSS-variable-driven theming, "no raw CSS for components, all new colors become tokens."
- Definition of Done template (build passes / lint passes / no scope creep beyond stated section).
- Shared edge-case policy: how empty states, loading states, and error states should generally be handled unless a section overrides it.
- Terminology glossary: IOC, Triage, Incident, Analysis — one definition each.

**Task-specific prompts (Sections 1–5, trimmed):**
- Just the ROLE reference ("per global conventions"), the CONTEXT, the delta rules specific to that section, and the STOP CONDITION/Definition of Done specific to that feature.
- Explicit **dependency notes** at the top of each prompt when it consumes something from an earlier one — e.g., Section 4 should open with "Depends on: `--threat-*` tokens from Section 1, `extractIocs()` output shape from Section 3." This makes the pipeline nature of the project visible instead of implicit.

This won't change what gets built — it just removes the duplication and the two or three places where sections silently assumed things about each other that weren't written down anywhere.
