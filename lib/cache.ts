import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

// ── Membros activos (usado em ~10 páginas) ──────────────────────────────────
// Lista leve: id + nome. Revalida a cada 60s ou quando chamado revalidateTag.
export const getCachedMembrosAtivos = unstable_cache(
    async (tenantId: number) => {
        return prisma.membro.findMany({
            where: { tenant_id: tenantId, is_active: true },
            select: { id: true, first_name: true, last_name: true },
            orderBy: { first_name: 'asc' },
        })
    },
    ['membros-ativos'],
    { revalidate: 60, tags: ['membros'] }
)

// ── Departamentos (usado em ~8 páginas) ──────────────────────────────────────
export const getCachedDepartamentos = unstable_cache(
    async (tenantId: number) => {
        return prisma.departamento.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' },
        })
    },
    ['departamentos'],
    { revalidate: 120, tags: ['departamentos'] }
)

// ── Grupos (usado em ~5 páginas) ─────────────────────────────────────────────
export const getCachedGrupos = unstable_cache(
    async (tenantId: number) => {
        return prisma.grupo.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' },
        })
    },
    ['grupos'],
    { revalidate: 120, tags: ['grupos'] }
)

// ── Sermões recentes (usado em ~3 páginas) ───────────────────────────────────
export const getCachedSermoes = unstable_cache(
    async (tenantId: number) => {
        return prisma.sermao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, titulo: true, data_pregacao: true },
            orderBy: { data_pregacao: 'desc' },
            take: 100,
        })
    },
    ['sermoes'],
    { revalidate: 60, tags: ['sermoes'] }
)

// ── Congregações (usado em ~6 páginas) ───────────────────────────────────────
export const getCachedCongregacoes = unstable_cache(
    async (tenantId: number) => {
        return prisma.congregacao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' },
        })
    },
    ['congregacoes'],
    { revalidate: 300, tags: ['congregacoes'] }
)

// ── Tenant config (usado em ~5 páginas media) ────────────────────────────────
export const getCachedTenantConfig = unstable_cache(
    async (tenantId: number) => {
        return prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true, nome: true,
                holyrics_url: true, holyrics_token: true,
                x32_ip: true, x32_port: true,
                lumikit_url: true, lumikit_cenas: true,
                regioes_custom: true,
            },
        })
    },
    ['tenant-config'],
    { revalidate: 300, tags: ['tenant'] }
)
