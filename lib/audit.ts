// lib/audit.ts
// Helper central para registar eventos de auditoria
// Uso: await audit({ ... })

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { getSessionData } from '@/lib/auth-utils'

// ── TIPOS ─────────────────────────────────────────────────────────────────────

export type AuditAcao =
    | 'CRIAR'
    | 'EDITAR'
    | 'APAGAR'
    | 'LOGIN'
    | 'LOGIN_FALHOU'
    | 'LOGOUT'
    | 'VINCULAR'
    | 'DESVINCULAR'
    | 'APROVAR'
    | 'REJEITAR'
    | 'EXPORT'
    | 'VER_PERFIL'
    | 'RESET_SENHA'
    | 'ALTERAR_ROLE'
    | 'ALTERAR_STATUS'

export type AuditCategoria =
    | 'MEMBROS'
    | 'FAMILIAS'
    | 'ESCALAS'
    | 'FINANCEIRO'
    | 'ACESSO'
    | 'DOCUMENTOS'
    | 'CANTINA'
    | 'SISTEMA'

export type AuditAlvoTipo =
    | 'MEMBRO'
    | 'FAMILIA'
    | 'ESCALA'
    | 'EVENTO'
    | 'LANCAMENTO'
    | 'CONTRIBUICAO'
    | 'RIFA'
    | 'CARNE'
    | 'SISTEMA'

interface AuditParams {
    // Contexto (obrigatorio)
    tenant_id: number
    categoria: AuditCategoria
    acao: AuditAcao

    // Quem fez (opcional — se nao passar, tenta ler da sessao)
    actor_id?: number
    actor_nome?: string

    // Sobre quem / o que
    alvo_id?: number
    alvo_nome?: string
    alvo_tipo?: AuditAlvoTipo

    // Detalhes
    descricao?: string
    dados_antes?: Record<string, any>
    dados_apos?: Record<string, any>
}

// ── FUNCAO PRINCIPAL ──────────────────────────────────────────────────────────

export async function audit(params: AuditParams): Promise<void> {
    try {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')
            || headersList.get('x-real-ip')
            || 'desconhecido'
        const userAgent = headersList.get('user-agent') || null

        // Tenta preencher actor se nao for passado
        let actorId = params.actor_id
        let actorNome = params.actor_nome

        if (!actorId) {
            try {
                const session = await getSessionData()
                if (session) {
                    actorId = session.membroId
                }
            } catch {
                // Pode nao ter sessao (ex: login falhado)
            }
        }

        await prisma.auditLog.create({
            data: {
                tenant_id: params.tenant_id,
                actor_id: actorId || null,
                actor_nome: actorNome || null,
                alvo_id: params.alvo_id || null,
                alvo_nome: params.alvo_nome || null,
                alvo_tipo: params.alvo_tipo || null,
                acao: params.acao,
                categoria: params.categoria,
                descricao: params.descricao || null,
                dados_antes: params.dados_antes
                    ? JSON.stringify(params.dados_antes)
                    : null,
                dados_apos: params.dados_apos
                    ? JSON.stringify(params.dados_apos)
                    : null,
                ip: ip.split(',')[0].trim(), // pega o primeiro IP da chain
                user_agent: userAgent,
            }
        })
    } catch (err: any) {
        // Nunca deixa o audit quebrar o fluxo principal
        console.error('[AUDIT] Erro ao registar evento:', err.message)
    }
}

// ── HELPERS ESPECIFICOS ───────────────────────────────────────────────────────

// Para registar apenas os campos que mudaram (evita guardar dados desnecessarios)
export function diffCampos(
    antes: Record<string, any>,
    depois: Record<string, any>,
    camposIgnorar: string[] = ['password', 'updatedAt', 'updated_at']
): { antes: Record<string, any>; depois: Record<string, any> } | null {
    const camposMudaram: string[] = []

    Object.keys(depois).forEach(key => {
        if (camposIgnorar.includes(key)) return
        if (JSON.stringify(antes[key]) !== JSON.stringify(depois[key])) {
            camposMudaram.push(key)
        }
    })

    if (camposMudaram.length === 0) return null

    const snapAntes: Record<string, any> = {}
    const snapDepois: Record<string, any> = {}

    camposMudaram.forEach(key => {
        snapAntes[key] = antes[key]
        snapDepois[key] = depois[key]
    })

    return { antes: snapAntes, depois: snapDepois }
}

// Para sanitizar dados sensiveis antes de guardar no log
export function sanitizar(dados: Record<string, any>): Record<string, any> {
    const CAMPOS_SENSIVEIS = ['password', 'nova_senha', 'token', 'secret']
    const resultado = { ...dados }
    CAMPOS_SENSIVEIS.forEach(campo => {
        if (campo in resultado) resultado[campo] = '[OCULTO]'
    })
    return resultado
}