import type { AnyVariables } from '@urql/core'
import { Client, DocumentInput, OperationContext } from '@urql/core'
import { WritableAtom, atom } from 'jotai/vanilla'
import type { Getter } from 'jotai/vanilla'
import { pipe, subscribe } from 'wonka'
import { clientAtom } from './clientAtom'
import {
  InitialOperationResult,
  urqlReactCompatibleInitialState,
} from './common'

export type AtomWithLazyQuery<
  Data,
  Variables extends AnyVariables
> = WritableAtom<
  InitialOperationResult<Data, Variables>,
  [Variables, Partial<OperationContext>] | [Variables],
  Promise<InitialOperationResult<Data, Variables>>
>

export function atomWithLazyQuery<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
>(
  query: DocumentInput<Data, Variables>,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): AtomWithLazyQuery<Data, Variables> {
  const atomDataBase = atom<InitialOperationResult<Data, Variables>>(
    urqlReactCompatibleInitialState
  )
  atomDataBase.onMount = (setAtom) => {
    return () => {
      // Clean up the atom cache on unmount
      setAtom(urqlReactCompatibleInitialState)
    }
  }
  const atomData = atom<
    InitialOperationResult<Data, Variables>,
    [Variables, Partial<OperationContext>] | [Variables],
    Promise<InitialOperationResult<Data, Variables>>
  >(
    (get) => {
      return get(atomDataBase)
    },
    (get, set, ...args) => {
      const source = getClient(get).query(query, args[0], {
        requestPolicy: 'network-only',
        ...(args[1] ? args[1] : {}),
      })
      pipe(
        source,
        subscribe((result) => set(atomDataBase, result))
      )

      return source.toPromise()
    }
  )

  return atomData
}
