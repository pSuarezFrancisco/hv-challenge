import { useState } from 'react'
import {
  List,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Issue, IssueSeverity } from '../../types/review'
import { SEVERITY_LABEL, groupBySeverity, sortByPage } from './severity'
import { IssueListItem } from './IssueListItem'

type SortMode = 'severity' | 'page'

interface IssueListProps {
  issues: Issue[]
  onIssueClick: (issue: Issue) => void
}

function SectionHeader({ severity, count }: { severity: IssueSeverity; count: number }) {
  return (
    <Typography variant="overline" color="text.secondary">
      {SEVERITY_LABEL[severity]} ({count})
    </Typography>
  )
}

function StaticSection({
  severity,
  issues,
  onIssueClick,
}: {
  severity: IssueSeverity
  issues: Issue[]
  onIssueClick: (issue: Issue) => void
}) {
  if (issues.length === 0) return null

  return (
    <Box>
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <SectionHeader severity={severity} count={issues.length} />
      </Box>
      <List disablePadding>
        {issues.map((issue) => (
          <IssueListItem key={issue.id} issue={issue} onClick={onIssueClick} />
        ))}
      </List>
    </Box>
  )
}

export function IssueList({ issues, onIssueClick }: IssueListProps) {
  const [sortMode, setSortMode] = useState<SortMode>('severity')
  const [minorExpanded, setMinorExpanded] = useState(true)

  if (issues.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No issues were found in this document.
        </Typography>
      </Box>
    )
  }

  const sortToggle = (
    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={sortMode}
        onChange={(_, value: SortMode | null) => value && setSortMode(value)}
      >
        <ToggleButton value="severity">By severity</ToggleButton>
        <ToggleButton value="page">By page</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )

  if (sortMode === 'page') {
    return (
      <Box>
        {sortToggle}
        <List disablePadding>
          {sortByPage(issues).map((issue) => (
            <IssueListItem key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </List>
      </Box>
    )
  }

  const groups = groupBySeverity(issues)

  return (
    <Box>
      {sortToggle}

      <StaticSection severity="critical" issues={groups.critical} onIssueClick={onIssueClick} />
      <StaticSection severity="major" issues={groups.major} onIssueClick={onIssueClick} />

      {groups.minor.length > 0 && (
        <Accordion
          disableGutters
          square
          expanded={minorExpanded}
          onChange={(_, expanded) => setMinorExpanded(expanded)}
          sx={{ '&:before': { display: 'none' }, boxShadow: 'none' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <SectionHeader severity="minor" count={groups.minor.length} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List disablePadding>
              {groups.minor.map((issue) => (
                <IssueListItem key={issue.id} issue={issue} onClick={onIssueClick} />
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
