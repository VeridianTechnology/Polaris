import { mediaResponse } from '../../server/instagram-media.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' }
  return mediaResponse(event.queryStringParameters?.post)
}
