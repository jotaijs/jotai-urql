/* eslint-disable react-hooks/rules-of-hooks */
import { TypedDocumentNode } from '@urql/core'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithMutation, atomWithQuery } from '../../src'

type Expect<T extends true> = T

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

// Type tests
/* eslint-disable @typescript-eslint/no-unused-vars */

const queryWithoutGenerics = useAtomValue(
  atomWithQuery({
    query: ``,
  })
)

// @ts-expect-error unused type
type shouldBeUnknown = Expect<
  Equal<(typeof queryWithoutGenerics)['data'], unknown>
>

const queryWithTypedDocumentNodeGenerics = useAtomValue(
  atomWithQuery({
    query: `` as unknown as TypedDocumentNode<{ hello: string }, undefined>,
  })
)

// @ts-expect-error unused type
type shouldBeTypedWithInferredData = Expect<
  Equal<
    (typeof queryWithTypedDocumentNodeGenerics)['data'],
    { hello: string } | undefined
  >
>

const SomeQuery = `` as unknown as TypedDocumentNode<
  { hello: string },
  { arg: string }
>

//@ts-expect-error should error as getVariables are not provided
atomWithQuery({
  query: SomeQuery,
})

atomWithQuery({
  query: SomeQuery,
  // TODO: unknown vars should not be allowed to be passed, yet possible :(
  getVariables: () => ({ error: 'hello', arg: 'hello' }),
})

atomWithQuery({
  query: SomeQuery,
  getVariables: () => ({ arg: 'hello' }),
})

const dispatch = useSetAtom(atomWithQuery({ query: `` }))
dispatch()
dispatch({ requestPolicy: 'network-only' })

const [opMutationResultTypedDocumentNode, mutateTypedDocumentNode] = useAtom(
  atomWithMutation(
    `` as unknown as TypedDocumentNode<{ result: string }, { arg: string }>
  )
)

// @ts-expect-error unused type
type shouldBeTypedWithInferredDataMutation = Expect<
  Equal<
    (typeof opMutationResultTypedDocumentNode)['data'],
    { result: string } | undefined
  >
>

// @ts-expect-error should error as wrong vars are passed
mutateTypedDocumentNode({ error: 'hello', arg: 'hello' })

// @ts-expect-error should error as no vars are passed
mutateTypedDocumentNode()

const [opMutationResultGenerics, mutateGenerics] = useAtom(
  atomWithMutation<string, { arg: string }>(``)
)

// @ts-expect-error unused type
type toBeExpectedType = Expect<
  Equal<(typeof opMutationResultGenerics)['data'], string | undefined>
>

// @ts-expect-error should error as no unknown vars should be passed
mutateGenerics({ error: 'hello', arg: 'hello' })

mutateGenerics({ arg: 'hello' })
