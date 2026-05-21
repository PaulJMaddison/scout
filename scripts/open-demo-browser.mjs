import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function readArgument(name, fallback) {
  const prefix = `--${name}=`
  const match = process.argv.find((argument) => argument.startsWith(prefix))
  return match ? match.slice(prefix.length) : fallback
}

const playwright = await import(new URL('../apps/web/node_modules/playwright/index.mjs', import.meta.url))
const { chromium } = playwright

const baseUrl = readArgument('base-url', 'http://127.0.0.1:5173').replace(/\/$/, '')
const tenantSlug = readArgument('tenant', 'demo')
const email = readArgument('email', 'admin@scout.local')
const password = readArgument('password', 'DemoAdmin123!')
const targetPath = readArgument('target', '/demo')
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const profileDir = path.join(repoRoot, '.demo', 'browser-sessions', `session-${Date.now()}`)

let context

async function ensureLoggedIn(page) {
  await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'domcontentloaded' })

  if (!page.url().includes('/login')) {
    return
  }

  await page.getByLabel('Tenant slug').fill(tenantSlug)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await Promise.all([
    page.waitForURL('**/demo', { timeout: 20000 }),
    page.getByRole('button', { name: 'Enter console' }).click(),
  ])

  if (targetPath !== '/demo') {
    await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'domcontentloaded' })
  }
}

try {
  await fs.mkdir(profileDir, { recursive: true })

  context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: null,
    args: ['--window-position=24,24', '--window-size=1280,720'],
  })

  const page = context.pages()[0] ?? (await context.newPage())
  await ensureLoggedIn(page)
  await page.bringToFront()

  console.log(`READY:${page.url()}`)

  context.on('close', () => {
    process.exit(0)
  })

  setInterval(() => {}, 1000)
} catch (error) {
  console.error(`ERROR:${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  if (context) {
    await context.close().catch(() => {})
  }
  process.exit(1)
}
