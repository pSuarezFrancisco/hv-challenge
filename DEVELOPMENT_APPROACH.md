# Development approach

## Planning before code

Before writing any application code, I read all three challenge materials in full
(the requirements PDF, the example document, and `review_mock.json`) and wrote up my
understanding as a working README — partly to make sure I wasn't missing anything in
the brief, and partly so later decisions had something concrete to check themselves
against instead of drifting from memory of the prompt.

From there, the technology choices (Vite vs. Next.js, a custom PDF renderer vs. a
native browser embed, MUI vs. Tailwind) were made as deliberate, arguable decisions
before any code existed — each one weighed against what the ticket actually asked
for, not defaulted into. That mattered in practice: it's what surfaced the project's
real technical risk early, instead of discovering it midway through a build.

## What required the most expertise

The hardest problem wasn't the UI — it was making the acceptance criterion "search
the entire PDF with Cmd+F / Ctrl+F" actually true once the document is virtualized.
Native find-in-page only searches text currently in the DOM, so a naively virtualized
viewer (rendering only the pages a user has scrolled to) would make search silently
fail on every page the user hasn't visited yet — the kind of bug that's invisible in
a quick demo and only shows up when someone searches for something on page 30.

The fix: separate the two things a PDF page render actually does. A page's pdf.js
**text layer** is cheap (invisible DOM text) and is always mounted for every page, so
search always has something to match against. A page's **canvas image** is the
expensive part, and is the only thing actually virtualized, gated behind an
`IntersectionObserver`. That decision — identified and made before any of the PDF
viewer code was written — is what let the rest of that component be built with
confidence instead of trial and error.

A second problem, much smaller in scope but nastier to pin down, showed up later
while adding the issue-list search bar: `position: sticky` on the search box wasn't
sticking — it scrolled away with the rest of the sidebar instead of pinning below the
sort toggle. This is the kind of bug where the obvious suspects (a `z-index` conflict,
an `overflow: hidden` on some ancestor) weren't it, and neither MUI's nor Chromium's
own docs fully explain the exact failure mode. I isolated it empirically: dropped a
raw, unstyled `<div style="position: sticky">` directly into the same scroll
container, outside any of the app's components, to separate "is this a browser/CSS
fact about this DOM structure" from "is this something specific to how I've built
this." That raw element also failed to stick, which pointed at the DOM structure
itself rather than any MUI component. From there it was a process of removing
wrapping elements one at a time until it started working — the fix was deleting one
unnecessary wrapping `<Box>` around the search bar (see the comment in
`src/components/IssueList/IssueList.tsx`, "Fragment, not a wrapping Box"). The
practical lesson, not obvious from either library's documentation: a sticky
element's positioning is bounded by its immediate parent's box, so a wrapper that
collapses to exactly fit its sticky child leaves that child no room to move within —
it just scrolls normally instead of pinning.

## Iterating past the acceptance criteria

Once the three acceptance criteria (Cmd+F search, submit gating, blocking-reason
messaging) were met, I asked myself honestly what a reviewer opening this page would
actually want next, rather than stopping at "technically done." That pass added: a
floating PDF toolbar (page-number jump, previous/next page, previous/next *page with
an issue* — jumping straight between the pages that actually need attention — and
zoom in/out/reset); a search box scoped to the issue list itself (distinct from the
PDF's native Cmd+F); sticky severity-section headers so a long Critical or Major list
never scrolls its own label out of view; a PDF-centering fix so narrower pages don't
render flush against the left edge; and a restrained visual pass on the header and
submission bar using HomeVision's actual brand purple (`#4f46e5`, taken from their
real stylesheet) — kept strictly functional (buttons, the status chip, focus states,
toolbar badges), never as decorative surface color. Two earlier, more heavily
branded versions of that last piece (a full custom theme with swapped fonts and a
gradient AppBar; later, just a gradient accent strip) were built and then reverted
after actually looking at them live — MUI's default look is tuned as a system, and
partially swapping pieces out of it read as less polished, not more.

## Judgment calls worth naming

A few decisions were deliberately *not* obvious defaults, and I'd defend each one
specifically rather than say "it seemed right":

- **No in-app "mark issue as resolved" control.** The data model (`review_mock.json`)
  has no `resolved` field on an issue, and the product flow described in the brief is
  explicit that resolution happens by fixing the document externally and re-uploading
  a new version — not by interacting with this page. Building a resolve-checkbox UI
  would have invented state the product doesn't have and misrepresented how the real
  workflow works.
- **Grouping issues by severity, with only the Minor group collapsible.** Critical and
  Major issues are what block submission, so they're always fully visible — no risk
  of a user collapsing them and losing track of what's blocking them. Minor issues
  carry no such risk, so they're the only group given a decluttering affordance.
- **A muted, separate line for "N minor issues, not blocking" in the submit bar**,
  rather than folding that count into the same sentence as the blocking-issue count —
  the urgent message and the informational one have different jobs and shouldn't
  compete for attention in the same alert.

## Where I drew the scope line

Given the time available, I prioritized getting the core interaction (PDF + search +
gating) unambiguously correct over breadth of polish. Concretely: the submit-gating
logic and severity/sorting logic are covered by a real unit test suite (`npm run
test`) since that logic is exactly the part a bug would be easiest to ship silently;
a handful of production-readiness gaps that were out of scope for a take-home are
called out as `// PRODUCTION:` comments at the exact line they apply to, rather than
either fixed pre-emptively or left unmentioned. See `README.md`'s "Production
readiness" section for the fuller list and reasoning.
