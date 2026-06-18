const { copyFileSync, mkdirSync } = require('node:fs')
const { dirname, join } = require('node:path')

const assets = [
  ['src/nodes/KynticAi/KynticAi.node.json', 'dist/nodes/KynticAi/KynticAi.node.json'],
]

for (const [from, to] of assets) {
  const target = join(__dirname, '..', to)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(join(__dirname, '..', from), target)
}
