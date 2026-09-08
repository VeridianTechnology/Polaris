import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mediaResponse } from './server/instagram-media.js'

function publicInstagramMedia() {
  const configure = (server) => {
    server.middlewares.use('/.netlify/functions/instagram-media', async (request, response) => {
      if (request.method !== 'GET') { response.writeHead(405).end(); return }
      const post = new URL(request.url, 'http://localhost').searchParams.get('post')
      const result = await mediaResponse(post)
      response.writeHead(result.statusCode, result.headers).end(result.body)
    })
  }
  return { name: 'public-instagram-media', configureServer: configure, configurePreviewServer: configure }
}

export default defineConfig({
  plugins: [react(), publicInstagramMedia()],
  server: {
    proxy: {
      '/aic-local': { target: 'http://127.0.0.1:8765', changeOrigin: true, rewrite: (path) => path.replace(/^\/aic-local/, '') || '/' },
    },
  },
})
