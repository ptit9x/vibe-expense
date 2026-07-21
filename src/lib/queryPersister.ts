import { get, set, del } from 'idb-keyval'
import type { Persister } from '@tanstack/react-query-persist-client'

/**
 * IndexedDB persister for TanStack Query — survives reloads and offline use.
 * Uses a single key 'react-query' in the default IDB store.
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (persistedClient) => {
      await set('react-query', persistedClient)
    },
    restoreClient: async () => {
      return await get('react-query')
    },
    removeClient: async () => {
      await del('react-query')
    },
  }
}
