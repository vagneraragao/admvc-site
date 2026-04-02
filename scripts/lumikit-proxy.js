#!/usr/bin/env node
/**
 * ADMVC — Lumikit Proxy
 *
 * Proxy HTTP local que encaminha pedidos do browser para o Lumikit SHOW.
 * Resolve o bloqueio de mixed content (HTTPS app → HTTP Lumikit).
 *
 * Uso:
 *   node lumikit-proxy.js                          (usa 172.20.10.2:5000)
 *   node lumikit-proxy.js 192.168.1.60             (IP custom, porta 5000)
 *   node lumikit-proxy.js 192.168.1.60 5000 8081   (tudo custom)
 *
 * O browser liga a http://localhost:8081 e o proxy encaminha para o Lumikit.
 */

const http = require('http')

const LUMIKIT_IP = process.argv[2] || '172.20.10.2'
const LUMIKIT_PORT = parseInt(process.argv[3] || '5000', 10)
const PROXY_PORT = parseInt(process.argv[4] || '8081', 10)

const server = http.createServer((req, res) => {
    // CORS headers — permite pedidos do browser
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    const targetUrl = `http://${LUMIKIT_IP}:${LUMIKIT_PORT}${req.url}`

    const proxyReq = http.request(targetUrl, { method: req.method, timeout: 5000 }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
        console.error(`[ERRO] ${req.url} → ${err.message}`)
        res.writeHead(502)
        res.end(JSON.stringify({ error: err.message }))
    })

    proxyReq.on('timeout', () => {
        proxyReq.destroy()
        res.writeHead(504)
        res.end(JSON.stringify({ error: 'Timeout' }))
    })

    req.pipe(proxyReq)
})

server.listen(PROXY_PORT, () => {
    console.log('')
    console.log('  ╔══════════════════════════════════════════════════╗')
    console.log('  ║           ADMVC — Lumikit Proxy                 ║')
    console.log('  ╠══════════════════════════════════════════════════╣')
    console.log(`  ║  Proxy:    http://localhost:${PROXY_PORT}                ║`)
    console.log(`  ║  Lumikit:  http://${LUMIKIT_IP}:${LUMIKIT_PORT}`.padEnd(55) + '║')
    console.log('  ║                                                  ║')
    console.log('  ║  Na app, configure o URL do Lumikit como:        ║')
    console.log(`  ║  http://localhost:${PROXY_PORT}`.padEnd(55) + '║')
    console.log('  ╚══════════════════════════════════════════════════╝')
    console.log('')
})
