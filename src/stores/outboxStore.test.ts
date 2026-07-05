import { describe, it, expect, beforeEach } from 'vitest'
import { useOutboxStore, MAX_OFFLINE_ENTRIES } from './outboxStore'
import type { CreateTransactionInput } from '@/types'

const sampleInput: CreateTransactionInput = {
  type: 'expense',
  amount: 100,
  transaction_date: '2026-07-05',
  wallet_id: 'w1',
}

beforeEach(() => {
  useOutboxStore.setState({ entries: [] })
  localStorage.clear()
})

describe('outboxStore', () => {
  it('add() creates a pending entry with tempId', () => {
    const tempId = useOutboxStore.getState().add('create', sampleInput)
    expect(tempId).toBeTruthy()
    const entries = useOutboxStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('pending')
    expect(entries[0].attempts).toBe(0)
  })

  it('updateStatus() marks failed and increments attempts', () => {
    const tempId = useOutboxStore.getState().add('create', sampleInput)
    useOutboxStore.getState().updateStatus(tempId, 'failed', 'network')
    const e = useOutboxStore.getState().entries[0]
    expect(e.status).toBe('failed')
    expect(e.attempts).toBe(1)
    expect(e.lastError).toBe('network')
  })

  it('remove() deletes entry', () => {
    const tempId = useOutboxStore.getState().add('create', sampleInput)
    useOutboxStore.getState().remove(tempId)
    expect(useOutboxStore.getState().entries).toHaveLength(0)
  })

  it('clearFailed() removes only failed entries', () => {
    const id1 = useOutboxStore.getState().add('create', { ...sampleInput, amount: 1 })
    const id2 = useOutboxStore.getState().add('create', { ...sampleInput, amount: 2 })
    useOutboxStore.getState().updateStatus(id1, 'failed', 'err')
    useOutboxStore.getState().clearFailed()
    const remaining = useOutboxStore.getState().entries
    expect(remaining).toHaveLength(1)
    expect(remaining[0].tempId).toBe(id2)
  })

  it('getPending() returns only pending entries', () => {
    const id1 = useOutboxStore.getState().add('create', { ...sampleInput, amount: 1 })
    useOutboxStore.getState().add('create', { ...sampleInput, amount: 2 })
    useOutboxStore.getState().updateStatus(id1, 'syncing')
    const pending = useOutboxStore.getState().getPending()
    expect(pending).toHaveLength(1)
  })

  it(`add() throws when reaching MAX_OFFLINE_ENTRIES (${MAX_OFFLINE_ENTRIES})`, () => {
    for (let i = 0; i < MAX_OFFLINE_ENTRIES; i++) {
      useOutboxStore.getState().add('create', { ...sampleInput, amount: i })
    }
    expect(useOutboxStore.getState().entries).toHaveLength(MAX_OFFLINE_ENTRIES)
    expect(() =>
      useOutboxStore.getState().add('create', { ...sampleInput, amount: 99 })
    ).toThrow('OUTBOX_FULL')
    // Vẫn đúng MAX_OFFLINE_ENTRIES, không thêm entry thừa
    expect(useOutboxStore.getState().entries).toHaveLength(MAX_OFFLINE_ENTRIES)
  })
})
