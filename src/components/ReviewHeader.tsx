import { AppBar, Toolbar, Typography, Chip, Stack, Box } from '@mui/material'
import type { Review } from '../types/review'

const STATUS_LABEL: Record<Review['status'], string> = {
  created: 'Created',
  processing: 'Processing',
  on_review: 'On Review',
  submitted: 'Submitted',
}

interface ReviewHeaderProps {
  review: Review
}

const uploadedAtFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function ReviewHeader({ review }: ReviewHeaderProps) {
  const isSubmitted = review.status === 'submitted'

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {review.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uploaded by {review.user.first_name} {review.user.last_name} on{' '}
            {uploadedAtFormatter.format(new Date(review.uploaded_at))} · v{review.version}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label={STATUS_LABEL[review.status]}
            color={isSubmitted ? 'success' : 'primary'}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
