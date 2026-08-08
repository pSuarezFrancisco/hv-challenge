import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import './index.css'
import { theme } from './theme'
import App from './App.tsx'

// PRODUCTION: no ErrorBoundary in this tree — an unexpected render exception
// anywhere below (e.g. a pdf.js internal error) currently crashes to a blank
// screen instead of a recoverable fallback.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
