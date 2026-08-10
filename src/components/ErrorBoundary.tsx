import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Box } from '@mui/material'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Alert severity="error">Something went wrong. Please reload the page.</Alert>
        </Box>
      )
    }

    return this.props.children
  }
}
