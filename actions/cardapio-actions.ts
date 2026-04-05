'use server'

import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// ── CRIAR/ATUALIZAR CARDAPIO PARA UM EVENTO ──────────────────────────────────

export async function salvarCardapio(eventoId: number, produtoIds: number[]) {
    await requireAuth()
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    if (!produtoIds.length) return { error: 'Selecione pelo menos um produto.' }

    try {
        // Verificar se ja existe cardapio para este evento
        const existente = await db.cardapioCantina.findUnique({ where: { evento_id: eventoId } })

        if (existente) {
            // Apagar itens antigos e recriar
            await db.cardapioItem.deleteMany({ where: { cardapio_id: existente.id } })
            await db.cardapioItem.createMany({
                data: produtoIds.map(pid => ({ cardapio_id: existente.id, produto_id: pid })),
            })
        } else {
            await (db as any).cardapioCantina.create({
                data: {
                    tenant_id: tenantId,
                    evento_id: eventoId,
                    itens: {
                        create: produtoIds.map(pid => ({ produto_id: pid })),
                    },
                },
            })
        }

        revalidatePath('/cantina')
        return { success: true }
    } catch (error) {
        console.error('Erro ao salvar cardapio:', error)
        return { error: 'Erro ao salvar cardapio.' }
    }
}

// ── REMOVER CARDAPIO ─────────────────────────────────────────────────────────

export async function removerCardapio(eventoId: number) {
    await requireAuth()
    const db = await getDb()

    try {
        await db.cardapioCantina.delete({ where: { evento_id: eventoId } })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao remover cardapio.' }
    }
}

// ── OBTER CARDAPIO DE UM EVENTO ──────────────────────────────────────────────

export async function obterCardapio(eventoId: number) {
    const db = await getDb()
    return db.cardapioCantina.findUnique({
        where: { evento_id: eventoId },
        include: {
            itens: {
                include: { produto: { select: { id: true, nome: true, preco: true, stock: true, controla_stock: true, imagem_url: true, categoria: { select: { nome: true } } } } },
            },
        },
    })
}
