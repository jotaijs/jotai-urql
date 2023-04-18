import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { atom } from 'jotai/vanilla'
import { atomWithQuery } from '../../../src'
import { generateUrqlClient } from './client'

const client = generateUrqlClient()

const pauseAtom = atom(true)

const countQueryAtom = atomWithQuery<{ count: number }>({
  query: 'query Count { count }',
  getPause: (get) => get(pauseAtom),
  getClient: () => client,
})

const Counter = () => {
  const [opResult, dispatch] = useAtom(countQueryAtom)
  const [paused, setPause] = useAtom(pauseAtom)
  const { error, stale, data } = opResult

  if (error) {
    throw error
  }

  return (
    <>
      {stale && <div>refetching stale</div>}
      {paused && <div>paused</div>}
      <div>{data ? `count: ${data.count}` : 'query is paused'}</div>
      <button
        onClick={() => {
          setPause((it) => !it)
        }}>
        toggle pause
      </button>
      <button
        onClick={() =>
          dispatch({
            requestPolicy: 'network-only',
          })
        }>
        refetch-network-only
      </button>
    </>
  )
}

export const Paused = () => {
  return (
    <Suspense fallback="loading">
      <Counter />
    </Suspense>
  )
}
