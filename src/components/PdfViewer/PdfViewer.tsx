import { useEffect, useRef, useState } from 'react'
import { Document } from 'react-pdf'
import { Alert, Box, CircularProgress } from '@mui/material'
import { PdfPage } from './PdfPage'
import type { ReviewDocument } from '../../types/review'
import '../../lib/pdfWorker'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

const MAX_PAGE_WIDTH = 760
const HIGHLIGHT_DURATION_MS = 1600

export interface PdfScrollRequest {
  page: number
  // Bumped on every request so re-clicking the same issue still scrolls/re-highlights.
  token: number
}

interface PdfViewerProps {
  doc: ReviewDocument
  scrollRequest: PdfScrollRequest | null
}

export function PdfViewer({ doc, scrollRequest }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [containerWidth, setContainerWidth] = useState(0)
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!scrollRequest) return
    const target = pageRefs.current.get(scrollRequest.page)
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Moves keyboard/screen-reader focus along with the visual scroll — without this,
    // clicking an issue only *looks* like navigation to a sighted mouse user.
    target.focus({ preventScroll: true })
    setHighlightedPage(scrollRequest.page)
    const timeout = setTimeout(() => setHighlightedPage(null), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [scrollRequest])

  const registerRef = (pageNum: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(pageNum, el)
    else pageRefs.current.delete(pageNum)
  }

  const pageWidth = Math.min(MAX_PAGE_WIDTH, containerWidth > 32 ? containerWidth - 32 : MAX_PAGE_WIDTH)

  return (
    <Box ref={containerRef} sx={{ height: '100%', overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
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
  )
}
