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
