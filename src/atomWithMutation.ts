import type {
  AnyVariables,
  Client,
  OperationContext,
  TypedDocumentNode,
} from '@urql/core'
import type { DocumentNode } from 'graphql'
import { atom } from 'jotai/vanilla'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { pipe, subscribe } from 'wonka'
import { clientAtom } from './clientAtom'
import {
  type InitialOperationResult,
  urqlReactCompatibleInitialState,
} from './common'

export function atomWithMutation<Data, Variables extends AnyVariables>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): WritableAtom<
  InitialOperationResult<Data, Variables>,
  [Variables, Partial<OperationContext>] | [Variables],
  Promise<InitialOperationResult<Data, Variables>>
> {
  const atomDataBase = atom<InitialOperationResult<Data, Variables>>(
    urqlReactCompatibleInitialState
  )
  atomDataBase.onMount = (setAtom) => {
    return () => {
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
