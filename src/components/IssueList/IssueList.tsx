import { useEffect, useMemo, useState } from 'react'
import {
  List,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import type { Issue, IssueSeverity } from '../../types/review'
import { SEVERITY_LABEL, groupBySeverity, sortByPage } from './severity'
import { IssueListItem } from './IssueListItem'

type SortMode = 'severity' | 'page'

interface IssueListProps {
  issues: Issue[]
  onIssueClick: (issue: Issue) => void
}

// The sticky search bar (below) occupies this much height — severity section
// headers stick just beneath it (see stickyHeaderSx.top) rather than both
// competing for top: 0, so they stack cleanly instead of overlapping.
const SEARCH_BAR_HEIGHT = 65

function SectionHeader({ severity, count }: { severity: IssueSeverity; count: number }) {
  return (
    <Typography variant="overline" color="text.secondary">
      {SEVERITY_LABEL[severity]} ({count})
    </Typography>
  )
}

// Sticky within the sidebar's own scroll container: as you scroll through a long
// section, its header stays pinned so you never lose track of which severity
// you're looking at — the same "CRITICAL (4)" bar just stays put instead of
// scrolling away, and the next section's header takes over once you reach it.
const stickyHeaderSx = {
  position: 'sticky' as const,
  top: SEARCH_BAR_HEIGHT,
  zIndex: 1,
  bgcolor: 'grey.100',
  borderBottom: '1px solid',
  borderColor: 'divider',
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
      <Box sx={{ ...stickyHeaderSx, px: 2, py: 1 }}>
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

function matchesSearch(issue: Issue, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    issue.title.toLowerCase().includes(normalized) ||
    issue.description.toLowerCase().includes(normalized)
  )
}

export function IssueList({ issues, onIssueClick }: IssueListProps) {
  const [sortMode, setSortMode] = useState<SortMode>('severity')
  const [minorExpanded, setMinorExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIssues = useMemo(
    () => issues.filter((issue) => matchesSearch(issue, searchQuery)),
    [issues, searchQuery],
  )

  // A fresh search that turns up minor-only matches shouldn't hide behind a
  // collapsed accordion — but this only fires when the query itself changes, so
  // the user can still collapse it manually afterward without being fought.
  useEffect(() => {
    if (searchQuery.trim() !== '') setMinorExpanded(true)
  }, [searchQuery])

  if (issues.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No issues were found in this document.
        </Typography>
      </Box>
    )
  }

  // Sort toggle first: it's a set-once-and-forget control, so it scrolls away
  // naturally with the rest of the content. Search sticks below it — that's the
  // control worth adjusting mid-scroll, so it's the one that stays reachable.
  //
  // Fragment, not a wrapping Box: an extra plain Box here (verified empirically,
  // not just by inspection) silently broke the search box's position:sticky —
  // it kept moving 1:1 with scroll instead of pinning. Removing that one extra
  // wrapper level fixed it. Don't reintroduce a wrapper around these two blocks.
  const controls = (
    <>
      <Box sx={{ px: 1.5, pt: 1.5, pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={sortMode}
          onChange={(_, value: SortMode | null) => value && setSortMode(value)}
          sx={{ width: '100%' }}
        >
          <ToggleButton value="severity" sx={{ flex: 1, justifyContent: 'center' }}>
            By severity
          </ToggleButton>
          <ToggleButton value="page" sx={{ flex: 1, justifyContent: 'center' }}>
            By page
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search issues"
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': 'Search issues' },
          }}
        />
      </Box>
    </>
  )

  if (filteredIssues.length === 0) {
    return (
      <Box>
        {controls}
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No issues match your search.
          </Typography>
        </Box>
      </Box>
    )
  }

  if (sortMode === 'page') {
    return (
      <Box>
        {controls}
        <List disablePadding>
          {sortByPage(filteredIssues).map((issue) => (
            <IssueListItem key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </List>
      </Box>
    )
  }

  const groups = groupBySeverity(filteredIssues)

  return (
    <Box>
      {controls}

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
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={stickyHeaderSx}>
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
