import type {
  AnyVariables,
  Client,
  Operation,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import { createRequest } from '@urql/core'
import type { DocumentNode } from 'graphql'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type AtomWithSubscriptionOptions<Data, Variables extends AnyVariables> = {
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string
  getVariables: (get: Getter) => Variables
  getContext?: (get: Getter) => Partial<OperationContext>
  getClient: (get: Getter) => Client
}

export function atomWithSubscription<Data, Variables extends AnyVariables>({
  query,
  getVariables,
  getContext,
  getClient = (get) => get(clientAtom),
}: AtomWithSubscriptionOptions<Data, Variables>): WritableAtom<
  Promise<OperationResult<Data, Variables>> | OperationResult<Data, Variables>,
  [Partial<OperationContext>],
  void
> {
  const cache = new WeakMap<Client, Operation>()
  // This is to avoid recreation of the client on every operation result change
  // This is to make it more reliable when people do mistakes plus
  // making client dynamic is rather very bad idea, as all cache is in the client
  let client: Client
  return createAtoms(
    (get) => [query, getVariables(get), getContext?.(get)] as const,
    getClient,
    (_client, args) => {
      const operation = _client.createRequestOperation(
        'subscription',
        createRequest(args[0], args[1]),
        args[2]
      )
      cache.set(_client, operation)
      client = _client
      return _client.executeRequestOperation(operation)
    },
    (context) => {
      const operation = cache.get(client) as Operation
      if (!operation) {
        throw new Error(
          "Operation not found in cache, something went wrong. Probably client has changed make sure it' not changing dynamically."
        )
      }
      client.reexecuteOperation(
        client.createRequestOperation('subscription', operation, {
          ...operation.context,
          ...context,
        })
      )
    }
  )
}
