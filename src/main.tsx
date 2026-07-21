import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createIDBPersister } from './lib/queryPersister'
import { ThemeProvider } from './components/theme-provider'
import { I18nProvider } from './lib/i18n'
import { injectSpeedInsights } from '@vercel/speed-insights'
import './index.css'
import App from './App.tsx'

// Inject Speed Insights for Vercel performance monitoring
injectSpeedInsights()

const PERSIST_BLOCKLIST = ['auth'] // keys whose root matches are never persisted

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible global defaults so new hooks that forget staleTime don't
      // refetch on every mount/focus. Individual hooks can override.
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep data in memory long enough for offline reuse
      retry: 1,
      refetchOnWindowFocus: true,
      placeholderData: keepPreviousData, // smooth offline-to-online transitions
    },
  },
})

// ─── Persist React Query cache to IndexedDB for offline support ─────────────
// Restores cached data on reload so pages render even when offline. The
// `shouldDehydrateQuery` predicate skips auth and failed queries.
const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24 // 24 hours

persistQueryClient({
  queryClient,
  persister: createIDBPersister(),
  maxAge: MAX_CACHE_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Never persist the auth query — would leak/restore stale sessions.
      if (PERSIST_BLOCKLIST.includes(query.queryKey[0] as string)) return false
      // Only persist successful queries.
      return query.state.status === 'success'
    },
  },
})

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
