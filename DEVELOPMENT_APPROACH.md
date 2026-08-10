# Development approach

## Planning before code

Read all three challenge materials in full (requirements PDF, example document,
`review_mock.json`) before writing code, and wrote up a working README first —
to catch gaps in the brief and give later decisions something concrete to check
against.

## Architecture decisions

- **Vite, not Next.js.** Single client-only page, no SSR/routing need, and
  PDF-rendering needs browser-only APIs (`canvas`, `Worker`) that don't exist
  during SSR.
- **Custom PDF renderer (`react-pdf`/pdf.js), not a native `<iframe>` embed.**
  Needed for click-an-issue → jump-to-page; the mock's per-page `height`/`width`
  data also pointed at a page-by-page renderer.
- **MUI, not Tailwind.** `Chip`/`Alert`/`List`/`AppBar` cover the UI with
  accessible defaults (e.g. `Alert`'s `role="alert"`) at low cost, leaving more
  time for the PDF/search engineering below.

## What required the most expertise

The hardest problem: making the acceptance criterion "search the entire PDF with
Cmd+F/Ctrl+F" work once the document is virtualized. Native find-in-page only
searches text in the DOM, so naive virtualization (rendering only visited pages)
would silently break search on any page not yet scrolled to.

Fix: split what a PDF page render does. The pdf.js text layer (invisible DOM
text) is cheap and always mounted, so search always has something to match. The
canvas image is the expensive part, and is the only thing virtualized, gated
behind an `IntersectionObserver`.

Note: native find-in-page also matches text in the sidebar/header, not just the
PDF — expected, the same as Google Docs' or GitHub's PDF viewers.

A second issue: `position: sticky` on the issue-list search box wasn't sticking.
Root cause: a wrapping `Box` around it collapsed to exactly the child's height,
leaving no room for the child to move within its containing block before the
wrapper itself scrolled past. Removing the wrapper fixed it (see the comment in
`IssueList.tsx`).

## Judgment calls

- No in-app "mark issue as resolved" control. `review_mock.json` issues have no
  `resolved` field; resolution happens by fixing the document externally and
  re-uploading a new version, which is outside this page's scope.
- Severity grouping with only Minor collapsible. Critical and Major are always
  fully visible since they block submission; Minor carries no such risk.
- Submission bar keeps the blocking-issue count and the minor-issue count as
  separate lines rather than one sentence.
- Brand-purple usage stays functional only (buttons, status chip, focus
  states), never decorative surface color.
- Page jumps beyond 5 pages away are instant, not animated — avoids both a
  slow-feeling jump and rasterizing pages the user never intends to look at.

## Production readiness

Gaps below are also marked in-code with `// PRODUCTION:` comments.

**Testing** — Unit tests (`severity.test.ts`) cover severity grouping/sorting
and submit-blocking logic, the parts most likely to ship a silent bug. Not
covered: component tests, end-to-end tests.

**Accessibility** — Severity conveyed by text, not color alone; focus moves on
navigation; MUI `Alert` gives state changes `role="alert"`. Not covered: a full
color-contrast audit; a PDF screen-reader read-through (needs source-PDF
tagging, outside this app's control).

**Performance** — Bundle: 923.67KB / 281.34KB gzipped (plus a ~1MB pdf.worker
chunk), not code-split — `React.lazy` on the PDF viewer would fix this. Rendered
PDF canvases are never released from memory (fine at 34 pages; wouldn't scale to
a much longer document).

**Security** — The PDF is served from a public, unauthenticated path; real
review data includes PII (name, address, financials), so a real deployment
needs access-controlled delivery (e.g. signed URLs). No auth exists anywhere.

**Error handling** — Load failure has a working Retry. An `ErrorBoundary` at the
root (`main.tsx`) catches unexpected render exceptions. Submit has no failure
path since it's fully local.

**Architecture / maintainability** — `useReview` hand-rolls what a data-fetching
library (TanStack Query) gives for free — caching, dedup, invalidation. The
mocked API response is cast to `Review` at compile time only, with no runtime
validation (e.g. Zod) — fine for a static local mock, not for a real API.
`types/review.ts` hand-mirrors the backend shape; should be generated from a
schema in a real integration.

**Configuration** — No env vars currently exist; a real deployment would move
things like the API base URL to env-driven config instead of hardcoding.

**Deployment** — `npm run build` → static `dist/`. A real rollout needs CI
(typecheck/lint/test per PR), a CDN/static host, and env-driven config.

## Scope

Prioritized the core interaction (PDF, search, gating) over breadth of polish —
see Production readiness above for what's covered and what's a known gap.
