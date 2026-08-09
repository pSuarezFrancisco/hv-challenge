import { useEffect, useState } from 'react'
import { Paper, Stack, Divider, TextField, Typography, IconButton, Tooltip, Badge, ButtonBase } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'

interface PdfToolbarProps {
  pageCount: number
  currentPage: number
  issuePages: number[]
  onJumpToPage: (pageNum: number) => void
  zoomLevel: number
  minZoom: number
  maxZoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  // Below the pane width where the page-nav and zoom pills would otherwise overlap
  // side by side, stack the zoom pill above the page-nav pill instead.
  isNarrow: boolean
}

export function PdfToolbar({
  pageCount,
  currentPage,
  issuePages,
  onJumpToPage,
  zoomLevel,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isNarrow,
}: PdfToolbarProps) {
  const [pageInput, setPageInput] = useState(String(currentPage))

  // Keeps the field showing where you actually are (after a jump, or as you scroll)
  // instead of going blank once you've navigated somewhere.
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  const handleJump = () => {
    const pageNum = Number(pageInput)
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > pageCount) return
    onJumpToPage(pageNum)
  }

  // issuePages is sorted ascending, so the previous/next flagged page relative to
  // wherever the viewer currently is are just the nearest neighbors around currentPage.
  const previousIssuePage = [...issuePages].reverse().find((page) => page < currentPage)
  const nextIssuePage = issuePages.find((page) => page > currentPage)

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          // Comfortably above pdf.js's own internal layers (its text layer sits at
          // z-index: 2), so the toolbar doesn't get visually buried under page content.
          zIndex: 10,
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Tooltip title="Previous page with issues">
            <span>
              <IconButton
                size="small"
                onClick={() => previousIssuePage !== undefined && onJumpToPage(previousIssuePage)}
                disabled={previousIssuePage === undefined}
                aria-label="Previous page with issues"
              >
                <Badge color="error" variant="dot" overlap="circular">
                  <SkipPreviousIcon fontSize="small" />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>
  
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
  
          <Tooltip title="Previous page">
            <span>
              <IconButton
                size="small"
                onClick={() => onJumpToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
  
          <TextField
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleJump()
            }}
            size="small"
            variant="outlined"
            sx={{ width: 64 }}
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                'aria-label': 'Go to page number',
                style: { textAlign: 'center' },
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            of {pageCount}
          </Typography>
          <Tooltip title="Go to page">
            <span>
              <IconButton size="small" onClick={handleJump} aria-label="Go to page">
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
  
          <Tooltip title="Next page">
            <span>
              <IconButton
                size="small"
                onClick={() => onJumpToPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                aria-label="Next page"
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
  
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
  
          <Tooltip title="Next page with issues">
            <span>
              <IconButton
                size="small"
                onClick={() => nextIssuePage !== undefined && onJumpToPage(nextIssuePage)}
                disabled={nextIssuePage === undefined}
                aria-label="Next page with issues"
              >
                <Badge color="error" variant="dot" overlap="circular">
                  <SkipNextIcon fontSize="small" />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          zIndex: 10,
          ...(isNarrow
            ? { bottom: 72, left: '50%', transform: 'translateX(-50%)' }
            : { bottom: 16, right: 16 }),
          px: 1,
          py: 0.5,
          borderRadius: 999,
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Tooltip title="Zoom out">
            <span>
              <IconButton size="small" onClick={onZoomOut} disabled={zoomLevel <= minZoom} aria-label="Zoom out">
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Reset zoom">
            <ButtonBase
              onClick={onResetZoom}
              sx={{ px: 1, py: 0.25, borderRadius: 1, minWidth: 48 }}
              aria-label={`Reset zoom, currently ${Math.round(zoomLevel * 100)}%`}
            >
              <Typography variant="body2" color="text.secondary">
                {Math.round(zoomLevel * 100)}%
              </Typography>
            </ButtonBase>
          </Tooltip>

          <Tooltip title="Zoom in">
            <span>
              <IconButton size="small" onClick={onZoomIn} disabled={zoomLevel >= maxZoom} aria-label="Zoom in">
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>
    </>
  )
}
