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
// Beyond this many pages away, jump instantly instead of animating — long smooth
// scrolls rasterize every intermediate page (see PdfPage's IntersectionObserver
// PRODUCTION comment) even though the user never intends to look at them.
const LONG_JUMP_PAGE_THRESHOLD = 5
// Below this PDF-pane width, the page-nav and zoom toolbars no longer fit side by
// side without overlapping (page-nav pill ~304px + zoom pill ~136px).
const NARROW_VIEWER_BREAKPOINT = 640

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
  const currentPageRef = useRef(currentPage)

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

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

  // Shared by issue-click navigation (via scrollRequest below) and the toolbar's
  // page-jump control, so scroll/highlight/focus logic lives in one place.
  const scrollToPage = useCallback((pageNum: number) => {
    const target = pageRefs.current.get(pageNum)
    if (!target) return

    // Nearby jumps animate smoothly; long-distance jumps go instant instead of
    // animating past dozens of pages the user isn't actually looking at.
    const distance = Math.abs(pageNum - currentPageRef.current)
    const behavior: ScrollBehavior = distance > LONG_JUMP_PAGE_THRESHOLD ? 'auto' : 'smooth'
    target.scrollIntoView({ behavior, block: 'start' })
    // Moves keyboard/screen-reader focus along with the scroll, so navigation
    // isn't purely visual.
    target.focus({ preventScroll: true })
    setHighlightedPage(pageNum)
    setCurrentPage(pageNum)

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedPage(null), HIGHLIGHT_DURATION_MS)
  }, [])

  // Tracks the current page for the toolbar, including manual scrolling (not just
  // toolbar-triggered jumps), so "next page" always means next from wherever the
  // user actually is.
  //
  // Uses 'scrollend' instead of 'scroll': scroll fires constantly during a smooth-
  // scroll animation and would race with scrollToPage's own immediate
  // setCurrentPage() above, briefly showing the previous page mid-animation.
  // scrollend only fires once the scroll has settled.
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

  // Re-anchors scroll position to the page already in view when zoom changes the
  // rendered width, so the layout shift doesn't leave the user at an arbitrary
  // point. Instant, and skips scrollToPage's highlight/focus side effects — this
  // isn't navigation, just staying in place.
  // oxlint-disable react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const target = pageRefs.current.get(currentPage)
    if (!target) return
    target.scrollIntoView({ behavior: 'auto', block: 'start' })
    // Keyed only on zoomLevel: currentPage/pageRefs are read, not reacted to.
    // Re-running on every currentPage change would fight normal scrolling.
  }, [zoomLevel])
  // oxlint-enable react-hooks/exhaustive-deps

  // Deduped, page-ascending: issue navigation follows document order, and
  // multiple issues on one page count as a single stop.
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
        {/* Centers the page stack — without this constrained width, each page's
            wrapper stretches full width and narrower content sits flush-left. Beyond
            100% zoom, pageWidth can exceed the container; overflowX handles it. */}
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
        isNarrow={containerWidth > 0 && containerWidth < NARROW_VIEWER_BREAKPOINT}
      />
    </Box>
  )
}
