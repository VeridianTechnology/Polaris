import test from 'node:test'
import assert from 'node:assert/strict'
import { AI_BOARD_KEY, addAiReply, createAiThread, readAiBoard, saveAiBoard } from './aiBoardStore.js'

function storage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}

test('AI threads and replies persist independently from Agora', () => {
  const saved = storage()
  saved.setItem('polaris-academy-reactions', '{"untouched":true}')
  const thread = createAiThread({ title: ' Art study ', body: ' A first idea ', channel: 'Art' })
  const withReply = addAiReply(thread, ' A second thought ')
  saveAiBoard(saved, [withReply])
  assert.deepEqual(readAiBoard(saved), [withReply])
  assert.equal(withReply.replies[0].body, 'A second thought')
  assert.equal(thread.replies.length, 0)
  assert.equal(saved.getItem('polaris-academy-reactions'), '{"untouched":true}')
})

test('invalid stored data is rejected without overwriting it', () => {
  const saved = storage()
  saved.setItem(AI_BOARD_KEY, '{"version":1,"threads":[{"id":"bad"}]}')
  const before = saved.getItem(AI_BOARD_KEY)
  assert.throws(() => readAiBoard(saved))
  assert.equal(saved.getItem(AI_BOARD_KEY), before)
})

test('drafts validate boundaries and categories before persistence', () => {
  assert.throws(() => createAiThread({ title: ' ', body: 'hello', channel: 'Research' }))
  assert.throws(() => createAiThread({ title: 'Valid', body: 'a'.repeat(5001), channel: 'Art' }))
  assert.throws(() => createAiThread({ title: 'Valid', body: 'hello', channel: 'Agora' }))
  const thread = createAiThread({ title: 'Valid', body: 'a'.repeat(5000), channel: 'Research' })
  assert.equal(thread.body.length, 5000)
  assert.throws(() => addAiReply(thread, '   '))
})

test('a failed save propagates the error to the draft UI', () => {
  const saved = { setItem: () => { throw new Error('Storage full') } }
  assert.throws(() => saveAiBoard(saved, []), /Storage full/)
})
