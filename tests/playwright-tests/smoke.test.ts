import { Page, expect, test } from '@playwright/test'

const mockResponse = async (page: Page, data: Record<string, any>) => {
  await page.route(
    'http://fake-url.com/graphql',
    (route) => {
      // delay 200ms
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: data,
          }),
        })
      }, 50)
    },
    { times: 1 }
  )
}

const mockErrorResponse = async (page: Page) => {
  await page.route(
    'http://fake-url.com/graphql',
    (route) => {
      // delay 200ms
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            error: new Error('error'),
          }),
        })
      }, 50)
    },
    { times: 1 }
  )
}

test('smoke - query', async ({ page }) => {
  await mockResponse(page, { count: 0 })
  await page.goto('/smoke')
  // Suspended on initial loading
  await expect(page.getByText('loading')).toBeVisible()
  await expect(page.getByText('count: 0')).toBeVisible()

  await mockResponse(page, { count: 1 })
  // Reexecutes but with wrong policy (cache-first) hence no update
  await page.getByText('refetch-wrong-policy').click()
  // Data shouldn't change
  await expect(page.getByText('count: 0')).toBeVisible()
  // Reexecute with network-only policy, hence update
  await page.getByText('refetch-network-only').click()
  // Updated
  // TODO: This is another problem. For some reason stale state on network-only
  //  doesn't get triggered (for cache-and-network it does). URQL react bindings trigger stale to be triggered
  await expect(page.getByText('refetching stale')).not.toBeVisible() // It should be visible, but it's not, so for now we check it's not so once it's fixed this will fail
  await expect(page.getByText('count: 1')).toBeVisible()

  // Next call should break the UI
  await mockErrorResponse(page)
  // Reexecute with network-only policy, hence update
  await page.getByText('refetch-cache-and-network').click()
  // Updated and shows refetching stale as mentioned above
  await expect(page.getByText('refetching stale')).toBeVisible()

  await expect(page.getByText('errored')).toBeVisible()
  await mockResponse(page, { count: 2 })
  await page.getByText('retry').click()

  // Since we redirect instantly on retry click, to avoid immediate render (and another throw of error that will get us back to error boundary)
  // we have a stale-with-error short circuit, this ideally should be fixed to be suspended. As original urql client react bindings suspend the tree before
  // results are in and then renders.
  // TODO: Make it so it behaves similarly to URQL react binding
  await expect(page.getByText('stale-with-error')).toBeVisible()
  await expect(page.getByText('count: 2')).toBeVisible()
})

test('smoke - query, suspense disabled', async ({ page }) => {
  await mockResponse(page, { count: 0 })
  // Somehow we need to load into the root page first and redirect, otherwise it doesn't work.
  await page.goto('/')
  await page.getByText('Suspense Disabled').click()
  await expect(page.getByText('loading', { exact: true })).not.toBeVisible()
  await expect(page.getByText('non-suspended-loading')).toBeVisible()
  await expect(page.getByText('count: 0')).toBeVisible()

  await mockResponse(page, { count: 1 })
  // Reexecutes but with wrong policy (cache-first) hence no update
  await page.getByText('refetch-wrong-policy').click()
  // Data shouldn't change
  await expect(page.getByText('count: 0')).toBeVisible()
  // Reexecute with network-only policy, hence update
  await page.getByText('refetch-network-only').click()
  // Updated
  // TODO: This is another problem. For some reason stale state on network-only
  //  doesn't get triggered (for cache-and-network it does). URQL react bindings trigger stale to be triggered
  await expect(page.getByText('refetching stale')).not.toBeVisible() // It should be visible, but it's not, so for now we check it's not so once it's fixed this will fail
  await expect(page.getByText('count: 1')).toBeVisible()
})

test('smoke - query, paused', async ({ page }) => {
  await mockResponse(page, { count: 0 })
  await page.goto('/paused')
  // Should be suspended on initial loading as query is paused
  await expect(page.getByText('loading')).not.toBeVisible()
  await expect(page.getByText('query is paused')).toBeVisible()

  // Reexecute with network-only policy. Shouldn't update anything as query is paused
  await page.getByText('refetch-network-only').click()
  await expect(page.getByText('query is paused')).toBeVisible()

  // Unpause should trigger loading and suspend the tree
  await page.getByText('toggle pause').click()
  await expect(page.getByText('loading')).toBeVisible()
  await expect(page.getByText('count: 0')).toBeVisible()

  await mockResponse(page, { count: 1 })
  // Refetches with new data
  await page.getByText('refetch-network-only').click()
  await expect(page.getByText('refetching stale')).not.toBeVisible() // Should be visible as per URQL, but not visible for Jotai at the moment
  await expect(page.getByText('count: 1')).toBeVisible()

  // Pause again
  await page.getByText('toggle pause').click()
  await expect(page.getByText('count: 1')).toBeVisible()

  await mockResponse(page, { count: 2 })
  // Refetch again, shouldn't change anything as query is paused
  await page.getByText('refetch-network-only').click()
  await expect(page.getByText('count: 1')).toBeVisible()
  // Unpause shouldn't trigger any loading as data is already there
  await page.getByText('toggle pause').click()
  await expect(page.getByText('count: 1')).toBeVisible()

  // Refetch again, since unpaused should show update content
  await page.getByText('refetch-network-only').click()
  await expect(page.getByText('count: 2')).toBeVisible()

  // Redirect and return back to see if it data is still there
  await page.getByText('Home').click()
  await page.getByText('Paused').click()
  await expect(page.getByText('count: 2')).toBeVisible()

  // Pause again and redirect to home. This should clear the data
  await page.getByText('toggle pause').click()
  await page.getByText('Home').click()
  await page.getByText('Paused').click()
  await expect(page.getByText('query is paused')).toBeVisible()
})

test('smoke - mutation', async ({ page }) => {
  await mockResponse(page, {
    burgers: [
      {
        __typename: 'Burger',
        id: '1',
        name: 'Big Tasty',
        price: 8,
      },
      {
        __typename: 'Burger',
        id: '2',
        name: 'Big Mac',
        price: 5,
      },
      {
        __typename: 'Burger',
        id: '3',
        name: 'McChicken',
        price: 3,
      },
    ],
  })
  await page.goto('/mutations')
  // Suspended on initial loading
  await expect(page.getByText('loading')).toBeVisible()
  // Shows data after loading
  await expect(page.getByText('Big Mac')).toBeVisible()

  await mockResponse(page, {
    burgerCreate: {
      __typename: 'Burger',
      id: '2',
      name: 'Big Mac',
      price: 25,
    },
  })
  await page.getByText('mutate').click()
  // Mutation result should affect query result updating burger with an id 2
  await expect(page.getByTestId('query-table').getByText('25')).toBeVisible()
  // Same should be visible within mutation table
  await expect(page.getByTestId('mutation-table').getByText('25')).toBeVisible()

  // Rerouting to an empty page to check if mutation state will reset (same behaviour as urql official react bindings)
  await page.getByText('Home').click()
  await expect(page.getByText('Empty')).toBeVisible()
  // Rerouting back. Query results should stay the same (with mutation affecting them). Mutation results should be reset.
  await page.getByText('Mutations').click()
  await expect(page.getByTestId('query-table').getByText('25')).toBeVisible()
  await expect(page.getByTestId('mutation-table')).not.toBeVisible()
})

test('smoke - lazy query', async ({ page }) => {
  await mockResponse(page, {
    burgers: [
      {
        __typename: 'Burger',
        id: '1',
        name: 'Big Tasty',
        price: 8,
      },
      {
        __typename: 'Burger',
        id: '2',
        name: 'Big Mac',
        price: 5,
      },
      {
        __typename: 'Burger',
        id: '3',
        name: 'McChicken',
        price: 3,
      },
    ],
  })
  await page.goto('/mutations')
  // Suspended on initial loading
  await expect(page.getByText('loading')).toBeVisible()
  // Shows data after loading
  await expect(page.getByText('Big Mac')).toBeVisible()

  await mockResponse(page, {
    burgers: [
      {
        __typename: 'Burger',
        id: '1',
        name: 'Big Tasty',
        price: 8,
      },
      {
        __typename: 'Burger',
        id: '2',
        name: 'Big Mac',
        price: 25, // We update the data here as if it changed
      },
      {
        __typename: 'Burger',
        id: '3',
        name: 'McChicken',
        price: 3,
      },
    ],
  })
  await page.getByText('load lazy burgers').click()
  await expect(page.getByText('loading burgers...')).toBeVisible()
  // New one off result should affect query result updating burger with an id 2
  await expect(page.getByTestId('query-table').getByText('25')).toBeVisible()
  // Same result should be visible within lazy query table
  await expect(
    page.getByTestId('query-lazy-table').getByText('25')
  ).toBeVisible()

  // Rerouting to an empty page to check if lazy query state will reset (same behaviour as urql official react bindings)
  await page.getByText('Home').click()
  await expect(page.getByText('Empty')).toBeVisible()
  // Rerouting back. Query results should stay the same (with mutation affecting them). Mutation results should be reset.
  await page.getByText('Mutations').click()
  await expect(page.getByTestId('query-table').getByText('25')).toBeVisible()
  await expect(page.getByTestId('query-lazy-table')).not.toBeVisible()
})
