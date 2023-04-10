import { describe, expect, it } from 'vitest'
import {
  atomsWithMutation,
  atomsWithQuery,
  atomsWithSubscription,
  clientAtom,
} from '../../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(clientAtom).toBeDefined()
    expect(atomsWithQuery).toBeDefined()
    expect(atomsWithMutation).toBeDefined()
    expect(atomsWithSubscription).toBeDefined()
  })
})
