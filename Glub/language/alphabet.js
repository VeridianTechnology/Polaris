export const SCRIPT_NAME = 'Glub Script'
export const SCRIPT_VERSION = 1

// Original monoline glyphs on a 24 × 24 grid. Latin letters are canonical;
// this is a reversible display alphabet, not a new semantic language.
const shapes = [
  ['A', 'Origin', 'M12 3 3 12 12 21 21 12Z M12 8V16'],
  ['B', 'Tide', 'M5 4V20H17 M5 4H17L12 10 17 16H5'],
  ['C', 'Crescent', 'M19 5H10L4 12 10 19H19 M4 12H13'],
  ['D', 'Gate', 'M5 20V4H12L20 12 12 20 M10 8V16'],
  ['E', 'Ember', 'M4 5H20L12 12 20 19H4 M4 12H8'],
  ['F', 'Branch', 'M6 21V3L18 8 6 13 M6 17H15'],
  ['G', 'Orbit', 'M12 3 21 12 12 21 3 12 12 3 M12 12H21 M8 12H8.1'],
  ['H', 'Bridge', 'M4 4V20 M20 4V20 M4 8 12 16 20 8'],
  ['I', 'Signal', 'M12 3V21 M7 6 12 3 17 6 M7 18 12 21 17 18'],
  ['J', 'Hook', 'M5 4H18V15L12 21 5 15 M10 8H18'],
  ['K', 'Fork', 'M5 3V21 M5 12 18 4 M10 9 20 20'],
  ['L', 'Anchor', 'M8 3V18L17 12 M3 18 8 22 20 18'],
  ['M', 'Mountain', 'M3 20 8 4 12 12 16 4 21 20 M8 17H16'],
  ['N', 'Current', 'M4 20V4L20 20V4 M8 12H16'],
  ['O', 'Eye', 'M3 12 12 5 21 12 12 19Z M10 12 12 10 14 12 12 14Z'],
  ['P', 'Seed', 'M7 21V3H15L20 8 15 13H7 M11 7H15'],
  ['Q', 'Comet', 'M12 3 20 11 12 19 4 11Z M12 11 21 21'],
  ['R', 'Root', 'M5 21V3H13L19 9 13 15H5 M13 15 20 21'],
  ['S', 'Spiral', 'M20 4H4V12H20V20H4 M8 8H16'],
  ['T', 'Beacon', 'M3 7 12 3 21 7 M12 3V21 M7 16H17'],
  ['U', 'Vessel', 'M4 4V14L12 21 20 14V4 M8 8V13L12 17'],
  ['V', 'Valley', 'M3 4 12 21 21 4 M8 4 12 11 16 4'],
  ['W', 'Weave', 'M3 5 8 20 12 12 16 20 21 5 M8 7H16'],
  ['X', 'Crossing', 'M4 4 20 20 M20 4 4 20 M8 12 12 8 16 12 12 16Z'],
  ['Y', 'Confluence', 'M4 3 12 11 20 3 M12 11V21 M7 17 12 21 17 17'],
  ['Z', 'Horizon', 'M3 4H21L3 20H21 M8 12H16'],
]

export const ALPHABET = shapes.map(([letter, name, path]) => ({ letter, name, path }))
export const GLYPH_BY_LETTER = Object.fromEntries(ALPHABET.map((glyph) => [glyph.letter, glyph]))

export function glyphFor(character) {
  return /^[a-z]$/i.test(character) ? GLYPH_BY_LETTER[character.toUpperCase()] : null
}

export function alphabetSvg() {
  const cells = ALPHABET.map((glyph, index) => {
    const x = 32 + (index % 7) * 100
    const y = 108 + Math.floor(index / 7) * 114
    return `<g transform="translate(${x} ${y})"><rect width="86" height="100" rx="6" fill="#172329"/><svg x="19" y="10" width="48" height="48" viewBox="0 0 24 24"><path d="${glyph.path}" fill="none" stroke="#c3d3c5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><text x="43" y="76" text-anchor="middle" fill="#eeeae0" font-size="14">${glyph.letter} · ${glyph.name}</text></g>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="610" viewBox="0 0 750 610" role="img" aria-label="Glub Script alphabet, version 1"><rect width="750" height="610" fill="#111b20"/><g font-family="sans-serif"><text x="32" y="47" fill="#eeeae0" font-size="28">Glub Script / 01</text><text x="32" y="77" fill="#a4b6b9" font-size="13">26 original glyphs · A–Z · Left to right · English remains the source</text>${cells}<text x="32" y="590" fill="#a4b6b9" font-size="12">Numbers, punctuation, spaces and non-Latin characters remain unchanged.</text></g></svg>`
}
