import type { Client, OperationResult } from '@urql/core'
import { atom } from 'jotai/vanilla'
import type { Getter } from 'jotai/vanilla'
import { atomWithObservable } from 'jotai/vanilla/utils'
import { filter, pipe, toObservable } from 'wonka'
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
  handleAction: (
    action: Action,
    client: Client,
    refresh: () => void
  ) => ActionResult
) => {
  const refreshAtom = atom(0)

  if (process.env.NODE_ENV !== 'production') {
    refreshAtom.debugPrivate = true
  }

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
    const source = get(sourceAtom) as Source<Result | undefined>
    const observable = pipe(source, toObservable)
    const resultAtom = atomWithObservable(() => observable, {
      initialValue: undefined,
    })

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
    (get, set, action: Action) => {
      const client = getClient(get)
      const refresh = () => {
        set(refreshAtom, (c) => c + 1)
      }
      return handleAction(action, client, refresh)
    }
  )

  const baseDataAtom = atom((get) => {
    const source = get(sourceAtom)
    const observable = pipe(
      source,
      filter((result) => 'data' in result && !result.error),
      toObservable
    )
    const resultAtom = atomWithObservable(() => observable)

    if (process.env.NODE_ENV !== 'production') {
      resultAtom.debugPrivate = true
    }

    return resultAtom
  })

  if (process.env.NODE_ENV !== 'production') {
    baseDataAtom.debugPrivate = true
  }

  const returnResultData = (result: Result) => {
    if (result.error) {
      throw result.error
    }
    return result.data
  }

  const dataAtom = atom(
    (get) => {
      const resultAtom = get(baseDataAtom)
      const result = get(resultAtom)
      if (result instanceof Promise) {
        return result.then(returnResultData)
      }
      return returnResultData(result)
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
