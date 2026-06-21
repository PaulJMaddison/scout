#!/usr/bin/env node
import { runBuyerCli } from './buyer-cli.js'

await runBuyerCli(process.argv.slice(2))
