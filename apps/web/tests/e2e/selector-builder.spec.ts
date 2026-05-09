import { expect, test } from '@playwright/test'

test('tenant admin can create a selector draft', async ({ page }) => {
  const selectorName = `Playwright Selector ${Date.now()}`

  await page.goto('/login')
  await page.getByLabel('Tenant slug').fill('demo')
  await page.getByLabel('Email').fill('admin@contextlayer.local')
  await page.getByLabel('Password').fill('DemoAdmin123!')
  await page.getByRole('button', { name: 'Enter console' }).click()

  await expect(page).toHaveURL(/\/demo/)

  await page.getByRole('navigation').getByRole('link', { name: 'Selector Builder', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Selector builder' })).toBeVisible()
  await expect(page.getByLabel('Preview user')).not.toHaveValue('')
  await expect(page.getByLabel('Data source')).not.toHaveValue('')
  await expect(page.getByLabel('Target semantic attribute')).not.toHaveValue('')

  await page.getByLabel('Selector name').fill(selectorName)
  await page.getByLabel('Explanation template').fill('Preferred channel derived from {{sourceValue}}.')

  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeEnabled()
  await page.getByRole('link', { name: 'Audit Log' }).click()
  await page.getByPlaceholder('Search action, actor, entity, or id').fill('selector.created')
  await expect(page.getByText('selector.created').first()).toBeVisible()
})
