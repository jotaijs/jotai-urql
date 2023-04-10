import React, { StrictMode, Suspense } from 'react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { Client } from '@urql/core'
import { useAtom } from 'jotai/react'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { fromValue, pipe, take, toPromise } from 'wonka'
import { atomsWithMutation } from '../../src/index'

const withPromise = (source$: any) => {
  source$.toPromise = () => pipe(source$, take(1), toPromise)
  return source$
}

const generateClient = (error?: () => boolean) =>
  ({
    mutation: () => {
      const source$ = withPromise(
        fromValue(
          error?.()
            ? { error: new Error('fetch error') }
            : { data: { count: 1 } }
        )
      )
      return source$
    },
  } as unknown as Client)

afterEach(() => {
  cleanup()
})

it('mutation basic test', async () => {
  const client = generateClient()
  const testAtom = atomsWithMutation<{ count: number }, Record<string, never>>(
    'mutation Test { count }',
    () => client
  )

  const Counter = () => {
    const [opResult] = useAtom(testAtom)
    if (!opResult.data) {
      return <div>no data</div>
    }

    return (
      <>
        <div>count: {opResult?.data.count}</div>
      </>
    )
  }

  const Controls = () => {
    const [, mutate] = useAtom(testAtom)
    return <button onClick={() => mutate({})}>mutate</button>
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <Controls />
    </StrictMode>
  )
  // No suspense is triggered is expected.
  await findByText('no data')
  fireEvent.click(getByText('mutate'))
  await findByText('count: 1')
})

describe('error handling', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterAll(() => {
    vi.resetAllMocks()
  })
  it('mutation error test', async () => {
    const client = generateClient(() => true)
    const countAtom = atomsWithMutation<
      { count: number },
      Record<string, never>
    >('mutation Test { count }', () => client)

    const Counter = () => {
      const [opResult] = useAtom(countAtom)

      if (!opResult.data) {
        return <div>no data</div>
      }

      return (
        <>
          <div>count: {opResult.data.count}</div>
        </>
      )
    }

    let errored = false
    const Controls = () => {
      const [, mutate] = useAtom(countAtom)
      const handleClick = async () => {
        const result = await mutate({})
        if (result.error) {
          errored = true
        }
      }
      return <button onClick={handleClick}>mutate</button>
    }

    const { getByText, findByText } = render(
      <StrictMode>
        <Suspense fallback="loading">
          <Counter />
        </Suspense>
        <Controls />
      </StrictMode>
    )

    // No suspense is triggered is expected.
    await findByText('no data')
    fireEvent.click(getByText('mutate'))
    await waitFor(() => {
      expect(errored).toBe(true)
    })
  })
})
