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

        // Recupera o tenant padrão (já que é um formulário público)
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) throw new Error("Tenant não configurado.");

        const novoVisitante = await prisma.visitante.create({
            data: {
                tenant_id: tenant.id,
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

export async function salvarRelatoRapido(formData: FormData) {
    try {
        // 1. Verificação de Segurança (Sessão do Membro)
        const session = await getSessionData();
        if (!session || !session.membroId) {
            return { ok: false, error: "Sessão expirada ou não autorizada." };
        }

        const membro = await prisma.membro.findUnique({
            where: { id: session.membroId }
        });

        if (!membro) {
            return { ok: false, error: "Membro não encontrado." };
        }

        // 2. Captura dos dados do formulário
        const visitante_id = Number(formData.get('visitante_id'));
        const relato = formData.get('relato') as string;

        if (!relato || relato.trim() === "") {
            return { ok: false, error: "O relato não pode estar vazio." };
        }

        // 3. Gravação do Acompanhamento (Histórico)
        await prisma.acompanhamentoVisitante.create({
            data: {
                tenant_id: membro.tenant_id,
                visitante_id,
                membro_id: session.membroId,
                tipo_contacto: 'WHATSAPP', // Definimos como padrão para o relato rápido
                observacoes: relato,
                data_contacto: new Date(),
            }
        });

        // 4. Atualização do Status do Visitante
        // Quando alguém faz um relato rápido, o status passa automaticamente para EM_CONTACTO
        await prisma.visitante.update({
            where: { id: visitante_id },
            data: {
                status: 'EM_CONTACTO',
                data_ultima_visita: new Date()
            }
        });

        // 5. Revalidação das páginas para atualizar os dados no ecrã
        revalidatePath('/departamentos/acolhimento/dashboard');
        revalidatePath('/membros/dashboard');

        return { ok: true };

    } catch (error) {
        console.error("Erro ao salvar relato rápido:", error);
        return { ok: false, error: "Falha técnica ao gravar o relato." };
    }
}

export async function registarAcompanhamento(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { error: "Sessão expirada." };

        const membro = await prisma.membro.findUnique({
            where: { id: session.membroId }
        });

        if (!membro) return { error: "Membro não encontrado." };

        const visitanteId = Number(formData.get('visitante_id'));
        const tipoContacto = formData.get('tipo_contacto') as string;
        const observacoes = formData.get('observacoes') as string;
        const novoStatus = formData.get('status') as string;
        const quantidadeVisitas = Number(formData.get('quantidade_visitas')) || 1;

        // 1. Grava o histórico
        await prisma.acompanhamentoVisitante.create({
            data: {
                tenant_id: membro.tenant_id,
                visitante_id: visitanteId,
                membro_id: session.membroId,
                tipo_contacto: tipoContacto,
                observacoes: observacoes
            }
        });

        // 2. Atualiza o visitante
        await prisma.visitante.update({
            where: { id: visitanteId },
            data: {
                status: novoStatus,
                quantidade_visitas: quantidadeVisitas,
                data_ultima_visita: new Date()
            }
        });

        revalidatePath('/departamentos/acolhimento/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao registar acompanhamento:", error);
        return { error: "Falha ao gravar os dados." };
    }
}