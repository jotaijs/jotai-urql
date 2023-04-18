import { ClientOptions, createClient, fetchExchange } from '@urql/core'
import { cacheExchange } from '@urql/exchange-graphcache'

export const generateUrqlClient = (opts?: Partial<ClientOptions>) =>
  createClient({
    url: 'http://fake-url.com/graphql',
    exchanges: [cacheExchange(), fetchExchange],
    suspense: false,
    ...opts,
  })
