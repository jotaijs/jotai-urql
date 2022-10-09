import {
  atomsWithUrqlMutation,
  atomsWithUrqlQuery,
  atomsWithUrqlSubscription,
  clientAtom,
} from '../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(clientAtom).toBeDefined()
    expect(atomsWithUrqlQuery).toBeDefined()
    expect(atomsWithUrqlMutation).toBeDefined()
    expect(atomsWithUrqlSubscription).toBeDefined()
  })
})
