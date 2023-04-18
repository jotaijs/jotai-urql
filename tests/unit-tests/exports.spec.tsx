import { describe, expect, it } from 'vitest'
import {
  atomWithMutation,
  atomWithQuery,
  atomWithSubscription,
  clientAtom,
  suspenseAtom,
} from '../../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(clientAtom).toBeDefined()
    expect(atomWithQuery).toBeDefined()
    expect(atomWithMutation).toBeDefined()
    expect(atomWithSubscription).toBeDefined()
    expect(suspenseAtom).toBeDefined()
  })
})
