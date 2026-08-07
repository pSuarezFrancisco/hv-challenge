import reviewMock from './reviewMock.json'
import type { Review } from '../types/review'

const MOCK_LATENCY_MS = 600

// Stands in for a real API call: the submit endpoint doesn't exist yet, so this
// resolves review_mock.json after a short delay to give the UI a real loading state.
//
// PRODUCTION: document.pdf_url here points at a public, unauthenticated static file
// (public/example_document.pdf). A real review can contain PII (name, address,
// financials — see the mock data), so the real endpoint needs to return an
// access-controlled URL (e.g. a short-lived signed URL) rather than a public path.
export function fetchReview(): Promise<Review> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(reviewMock as Review), MOCK_LATENCY_MS)
  })
}
