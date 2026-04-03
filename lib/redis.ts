import { Redis } from '@upstash/redis'

// Singleton — seguro a nível de módulo (sem conexão TCP persistente)
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN!,
})

// ── Helper de cache genérico ─────────────────────────────────────────────────
// Tenta ler do Redis; se miss, executa a função e guarda com TTL.
// Fail-open: se o Redis falhar, executa a query diretamente (sem cache).
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
): Promise<T> {
    try {
        const hit = await redis.get<T>(key)
        if (hit !== null && hit !== undefined) return hit
    } catch {
        // Redis down — fail-open
    }

    const data = await fn()

    try {
        await redis.set(key, data, { ex: ttlSeconds })
    } catch {
        // Redis down — não bloqueia
    }

    return data
}

// ── Invalidação por padrão ───────────────────────────────────────────────────
// Apaga todas as keys que começam com o prefixo dado.
// Útil para invalidar cache de um tenant inteiro ou de uma entidade.
export async function invalidatePrefix(prefix: string) {
    try {
        let cursor: string | number = 0
        do {
            const [nextCursor, keys] = await redis.scan(Number(cursor), { match: `${prefix}*`, count: 100 })
            cursor = nextCursor
            if (keys.length > 0) {
                await redis.del(...keys)
            }
        } while (Number(cursor) !== 0)
    } catch {
        // Redis down — falha silenciosa
    }
}

// ── Invalidação de key única ─────────────────────────────────────────────────
export async function invalidateKey(...keys: string[]) {
    try {
        if (keys.length > 0) await redis.del(...keys)
    } catch {
        // Redis down — falha silenciosa
    }
}
