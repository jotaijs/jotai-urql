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

type Args<Data, Variables extends AnyVariables> = readonly [
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  variables: Variables,
  context?: Partial<OperationContext>
]

type Action = {
  type: 'refetch'
}

export function atomsWithQuery<Data, Variables extends AnyVariables>(
  getArgs: (get: Getter) => Args<Data, Variables>,
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action>,
  statusAtom: WritableAtom<OperationResult<Data, Variables>, Action>
] {
  return createAtoms(
    getArgs,
    getClient,
    (client, args) => client.query(...args),
    (action, _client, refresh) => {
      if (action.type === 'refetch') {
        refresh()
        return
      }
    }
  )
}
