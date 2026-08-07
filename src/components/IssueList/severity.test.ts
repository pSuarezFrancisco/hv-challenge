import { describe, expect, it } from 'vitest'
import type { Issue } from '../../types/review'
import { describeBlockers, groupBySeverity, isBlockingSeverity, sortByPage } from './severity'

function makeIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'issue_x',
    title: 'Test issue',
    description: 'Test description',
    severity: 'minor',
    page: 1,
    ...overrides,
  }
}

describe('isBlockingSeverity', () => {
  it('treats critical and major as blocking', () => {
    expect(isBlockingSeverity('critical')).toBe(true)
    expect(isBlockingSeverity('major')).toBe(true)
  })

  it('does not treat minor as blocking', () => {
    expect(isBlockingSeverity('minor')).toBe(false)
  })
})

describe('sortByPage', () => {
  it('sorts ascending by page number', () => {
    const issues = [makeIssue({ id: 'a', page: 33 }), makeIssue({ id: 'b', page: 1 }), makeIssue({ id: 'c', page: 14 })]

    expect(sortByPage(issues).map((issue) => issue.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const issues = [makeIssue({ id: 'a', page: 2 }), makeIssue({ id: 'b', page: 1 })]
    const original = [...issues]

    sortByPage(issues)

    expect(issues).toEqual(original)
  })
})

describe('groupBySeverity', () => {
  it('buckets issues by severity and sorts each bucket by page', () => {
    const issues = [
      makeIssue({ id: 'crit-2', severity: 'critical', page: 33 }),
      makeIssue({ id: 'crit-1', severity: 'critical', page: 1 }),
      makeIssue({ id: 'major-1', severity: 'major', page: 5 }),
      makeIssue({ id: 'minor-1', severity: 'minor', page: 10 }),
    ]

    const groups = groupBySeverity(issues)

    expect(groups.critical.map((issue) => issue.id)).toEqual(['crit-1', 'crit-2'])
    expect(groups.major.map((issue) => issue.id)).toEqual(['major-1'])
    expect(groups.minor.map((issue) => issue.id)).toEqual(['minor-1'])
  })

  it('returns empty arrays for severities with no issues', () => {
    const groups = groupBySeverity([makeIssue({ severity: 'minor' })])

    expect(groups.critical).toEqual([])
    expect(groups.major).toEqual([])
  })
})

describe('describeBlockers', () => {
  it('describes a single critical issue in the singular', () => {
    const message = describeBlockers([makeIssue({ severity: 'critical' })])
    expect(message).toBe('1 critical issue must be resolved before this review can be submitted.')
  })

  it('describes multiple critical issues in the plural', () => {
    const message = describeBlockers([
      makeIssue({ id: 'a', severity: 'critical' }),
      makeIssue({ id: 'b', severity: 'critical' }),
    ])
    expect(message).toBe('2 critical issues must be resolved before this review can be submitted.')
  })

  it('combines critical and major counts in one sentence', () => {
    const message = describeBlockers([
      makeIssue({ id: 'a', severity: 'critical' }),
      makeIssue({ id: 'b', severity: 'critical' }),
      makeIssue({ id: 'c', severity: 'major' }),
    ])
    expect(message).toBe('2 critical and 1 major issues must be resolved before this review can be submitted.')
  })

  it('describes major-only blockers without mentioning critical', () => {
    const message = describeBlockers([makeIssue({ severity: 'major' })])
    expect(message).toBe('1 major issue must be resolved before this review can be submitted.')
  })
})
