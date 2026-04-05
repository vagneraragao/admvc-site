'use server'

import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIAS
// ══════════════════════════════════════════════════════════════════════════════

export async function criarCategoria(formData: FormData) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    const nome = (formData.get('nome') as string)?.trim()
    if (!nome) return { error: 'Nome da categoria e obrigatorio.' }

    try {
        await (db as any).categoriaCantina.create({
            data: { tenant_id: tenantId, nome, ordem: 0 },
        })
        revalidatePath('/cantina')
        return { success: true }
    } catch (error: any) {
        if (error?.code === 'P2002') return { error: 'Ja existe uma categoria com este nome.' }
        return { error: 'Erro ao criar categoria.' }
    }
}

export async function eliminarCategoria(categoriaId: number) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()

    try {
        await db.categoriaCantina.delete({ where: { id: categoriaId } })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao eliminar categoria. Verifique se nao tem produtos associados.' }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUTOS
// ══════════════════════════════════════════════════════════════════════════════

export async function criarProduto(formData: FormData) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    const nome = (formData.get('nome') as string)?.trim()
    const preco = Number(formData.get('preco') || 0)
    const categoria_id = formData.get('categoria_id') ? Number(formData.get('categoria_id')) : null
    const stock = Number(formData.get('stock') || 0)
    const stock_minimo = Number(formData.get('stock_minimo') || 0)
    const controla_stock = formData.get('controla_stock') !== 'false'
    const imagem_url = (formData.get('imagem_url') as string)?.trim() || null
    const promocoesRaw = formData.get('promocoes') as string | null
    const promocoes = promocoesRaw ? JSON.parse(promocoesRaw) : null

    if (!nome) return { error: 'Nome do produto e obrigatorio.' }
    if (preco < 0) return { error: 'Preco nao pode ser negativo.' }

    try {
        await (db as any).produtoCantina.create({
            data: {
                tenant_id: tenantId,
                nome,
                preco,
                categoria_id,
                stock,
                stock_minimo,
                controla_stock,
                imagem_url,
                disponivel: true,
                promocoes,
            },
        })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao criar produto.' }
    }
}

export async function atualizarProduto(produtoId: number, formData: FormData) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()

    const nome = (formData.get('nome') as string)?.trim()
    const preco = Number(formData.get('preco') || 0)
    const categoria_id = formData.get('categoria_id') ? Number(formData.get('categoria_id')) : null
    const stock = Number(formData.get('stock') || 0)
    const stock_minimo = Number(formData.get('stock_minimo') || 0)
    const controla_stock = formData.get('controla_stock') !== 'false'
    const disponivel = formData.get('disponivel') !== 'false'
    const imagem_url = (formData.get('imagem_url') as string)?.trim() || null
    const promocoesRaw = formData.get('promocoes') as string | null
    const promocoes = promocoesRaw ? JSON.parse(promocoesRaw) : null

    if (!nome) return { error: 'Nome do produto e obrigatorio.' }

    try {
        await db.produtoCantina.update({
            where: { id: produtoId },
            data: { nome, preco, categoria_id, stock, stock_minimo, controla_stock, disponivel, imagem_url, promocoes },
        })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao atualizar produto.' }
    }
}

export async function eliminarProduto(produtoId: number) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()
    try {
        await db.produtoCantina.delete({ where: { id: produtoId } })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao eliminar produto. Pode ter transacoes associadas.' }
    }
}

export async function toggleDisponibilidadeProduto(produtoId: number) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()

    try {
        const produto = await db.produtoCantina.findUnique({ where: { id: produtoId } })
        if (!produto) return { error: 'Produto nao encontrado.' }

        await db.produtoCantina.update({
            where: { id: produtoId },
            data: { disponivel: !produto.disponivel },
        })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao alterar disponibilidade.' }
    }
}

export async function atualizarStock(produtoId: number, quantidade: number) {
    await requireRole(['ADMIN', 'CONGREGATION_ADMIN'])
    const db = await getDb()

    try {
        await db.produtoCantina.update({
            where: { id: produtoId },
            data: { stock: quantidade },
        })
        revalidatePath('/cantina')
        return { success: true }
    } catch {
        return { error: 'Erro ao atualizar stock.' }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// SALDO / RECARGA
// ══════════════════════════════════════════════════════════════════════════════

export async function recarregarSaldo(membroId: number, valor: number, descricao?: string) {
    const session = await requireRole(['ADMIN', 'CONGREGATION_ADMIN', 'FINANCE'])
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    if (valor <= 0) return { error: 'O valor da recarga deve ser positivo.' }

    try {
        // Buscar ou criar saldo
        let saldo = await db.saldoCantina.findUnique({ where: { membro_id: membroId } })

        if (!saldo) {
            saldo = await (db as any).saldoCantina.create({
                data: { tenant_id: tenantId, membro_id: membroId, saldo: 0 },
            })
        }

        const novoSaldo = (saldo?.saldo || 0) + valor

        // Atualizar saldo
        await db.saldoCantina.update({
            where: { membro_id: membroId },
            data: { saldo: novoSaldo },
        })

        // Registar transacao
        await (db as any).transacaoCantina.create({
            data: {
                tenant_id: tenantId,
                membro_id: membroId,
                tipo: 'RECARGA',
                valor,
                saldo_apos: novoSaldo,
                descricao: descricao || 'Recarga de saldo',
                operador_id: session.membroId,
            },
        })

        revalidatePath('/cantina')
        revalidatePath('/membros/dashboard')
        return { success: true, novoSaldo }
    } catch (error) {
        console.error('Erro ao recarregar saldo:', error)
        return { error: 'Erro ao recarregar saldo.' }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// VENDA (POS)
// ══════════════════════════════════════════════════════════════════════════════

interface ItemVenda {
    produtoId: number
    quantidade: number
}

export async function registarVenda(membroId: number, itens: ItemVenda[], formaPagamento: string = 'CREDITOS') {
    const session = await requireAuth()
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    if (!itens.length) return { error: 'Adicione pelo menos um item.' }

    try {
        // 1. Buscar produtos e calcular total
        const produtoIds = itens.map(i => i.produtoId)
        const produtos = await db.produtoCantina.findMany({
            where: { id: { in: produtoIds }, disponivel: true },
        })

        if (produtos.length !== produtoIds.length) {
            return { error: 'Um ou mais produtos nao estao disponiveis.' }
        }

        let total = 0
        const itensValidados = itens.map(item => {
            const produto = produtos.find(p => p.id === item.produtoId)!
            const subtotal = produto.preco * item.quantidade
            total += subtotal

            // Verificar stock
            if (produto.controla_stock && produto.stock < item.quantidade) {
                throw new Error(`Stock insuficiente para "${produto.nome}". Disponivel: ${produto.stock}`)
            }

            return { ...item, preco_unitario: produto.preco, nome: produto.nome, produto }
        })

        // 2. Buscar saldo do membro
        let saldo = await db.saldoCantina.findUnique({ where: { membro_id: membroId } })
        let novoSaldo = saldo?.saldo || 0

        if (formaPagamento === 'CREDITOS') {
            // Verificar saldo do membro
            if (!saldo || saldo.saldo < total) {
                return { error: `Saldo insuficiente. Disponivel: ${(saldo?.saldo || 0).toFixed(2)}€. Total: ${total.toFixed(2)}€` }
            }

            // 3. Debitar saldo
            novoSaldo = saldo.saldo - total
            await db.saldoCantina.update({
                where: { membro_id: membroId },
                data: { saldo: novoSaldo },
            })
        }

        // 4. Registar transacao com itens
        const descricaoItens = itensValidados.map(i => `${i.quantidade}x ${i.nome}`).join(', ')

        await (db as any).transacaoCantina.create({
            data: {
                tenant_id: tenantId,
                membro_id: membroId,
                tipo: 'CONSUMO',
                valor: -total,
                saldo_apos: novoSaldo,
                descricao: descricaoItens,
                operador_id: session.membroId,
                forma_pagamento: formaPagamento,
                itens: {
                    create: itensValidados.map(i => ({
                        produto_id: i.produtoId,
                        quantidade: i.quantidade,
                        preco_unitario: i.preco_unitario,
                    })),
                },
            },
        })

        // 5. Atualizar stock
        for (const item of itensValidados) {
            if (item.produto.controla_stock) {
                await db.produtoCantina.update({
                    where: { id: item.produtoId },
                    data: { stock: { decrement: item.quantidade } },
                })
            }
        }

        revalidatePath('/cantina')
        return { success: true, total, novoSaldo }
    } catch (error: any) {
        console.error('Erro ao registar venda:', error)
        return { error: error.message || 'Erro ao registar venda.' }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ESTORNO
// ══════════════════════════════════════════════════════════════════════════════

export async function estornarTransacao(transacaoId: number) {
    await requireRole(['ADMIN', 'FINANCE'])
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    try {
        const transacao = await db.transacaoCantina.findUnique({
            where: { id: transacaoId },
            include: { itens: true },
        })

        if (!transacao || transacao.tipo !== 'CONSUMO') {
            return { error: 'Transacao nao encontrada ou nao e estornavel.' }
        }

        const valorEstorno = Math.abs(transacao.valor)

        // Devolver saldo
        const saldo = await db.saldoCantina.findUnique({ where: { membro_id: transacao.membro_id } })
        const novoSaldo = (saldo?.saldo || 0) + valorEstorno

        await db.saldoCantina.update({
            where: { membro_id: transacao.membro_id },
            data: { saldo: novoSaldo },
        })

        // Devolver stock
        for (const item of transacao.itens) {
            await db.produtoCantina.update({
                where: { id: item.produto_id },
                data: { stock: { increment: item.quantidade } },
            })
        }

        // Registar transacao de estorno
        await (db as any).transacaoCantina.create({
            data: {
                tenant_id: tenantId,
                membro_id: transacao.membro_id,
                tipo: 'ESTORNO',
                valor: valorEstorno,
                saldo_apos: novoSaldo,
                descricao: `Estorno da transacao #${transacaoId}`,
            },
        })

        revalidatePath('/cantina')
        return { success: true }
    } catch (error) {
        console.error('Erro ao estornar:', error)
        return { error: 'Erro ao estornar transacao.' }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSULTAS
// ══════════════════════════════════════════════════════════════════════════════

export async function obterSaldoMembro(membroId: number) {
    const db = await getDb()
    const saldo = await db.saldoCantina.findUnique({ where: { membro_id: membroId } })
    return saldo?.saldo || 0
}

export async function obterExtratoMembro(membroId: number, limite = 50) {
    const db = await getDb()
    return db.transacaoCantina.findMany({
        where: { membro_id: membroId },
        include: { itens: { include: { produto: { select: { nome: true } } } } },
        orderBy: { criado_em: 'desc' },
        take: limite,
    })
}
