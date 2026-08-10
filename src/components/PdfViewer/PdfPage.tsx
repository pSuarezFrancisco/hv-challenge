import { useEffect, useRef, useState } from 'react'
import { Page } from 'react-pdf'
import { useTheme } from '@mui/material'
import type { DocumentPage } from '../../types/review'

interface PdfPageProps {
  page: DocumentPage
  width: number
  isHighlighted: boolean
  registerRef: (pageNum: number, el: HTMLDivElement | null) => void
}

// Canvas rendering is virtualized (only pages near the viewport pay the cost of
// rasterizing), but the text layer is always requested so Cmd+F / Ctrl+F can find
// text on pages the user hasn't scrolled to yet.
export function PdfPage({ page, width, isHighlighted, registerRef }: PdfPageProps) {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    // PRODUCTION: isNearViewport only ever goes true, never back to false — a
    // rasterized page stays in memory for the session. Fine at 34 pages; a much
    // longer document would need to release canvases that scroll far out of view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNearViewport(true)
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const height = width * (page.height / page.width)

  return (
    <div
      ref={(el) => {
        wrapperRef.current = el
        registerRef(page.page_num, el)
      }}
      data-page-number={page.page_num}
      tabIndex={-1}
      aria-label={`Page ${page.page_num}`}
      style={{
        minHeight: height,
        boxShadow: isHighlighted
          ? `0 0 0 3px ${theme.palette.primary.main}`
          : '0 0 0 1px rgba(0, 0, 0, 0.12)',
        transition: 'box-shadow 0.3s ease',
        marginBottom: 16,
      }}
    >
      <Page
        pageNumber={page.page_num}
        width={width}
        renderMode={isNearViewport ? 'canvas' : 'none'}
        renderTextLayer
        renderAnnotationLayer={false}
        loading=""
      />
    </div>
  )
}
