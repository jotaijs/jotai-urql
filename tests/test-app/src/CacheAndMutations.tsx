import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { atomWithMutation, atomWithQuery } from '../../../src'
import { generateUrqlClient } from './client'

const client = generateUrqlClient()

type Burger = { id: string; name: string; price: number }

const burgersAtom = atomWithQuery<{ burgers: Burger[] }>({
  query: `query Index_Burgers {
  burgers {
    id
    name
    price
  }
}`,
  getClient: () => client,
})

const burgerCreateAtom = atomWithMutation<{ burgerCreate: Burger }>(
  `mutation {
  burgerCreate {
    id
    name
    price
  }
}`,
  () => client
)

const Burgers = () => {
  const [opResult] = useAtom(burgersAtom)
  const [mutationOpResult, mutate] = useAtom(burgerCreateAtom)
  const burgers = opResult?.data?.burgers
  const burger = mutationOpResult.data?.burgerCreate

  if (!burgers) throw new Error('No burgers loaded!')

  return (
    <main>
      <table data-testid="query-table">
        <tbody>
          {burgers.map((burger) => (
            <tr key={burger.id}>
              <td>{burger.id}</td>
              <td>{burger.name}</td>
              <td>{burger.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => mutate({})}>mutate</button>
      {burger && (
        <table data-testid="mutation-table">
          <tbody>
            <tr>
              <td>{burger.id}</td>
              <td>{burger.name}</td>
              <td>{burger.price}</td>
            </tr>
          </tbody>
        </table>
      )}
    </main>
  )
}

export const CacheAndMutations = () => {
  return (
    <Suspense fallback="loading">
      <Burgers />
    </Suspense>
  )
}
