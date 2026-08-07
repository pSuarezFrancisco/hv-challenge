import { ListItemButton, ListItemText, Chip, Stack, Typography } from '@mui/material'
import type { Issue } from '../../types/review'
import { SEVERITY_COLOR, SEVERITY_LABEL } from './severity'

interface IssueListItemProps {
  issue: Issue
  onClick: (issue: Issue) => void
}

export function IssueListItem({ issue, onClick }: IssueListItemProps) {
  return (
    <ListItemButton
      onClick={() => onClick(issue)}
      alignItems="flex-start"
      sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
    >
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Chip
              label={SEVERITY_LABEL[issue.severity]}
              color={SEVERITY_COLOR[issue.severity]}
              size="small"
              variant={issue.severity === 'minor' ? 'outlined' : 'filled'}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {issue.title}
            </Typography>
          </Stack>
        }
        secondary={
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ display: 'block' }}
            >
              {issue.description}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="span">
              Page {issue.page}
            </Typography>
          </>
        }
      />
    </ListItemButton>
  )
}
