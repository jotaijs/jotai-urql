import type {
  AnyVariables,
  Client,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import { DocumentNode } from 'graphql'
import type { Getter, WritableAtom } from 'jotai'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type Action = {
  readonly type: 'refetch'
}

export function atomsWithSubscription<Data, Variables extends AnyVariables>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  getVariables: (get: Getter) => Variables,
  getContext?: (get: Getter) => Partial<OperationContext>,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action>,
  statusAtom: WritableAtom<OperationResult<Data, Variables> | undefined, Action>
] {
  return createAtoms(
    (get) => [query, getVariables(get), getContext?.(get)] as const,
    getClient,
    (client, args) => client.subscription(...args),
    (action, _client, refresh) => {
      if (action.type === 'refetch') {
        refresh()
        return
      }
    }
  )
}
