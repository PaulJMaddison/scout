import { expect, test, type Page } from '@playwright/test'

const adminRoutes = [
  '/demo',
  '/story/source-signals',
  '/story/context-layer',
  '/story/ai-workflow',
  '/story/outcomes',
  '/overview',
  '/data-sources',
  '/selectors',
  '/semantic-schema',
  '/customers/123',
  '/agent-playground',
  '/audit',
  '/bootstrap-studio',
] as const

async function signInAsDemoAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Tenant slug').fill('demo')
  await page.getByLabel('Email').fill('admin@contextlayer.local')
  await page.getByLabel('Password').fill('DemoAdmin123!')
  await page.getByRole('button', { name: 'Enter console' }).click()
  await expect(page).toHaveURL(/\/demo/)
}

async function forceLoggedOut(page: Page) {
  await page.context().clearCookies()
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

test('login page fits short desktop heights without clipping', async ({ page }) => {
  await forceLoggedOut(page)
  await page.setViewportSize({ width: 1365, height: 600 })
  await page.goto('/login?redirect=%2Fdemo')
  await page.waitForLoadState('domcontentloaded')

  if (!page.url().includes('/login')) {
    await page.goto('/login?redirect=%2Fdemo')
    await page.waitForLoadState('domcontentloaded')
  }

  const layout = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.innerHeight + 1)
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1)
  await expect(page.getByRole('button', { name: 'Enter console' })).toBeVisible()
  await expect(page.getByText('Unified semantic layer')).toBeVisible()
})

test('login page remains usable on mobile without horizontal overflow', async ({ page }) => {
  await forceLoggedOut(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login?redirect=%2Fdemo')
  await page.waitForLoadState('domcontentloaded')

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1)
  await expect(page.getByRole('button', { name: 'Enter console' })).toBeVisible()
})

test('admin routes avoid horizontal overflow at laptop-height desktop viewport', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1365, height: 600 })
  await signInAsDemoAdmin(page)

  for (const route of adminRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await page.locator('body').waitFor({ state: 'visible' })

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }))

    expect.soft(layout.scrollWidth, `horizontal overflow on ${route}`).toBeLessThanOrEqual(layout.innerWidth + 1)
    expect.soft(layout.scrollHeight, `shell overflow on ${route}`).toBeGreaterThan(0)
  }
})

test('executive walkthrough and customer profile stay usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signInAsDemoAdmin(page)

  for (const route of ['/demo', '/customers/123'] as const) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await page.locator('body').waitFor({ state: 'visible' })

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))

    expect.soft(layout.scrollWidth, `mobile horizontal overflow on ${route}`).toBeLessThanOrEqual(layout.innerWidth + 1)
  }
})
