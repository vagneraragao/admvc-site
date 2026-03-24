// app/api/financeiro/lancar/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'

export async function POST(request: Request) {
    try {
        const session = await getSessionData();
        const registradoPorId = session?.membroId || 1;

        const body = await request.json()
        const { objetivoId, membroId, valor, forma, data } = body

        // 1. Validação de segurança dos campos
        if (!objetivoId || !membroId || !valor || !forma) {
            return NextResponse.json(
                { error: 'Dados incompletos para o lançamento.' },
                { status: 400 }
            )
        }

        // 2. Operação em Transação (Garante que ou faz tudo, ou não faz nada)
        const resultado = await prisma.$transaction(async (tx) => {

            // A. Cria o registro do lançamento (o rastro financeiro)
            const novoLancamento = await tx.lancamentoFinanceiro.create({
                data: {
                    objetivo_id: Number(objetivoId),
                    valor_pago: parseFloat(valor),
                    forma_pagamento: String(forma).toUpperCase(),
                    data_recebimento: data ? new Date(data) : new Date(),
                    registrado_por_id: registradoPorId
                }
            })

            // B. Opcional: Atualiza o status do Objetivo se ele for concluído
            // Buscamos o objetivo para ver o total prometido vs total pago
            const objetivo = await tx.objetivoFinanceiro.findUnique({
                where: { id: Number(objetivoId) },
                include: { lancamentos: true }
            })

            const totalJaPago = objetivo?.lancamentos.reduce((sum, l) => sum + l.valor_pago, 0) || 0;
            const metaTotal = (objetivo?.valor_mensal || 0) * (objetivo?.parcelas_total || 0);

            if (totalJaPago >= metaTotal) {
                await tx.objetivoFinanceiro.update({
                    where: { id: Number(objetivoId) },
                    data: { status: 'CONCLUIDO' }
                })
            }

            return novoLancamento
        })

        return NextResponse.json(resultado)

    } catch (error: any) {
        console.error("ERRO NO LANÇAMENTO FINANCEIRO:", error)
        return NextResponse.json(
            { error: 'Falha interna ao processar o pagamento.' },
            { status: 500 }
        )
    }
}