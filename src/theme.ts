import { createTheme } from '@mui/material'

// Primary color from homevision.co's own stylesheet (--base--purple), applied
// only to primary actions/accents (buttons, status chip, focus highlight) — not
// to severity chips or alerts, which keep their semantic red/orange/grey.
// Typography, shape, and shadows stay MUI's defaults, tuned around Roboto and
// MUI's own component proportions.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
      dark: '#3730a3',
    },
  },
})
