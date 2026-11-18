/**
 * Wipes a LOCAL database, re-runs all migrations and seeds it.
 *
 *   npm run db:reset          dev database (DATABASE_URL); asks for confirmation
 *   npm run db:test:setup     test database (DATABASE_URL_TEST, or "<dev db name>_test")
 *
 * Uploaded files are deleted too (media/ for dev, media-test/ for test).
 * Refuses to run against anything other than localhost or with NODE_ENV=production.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'

import dotenv from 'dotenv'

dotenv.config()

const args = process.argv.slice(2)
const isTest = args.includes('--test')
const skipPrompt = args.includes('--yes')

const env = { ...process.env }
if (!env.DATABASE_URL) fail('DATABASE_URL is not set (see .env.example).')

if (isTest) {
  if (env.DATABASE_URL_TEST) {
    env.DATABASE_URL = env.DATABASE_URL_TEST
  } else {
    const url = new URL(env.DATABASE_URL)
    url.pathname = `${url.pathname.slice(1)}_test`
    env.DATABASE_URL = url.toString()
  }
  env.MEDIA_DIR = 'media-test'
}

const url = new URL(env.DATABASE_URL)
const dbName = decodeURIComponent(url.pathname.slice(1))
const mediaDir = path.resolve(process.cwd(), env.MEDIA_DIR || 'media')

if (env.NODE_ENV === 'production') fail('Refusing to reset with NODE_ENV=production.')
if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) {
  fail(`Refusing to reset a non-local database (host "${url.hostname}").`)
}
if (!isTest && dbName.endsWith('_test')) {
  console.warn('Note: DATABASE_URL points at a *_test database.')
}

console.log(`Database: ${dbName} on ${url.hostname}:${url.port || 5432}`)
console.log(`Uploads:  ${path.relative(process.cwd(), mediaDir)}/`)

if (!skipPrompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(
    `This deletes ALL data in "${dbName}" (including admin users). Type "reset" to continue: `,
  )
  rl.close()
  if (answer.trim() !== 'reset') fail('Cancelled.')
}

fs.rmSync(mediaDir, { recursive: true, force: true })
run(['migrate:fresh', '--force-accept-warning'])
run(['run', 'src/seed/index.ts'])
console.log(`\n"${dbName}" has been reset and seeded.`)

function run(payloadArgs) {
  // Arguments are fixed strings from this file, so joining them into one command is safe.
  // (Windows needs a shell to find npx.)
  const result = spawnSync(`npx payload ${payloadArgs.join(' ')}`, {
    env: { ...env, NODE_OPTIONS: '--no-deprecation' },
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) fail(`"payload ${payloadArgs.join(' ')}" failed.`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
