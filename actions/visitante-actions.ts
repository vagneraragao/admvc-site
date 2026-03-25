'use server'
// actions/visitante-actions.ts

import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function registarVisitante(formData: FormData) {
    try {
        await prisma.visitante.create({
            data: {
                nome: formData.get('nome') as string,
                telefone: formData.get('telefone') as string,
                pedido_oracao: formData.get('pedido_oracao') as string,
            }
        });
        return { ok: true }
    } catch (e) {
        return { ok: false }
    }
}

export async function registarAcompanhamento(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { error: "Sessão expirada." };

        const visitanteId = Number(formData.get('visitante_id'));
        const tipoContacto = formData.get('tipo_contacto') as string;
        const observacoes = formData.get('observacoes') as string;
        const novoStatus = formData.get('status') as string;

        // NOVO: Captura a quantidade de visitas do formulário (padrão 1 se falhar)
        const quantidadeVisitas = Number(formData.get('quantidade_visitas')) || 1;

        // RESOLUÇÃO DO ERRO P2028:
        // Executamos as queries sequencialmente em vez de usar $transaction.
        // Isto é muito mais leve e evita timeouts em bancos de dados serverless.

        // 1. Grava o histórico do contacto
        await prisma.acompanhamentoVisitante.create({
            data: {
                visitante_id: visitanteId,
                membro_id: session.membroId,
                tipo_contacto: tipoContacto,
                observacoes: observacoes
            }
        });

        // 2. Atualiza o status e a quantidade de visitas do visitante
        await prisma.visitante.update({
            where: { id: visitanteId },
            data: {
                status: novoStatus,
                quantidade_visitas: quantidadeVisitas,
                data_ultima_visita: new Date() // Atualiza automaticamente para o dia de hoje
            }
        });

        revalidatePath('/acolhimento/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao registar acompanhamento:", error);
        return { error: "Falha ao gravar os dados. Tente novamente." };
    }
}