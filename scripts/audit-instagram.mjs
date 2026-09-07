import { readdir, readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const files = []
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const next = `${path}/${entry.name}`
    if (entry.isDirectory()) await walk(next)
    else if (/\.(js|jsx)$/.test(next) && !/instagram(Audit|Editorial)\.js$/.test(next)) files.push(next)
  }
}
await walk('dependencies')
const ids = new Set()
for (const file of files) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(/(?:["']|instagram\.com\/(?:p|reel)\/)(D[\w-]{10})(?=["'/])/g)) ids.add(match[1])
}
const results = {}
const queue = [...ids].sort()
async function worker() {
  while (queue.length) {
    const id = queue.shift()
    try {
      const { stdout: html } = await run('curl', ['-L', '-sS', '--max-time', '25', `https://www.instagram.com/p/${id}/embed/`], { maxBuffer: 5_000_000 })
      const encoded = html.match(/"contextJSON":("(?:\\.|[^"\\])*")/)
      const context = encoded ? JSON.parse(JSON.parse(encoded[1])) : null
      const media = context?.gql_data?.shortcode_media
      const ratio = html.match(/class="Content EmbedFrame" style="padding-bottom: ([\d.]+)%;/)
      const username = html.match(/class="UsernameText">([^<]+)/)?.[1]
      const unavailable = /The link to this photo or video may be broken|post may have been removed/.test(html)
      results[id] = {
        status: media ? (media.is_video ? (media.video_url ? 'video' : 'preview') : 'post') : unavailable ? 'unavailable' : ratio && username ? 'post' : 'unknown',
        ...(ratio ? { mediaRatio: Number(ratio[1]) / 100 } : {}),
        ...(username ? { username } : {}),
        ...(media ? { type: media.__typename, caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || '', videoAvailable: Boolean(media.video_url), dimensions: media.dimensions } : {}),
      }
    } catch (error) {
      results[id] = { status: 'unknown', error: error.code || 'request-failed' }
    }
    if (Object.keys(results).length % 25 === 0) console.log(`Checked ${Object.keys(results).length}/${ids.size}`)
  }
}
await Promise.all([worker(), worker(), worker()])
await writeFile('scripts/data/instagram-audit.json', JSON.stringify(Object.fromEntries(Object.entries(results).sort()), null, 2) + '\n')
await writeFile('dependencies/shared/instagramAudit.js', '// Public embed availability and dimensions. Refresh: node scripts/audit-instagram.mjs\nexport const instagramAudit = ' + JSON.stringify(Object.fromEntries(Object.entries(results).sort().map(([id, item]) => [id, {
  status: item.status,
  mediaRatio: item.mediaRatio || (item.dimensions?.height / item.dimensions?.width) || 1,
  username: item.username || '',
}])), null, 2) + '\n')
console.log(JSON.stringify({ total: ids.size, counts: Object.values(results).reduce((counts, item) => ({ ...counts, [item.status]: (counts[item.status] || 0) + 1 }), {}) }))
