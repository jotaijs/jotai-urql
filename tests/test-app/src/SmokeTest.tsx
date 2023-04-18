import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { atomWithQuery } from '../../../src'
import { generateUrqlClient } from './client'
import { ErrorBoundary } from './ErrorBoundary'

const client = generateUrqlClient()

const countQueryAtom = atomWithQuery<{ count: number }>({
  query: 'query Count { count }',
  getClient: () => client,
})

const Counter = () => {
  const [{ error, stale, data }, dispatch] = useAtom(countQueryAtom)

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

export const SmokeTest = () => {
  // This needs to be useAtom and not useSetAtom, as otherwise reexecute won't trigger (it gets ignored by client if there is no subscribers to the query)
  const [, dispatch] = useAtom(countQueryAtom)
  return (
    <ErrorBoundary retry={() => dispatch({ requestPolicy: 'network-only' })}>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </ErrorBoundary>
  )
}
