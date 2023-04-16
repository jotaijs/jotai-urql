import type { AnyVariables } from '@urql/core'
import { createRequest } from '@urql/core'
import type { Getter } from 'jotai/vanilla'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'
import type { AtomWithQuery, AtomWithQueryOptions } from './types'

export function atomWithQuery<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
>(
  options: AtomWithQueryOptions<Data, Variables>
): AtomWithQuery<Data, Variables> {
  const {
    query,
    getVariables = () => ({} as Variables),
    getContext,
    getClient = (get: Getter) => get(clientAtom),
    getPause = () => false,
  } = options
  return createAtoms(
    (get) => [query, getVariables(get), getContext?.(get)] as const,
    getClient,
    (_client, args) => {
      const operation = _client.createRequestOperation(
        'query',
        createRequest(args[0], args[1] as Variables),
        args[2]
      )
      return _client.executeRequestOperation(operation)
    },
    (context, get) => {
      const pause = getPause(get)
      const client = getClient(get)
      const operation = client.createRequestOperation(
        'query',
        createRequest(query, getVariables(get) as Variables),
        getContext?.(get)
      )
      // Reexecute the operation is not going to be triggered anyway if there is no subscribers, but to be 100% sure and to protect code below from any unexpected states
      !pause &&
        client.reexecuteOperation(
          client.createRequestOperation('query', operation, {
            ...operation?.context,
            ...context,
          })
        )
    },
    getPause
  )
}
