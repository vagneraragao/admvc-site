'use server'

import prisma, { getTenantClient } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

async function getDb() {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');
    if (!tenantId) throw new Error("Sessão inválida. Igreja não identificada.");
    return getTenantClient(Number(tenantId));
}


export async function criarNovaFamilia(formData: FormData) {
    const surname = formData.get('surname') as string;

    if (!surname) return { erro: "Nome é obrigatório" };

    try {
        const db = await getDb();
        await db.familia.create({
            data: { 
                surname: surname,
                tenant_id: 0
            }
        });

        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Erro ao criar família." };
    }
}

export async function removerMembroDaFamilia(membroId: number) {
    try {
        const db = await getDb();
        await db.membro.update({
            where: { id: membroId },
            data: {
                familia_id: null,
                parentesco: null // Limpamos também o parentesco ao sair da família
            }
        });

        revalidatePath('/admin/familias');
        // Importante: revalidar a página de edição também, caso esteja aberta
        revalidatePath('/admin/membros/editar/[id]', 'page');

        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao remover membro:", error);
        return { erro: "Não foi possível remover o membro." };
    }
}

export async function vincularMembroAFamilia(membroId: number, familiaId: number, parentesco: string) {

    try {
        const db = await getDb();
        await db.membro.update({
            where: { id: membroId },
            data: {
                familia_id: familiaId,
                parentesco: parentesco
            }
        });
        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (error) {
        return { erro: "Não foi possível vincular o membro." };
    }
}

export async function criarFamiliaAction(formData: FormData) {
    try {
        const surname = formData.get('surname') as string;
        const db = await getDb();

        // 👇 1. A BARREIRA ANTI-DUPLICAÇÃO
        const familiaExiste = await db.familia.findFirst({
            where: {
                surname: {
                    equals: surname.trim(),
                    mode: 'insensitive' // Ignora maiúsculas/minúsculas (Silva == silva)
                }
            }
        });

        if (familiaExiste) {
            return { ok: false, error: `A família "${surname}" já está registada no sistema.` };
        }

        // 2. Se não existir, avança com a criação normal
        const novaFamilia = await db.familia.create({
            data: {
                surname: surname.trim(),
                tenant_id: 0
                // ... restantes campos
            }
        });

        // revalidatePath('/admin/familias');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: "Erro ao criar família." };
    }
}

export async function excluirFamiliaAction(familiaId: number) {
    try {
        const db = await getDb();
        // 1. Encontrar a família e verificar os membros
        const familia = await db.familia.findUnique({
            where: { id: familiaId },
            include: { members: true }
        });

        if (!familia) return { ok: false, error: 'Família não encontrada.' };

        // 2. Se houver membros, removemos o vínculo deles com a família antes de a apagar
        // (Os membros continuam no sistema, apenas ficam "Sem Vínculo")
        if (familia.members.length > 0) {
            await db.membro.updateMany({
                where: { familia_id: familiaId },
                data: {
                    familia_id: null,
                    parentesco: null // Limpa o papel (ex: Pai, Filho) já que não há mais família
                }
            });
        }

        // 3. Exclui a família de vez
        await db.familia.delete({
            where: { id: familiaId }
        });

        revalidatePath('/admin/familias');
        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao excluir família:", error);
        return { ok: false, error: 'Erro interno ao excluir a família.' };
    }
}

export async function buscarMembrosSemFamiliaAction(query: string) {
    if (!query || query.length < 2) return [];

    try {
        const db = await getDb();
        const membros = await db.membro.findMany({
            where: {
                familia_id: null, // Só quem não tem família
                OR: [
                    { first_name: { contains: query, mode: 'insensitive' } },
                    { last_name: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 6, // Só traz os 6 melhores resultados para não pesar
            select: { id: true, first_name: true, last_name: true }
        });

        return membros.map(m => ({
            id: m.id,
            fullName: `${m.first_name} ${m.last_name}`.trim()
        }));
    } catch (error) {
        return [];
    }
}

export async function vincularMembroFamiliaAction(membroId: string, familiaId: string, parentesco: string) {
    try {
        const db = await getDb();
        await db.membro.update({
            where: { id: parseInt(membroId) },
            data: { familia_id: parseInt(familiaId), parentesco: parentesco }
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/familias');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: 'Erro ao vincular membro.' };
    }
}