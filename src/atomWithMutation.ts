import { DocumentInput } from '@urql/core'
import type { AnyVariables, Client, OperationContext } from '@urql/core'
import { atom } from 'jotai/vanilla'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { pipe, subscribe } from 'wonka'
import { clientAtom } from './clientAtom'
import {
  type InitialOperationResult,
  urqlReactCompatibleInitialState,
} from './common'

export type AtomWithMutation<
  Data,
  Variables extends AnyVariables
> = WritableAtom<
  InitialOperationResult<Data, Variables>,
  [Variables, Partial<OperationContext>] | [Variables],
  Promise<InitialOperationResult<Data, Variables>>
>

export function atomWithMutation<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
>(
  query: DocumentInput<Data, Variables>,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): AtomWithMutation<Data, Variables> {
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
      const source = getClient(get).mutation(query, args[0], args[1])
      pipe(
        source,
        subscribe((result) => set(atomDataBase, result))
      )

      return source.toPromise()
    }
  )

  return atomData
}
