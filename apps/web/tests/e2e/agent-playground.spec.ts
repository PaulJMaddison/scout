import { expect, test } from '@playwright/test'

test('sales rep can generate a grounded outreach recommendation', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Tenant slug').fill('demo')
  await page.getByLabel('Email').fill('rep@scout.local')
  await page.getByLabel('Password').fill('DemoSales123!')
  await page.getByRole('button', { name: 'Enter console' }).click()

  await expect(page).toHaveURL(/\/demo/)

  await page.goto('/agent-playground')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Intelligent Sales Support uses Scout evidence packs to generate grounded sales recommendations.',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Generate recommendation' }).click()

  await expect(page.getByText('Why this was recommended')).toBeVisible()
  await expect(page.getByText('FACT-01').first()).toBeVisible()
  await expect(
    page.getByText(/Larkspur Logistics Group: next step for enterprise planning/i).first(),
  ).toBeVisible()
})
