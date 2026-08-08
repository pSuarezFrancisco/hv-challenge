import { createTheme } from '@mui/material'

// Primary color from homevision.co's own stylesheet (--base--purple). Applied only
// to the app's primary actions/accents (buttons, status chip, focus highlight) —
// not to severity chips or alerts, which keep their semantic red/orange/grey
// regardless of brand color. Everything else (typography, shape, shadows) stays
// MUI's default — those defaults are tuned specifically around Roboto and MUI's own
// component proportions, and swapping them out fought the framework more than it
// added polish.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
      dark: '#3730a3',
    },
  },
})
