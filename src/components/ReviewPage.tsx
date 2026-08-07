import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { useReview } from '../hooks/useReview'
import { ReviewHeader } from './ReviewHeader'
import { IssueList } from './IssueList/IssueList'
import { SubmissionBar } from './SubmissionBar'
import { PdfViewer, type PdfScrollRequest } from './PdfViewer/PdfViewer'
import type { Issue } from '../types/review'

export function ReviewPage() {
  const { review, setReview, loadState, retry } = useReview()
  const [scrollRequest, setScrollRequest] = useState<PdfScrollRequest | null>(null)

  if (loadState.status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (loadState.status === 'error') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Retry
            </Button>
          }
        >
          Failed to load this review.
        </Alert>
      </Box>
    )
  }

  if (!review) {
    // status is 'success' but review hasn't landed in state on this render yet — the
    // hook always sets both together, so this is a defensive guard, not a real path.
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const handleIssueClick = (issue: Issue) => {
    setScrollRequest({ page: issue.page, token: Date.now() })
  }

  const handleSubmit = () => {
    setReview((prev) => (prev ? { ...prev, status: 'submitted' } : prev))
  }

  return (
    <Stack sx={{ height: '100vh' }}>
      <ReviewHeader review={review} />
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            width: 380,
            flexShrink: 0,
            overflowY: 'auto',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IssueList issues={review.issues} onIssueClick={handleIssueClick} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PdfViewer doc={review.document} scrollRequest={scrollRequest} />
        </Box>
      </Stack>
      <SubmissionBar issues={review.issues} status={review.status} onSubmit={handleSubmit} />
    </Stack>
  )
}
