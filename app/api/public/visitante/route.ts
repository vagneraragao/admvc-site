import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { enviarEmailNotificacaoEquipa } from '@/lib/mail'
import { sendPushToDepartamento } from '@/lib/web-push'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        const { success } = rateLimit(`visitante:${ip}`, 5, 60000) // 5 requests per minute
        if (!success) {
            return NextResponse.json({ error: 'Demasiados pedidos. Tente novamente mais tarde.' }, { status: 429 })
        }

        const body = await request.json()
        const { nome, telefone, pedido_oracao } = body

        if (!nome || !telefone) {
            return NextResponse.json(
                { error: 'Nome e telefone sao obrigatorios.' },
                { status: 400 }
            )
        }

        const tenant = await prisma.tenant.findFirst()
        if (!tenant) {
            return NextResponse.json(
                { error: 'Configuracao nao encontrada.' },
                { status: 500 }
            )
        }

        const visitante = await prisma.visitante.create({
            data: {
                tenant_id: tenant.id,
                nome,
                telefone,
                pedido_oracao: pedido_oracao || null,
            }
        })

        // Email para equipa
        enviarEmailNotificacaoEquipa({ nome, telefone, pedido: pedido_oracao }).catch(() => {})

        // Push notification para membros do acolhimento
        sendPushToDepartamento(
            ['acolhimento', 'integração', 'Acolhimento'],
            {
                title: 'Novo Visitante!',
                body: `${nome} acabou de se registar. Faca o primeiro contacto.`,
                url: '/departamentos/acolhimento/dashboard',
                tag: 'visitante-novo',
            }
        ).catch(() => {})

        return NextResponse.json({ ok: true, id: visitante.id })
    } catch (error: any) {
        console.error('[API PUBLIC] Erro ao registar visitante:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
