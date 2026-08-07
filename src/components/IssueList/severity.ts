import type { Issue, IssueSeverity } from '../../types/review'

export const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
}

export const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
}

export const SEVERITY_COLOR: Record<IssueSeverity, 'error' | 'warning' | 'default'> = {
  critical: 'error',
  major: 'warning',
  minor: 'default',
}

export function isBlockingSeverity(severity: IssueSeverity): boolean {
  return severity === 'critical' || severity === 'major'
}

export function sortByPage(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => a.page - b.page)
}

// Groups by severity, page-ascending within each group.
export function groupBySeverity(issues: Issue[]): Record<IssueSeverity, Issue[]> {
  const groups: Record<IssueSeverity, Issue[]> = { critical: [], major: [], minor: [] }
  for (const issue of sortByPage(issues)) {
    groups[issue.severity].push(issue)
  }
  return groups
}

// Expects only blocking (critical/major) issues; caller filters first.
export function describeBlockers(blockingIssues: Issue[]): string {
  const criticalCount = blockingIssues.filter((issue) => issue.severity === 'critical').length
  const majorCount = blockingIssues.filter((issue) => issue.severity === 'major').length

  const parts: string[] = []
  if (criticalCount > 0) parts.push(`${criticalCount} critical`)
  if (majorCount > 0) parts.push(`${majorCount} major`)

  const issueWord = criticalCount + majorCount === 1 ? 'issue' : 'issues'
  return `${parts.join(' and ')} ${issueWord} must be resolved before this review can be submitted.`
}
