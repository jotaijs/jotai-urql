import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { atomsWithMutation, atomsWithQuery } from '../../../src'
import { generateUrqlClient } from './client'

const client = generateUrqlClient()

type Burger = { id: string; name: string; price: number }

const [burgersAtom] = atomsWithQuery<{ burgers: Burger[] }, undefined>(
  `query Index_Burgers {
  burgers {
    id
    name
    price
  }
}`,
  () => undefined,
  undefined,
  () => client
)

const burgerCreateAtom = atomsWithMutation<{ burgerCreate: Burger }, undefined>(
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
  const [data] = useAtom(burgersAtom)
  const [mutationOpResult, mutate] = useAtom(burgerCreateAtom)
  const burgers = data.burgers
  const burger = mutationOpResult.data?.burgerCreate

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
      <button onClick={() => mutate(undefined)}>mutate</button>
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
