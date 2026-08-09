# Wireframes

Three low-fidelity wireframes documenting this page's actual layout structure and
interaction states, added as a bonus item during final review — **not** artifacts
from a design phase that preceded the code. This project was built the other way
around (see [`DEVELOPMENT_APPROACH.md`](../DEVELOPMENT_APPROACH.md): requirements
read first, then technology and architecture decisions made deliberately, then the
UI built directly against those decisions). These wireframes are a faithful,
after-the-fact structural record of what got built, useful on their own terms as
quick reference for layout/state without opening the running app.

- **`01-review-page-layout.svg`** — full page layout in the default (blocked-
  submission) state: header, issue sidebar (sort toggle, sticky search, severity
  sections with sticky headers, collapsible minor group), PDF pane with the floating
  page-navigation and zoom toolbars, and the submission bar. Numbered callouts tie
  back to the structural notes underneath.
- **`02-submission-bar-states.svg`** — the submission bar's three states side by
  side: blocked, ready-to-submit, and submitted.
- **`03-loading-error-states.svg`** — the two full-page states before a review has
  successfully loaded: loading spinner and load-failure with Retry.

## Opening them

Each file is a plain, self-contained SVG — open directly in a browser or any image
viewer, no tooling required.

## Importing into Figma

These were deliberately built as plain vector shapes (`rect`/`line`/`circle`/`text`
only — no filters, gradients, or embedded raster) so they survive Figma's SVG import
as real, editable layers rather than a flattened image:

1. Drag a `.svg` file directly onto a Figma canvas (or **File → Place image…** and
   select it).
2. Figma converts it into a layer group — each box, line, and text label becomes its
   own editable node you can restyle, regroup, or swap out.
3. Ungroup (`Shift+Cmd+G` / `Shift+Ctrl+G`) if you want to break it down further into
   individual layers.
