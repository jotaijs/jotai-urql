import type { AnyVariables } from '@urql/core'
import { Client, DocumentInput, OperationContext } from '@urql/core'
import { WritableAtom, atom } from 'jotai/vanilla'
import type { Getter } from 'jotai/vanilla'
import { filter, pipe, subscribe } from 'wonka'
import { clientAtom } from './clientAtom'
import {
  InitialOperationResultLazy,
  urqlReactCompatibleInitialStateLazy,
} from './common'

export type AtomWithLazyQuery<
  Data,
  Variables extends AnyVariables
> = WritableAtom<
  InitialOperationResultLazy<Data, Variables>,
  [Variables, Partial<OperationContext>] | [Variables],
  Promise<InitialOperationResultLazy<Data, Variables>>
>

export function atomWithLazyQuery<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
>(
  query: DocumentInput<Data, Variables>,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): AtomWithLazyQuery<Data, Variables> {
  const atomDataBase = atom<InitialOperationResultLazy<Data, Variables>>(
    urqlReactCompatibleInitialStateLazy
  )
  atomDataBase.onMount = (setAtom) => {
    return () => {
      // Clean up the atom cache on unmount
      setAtom(urqlReactCompatibleInitialStateLazy)
    }
  }
  const atomData = atom<
    InitialOperationResultLazy<Data, Variables>,
    [Variables, Partial<OperationContext>] | [Variables],
    Promise<InitialOperationResultLazy<Data, Variables>>
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
        // This is needed so that the atom gets updated with loading states etc., but not with the final result that will be set by the promise
        filter((result) => result?.data === undefined),
        subscribe((result) => set(atomDataBase, { ...result, fetching: true }))
      )

      set(atomDataBase, {
        ...urqlReactCompatibleInitialStateLazy,
        fetching: true,
      })
      return source.toPromise().then((result) => {
        const mergedResult = { ...result, fetching: false }
        set(atomDataBase, mergedResult)
        return mergedResult
      })
    }
  )

  return atomData
}
