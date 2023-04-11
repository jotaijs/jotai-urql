import { AnyVariables, Operation } from '@urql/core'
import type { Client, OperationContext, OperationResult } from '@urql/core'
import { atomWithObservable } from 'jotai/utils'
import { atom } from 'jotai/vanilla'
import type { Getter } from 'jotai/vanilla'
import { pipe, toObservable } from 'wonka'
import type { Source } from 'wonka'
import { suspenseAtom } from './suspenseAtom'

export type InitialOperationResult<Data, Variables extends AnyVariables> = Omit<
  OperationResult<Data, Variables>,
  'operation'
> & {
  operation: Operation<Data, Variables> | undefined
}
// This is the same (aside from missing fetching and having hasNext) object shape as urql-react has by default while operation is yet to be triggered/yet to be fetched
export const urqlReactCompatibleInitialState = {
  stale: false,
  // Casting is needed to make typescript chill here as it tries here to be too smart
  error: undefined as any,
  data: undefined as any,
  extensions: undefined as any,
  hasNext: false,
  operation: undefined,
} as InitialOperationResult<any, any>

export const createAtoms = <Args, Result extends OperationResult, ActionResult>(
  getArgs: (get: Getter) => Args,
  getClient: (get: Getter) => Client,
  execute: (client: Client, args: Args) => Source<Result>,
  reexecute: (context?: Partial<OperationContext>) => ActionResult
) => {
  const sourceAtom = atom((get) => {
    const args = getArgs(get)
    const client = getClient(get)
    const source = execute(client, args)
    return source
  })

  if (process.env.NODE_ENV !== 'production') {
    sourceAtom.debugPrivate = true
  }

  const baseStatusAtom = atom((get) => {
    const source = get(sourceAtom)
    const observable = pipe(source, toObservable)
    // Enables or disables suspense based off global suspense atom
    const initialState = get(suspenseAtom)
      ? {}
      : { initialValue: urqlReactCompatibleInitialState }
    const resultAtom = atomWithObservable<Result>(
      () => observable,
      initialState as any
    )
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseStatusAtom.debugPrivate = true
  }

  const operationResultAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      return get(resultAtom)
    },
    (_, __, context?: Partial<OperationContext>) => {
      return reexecute(context)
    }
  )

  return operationResultAtom
}
