import { useCallback, useEffect, useState } from 'react'
import { fetchReview } from '../data/fetchReview'
import type { Review } from '../types/review'

type ReviewLoadState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success' }

// PRODUCTION: this hand-rolls what a real data-fetching library (TanStack Query,
// RTK Query) gives for free — caching, request dedup, background refetch, and
// invalidation after a successful submit. Worth the swap once there's a real API
// and more than one page/component that needs this data.
export function useReview() {
  const [review, setReview] = useState<Review | null>(null)
  const [loadState, setLoadState] = useState<ReviewLoadState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })

    fetchReview()
      .then((data) => {
        if (cancelled) return
        setReview(data)
        setLoadState({ status: 'success' })
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

  return { review, setReview, loadState, retry }
}
