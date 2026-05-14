import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme-provider'
import { I18nProvider } from './lib/i18n'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/notifications'

const queryClient = new QueryClient()

// Register service worker for PWA + push notifications
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
