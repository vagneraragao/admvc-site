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

        await prisma.encontroGrupo.create({
            data: {
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