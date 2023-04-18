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
    getVariables = (_get: Getter) => ({} as Variables),
    getContext,
    getClient = (get: Getter) => get(clientAtom),
    getPause = () => false,
  } = options
  return createAtoms(
    (get) => [query, getVariables(get), getContext?.(get)] as const,
    getClient,
    (client, args) => client.query(args[0], args[1] as Variables, args[2]),
    (context, get) => {
      const pause = getPause(get)
      const client = getClient(get)
      // Here we manually create the operation from our arguments in order to call `reexecuteOperation` as calling `client.query`
      // as it is not equivalent in behavior to calling `client.reexecuteOperation` with the same arguments.
      // query and variables are used to generate unique operation key (a number), and the operation key is used to identify the operation.
      // Not the reference. It works similar to `hashCode` in Java, so similar pair of query and variables will generate the same key.
      const operation = client.createRequestOperation(
        'query',
        createRequest(query, getVariables(get) as Variables),
        {
          ...getContext?.(get),
          ...context,
        }
      )
      // Reexecute the operation is not going to be triggered anyway if there is no subscribers, but to be 100% sure and to protect code below from any unexpected states
      !pause && client.reexecuteOperation(operation)
    },
    getPause
  )
}
