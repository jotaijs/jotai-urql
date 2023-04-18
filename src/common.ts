import type {
  AnyVariables,
  Client,
  Operation,
  OperationContext,
  OperationResult,
} from '@urql/core'
import type { Getter } from 'jotai/vanilla'
import { atom } from 'jotai/vanilla'
import { atomWithObservable } from 'jotai/vanilla/utils'
import type { Source } from 'wonka'
import { pipe, toObservable } from 'wonka'
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
  reexecute: (context: Partial<OperationContext>, get: Getter) => ActionResult,
  getPause: (get: Getter) => boolean
) => {
  const initialLoadAtom = atom<Result>(
    urqlReactCompatibleInitialState as Result
  )

  const baseStatusAtom = atom((get) => {
    const args = getArgs(get)
    const client = getClient(get)
    const source = getPause(get) ? null : execute(client, args)
    if (!source) {
      return initialLoadAtom
    }
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

  // This atom is used ONLY when for the `getPause` is returning true.
  // This is needed to keep and show previous result in cache when the query is getting paused dynamically (meaning resultAtom would return `urqlReactCompatibleInitialState`).
  // E.g. *getPause is false* state 1 -> state 2 -> state 3 *getPause set to true* -> null (return cached state 3) -> *getPause is false* -> state 4
  const prevResultCacheInCaseOfDynamicPausing = atom<{
    cache?: Result
  }>({})
  prevResultCacheInCaseOfDynamicPausing.onMount = (setAtom) => {
    return () => {
      // Here we clean up the cache on unmount
      setAtom({})
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    initialLoadAtom.debugPrivate = true
    baseStatusAtom.debugPrivate = true
    prevResultCacheInCaseOfDynamicPausing.debugPrivate = true
  }

  const operationResultAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      const result = get(resultAtom)
      const prevValueCache = get(prevResultCacheInCaseOfDynamicPausing)
      if (getPause(get) && prevValueCache.cache) {
        return prevValueCache.cache
      }
      prevValueCache.cache = result

      return result
    },
    (get, _set, context?: Partial<OperationContext>) => {
      return reexecute(context ?? {}, get)
    }
  )

  return operationResultAtom
}
