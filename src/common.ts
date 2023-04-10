import type { Client, OperationContext, OperationResult } from '@urql/core'
import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { atomWithObservable } from 'jotai/utils'
import { pipe, toObservable } from 'wonka'
import type { Source } from 'wonka'

export const createAtoms = <
  Args,
  Result extends OperationResult,
  Action,
  ActionResult
>(
  getArgs: (get: Getter) => Args,
  getClient: (get: Getter) => Client,
  execute: (client: Client, args: Args) => Source<Result>,
  handleAction: (action: Action | Partial<OperationContext>) => ActionResult
) => {
  const refreshAtom = atom(0)

  const sourceAtom = atom((get) => {
    get(refreshAtom)
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
    const resultAtom = atomWithObservable(() => observable)
    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseStatusAtom.debugPrivate = true
  }

  const statusAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      return get(resultAtom)
    },
    (_, __, action: Action | Partial<OperationContext>) => {
      return handleAction(action)
    }
  )

  const returnResultData = (result: Result) => {
    return result.data
  }

  const dataAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      const result = get(resultAtom)
      if (result instanceof Promise) {
        return result.then(returnResultData)
      }
      return returnResultData(result)
    },
    (_get, set, action: Action | Partial<OperationContext>) =>
      set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
