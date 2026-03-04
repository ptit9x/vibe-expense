import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
    it('renders the App component and navigates to login by default', () => {
        render(<App />)

        // Verify the login page is rendered
        expect(screen.getByText(/Welcome back/i, { selector: 'h1' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
    })
})
