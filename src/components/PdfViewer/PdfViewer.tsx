import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Document } from 'react-pdf'
import { Alert, Box, CircularProgress } from '@mui/material'
import { PdfPage } from './PdfPage'
import { PdfToolbar } from './PdfToolbar'
import type { Issue, ReviewDocument } from '../../types/review'
import '../../lib/pdfWorker'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

const MAX_PAGE_WIDTH = 760
const HIGHLIGHT_DURATION_MS = 1600
const ZOOM_STEP = 0.25
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2

export interface PdfScrollRequest {
  page: number
  // Bumped on every request so re-clicking the same issue still scrolls/re-highlights.
  token: number
}

interface PdfViewerProps {
  doc: ReviewDocument
  issues: Issue[]
  scrollRequest: PdfScrollRequest | null
}

export function PdfViewer({ doc, issues, scrollRequest }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Shared by issue-click navigation (via the scrollRequest prop, below) and the
  // toolbar's own page-jump control, so there's one place that knows how to
  // scroll/highlight/focus a page rather than two divergent implementations.
  const scrollToPage = useCallback((pageNum: number) => {
    const target = pageRefs.current.get(pageNum)
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Moves keyboard/screen-reader focus along with the visual scroll — without this,
    // navigating only *looks* like navigation to a sighted mouse user.
    target.focus({ preventScroll: true })
    setHighlightedPage(pageNum)
    setCurrentPage(pageNum)

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedPage(null), HIGHLIGHT_DURATION_MS)
  }, [])

  // Tracks which page is "current" for the toolbar's page indicator and prev/next
  // buttons — not just after a toolbar-triggered jump, but as the user scrolls
  // manually too, so "next page" always means "next after wherever you actually are."
  //
  // Recalculates on 'scrollend' rather than every 'scroll' event: scrollToPage's own
  // immediate setCurrentPage() above already gives instant feedback on a jump/click,
  // and a smooth-scroll animation fires many 'scroll' events while it's still mid-
  // flight — recalculating on each of those raced against that immediate update and
  // could momentarily show the *previous* page before settling on the right one.
  // 'scrollend' only fires once the scroll (animated or manual) has actually settled,
  // so there's exactly one source of truth at a time instead of two competing ones.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateCurrentPage = () => {
      const containerTop = container.getBoundingClientRect().top
      let latestPage = doc.pages[0]?.page_num ?? 1

      for (const page of doc.pages) {
        const pageEl = pageRefs.current.get(page.page_num)
        if (!pageEl) continue
        const relativeTop = pageEl.getBoundingClientRect().top - containerTop
        if (relativeTop <= 100) {
          latestPage = page.page_num
        } else {
          break
        }
      }
      setCurrentPage(latestPage)
    }

    container.addEventListener('scrollend', updateCurrentPage, { passive: true })
    updateCurrentPage()

    return () => {
      container.removeEventListener('scrollend', updateCurrentPage)
    }
  }, [doc.pages, containerWidth])

  useEffect(() => {
    if (scrollRequest) scrollToPage(scrollRequest.page)
  }, [scrollRequest, scrollToPage])

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    }
  }, [])

  const registerRef = (pageNum: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(pageNum, el)
    else pageRefs.current.delete(pageNum)
  }

  const zoomIn = () => setZoomLevel((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100))
  const zoomOut = () => setZoomLevel((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100))
  const resetZoom = () => setZoomLevel(1)

  // Re-anchors the scroll position to whichever page was already in view whenever
  // zoom changes the rendered page width — otherwise the layout shift would leave
  // the user looking at an arbitrary, unrelated point in the document. Instant
  // (not smooth) and skips the highlight/focus side effects of scrollToPage, since
  // this isn't a navigation action — it's just "stay where I was."
  useLayoutEffect(() => {
    const target = pageRefs.current.get(currentPage)
    if (!target) return
    target.scrollIntoView({ behavior: 'auto', block: 'start' })
    // Deliberately keyed only on zoomLevel — currentPage/pageRefs are read here, not
    // reacted to; re-running this on every currentPage change would fight normal
    // scrolling instead of only correcting for zoom-driven layout shifts.
  }, [zoomLevel])

  // Deduped, page-ascending — issue navigation always follows physical document
  // order, and multiple issues sharing a page count as one stop (the sidebar shows
  // all of them once you're there; stepping through each individually would mean
  // some "next" clicks don't visibly move you anywhere).
  const issuePages = useMemo(
    () => [...new Set(issues.map((issue) => issue.page))].sort((a, b) => a - b),
    [issues],
  )

  // 100% zoom = the existing fit-to-container-capped-at-760px width; zoom scales
  // relative to that baseline rather than to the raw container width.
  const baseWidth = Math.min(MAX_PAGE_WIDTH, containerWidth > 32 ? containerWidth - 32 : MAX_PAGE_WIDTH)
  const pageWidth = baseWidth * zoomLevel

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box
        ref={containerRef}
        sx={{ height: '100%', overflowY: 'auto', overflowX: 'auto', p: 2, bgcolor: 'grey.100' }}
      >
        {/* Centers the page stack within the viewer pane — without a constrained width
            here, each page's block-level wrapper stretches full width and the
            narrower rendered page content sits flush-left instead of centered. Beyond
            100% zoom, pageWidth can exceed the container's own width, at which point
            this simply renders at its natural (wider) size and overflowX handles it. */}
        <Box sx={{ maxWidth: pageWidth, mx: 'auto' }}>
          <Document
            file={doc.pdf_url}
            onLoadError={(error) => setLoadError(error.message)}
            loading={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            }
            error={<Alert severity="error">Failed to load the document.</Alert>}
          >
            {containerWidth > 0 &&
              doc.pages.map((page) => (
                <PdfPage
                  key={page.page_num}
                  page={page}
                  width={pageWidth}
                  isHighlighted={highlightedPage === page.page_num}
                  registerRef={registerRef}
                />
              ))}
          </Document>
          {loadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {loadError}
            </Alert>
          )}
        </Box>
      </Box>
      <PdfToolbar
        pageCount={doc.pages.length}
        currentPage={currentPage}
        issuePages={issuePages}
        onJumpToPage={scrollToPage}
        zoomLevel={zoomLevel}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />
    </Box>
  )
}
