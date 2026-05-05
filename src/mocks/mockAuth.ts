// Mock users only loaded in development — tree-shaken from production builds
export const getMockUsers = (): Record<string, { id: string; email: string; password: string; full_name: string }> => ({
  'dev@example.com': { id: 'dev-user', email: 'dev@example.com', password: 'password', full_name: 'Dev User' },
})
