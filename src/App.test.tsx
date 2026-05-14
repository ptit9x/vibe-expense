import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('App', () => {
    it('renders the App component', async () => {
        renderWithProviders(<App />)

        // Wait for loading to complete — app may show spinner initially
        // then either login page or dashboard depending on auth state
        await waitFor(() => {
            // In dev mode without Supabase, the app should render something meaningful
            expect(document.querySelector('.animate-spin')).toBeNull()
        }, { timeout: 3000 })
    })
})
