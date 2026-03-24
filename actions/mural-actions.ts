// app/membros/mural/actions.ts
'use server'

import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function publicarAviso(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { error: 'Não autorizado' };

        const texto = formData.get('texto') as string;
        const destino = formData.get('destino') as string;

        if (!texto || texto.trim() === '' || !destino) {
            return { error: 'Mensagem inválida.' };
        }

        const isDepto = destino.startsWith('DEP_');
        const idReal = destino.replace('DEP_', '').replace('GRP_', '');

        // ATENÇÃO: Se o ID na sua base de dados for String em vez de Int, remova o "Number()" abaixo.
        await prisma.avisoMural.create({
            data: {
                texto: texto.trim(),
                autor_id: session.membroId,
                departamento_id: isDepto ? Number(idReal) : null,
                grupo_id: !isDepto ? Number(idReal) : null,
            }
        });

        revalidatePath('/membros/mural');
        return { ok: true };
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao publicar aviso.' };
    }
}

// Adicione no final de app/membros/mural/actions.ts

export async function apagarAviso(avisoId: string) {
    try {
        const session = await getSessionData();
        if (!session) return { error: 'Não autorizado' };

        const aviso = await prisma.avisoMural.findUnique({ where: { id: avisoId } });
        if (!aviso) return { error: 'Aviso não encontrado.' };

        // Verifica se é o autor da mensagem ou um Administrador
        if (aviso.autor_id !== session.membroId && session.role !== 'ADMIN') {
            return { error: 'Não tens permissão para apagar esta mensagem.' };
        }

        await prisma.avisoMural.delete({ where: { id: avisoId } });

        revalidatePath('/membros/mural');
        revalidatePath('/membros/dashboard'); // Para atualizar o widget
        return { ok: true };
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao apagar aviso.' };
    }
}