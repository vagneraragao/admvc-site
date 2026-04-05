'use server'

import { revalidatePath } from 'next/cache'
import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'

// ── CRIAR ITEM ─────────────────────────────────────────────────────────────────
export async function criarItemAssistencia(formData: FormData) {
    try {
        const session = await requireAuth()
        const db = await getDb()
        const tenantId = await getTenantIdFromHeaders()

        const nome = formData.get('nome') as string
        const categoria = formData.get('categoria') as string
        const unidade = formData.get('unidade') as string || 'unidade'
        const stock = Number(formData.get('stock')) || 0
        const stock_minimo = Number(formData.get('stock_minimo')) || 0

        if (!nome || !categoria) {
            return { error: 'Nome e categoria sao obrigatorios.' }
        }

        await db.itemAssistenciaSocial.create({
            data: {
                tenant_id: tenantId,
                nome,
                categoria,
                unidade,
                stock,
                stock_minimo,
            }
        })

        revalidatePath('/assistencia')
        revalidatePath('/assistencia/stock')
        return { ok: true }
    } catch (err: any) {
        console.error('Erro ao criar item assistencia:', err)
        return { error: err.message || 'Erro ao criar item.' }
    }
}

// ── REGISTAR MOVIMENTO ──────────────────────────────────────────────────────────
export async function registarMovimentoAssistencia(formData: FormData) {
    try {
        const session = await requireAuth()
        const db = await getDb()
        const tenantId = await getTenantIdFromHeaders()

        const item_id = Number(formData.get('item_id'))
        const tipo = formData.get('tipo') as string
        const quantidade = Number(formData.get('quantidade'))
        const destinatario = formData.get('destinatario') as string || null
        const observacao = formData.get('observacao') as string || null

        if (!item_id || !tipo || !quantidade || quantidade <= 0) {
            return { error: 'Campos obrigatorios em falta ou quantidade invalida.' }
        }

        const tiposValidos = ['DOACAO_RECEBIDA', 'ENTREGA_FAMILIA', 'ENTREGA_ENTIDADE', 'REPASSE_CANTINA']
        if (!tiposValidos.includes(tipo)) {
            return { error: 'Tipo de movimento invalido.' }
        }

        const item = await db.itemAssistenciaSocial.findUnique({ where: { id: item_id } })
        if (!item) return { error: 'Item nao encontrado.' }

        if (tipo === 'DOACAO_RECEBIDA') {
            // Incrementar stock
            await db.$transaction([
                db.movimentoAssistencia.create({
                    data: {
                        tenant_id: tenantId,
                        item_id,
                        tipo,
                        quantidade,
                        destinatario,
                        observacao,
                        registrado_por: session.membroId,
                    }
                }),
                db.itemAssistenciaSocial.update({
                    where: { id: item_id },
                    data: { stock: item.stock + quantidade }
                })
            ])
        } else {
            // ENTREGA_FAMILIA, ENTREGA_ENTIDADE, REPASSE_CANTINA — decrementar
            if (quantidade > item.stock) {
                return { error: `Stock insuficiente. Disponivel: ${item.stock} ${item.unidade}(s).` }
            }

            await db.$transaction([
                db.movimentoAssistencia.create({
                    data: {
                        tenant_id: tenantId,
                        item_id,
                        tipo,
                        quantidade,
                        destinatario,
                        observacao,
                        registrado_por: session.membroId,
                    }
                }),
                db.itemAssistenciaSocial.update({
                    where: { id: item_id },
                    data: { stock: item.stock - quantidade }
                })
            ])
        }

        revalidatePath('/assistencia')
        revalidatePath('/assistencia/stock')
        revalidatePath('/assistencia/movimentos')
        return { ok: true }
    } catch (err: any) {
        console.error('Erro ao registar movimento:', err)
        return { error: err.message || 'Erro ao registar movimento.' }
    }
}

// ── ELIMINAR ITEM ───────────────────────────────────────────────────────────────
export async function eliminarItemAssistencia(itemId: number) {
    try {
        await requireAuth()
        const db = await getDb()

        // Eliminar movimentos associados primeiro
        await db.movimentoAssistencia.deleteMany({ where: { item_id: itemId } })
        await db.itemAssistenciaSocial.delete({ where: { id: itemId } })

        revalidatePath('/assistencia')
        revalidatePath('/assistencia/stock')
        revalidatePath('/assistencia/movimentos')
        return { ok: true }
    } catch (err: any) {
        console.error('Erro ao eliminar item:', err)
        return { error: err.message || 'Erro ao eliminar item.' }
    }
}
