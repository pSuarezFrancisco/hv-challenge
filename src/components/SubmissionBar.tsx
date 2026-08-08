import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import type { Issue, ReviewStatus } from '../types/review'
import { describeBlockers, isBlockingSeverity } from './IssueList/severity'

interface SubmissionBarProps {
  issues: Issue[]
  status: ReviewStatus
  onSubmit: () => void
}

export function SubmissionBar({ issues, status, onSubmit }: SubmissionBarProps) {
  const blockingIssues = issues.filter((issue) => isBlockingSeverity(issue.severity))
  const minorCount = issues.filter((issue) => issue.severity === 'minor').length
  const isSubmitted = status === 'submitted'
  const canSubmit = blockingIssues.length === 0 && !isSubmitted

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'stretch' }}>
        <Box sx={{ flexGrow: 1 }}>
          {isSubmitted ? (
            <Alert severity="success" sx={{ py: 0 }}>
              This review has been submitted.
            </Alert>
          ) : blockingIssues.length > 0 ? (
            <Alert severity="error" sx={{ py: 0 }}>
              {describeBlockers(blockingIssues)}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ py: 0 }}>
              No blocking issues — this review is ready to submit.
            </Alert>
          )}
          {!isSubmitted && minorCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              There {minorCount === 1 ? 'is' : 'are'} also {minorCount} minor{' '}
              {minorCount === 1 ? 'issue' : 'issues'} that don't need to be resolved before
              submitting.
            </Typography>
          )}
        </Box>
        <Button variant="contained" disabled={!canSubmit} onClick={onSubmit}>
          {isSubmitted ? 'Submitted' : 'Submit review'}
        </Button>
      </Stack>
    </Box>
  )
}
