import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'

function llmProxyPlugin(): Plugin {
  return {
    name: 'llm-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/llm' && req.method === 'POST') {
          let body = '';
          for await (const chunk of req) {
            body += chunk;
          }

          try {
            const parsed = JSON.parse(body);
            const { baseUrl, apiKey, ...apiBody } = parsed;

            if (!baseUrl || !apiKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'text/plain');
              res.end('Missing baseUrl or apiKey');
              return;
            }

            const targetUrl = `${baseUrl}/chat/completions`;
            const apiRes = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(apiBody),
            });

            const apiBodyRes = await apiRes.text();
            res.statusCode = apiRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(apiBodyRes);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(err instanceof Error ? err.message : 'Proxy error');
          }
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), llmProxyPlugin()],
})
