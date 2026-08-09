# HomeVision Frontend Take-Home — Review Page

A take-home challenge for a Front-end Developer role at HomeVision: build the
**Review Page** of HomeVision's Document Review product — the screen where a user
sees an uploaded document alongside the issues an AI backend found in it, and submits
once nothing is blocking them.

See [`DEVELOPMENT_APPROACH.md`](./DEVELOPMENT_APPROACH.md) for a write-up of how this
was approached and which parts required the most thought.

## Setup

Requires Node `^20.19.0 || >=22.12.0` (Vite's own requirement — see `engines` in
`package.json`; the project was built and tested on Node 22.12). If you use
[nvm](https://github.com/nvm-sh/nvm), running `nvm use` in this directory picks up
the version pinned in `.nvmrc` automatically; `npm install`/`npm run dev` will print
an `EBADENGINE` warning if you're on an older Node.

```bash
nvm use          # optional, only if you use nvm — reads .nvmrc
npm install
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) and produce a production build
npm run test     # run the unit test suite (Vitest)
```

The app has no real backend — `src/data/reviewMock.json` (a copy of the
challenge-provided `review_mock.json`, with `document.pdf_url` pointed at the local
`public/example_document.pdf`) is loaded through a fake async call
(`src/data/fetchReview.ts`) that resolves after a short delay, so the UI goes through
a real loading state instead of rendering synchronously.

## What it does

- Renders the review's PDF and its issue list side by side, with the document name,
  uploader, upload date, version, and status shown in the header.
- Issues are grouped by severity (Critical / Major / Minor) with counts in each
  section header. Critical and Major are always fully visible; Minor is a
  collapsible section (expanded by default) so it can be tucked away without risking
  losing track of what's actually blocking submission. A toggle switches the whole
  list between this grouped view and a flat view sorted by page number. Severity
  section headers stay pinned while scrolling a long section, and a search box
  (scoped to the issue list, separate from the PDF's own search below) filters the
  list by title/description.
- Clicking an issue scrolls the PDF to that issue's page, briefly highlights it, and
  moves keyboard/screen-reader focus there too — not just the visual scroll.
- A floating toolbar over the PDF gives page-number entry, previous/next page,
  previous/next *page with an issue* (jumping straight between the pages that
  actually need attention), and zoom in/out/reset.
- Submission is blocked while any `critical` or `major` issue is present; a banner
  states exactly how many of each are blocking, with a separate, quieter line noting
  how many non-blocking minor issues also exist. `minor`-only reviews can submit.
- Since the real submit endpoint doesn't exist yet, "Submit" transitions local state
  to `submitted` (read-only banner + disabled button) rather than calling an API.
- If the initial data load fails, the page shows a real error state with a working
  Retry button (rather than a static message with no action behind it).
- Full-document search via the browser's native Cmd+F / Ctrl+F works across the whole
  PDF, not just pages that have been scrolled into view — see below for how.

## Architecture & key decisions

**Vite, not Next.js.** This is a single client-only page — no routing, no SSR/SEO
need, and the mocked API means there's no server data-fetching to justify Next.js.
It would also add friction: PDF-rendering libraries need browser-only APIs (`canvas`,
`Worker`) that don't exist during SSR, requiring `'use client'` / `dynamic(ssr:false)`
workarounds for no benefit here.

**Custom PDF renderer (`react-pdf`/pdf.js), not a native `<iframe>` embed.** A native
embed would get Cmd+F "for free," but the mock's `document.pages[].height/width` data
(otherwise unused) suggested a page-by-page rendered viewer was the intended design,
and only a custom renderer allows click-an-issue → jump to and highlight its page.

**Making Cmd+F work across a virtualized document was the core technical problem.**
Native find-in-page only searches text currently in the DOM. Naively virtualizing
pages (mounting only what's visible) would make search silently miss off-screen
pages. The fix, in `src/components/PdfViewer/PdfPage.tsx`: every page's pdf.js text
layer is always mounted (`renderTextLayer` is unconditional), but each page's canvas
image only rasterizes (`renderMode="canvas"` vs `"none"`) once an `IntersectionObserver`
reports it's near the viewport. Text layers are cheap DOM text; canvases are the
expensive part, so this gets correct full-document search without paying to rasterize
all 34 pages up front. Verified during development by loading the app and confirming
a page never scrolled to already has real text `<span>` elements in its DOM.

**Native find-in-page also matches UI chrome outside the PDF, and that's accepted as
correct, not a bug.** Because Cmd+F searches the whole rendered page, it will also
match visible text in the issue sidebar, header, buttons, etc. — including cases
where an issue description quotes a figure that also appears on the matching PDF
page (e.g. a dollar amount referenced in both places). The acceptance criterion asks
for search across the PDF, not search scoped *only* to the PDF, and every product
that relies on native find-in-page (Google Docs' web viewer, GitHub's PDF preview)
has this exact characteristic — it's inherent to the approach, not specific to this
implementation. Building a custom, PDF-scoped search would directly undercut the
reason native find was chosen: correctness and robustness from the browser's own
implementation, at near-zero engineering cost.

**MUI, not Tailwind.** The highest-risk, most time-consuming part of this build was
the PDF/search engineering above. MUI's `Chip` (severity badges), `Alert` (blocking
banner, submit confirmation), `List`/`ListItemButton`/`Accordion` (issue panel), and
`AppBar` cover the rest of the UI with accessible defaults out of the box — MUI's
`Alert` defaulting to `role="alert"`, for instance, means state-change announcements
for screen readers came for free rather than needing a hand-rolled `aria-live`
region. Trade-off: less bespoke visual identity than Tailwind would give.

## Assumptions

- **No in-app "mark as resolved" UI.** `review_mock.json`'s issues have no `resolved`
  field, and the product flow (per the challenge description) is that issues get
  resolved by fixing the document externally and re-uploading a new version — which
  produces a new review with a new issue list. That re-upload flow is out of scope
  for this page, so submit gating is derived read-only from whatever the current
  review's `issues[]` says: `canSubmit = issues.every(i => i.severity === 'minor')`.
- **Submit has no real endpoint**, so it simulates a local state transition to
  `submitted` rather than a network call, to demonstrate the full status lifecycle
  (`created | processing | on_review | submitted`) cheaply.
- The mock dataset actually contains **4 critical, 8 major, 13 minor** issues (25
  total) across 34 pages.

## Testing

`npm run test` runs a Vitest unit suite (`src/components/IssueList/severity.test.ts`)
covering the parts of the app where a silent bug would be easiest to ship unnoticed:
severity grouping/sorting and the submit-blocking message logic. Component and
end-to-end tests (e.g. formalizing the ad hoc Playwright script used to verify the
PDF viewer during development) are the natural next layer — see "Production
readiness" below.

## Production readiness

What's already covered, and what's intentionally left as a known gap — several of the
gaps below are also marked in-code with a `// PRODUCTION:` comment at the exact line
they apply to, rather than left implicit.

**Testing** — Unit tests exist for the pure logic (see above). Not yet covered:
component tests (React Testing Library) for `SubmissionBar`'s and `IssueList`'s
states, and a formalized end-to-end test for the PDF/search behavior.

**Accessibility** — Addressed: severity is conveyed by text label, not color alone;
submit/blocking-state changes are announced via MUI `Alert`'s default `role="alert"`;
clicking an issue moves keyboard/screen-reader focus to the target page, not just the
visual scroll (`src/components/PdfViewer/PdfViewer.tsx`). Not yet addressed: a full
color-contrast audit of MUI's default palette at the sizes used, and — the deeper,
PDF-specific problem — pdf.js's text layer makes PDF text searchable/selectable but
doesn't give a screen reader a coherent read-through of the document; that requires
the source PDF to be properly tagged, which is a document-authoring concern outside
this app's control.

**Performance** — The production build already surfaces a real bundle-size warning
(pdf.js's worker is ~1MB; main bundle 923.67KB / 281.34KB gzipped). Lazy-loading the PDF
viewer (`React.lazy`) would keep it off the critical path. See the `// PRODUCTION:`
comment in `PdfPage.tsx` — rendered pages are never released from memory as the user
scrolls past them, which is fine at 34 pages but wouldn't scale to a much longer
document without releasing canvases that scroll far out of view.

**Security** — See the `// PRODUCTION:` comment in `fetchReview.ts`: the PDF is
served from a public, unauthenticated static path, but this data (name, address,
lender, appraised value — see the mock) is exactly the kind of PII that needs
access-controlled delivery (e.g. short-lived signed URLs) in a real deployment. No
authentication/authorization exists anywhere in this app currently.

**Error handling** — A real load-failure state with a working retry exists
(`src/hooks/useReview.ts`). Not yet covered: Submit itself has no failure path since
it's fully local, and there's no `ErrorBoundary` anywhere in the tree (see the
`// PRODUCTION:` comment in `main.tsx`) — an unexpected render exception currently
crashes to a blank screen.

**Architecture / maintainability** — See the `// PRODUCTION:` comment in
`useReview.ts`: this hand-rolls what a real data-fetching library (TanStack Query,
RTK Query) would give for free — caching, dedup, invalidation after submit. Worth the
swap once there's a real API. `types/review.ts` also hand-mirrors the backend's JSON
shape by hand; in a real integration it should be generated from the backend's schema
so the two can't silently drift.

**Deployment** — Out of scope for now: this is currently just `npm run build` → a
static `dist/`. A real rollout needs CI (typecheck + lint + test on every PR — this
repo scaffolds `oxlint` but doesn't run it anywhere yet), a CDN/static host, and
environment-driven config instead of anything hardcoded.

## Repo notes

`task-files/` holds the original challenge inputs (challenge description PDF, example
output PDF, `review_mock.json`) for local reference — it's git-ignored and not part of
the pushed repo, both to avoid duplicating `public/example_document.pdf` in git
history and because republishing the challenge's own materials isn't this repo's call
to make.
