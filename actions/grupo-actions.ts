'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarEncontroAction(formData: FormData, presentesIds: number[]) {
    try {
        const grupo_id = Number(formData.get('grupo_id'));
        const data = new Date(formData.get('data') as string);
        const tema = formData.get('tema') as string;

        // Aqui entraria a tua lógica de upload de imagem para a cloud (S3, Supabase, etc)
        // const foto_file = formData.get('foto') as File;
        const foto_url = null; // Substitui pelo link do upload real quando tiveres

        const grupo = await prisma.grupo.findUnique({
            where: { id: grupo_id },
            select: { tenant_id: true }
        });

        if (!grupo) return { sucesso: false, erro: "Grupo não encontrado." };

        await prisma.encontroGrupo.create({
            data: {
                tenant_id: grupo.tenant_id,
                grupo_id,
                data,
                tema,
                foto_url,
                presentes: {
                    connect: presentesIds.map(id => ({ id }))
                }
            }
        });

        revalidatePath(`/membros/gestao/grupo/${grupo_id}`);
        return { sucesso: true };
    } catch (error: any) {
        console.error("Erro ao registar encontro:", error);
        return { sucesso: false, erro: "Falha ao gravar o encontro." };
    }
}



export async function atualizarDadosGrupoAction(formData: FormData) {
    try {
        const id = Number(formData.get('grupo_id'));
        const dia_semana = formData.get('dia_semana') as string;
        const horario = formData.get('horario') as string;
        const endereco = formData.get('endereco') as string;
        const numero = formData.get('numero') as string;
        const bairro = formData.get('bairro') as string;
        const cidade = formData.get('cidade') as string;
        const estado = formData.get('estado') as string;
        const pais = formData.get('pais') as string;

        await prisma.grupo.update({
            where: { id },
            data: { 
                dia_semana, 
                horario, 
                endereco, 
                numero,
                bairro, 
                cidade,
                estado,
                pais
            }
        });

        revalidatePath(`/membros/gestao/grupo/${id}`);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: "Erro ao atualizar dados." };
    }
}

export async function gerirMembroGrupoAction(grupoId: number, membroId: number, acao: 'ADICIONAR' | 'REMOVER') {
    try {
        if (acao === 'ADICIONAR') {
            await prisma.grupo.update({
                where: { id: grupoId },
                data: { membros: { connect: { id: membroId } } }
            });
        } else {
            await prisma.grupo.update({
                where: { id: grupoId },
                data: { membros: { disconnect: { id: membroId } } }
            });
        }
        revalidatePath(`/membros/gestao/grupo/${grupoId}`);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: "Erro ao processar membro." };
    }
}