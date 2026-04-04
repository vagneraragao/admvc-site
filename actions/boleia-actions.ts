'use server'

import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// ── CRIAR OFERTA ─────────────────────────────────────────────────────────────

export async function criarOfertaBoleia(formData: FormData) {
    const session = await requireAuth()
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()

    const evento_id = formData.get('evento_id') ? Number(formData.get('evento_id')) : null
    const data_hora_saida = formData.get('data_hora_saida') as string
    const endereco_partida = formData.get('endereco_partida') as string
    const zona_partida = formData.get('zona_partida') as string | null
    const latitude = formData.get('latitude') ? Number(formData.get('latitude')) : null
    const longitude = formData.get('longitude') ? Number(formData.get('longitude')) : null
    const vagas_total = Number(formData.get('vagas_total') || 1)
    const nota = formData.get('nota') as string | null
    const recorrente = formData.get('recorrente') === 'true'

    if (!endereco_partida || !data_hora_saida) {
        return { error: 'Preencha a morada de partida e o horario.' }
    }

    if (vagas_total < 1 || vagas_total > 8) {
        return { error: 'O numero de vagas deve ser entre 1 e 8.' }
    }

    try {
        await (db as any).boleiaOferta.create({
            data: {
                tenant_id: tenantId,
                motorista_id: session.membroId,
                evento_id: evento_id || null,
                data_hora_saida: new Date(data_hora_saida),
                endereco_partida: endereco_partida.trim(),
                zona_partida: zona_partida?.trim() || null,
                latitude,
                longitude,
                vagas_total,
                nota: nota?.trim() || null,
                recorrente,
                status: 'ATIVA',
            },
        })

        revalidatePath('/boleia')
        return { success: true }
    } catch (error) {
        console.error('Erro ao criar oferta de boleia:', error)
        return { error: 'Erro ao criar oferta. Tente novamente.' }
    }
}

// ── CANCELAR OFERTA ──────────────────────────────────────────────────────────

export async function cancelarOfertaBoleia(ofertaId: number) {
    const session = await requireAuth()
    const db = await getDb()

    try {
        const oferta = await db.boleiaOferta.findUnique({ where: { id: ofertaId } })

        if (!oferta || oferta.motorista_id !== session.membroId) {
            return { error: 'Oferta nao encontrada ou sem permissao.' }
        }

        await db.boleiaOferta.update({
            where: { id: ofertaId },
            data: { status: 'CANCELADA' },
        })

        revalidatePath('/boleia')
        revalidatePath('/boleia/minhas')
        return { success: true }
    } catch (error) {
        console.error('Erro ao cancelar oferta:', error)
        return { error: 'Erro ao cancelar. Tente novamente.' }
    }
}

// ── RESERVAR LUGAR ───────────────────────────────────────────────────────────

export async function reservarBoleia(ofertaId: number) {
    const session = await requireAuth()
    const db = await getDb()

    try {
        const oferta = await db.boleiaOferta.findUnique({
            where: { id: ofertaId },
            include: { reservas: { where: { status: 'CONFIRMADA' } } },
        })

        if (!oferta || oferta.status !== 'ATIVA') {
            return { error: 'Esta oferta ja nao esta disponivel.' }
        }

        if (oferta.motorista_id === session.membroId) {
            return { error: 'Nao pode reservar a sua propria boleia.' }
        }

        const vagasOcupadas = oferta.reservas.length
        if (vagasOcupadas >= oferta.vagas_total) {
            return { error: 'Ja nao ha vagas disponiveis.' }
        }

        const jaReservou = oferta.reservas.some(r => r.passageiro_id === session.membroId)
        if (jaReservou) {
            return { error: 'Ja tem uma reserva nesta boleia.' }
        }

        const tenantId = await getTenantIdFromHeaders()
        await (db as any).boleiaReserva.create({
            data: {
                tenant_id: tenantId,
                oferta_id: ofertaId,
                passageiro_id: session.membroId,
                status: 'CONFIRMADA',
            },
        })

        revalidatePath('/boleia')
        return { success: true }
    } catch (error) {
        console.error('Erro ao reservar boleia:', error)
        return { error: 'Erro ao reservar. Tente novamente.' }
    }
}

// ── CANCELAR RESERVA ─────────────────────────────────────────────────────────

export async function cancelarReservaBoleia(reservaId: number) {
    const session = await requireAuth()
    const db = await getDb()

    try {
        const reserva = await db.boleiaReserva.findUnique({ where: { id: reservaId } })

        if (!reserva || reserva.passageiro_id !== session.membroId) {
            return { error: 'Reserva nao encontrada ou sem permissao.' }
        }

        await db.boleiaReserva.update({
            where: { id: reservaId },
            data: { status: 'CANCELADA' },
        })

        revalidatePath('/boleia')
        return { success: true }
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error)
        return { error: 'Erro ao cancelar. Tente novamente.' }
    }
}
