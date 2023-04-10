import type {
  AnyVariables,
  Client,
  Operation,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import type { DocumentNode } from 'graphql'
import type { Getter, WritableAtom } from 'jotai'
import { atom } from 'jotai'
import { pipe, subscribe } from 'wonka'
import { clientAtom } from './clientAtom'

type MutationAtomOperationResult<Data, Variables extends AnyVariables> = Omit<
  OperationResult<Data, Variables>,
  'operation'
> & {
  operation: Operation<Data, Variables> | undefined
}
// This is the same (aside from missing fetching and having hasNext) object shape as urql-react has by default while mutation is yet to be triggered
const urqlReactCompatibleInitialState = {
  stale: false,
  // Casting is needed to make typescript chill here as it tries here to be too smart
  error: undefined as any,
  data: undefined as any,
  extensions: undefined as any,
  hasNext: false,
  operation: undefined,
} as MutationAtomOperationResult<any, any>

export function atomsWithMutation<Data, Variables extends AnyVariables>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): WritableAtom<
  MutationAtomOperationResult<Data, Variables>,
  [Variables, Partial<OperationContext>] | [Variables],
  Promise<MutationAtomOperationResult<Data, Variables>>
> {
  const atomDataBase = atom<MutationAtomOperationResult<Data, Variables>>(
    urqlReactCompatibleInitialState
  )
  atomDataBase.onMount = (setAtom) => {
    return () => {
      setAtom(urqlReactCompatibleInitialState)
    }
  }
  const atomData = atom<
    MutationAtomOperationResult<Data, Variables>,
    [Variables, Partial<OperationContext>] | [Variables],
    Promise<MutationAtomOperationResult<Data, Variables>>
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
