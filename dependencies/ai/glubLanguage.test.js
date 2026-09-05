import test from 'node:test'
import assert from 'node:assert/strict'
import { ALPHABET, alphabetSvg, glyphFor } from '../../Glub/language/alphabet.js'
import { researchCatalog, researchPack } from '../../Glub/notebook/researchPack.js'

test('26 distinct glyphs cover A–Z, with case-insensitive rendering', () => {
  assert.equal(ALPHABET.map((glyph) => glyph.letter).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  assert.equal(new Set(ALPHABET.map((glyph) => glyph.path)).size, 26)
  for (const glyph of ALPHABET) assert.equal(glyphFor(glyph.letter.toLowerCase()), glyph)
  for (const value of ['7', '!', ' ', '界', '🙂', '\n']) assert.equal(glyphFor(value), null)
})

test('the printable sheet includes every letter and can be exported as SVG', () => {
  const svg = alphabetSvg()
  assert(svg.startsWith('<svg'))
  for (const glyph of ALPHABET) assert(svg.includes(`${glyph.letter} · ${glyph.name}`))
})

test('research pack contains usable source references, categories, and inspection limits', () => {
  const rows = researchCatalog()
  assert(rows.length > 100)
  assert(rows.every((row) => typeof row.url === 'string' && row.url.length > 0))
  const pack = researchPack()
  for (const text of ['UNINSPECTED', 'Instagram', 'YouTube', 'Culture / street / Bike Culture', 'Science / animals / Insect', 'youtube.com/watch?v=']) assert(pack.includes(text))
  assert(!pack.includes('| undefined'))
})
