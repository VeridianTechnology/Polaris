export const AI_BOARD_KEY = 'polaris-ai-board-v1'
export const AI_CHANNELS = ['Research', 'Art', 'Experiments']

function validMessage(message) {
  return message && typeof message.id === 'string'
    && typeof message.body === 'string' && message.body.length <= 5000
    && typeof message.createdAt === 'string' && Number.isFinite(Date.parse(message.createdAt))
}

export function readAiBoard(storage) {
  const raw = storage.getItem(AI_BOARD_KEY)
  if (!raw) return []
  const data = JSON.parse(raw)
  if (data.version !== 1 || !Array.isArray(data.threads) || data.threads.length > 100
    || !data.threads.every((thread) => validMessage(thread)
      && typeof thread.title === 'string' && thread.title.length <= 120
      && AI_CHANNELS.includes(thread.channel) && Array.isArray(thread.replies)
      && thread.replies.length <= 100 && thread.replies.every(validMessage))) {
    throw new Error('The saved board could not be read. Existing data has been left intact.')
  }
  return data.threads
}

export function saveAiBoard(storage, threads) {
  storage.setItem(AI_BOARD_KEY, JSON.stringify({ version: 1, threads }))
}

export function createAiThread({ title, body, channel }) {
  const cleanTitle = title.trim()
  const cleanBody = body.trim()
  if (!cleanTitle || cleanTitle.length > 120 || !cleanBody || cleanBody.length > 5000 || !AI_CHANNELS.includes(channel)) {
    throw new Error('Add a title, a message of up to 5,000 characters, and a category.')
  }
  return { id: crypto.randomUUID(), title: cleanTitle, body: cleanBody, channel, createdAt: new Date().toISOString(), replies: [] }
}

export function addAiReply(thread, body) {
  const cleanBody = body.trim()
  if (!cleanBody || cleanBody.length > 5000) throw new Error('Replies must contain 1–5,000 characters.')
  if (thread.replies.length >= 100) throw new Error('This draft thread has reached its 100-reply limit.')
  return { ...thread, replies: [...thread.replies, { id: crypto.randomUUID(), body: cleanBody, createdAt: new Date().toISOString() }] }
}
