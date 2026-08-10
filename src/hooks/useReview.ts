import { useCallback, useEffect, useState } from 'react'
import { fetchReview } from '../data/fetchReview'
import type { Review } from '../types/review'

type ReviewLoadState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; review: Review }

// PRODUCTION: this hand-rolls what a real data-fetching library (TanStack Query,
// RTK Query) gives for free — caching, request dedup, background refetch, and
// invalidation after a successful submit. Worth the swap once there's a real API
// and more than one page/component that needs this data.
export function useReview() {
  const [loadState, setLoadState] = useState<ReviewLoadState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })

    fetchReview()
      .then((data) => {
        if (cancelled) return
        setLoadState({ status: 'success', review: data })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const normalizedError = error instanceof Error ? error : new Error(String(error))
        console.error('Failed to load review:', normalizedError)
        setLoadState({ status: 'error', error: normalizedError })
      })

    return () => {
      cancelled = true
    }
  }, [retryToken])

  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  // Only meaningful once loaded — a no-op if called from a stale closure while
  // loadState has since moved to 'loading' or 'error' (e.g. a retry firing mid-flight).
  const updateReview = useCallback((updater: (review: Review) => Review) => {
    setLoadState((prev) => (prev.status === 'success' ? { status: 'success', review: updater(prev.review) } : prev))
  }, [])

  return { loadState, retry, updateReview }
}
