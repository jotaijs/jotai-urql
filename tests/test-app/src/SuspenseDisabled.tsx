import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/react/utils'
import { atomWithQuery, suspenseAtom } from '../../../src'
import { generateUrqlClient } from './client'

const client = generateUrqlClient()

const countQueryAtom = atomWithQuery<{ count: number }>({
  query: 'query Count { count }',
  getClient: () => client,
})

const Counter = () => {
  const [opResult, dispatch] = useAtom(countQueryAtom)

  if (!opResult?.data) {
    return <div>non-suspended-loading</div>
  }
  const { error, stale, data } = opResult

  // This is needed to avoid return to the error boundary on retry. URQL react bindings suspend in this case. This needs to be fixed if possible.
  if (stale && error) {
    return <div>stale-with-error</div>
  }

  if (error) {
    throw error
  }

  return (
    <>
      {stale && <div>refetching stale</div>}
      <div>count: {data?.count}</div>
      <button onClick={() => dispatch({})}>refetch-wrong-policy</button>
      <button
        onClick={() =>
          dispatch({
            requestPolicy: 'network-only',
          })
        }>
        refetch-network-only
      </button>
      <button
        onClick={() =>
          dispatch({
            requestPolicy: 'cache-and-network',
          })
        }>
        refetch-cache-and-network
      </button>
    </>
  )
}

export const SuspenseDisabled = () => {
  // We disable suspense for this page.
  useHydrateAtoms([[suspenseAtom, false]])
  return (
    <Suspense fallback="loading">
      <Counter />
    </Suspense>
  )
}
