import type { AnyVariables, Client, Operation } from '@urql/core'
import { createRequest } from '@urql/core'
import { Getter } from 'jotai/vanilla'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'
import { AtomWithSubscription, AtomWithSubscriptionOptions } from './types'

export function atomWithSubscription<
  Data = never,
  Variables extends AnyVariables = AnyVariables
>(
  options: AtomWithSubscriptionOptions<Data, Variables>
): AtomWithSubscription<Data, Variables> {
  const {
    query,
    getVariables = () => ({} as Variables),
    getContext,
    getClient = (get: Getter) => get(clientAtom),
    getPause = () => false,
  } = options
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
        createRequest(args[0], args[1] as Variables),
        args[2]
      )
      cache.set(_client, operation)
      client = _client
      return _client.executeRequestOperation(operation)
    },
    (context, get) => {
      const operation = cache.get(client) as Operation
      if (!operation && !getPause(get)) {
        throw new Error(
          "Operation not found in cache, something went wrong. Probably client has changed make sure it' not changing dynamically."
        )
      }
      // Reexecute the operation is not going to be triggered anyway if there is no subscribers, but to be 100% sure and to protect code below from any unexpected states
      !getPause(get) &&
        client.reexecuteOperation(
          client.createRequestOperation('subscription', operation, {
            ...operation?.context,
            ...context,
          })
        )
    },
    getPause
  )
}
