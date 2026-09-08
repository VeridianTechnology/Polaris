import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePublicMedia, mediaResponse } from './instagram-media.js'
import { mediaShape, seekTime } from '../dependencies/shared/reelGeometry.js'

const image = (id) => ({ is_video: false, display_url: `https://scontent.cdninstagram.com/${id}.jpg`, dimensions: { width: 540, height: 960 } })
const embed = (media) => `"contextJSON":${JSON.stringify(JSON.stringify({ gql_data: { shortcode_media: media } }))}`

test('public video source stays separate from contradictory preview dimensions', () => {
  const result = parsePublicMedia(embed({ ...image('poster'), is_video: true, video_url: 'https://video.cdninstagram.com/reel.mp4' }))
  assert.equal(result.slides[0].type, 'video')
  assert.equal(result.slides[0].src, 'https://video.cdninstagram.com/reel.mp4')
  assert.equal(result.slides[0].poster, 'https://scontent.cdninstagram.com/poster.jpg')
  assert.equal(mediaShape(1280, 720), 'landscape')
  assert.equal(mediaShape(540, 960), 'portrait')
  assert.equal(mediaShape(576, 576), 'square')
})

test('carousel preserves all images in their original order', () => {
  const result = parsePublicMedia(embed({ ...image('one'), edge_sidecar_to_children: { edges: [image('one'), image('two'), image('three')].map((node) => ({ node })) } }))
  assert.deepEqual(result.slides.map((slide) => slide.src), ['one', 'two', 'three'].map((id) => `https://scontent.cdninstagram.com/${id}.jpg`))
})

test('restricted and unavailable media retain the Instagram fallback', () => {
  assert.equal(parsePublicMedia(embed({ ...image('poster'), is_video: true })), null)
  assert.equal(parsePublicMedia('<html>Unavailable</html>'), null)
  assert.equal(parsePublicMedia(embed({ ...image('one'), display_url: 'https://example.com/image.jpg' })), null)
  assert.equal(parsePublicMedia(embed({ ...image('one'), edge_sidecar_to_children: { edges: [{ node: image('one') }, { node: { is_video: true } }] } })), null)
})

test('endpoint does not fetch arbitrary URLs or uncurated posts', async () => {
  for (const post of ['https://example.com', '../private', 'AAAAAAAAAAA', undefined]) {
    assert.equal((await mediaResponse(post)).statusCode, 404)
  }
})

test('seeking clamps to playable duration in both directions', () => {
  assert.equal(seekTime(3, -5, 60), 0)
  assert.equal(seekTime(58, 5, 60), 60)
  assert.equal(seekTime(30, -5, 60), 25)
  assert.equal(seekTime(30, 5, NaN), 0)
})
