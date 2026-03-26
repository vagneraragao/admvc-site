'use server'
// actions/visitante-actions.ts

import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// ATUALIZA ESTA LINHA ABAIXO:
import { enviarEmailNotificacaoEquipa } from '@/lib/mail';

export async function registarVisitante(formData: FormData) {
    try {
        const nome = formData.get('nome') as string;
        const telefone = formData.get('telefone') as string;
        const pedido = formData.get('pedido_oracao') as string;

        const novoVisitante = await prisma.visitante.create({
            data: {
                nome: nome,
                telefone: telefone,
                pedido_oracao: pedido,
            }
        });

        // Agora a função será reconhecida
        await enviarEmailNotificacaoEquipa({
            nome: nome,
            telefone: telefone,
            pedido: pedido
        });

        revalidatePath('/departamentos/acolhimento/dashboard');
        return { ok: true, data: novoVisitante };
    } catch (e) {
        console.error("Erro no registo:", e); // Agora vais ver o erro real se o Prisma falhar
        return { ok: false, error: "Ocorreu um erro ao registar." }
    }
}