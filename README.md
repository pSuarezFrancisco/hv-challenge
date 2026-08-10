# HomeVision Frontend Take-Home — Review Page

A take-home challenge for a Front-end Developer role at HomeVision: build the
**Review Page** of HomeVision's Document Review product — the screen where a user
sees an uploaded document alongside the issues an AI backend found in it, and submits
once nothing is blocking them.

See [`DEVELOPMENT_APPROACH.md`](./DEVELOPMENT_APPROACH.md) for architecture
decisions, production-readiness notes, and which parts required the most thought.

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
a real loading state instead of rendering synchronously. The mock data has 4
critical, 8 major, and 13 minor issues (25 total) across 34 pages.

## What it does

- Renders the review's PDF and its issue list side by side, with the document name,
  uploader, upload date, version, and status shown in the header.
- Issues are grouped by severity (Critical / Major / Minor), with counts per section.
  Critical and Major are always visible; Minor is collapsible (expanded by default).
  A toggle switches to a flat view sorted by page number. Section headers stay
  pinned while scrolling, and a search box filters the list by title/description.
- Clicking an issue scrolls to that page, highlights it, and moves keyboard/
  screen-reader focus there.
- A floating toolbar over the PDF: page-number entry, previous/next page,
  previous/next page with an issue, and zoom in/out/reset.
- Submission is blocked while any `critical` or `major` issue is present; the
  banner states exactly how many of each, plus a separate line for non-blocking
  minor issues. `minor`-only reviews can submit.
- Submit transitions local state to `submitted` (no real endpoint exists yet).
- Load failures show a real error state with a working Retry button.
- Native Cmd+F/Ctrl+F searches the whole PDF, not just scrolled-into-view pages.

## Repo notes

`task-files/` holds the original challenge inputs (challenge description PDF, example
output PDF, `review_mock.json`) for local reference — it's git-ignored and not part of
the pushed repo, both to avoid duplicating `public/example_document.pdf` in git
history and because republishing the challenge's own materials isn't this repo's call
to make.
