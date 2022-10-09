import type {
  AnyVariables,
  Client,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import { DocumentNode } from 'graphql'
import type { Getter, WritableAtom } from 'jotai'
import { makeSubject } from 'wonka'
import type { Subject } from 'wonka'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type Action<Data, Variables extends AnyVariables> = [
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  variables: Variables,
  context?: Partial<OperationContext>
]

export function atomsWithUrqlMutation<Data, Variables extends AnyVariables>(
  getClient: (get: Getter) => Client = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action<Data, Variables>>,
  statusAtom: WritableAtom<
    OperationResult<Data, Variables>,
    Action<Data, Variables>
  >
] {
  type Result = OperationResult<Data, Variables>
  const subjectCache = new WeakMap<Client, Subject<Result>>()

  return createAtoms(
    () => {},
    getClient,
    (client) => {
      let subject = subjectCache.get(client)
      if (!subject) {
        subject = makeSubject()
        subjectCache.set(client, subject)
      }
      return subject.source
    },
    async (action, client) => {
      const result = await client.mutation(...action).toPromise()
      const subject = subjectCache.get(client)
      subject?.next(result)
    }
  )
}
