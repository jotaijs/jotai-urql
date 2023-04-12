import {
  AnyVariables,
  Client,
  DocumentInput,
  OperationContext,
  OperationResult,
} from '@urql/core'
import { Getter, WritableAtom } from 'jotai/vanilla'

type GraphQLRequestParams<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
> =
  | ({
      query: DocumentInput<Data, Variables>
    } & (Variables extends void
      ? { getVariables?: (get: Getter) => Variables }
      : Variables extends {
          [P in keyof Variables]: Exclude<Variables[P], null | void>
        }
      ? Variables extends { [P in keyof Variables]: never }
        ? { getVariables?: (get: Getter) => Variables }
        : { getVariables: (get: Getter) => Variables }
      : { getVariables?: (get: Getter) => Variables }))
  | {
      query: DocumentInput<Data, Variables>
      getVariables: (get: Getter) => Variables
    }

export type AtomWithQueryOptions<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
> = {
  getContext?: (get: Getter) => Partial<OperationContext>
  getPause?: (get: Getter) => boolean
  getClient?: (get: Getter) => Client
} & GraphQLRequestParams<Data, Variables>

export type AtomWithQuery<Data, Variables extends AnyVariables> = WritableAtom<
  Promise<OperationResult<Data, Variables>> | OperationResult<Data, Variables>,
  [context?: Partial<OperationContext>],
  void
>

export type AtomWithSubscriptionOptions<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables
> = AtomWithQueryOptions<Data, Variables>

export type AtomWithSubscription<
  Data,
  Variables extends AnyVariables
> = AtomWithQuery<Data, Variables>
