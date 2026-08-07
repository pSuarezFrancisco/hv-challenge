export type ReviewStatus = 'created' | 'processing' | 'on_review' | 'submitted'

export type IssueSeverity = 'critical' | 'major' | 'minor'

export interface Issue {
  id: string
  title: string
  description: string
  severity: IssueSeverity
  page: number
}

export interface DocumentPage {
  page_num: number
  height: number
  width: number
}

export interface ReviewDocument {
  pdf_url: string
  pages: DocumentPage[]
}

export interface ReviewUser {
  id: string
  first_name: string
  last_name: string
}

export interface Review {
  id: string
  name: string
  uploaded_at: string
  status: ReviewStatus
  version: number
  document: ReviewDocument
  user: ReviewUser
  issues: Issue[]
}
