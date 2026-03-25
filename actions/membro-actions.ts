'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs' // Recomendo bcryptjs para evitar problemas de compilação em Edge Runtime

/*
export async function atualizarDadosMembroAction(id: number, formData: FormData) {
    try {
        const membroId = Number(id);

        // 1. Criamos um objeto vazio para a atualização
        const dadosParaAtualizar: any = {};

        // 2. Só adicionamos ao objeto se o campo existir no formData
        // Isso evita sobrescrever com 'null' campos que não estavam na aba atual
        const campos = [
            'first_name', 'last_name', 'email', 'phone_1', 'phone_2',
            'birthdate', 'gender', 'marital_status', 'spouse_name',
            'children_number', 'notes'
        ];

        campos.forEach(campo => {
            const valor = formData.get(campo);
            if (valor !== null) { // Se o campo existe no envio do formulário
                if (campo === 'children_number') {
                    dadosParaAtualizar[campo] = parseInt(valor as string) || 0;
                } else if (campo === 'birthdate' && valor !== "") {
                    dadosParaAtualizar[campo] = new Date(valor as string);
                } else {
                    dadosParaAtualizar[campo] = valor as string;
                }
            }
        });

        // 3. Executamos o update apenas com os campos capturados
        await prisma.membro.update({
            where: { id: membroId },
            data: dadosParaAtualizar
        });

        // 4. Lógica de Ministérios (opcional, só se os checkboxes estiverem no form)
        const deptosEnviados = formData.getAll('deptos');
        if (deptosEnviados.length > 0) {
            const deptoIds = deptosEnviados.map(id => Number(id));
            await prisma.integranteDepartamento.deleteMany({ where: { membro_id: membroId } });
            await prisma.integranteDepartamento.createMany({
                data: deptoIds.map(dId => ({
                    membro_id: membroId,
                    departamento_id: dId,
                    funcao: "Membro"
                }))
            });
        }

        revalidatePath('/admin/membros');
        return { ok: true };

    } catch (error: any) {
        console.error("Erro na atualização parcial:", error);
        return { ok: false, error: error.message };
    }
}
*/

export async function confirmarPresenca(escalaId: number, status: boolean) {
    try {
        await prisma.escala.update({
            where: { id: escalaId },
            data: { confirmado: status }
        });
        revalidatePath("/membros/dashboard");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function assinarTermosAction(membroId: number) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: {
                termo_aceite: true,
                data_aceite: new Date(),
            }
        });
        revalidatePath('/membros/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function definirResponsavelFamilia(membroId: number, familiaId: number) {
    try {
        // 1. Retirar o poder de todos daquela família primeiro
        await prisma.membro.updateMany({
            where: { familia_id: familiaId },
            data: { is_family_admin: false }
        });

        // 2. Dar o poder apenas ao membro selecionado
        await prisma.membro.update({
            where: { id: membroId },
            data: { is_family_admin: true }
        });

        revalidatePath('/membros');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Erro ao trocar responsável." };
    }
}

export async function cadastrarMembroCompleto(formData: FormData) {
    try {
        const passwordRaw = (formData.get('password') as string) || "membro123";
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        const escolaridade_id = formData.get('escolaridade_id') ? Number(formData.get('escolaridade_id')) : null;
        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;

        // VERIFICAÇÃO DE CHECKBOXES (HTML envia "on" quando marcado)
        const isFamilyAdmin = formData.get('is_family_admin') === 'on' || formData.get('is_family_admin') === 'Sim';
        const hasChildren = formData.get('has_children') === 'on' || formData.get('has_children') === 'Sim';
        const spouseChristian = formData.get('spouse_christian') === 'on' || formData.get('spouse_christian') === 'Sim';
        const isActive = formData.get('is_active') === 'on' || formData.get('is_active') === 'true' || formData.get('is_active') === 'Sim';

        const novoMembroData = {
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: (formData.get('email') as string).toLowerCase().trim(),
            password: hashedPassword,
            gender: formData.get('gender') as string,
            birthdate: formData.get('birthdate') ? new Date(formData.get('birthdate') as string) : null,
            phone_1: formData.get('phone_1') as string,
            address_1: formData.get('address_1') as string,
            country: (formData.get('country') as string) || "Portugal",
            spouse_name: (formData.get('spouse_name') as string) || null,
            spouse_christian: spouseChristian,
            has_children: hasChildren,
            children_number: parseInt(formData.get('children_number') as string || "0"),
            is_family_admin: isFamilyAdmin,
            lang: "pt",

            // CORREÇÃO 1: Lê o Status e a Role dinamicamente do formulário!
            status: (formData.get('status') as string) || "ATIVO",
            role: (formData.get('role') as any) || "USER",
            is_active: isActive !== undefined ? isActive : true,

            escolaridade_id: escolaridade_id,
            conversion_date: conversion_date,
        };

        const novo = await prisma.membro.create({
            data: novoMembroData
        });

        revalidatePath('/admin/membros');
        return { sucesso: true, id: novo.id };
    } catch (error: any) {
        console.error("Erro ao cadastrar:", error);
        return { erro: error.message };
    }
}

export async function atualizarDadosMembro(membroId: number, formData: FormData) {
    try {
        console.log(`\n=============================================`);
        console.log(`👤 [DEBUG EDIÇÃO PERFIL] O membro ID ${membroId} está a atualizar os próprios dados`);

        const escolaridade_id = formData.get('escolaridade_id') ? Number(formData.get('escolaridade_id')) : null;
        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;

        // 1. DADOS BASE (Note que is_active, role e status NÃO estão aqui por segurança)
        const dataToUpdate: any = {
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: (formData.get('email') as string).toLowerCase().trim(),
            phone_1: formData.get('phone_1') as string,
            address_1: formData.get('address_1') as string,
            id_city: formData.get('id_city') as string,
            neighborhood: formData.get('neighborhood') as string,
            address_number: formData.get('address_number') as string,
            postal_code: formData.get('postal_code') as string,
            country: formData.get('country') as string || 'Portugal',
            birthdate: formData.get('birthdate') ? new Date(formData.get('birthdate') as string) : null,
            gender: formData.get('gender') as string,
            profession: formData.get('profession') as string,
            father_name: formData.get('father_name') as string,
            mother_name: formData.get('mother_name') as string,
            spouse_name: formData.get('spouse_name') as string,
            children_number: parseInt(formData.get('children_number') as string || "0"),
            escolaridade_id: escolaridade_id,
            conversion_date: conversion_date,
        };

        // 2. LÓGICA DA NOVA SENHA (Exatamente igual à do Admin)
        const novaSenha = formData.get('nova_senha') as string;

        if (novaSenha && novaSenha.trim() !== '') {
            console.log(`🔑 O Membro decidiu alterar a sua própria senha: "${novaSenha.trim()}"`);
            dataToUpdate.password = await bcrypt.hash(novaSenha.trim(), 10);
            console.log(`🔐 Senha encriptada e pronta a gravar!`);
        } else {
            console.log(`⏭️ O campo 'nova_senha' veio vazio. A senha atual mantém-se.`);
        }

        // 3. GRAVAÇÃO
        await prisma.membro.update({
            where: { id: Number(membroId) },
            data: dataToUpdate
        });

        console.log(`💾 Perfil do membro atualizado com sucesso!`);
        console.log(`=============================================\n`);

        revalidatePath('/membros/dashboard'); // Ajuste para a rota onde o membro vê o perfil
        revalidatePath('/admin/membros');
        return { sucesso: "Dados atualizados com sucesso!" };
    } catch (error: any) {
        console.error("❌ ERRO NO PRISMA:", error);
        return { erro: "Erro ao salvar no banco de dados." };
    }
}

export async function alternarConfirmacaoEscala(escalaIds: number[], statusConfirmacao: boolean) {
    try {
        await prisma.escala.updateMany({
            where: {
                id: { in: escalaIds } // Atualiza todas as escalas deste array
            },
            data: { confirmado: statusConfirmacao }
        });

        revalidatePath('/membros/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao confirmar escala:", error);
        return { ok: false, error: 'Erro ao atualizar a confirmação.' };
    }
}

export async function assinarDocumentoAction(membroId: number, tipo: 'GDPR' | 'PERMANECER') {
    try {
        const hoje = new Date();

        // Define a validade (Ex: 12 meses a partir de hoje)
        const validade = new Date();
        validade.setMonth(validade.getMonth() + 12);

        if (tipo === 'GDPR') {
            await prisma.membro.update({
                where: { id: membroId },
                data: {
                    gdpr_aceite: true,
                    gdpr_data_assinatura: hoje,
                    gdpr_validade: validade
                }
            });
        } else {
            await prisma.membro.update({
                where: { id: membroId },
                data: {
                    permanecer_aceite: true,
                    permanecer_data_assinatura: hoje,
                    permanecer_validade: validade
                }
            });
        }

        revalidatePath('/membros/dashboard');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: "Erro ao registar assinatura." };
    }
}