// actions/admin-actions.ts
'use server'

// 🔄 MUDANÇA 1: Importamos o global e a função multitenant
import prismaGlobal, { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";

// ============================================================================
// 🛠️ FUNÇÃO AUXILIAR: PEGAR O BANCO DE DADOS DA IGREJA ATUAL
// ============================================================================
async function getDb() {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');
    if (!tenantId) throw new Error("Sessão inválida. Igreja não identificada.");
    return getTenantClient(Number(tenantId));
}

// ============================================================================
// 🌍 AÇÕES GLOBAIS (Não precisam de tenant_id)
// ============================================================================

export async function criarCargo(formData: FormData) {
    const nome = formData.get('nome') as string;
    if (!nome) return;
    await prismaGlobal.cargo.create({ data: { nome } });
    revalidatePath('/admin/configuracoes');
}

export async function buscarCargos() {
    try {
        return await prismaGlobal.cargo.findMany({ orderBy: { nome: 'asc' } });
    } catch (error) {
        return [];
    }
}

export async function excluirCargo(id: number) {
    await prismaGlobal.cargo.delete({ where: { id } });
    revalidatePath('/admin/configuracoes');
}


// ============================================================================
// 🏢 AÇÕES MULTITENANT (Blindadas por Igreja)
// ============================================================================

export async function aprovarMembro(membroId: number, adminNome: string) {
    try {
        const db = await getDb();
        await db.membro.update({
            where: { id: membroId },
            data: { status: "ATIVO", data_admissao: new Date(), aprovado_por: adminNome }
        });

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/membros');
        return { sucesso: true };
    } catch (error) {
        return { erro: "Falha ao aprovar membro." };
    }
}

export async function criarDepartamento(formData: FormData) {
    const nome = formData.get('nome') as string;
    if (!nome) return;

    const db = await getDb();
    await db.departamento.create({ data: { nome, tenant_id: 0 } });
    revalidatePath('/admin/configuracoes');
}

export async function criarGrupo(formData: FormData) {
    const db = await getDb();
    const departamento_id = formData.get('departamento_id');
    const data_abertura = formData.get('data_abertura') as string;
    const lideresIds = formData.getAll('lideres_ids').map(Number);
    const membrosIds = formData.getAll('membros_ids').map(Number);

    await db.grupo.create({
        data: {
            nome: formData.get('nome') as string,
            tenant_id: 0,
            dia_semana: formData.get('dia_semana') as string,
            horario: formData.get('horario') as string,
            perfil: formData.get('perfil') as string,
            categoria: formData.get('categoria') as string,
            descricao: formData.get('descricao') as string,
            endereco: formData.get('endereco') as string,
            numero: formData.get('numero') as string,
            bairro: formData.get('bairro') as string,
            cidade: formData.get('cidade') as string,
            lideres: { connect: lideresIds.map((id: number) => ({ id })) },
            membros: { connect: membrosIds.map((id: number) => ({ id })) },
            estado: formData.get('estado') as string,
            pais: (formData.get('pais') as string) || "Portugal",
            data_abertura: data_abertura ? new Date(data_abertura) : new Date(),
            departamento_id: departamento_id ? Number(departamento_id) : null,
        } as any
    });

    revalidatePath('/admin/configuracoes');
}

export async function excluirGrupo(id: number) {
    try {
        const db = await getDb();
        await db.grupo.delete({ where: { id: id } });
        revalidatePath("/admin/configuracoes");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function vincularMembrosAoGrupo(grupoId: number, membrosIds: number[], lideresIds: number[]) {
    try {
        const db = await getDb();
        await db.grupo.update({
            where: { id: grupoId },
            data: {
                membros: { set: membrosIds.map(id => ({ id })) },
                lideres: { set: lideresIds.map(id => ({ id })) }
            }
        });

        revalidatePath("/admin/configuracoes");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function salvarEvento(formData: FormData) {
    try {
        const db = await getDb();
        const id = formData.get("id") as string | null;
        const nome = formData.get("nome") as string;
        const dataStr = formData.get("data") as string;
        const descricao = formData.get("descricao") as string;

        const dados = { nome, data: new Date(dataStr), descricao };

        if (id) {
            await db.evento.update({
                where: { id: Number(id) },
                data: dados
            });
        } else {
            await db.evento.create({
                data: { ...dados, tenant_id: 0 }
            });
        }

        revalidatePath("/admin/escalas");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function removerEscala(id: number) {
    try {
        const db = await getDb();
        await db.escala.delete({ where: { id } });
        revalidatePath("/admin/escalas");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function gerarLinkWhatsapp(escalaId: number) {
    const db = await getDb();
    const escala = await db.escala.findUnique({
        where: { id: escalaId },
        include: { membro: true, evento: true, departamento: true }
    });

    if (!escala || !escala.membro.phone_1) return null;

    const dataFormatada = new Date(escala.evento.data).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });
    const horaFormatada = new Date(escala.evento.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const mensagem = `Olá, *${escala.membro.first_name}*! 👋%0A%0A` +
        `Passamos para lembrar que você está escalado para servir na *ADMVC*:%0A%0A` +
        `📅 *Data:* ${dataFormatada}%0A` +
        `⏰ *Hora:* ${horaFormatada}%0A` +
        `📍 *Local:* Auditório Principal%0A` +
        `🎸 *Departamento:* ${escala.departamento.nome}%0A` +
        `💪 *Função:* ${escala.funcao}%0A%0A` +
        `Poderia confirmar sua presença no nosso portal?%0A` +
        `🔗 https://seusite.com/membros`;

    const telefone = escala.membro.phone_1.replace(/\D/g, '');
    return `https://wa.me/${telefone}?text=${mensagem}`;
}

export async function salvarGrupo(formData: FormData) {
    try {
        const db = await getDb();
        const idRaw = formData.get("id");
        const id = idRaw ? Number(idRaw) : null;

        const lideresIds = formData.getAll("lideres_ids").map(Number).filter(id => id > 0);
        const membrosIds = formData.getAll("membros_ids").map(Number).filter(id => id > 0);
        const deptoIdRaw = formData.get("departamento_id");
        const deptoId = deptoIdRaw ? Number(deptoIdRaw) : null;

        const baseData = {
            nome: formData.get("nome") as string,
            categoria: formData.get("categoria") as string,
            dia_semana: formData.get("dia_semana") as string,
            horario: formData.get("horario") as string,
            perfil: formData.get("perfil") as string,
            endereco: formData.get("endereco") as string,
            numero: formData.get("numero") as string,
            bairro: formData.get("bairro") as string,
            cidade: formData.get("cidade") as string,
            estado: formData.get("estado") as string,
            pais: formData.get("pais") as string || "Portugal",
            descricao: formData.get("descricao") as string,
            departamento_id: deptoId,
        };

        if (id) {
            await db.grupo.update({
                where: { id },
                data: {
                    ...baseData,
                    lideres: { set: lideresIds.map(id => ({ id })) },
                    membros: { set: membrosIds.map(id => ({ id })) }
                }
            });
        } else {
            await db.grupo.create({
                data: {
                    ...baseData,
                    tenant_id: 0,
                    lideres: { connect: lideresIds.map(id => ({ id })) },
                    membros: { connect: membrosIds.map(id => ({ id })) }
                }
            });
        }

        revalidatePath('/admin/configuracoes');
        return { sucesso: true };
    } catch (error: any) {
        return { sucesso: false, erro: error.message || "Erro interno." };
    }
}

export async function salvarEscala(formData: FormData) {
    try {
        const db = await getDb();
        const membro_id = Number(formData.get("membro_id"));
        const evento_id = Number(formData.get("evento_id"));
        const departamento_id = Number(formData.get("departamento_id"));
        const funcao = formData.get("funcao") as string;

        await db.escala.create({
            data: { membro_id, evento_id, departamento_id, funcao, tenant_id: 0, }
        });

        revalidatePath('/admin/escalas');
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Erro ao salvar" };
    }
}

export async function removerFuncaoDoDepartamento(id: number) {
    const db = await getDb();
    await db.funcaoDepartamento.delete({ where: { id } });
    revalidatePath("/admin/configuracoes");
}

export async function atualizarDepartamento(formData: FormData) {
    try {
        const db = await getDb();
        const id = Number(formData.get("id"));
        const nome = formData.get("nome") as string;
        const descricao = formData.get("descricao") as string;
        const liderInput = formData.get("lider_id");
        const lider_id = liderInput ? Number(liderInput) : null;

        await db.departamento.update({
            where: { id },
            data: { nome, descricao, lider_id: lider_id === 0 ? null : lider_id }
        });

        revalidatePath("/admin/configuracoes");
        return { ok: true };
    } catch (error) {
        return { ok: false };
    }
}

export async function adicionarFuncaoAoDepto(formData: FormData) {
    const db = await getDb();
    const nome = formData.get("nome") as string;
    const departamento_id = Number(formData.get("departamento_id"));

    await db.funcaoDepartamento.create({ data: { nome, departamento_id, tenant_id: 0, } });
    revalidatePath("/admin/configuracoes");
}

export async function removerFuncaoDoDepto(id: number) {
    const db = await getDb();
    await db.funcaoDepartamento.delete({ where: { id } });
    revalidatePath("/admin/configuracoes");
    return { ok: true };
}

export async function buscarEquipaPorDepartamentoId(deptoId: number) {
    try {
        const db = await getDb();
        const integrantes = await db.integranteDepartamento.findMany({
            where: { departamento_id: deptoId },
            include: {
                membro: { select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true } },
                funcoes: { include: { funcao: true } }
            },
            orderBy: { membro: { first_name: 'asc' } }
        });
        return { ok: true, data: integrantes };
    } catch (error) {
        return { ok: false, error: "Erro ao carregar a equipa." };
    }
}

export async function gerarEventosLoteAction(formData: FormData) {
    try {
        const db = await getDb();
        const nome = formData.get('nome') as string;
        const diaDaSemana = Number(formData.get('diaDaSemana'));
        const frequencia = formData.get('frequencia') as string;
        const horario = formData.get('horario') as string;
        const mesesDuracao = Number(formData.get('meses'));

        const hoje = new Date();
        const dataFim = new Date();
        dataFim.setMonth(hoje.getMonth() + mesesDuracao);

        const eventosParaCriar = [];
        let dataAtual = new Date(hoje);
        const [horas, minutos] = horario.split(':');
        dataAtual.setHours(Number(horas), Number(minutos), 0, 0);

        while (dataAtual <= dataFim) {
            if (dataAtual.getDay() === diaDaSemana) {
                let isMatch = false;
                const diaDoMes = dataAtual.getDate();
                const semanaDoMes = Math.ceil(diaDoMes / 7);

                if (frequencia === 'TODAS') isMatch = true;
                else if (frequencia === 'ULTIMO') {
                    const proximaSemana = new Date(dataAtual);
                    proximaSemana.setDate(diaDoMes + 7);
                    if (proximaSemana.getMonth() !== dataAtual.getMonth()) isMatch = true;
                } else if (frequencia === semanaDoMes.toString()) isMatch = true;

                if (isMatch) eventosParaCriar.push({ nome, data: new Date(dataAtual) });
            }
            dataAtual.setDate(dataAtual.getDate() + 1);
        }

        await db.evento.createMany({ data: eventosParaCriar });
        revalidatePath('/admin/escalas');
        return { ok: true, totalCriado: eventosParaCriar.length };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function criarEventoUnificadoAction(formData: FormData) {
    try {
        const db = await getDb();
        const tipo = formData.get('tipo') as string;
        const nome = formData.get('nome') as string;
        const horario = formData.get('horario') as string;
        const [horas, minutos] = horario.split(':');

        if (tipo === 'UNICO') {
            const dataString = formData.get('dataUnica') as string;
            const dataEvento = new Date(dataString);
            dataEvento.setHours(Number(horas), Number(minutos), 0, 0);

            await db.evento.create({ data: { nome, data: dataEvento, tenant_id: 0, } });
            revalidatePath('/admin/escalas');
            return { ok: true, totalCriado: 1 };
        }

        if (tipo === 'CONTINUO') {
            const diaDaSemana = Number(formData.get('diaDaSemana'));
            const frequencia = formData.get('frequencia') as string;
            const mesesDuracao = Number(formData.get('meses'));

            const hoje = new Date();
            const dataFim = new Date();
            dataFim.setMonth(hoje.getMonth() + mesesDuracao);

            const eventosParaCriar = [];
            let dataAtual = new Date(hoje);
            dataAtual.setHours(Number(horas), Number(minutos), 0, 0);

            while (dataAtual <= dataFim) {
                if (dataAtual.getDay() === diaDaSemana) {
                    let isMatch = false;
                    const diaDoMes = dataAtual.getDate();
                    const semanaDoMes = Math.ceil(diaDoMes / 7);

                    if (frequencia === 'TODAS') isMatch = true;
                    else if (frequencia === 'ULTIMO') {
                        const proximaSemana = new Date(dataAtual);
                        proximaSemana.setDate(diaDoMes + 7);
                        if (proximaSemana.getMonth() !== dataAtual.getMonth()) isMatch = true;
                    } else if (frequencia === semanaDoMes.toString()) isMatch = true;

                    if (isMatch) eventosParaCriar.push({ nome, data: new Date(dataAtual) });
                }
                dataAtual.setDate(dataAtual.getDate() + 1);
            }

            await db.evento.createMany({ data: eventosParaCriar });
            revalidatePath('/admin/escalas');
            return { ok: true, totalCriado: eventosParaCriar.length };
        }
        return { ok: false, error: "Tipo de evento inválido." };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function criarEscala(formData: FormData) {
    try {
        const db = await getDb();
        const evento_id = Number(formData.get('evento_id'));
        const departamento_id = Number(formData.get('departamento_id'));
        const membro_id = Number(formData.get('membro_id'));
        const funcao = formData.get('funcao') as string;
        const horario = formData.get('horario') as string;

        const jaEscalado = await db.escala.findFirst({
            where: { evento_id, membro_id, departamento_id }
        });

        if (jaEscalado) return { error: "Este voluntário já está escalado para este departamento neste evento." };

        await db.escala.create({
            data: { evento_id, departamento_id, membro_id, funcao, horario, confirmado: false, tenant_id: 0, }
        });

        revalidatePath(`/membros/gestao/escalas/${evento_id}`);
        revalidatePath(`/admin/escalas`);
        revalidatePath(`/membros/dashboard`);
        return { ok: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { error: "Este voluntário já está escalado para este culto/evento." };
        return { error: "Ocorreu um erro ao registar a escala na base de dados." };
    }
}

export async function atualizarMembroAdmin(id: number, formData: FormData) {
    try {
        const db = await getDb();
        const membroId = Number(id);
        const deptoIds = formData.getAll('deptos').map(id => Number(id));
        const grupoIds = formData.getAll('grupos').map(id => Number(id));

        const escolaridadeRaw = formData.get('escolaridade_id');
        const escolaridade_id = escolaridadeRaw ? Number(escolaridadeRaw) : null;

        const familiaIdRaw = formData.get('familia_id') as string;
        const parentescoRaw = formData.get('parentesco') as string;
        const familiaUpdate = familiaIdRaw ? { connect: { id: Number(familiaIdRaw) } } : { disconnect: true };

        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;
        const entry_date = formData.get('entry_date') ? new Date(formData.get('entry_date') as string) : null;
        const baptism_date = formData.get('baptism_date') ? new Date(formData.get('baptism_date') as string) : null;
        const birthdate = formData.get('birthdate') ? new Date(formData.get('birthdate') as string) : null;
        const wedding_date = formData.get('wedding_date') ? new Date(formData.get('wedding_date') as string) : null;

        const isActiveMarcado = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';
        const isSpouseChristian = formData.get('spouse_christian') === 'true';
        const hasChildren = formData.get('has_children') === 'true';

        const loyverseIdRaw = formData.get('loyverse_id') as string;
        const loyverseIdTratado = loyverseIdRaw && loyverseIdRaw.trim() !== '' ? loyverseIdRaw.trim() : null;

        const dataToUpdate: any = {

            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: (formData.get('email') as string).toLowerCase().trim(),
            phone_1: formData.get('phone_1') as string,
            birthdate: birthdate,
            gender: formData.get('gender') as string,
            profession: formData.get('profession') as string,
            father_name: formData.get('father_name') as string,
            mother_name: formData.get('mother_name') as string,
            escolaridade: escolaridade_id ? { connect: { id: escolaridade_id } } : { disconnect: true },

            postal_code: formData.get('postal_code') as string,
            address_1: formData.get('address_1') as string,
            address_2: formData.get('address_2') as string,
            address_number: formData.get('address_number') as string,
            neighborhood: formData.get('neighborhood') as string,
            id_city: formData.get('id_city') as string,
            state: formData.get('state') as string,
            country: formData.get('country') as string || 'Portugal',

            marital_status: formData.get('marital_status') as string,
            nationality: formData.get('nationality') as string,
            tax_id: formData.get('tax_id') as string,
            id_card_number: formData.get('id_card_number') as string,
            lang: formData.get('lang') as string,
            spouse_name: formData.get('spouse_name') as string,
            spouse_christian: isSpouseChristian,
            wedding_date: wedding_date,
            has_children: hasChildren,
            children_number: parseInt(formData.get('children_number') as string || "0"),

            entry_date: entry_date,
            baptism_date: baptism_date,
            conversion_date: conversion_date,
            notes: formData.get('notes') as string,
            previous_church: formData.get('previous_church') as string,
            church_role: formData.get('church_role') as string,
            ministry: formData.get('ministry') as string,

            is_active: isActiveMarcado,
            role: formData.get('role') as any,
            status: formData.get('status') as string,
            loyverse_id: loyverseIdTratado,
            familia: familiaUpdate,
            parentesco: familiaIdRaw ? (parentescoRaw || null) : null,
            grupos: { set: grupoIds.map(gid => ({ id: gid })) }
        };

        const avatarFile = formData.get('avatar') as File | null;
        if (avatarFile && avatarFile.size > 0) {
            const extension = avatarFile.name.split('.').pop();
            const fileName = `avatars/membro-${membroId}-${Date.now()}.${extension}`;
            try {
                const blob = await put(fileName, avatarFile, { access: 'public', addRandomSuffix: false });
                dataToUpdate.avatar_file = blob.url;
            } catch (blobError) {
                console.error("Erro no Blob:", blobError);
            }
        }

        const novaSenha = formData.get('nova_senha') as string;
        if (novaSenha && novaSenha.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(novaSenha.trim(), 10);
        }

        await db.membro.update({ where: { id: membroId }, data: dataToUpdate });

        await db.integranteDepartamento.deleteMany({ where: { membro_id: membroId } });
        for (const dId of deptoIds) {
            // Garante que a função "Membro" existe para este departamento
            let fMembro = await db.funcaoDepartamento.findFirst({ where: { departamento_id: dId, nome: 'Membro' } });
            if (!fMembro) fMembro = await db.funcaoDepartamento.create({ data: { nome: 'Membro', tenant_id: 0, departamento_id: dId } });

            await db.integranteDepartamento.create({
                data: {
                    membro_id: membroId,
                    departamento_id: dId,
                    tenant_id: 0,
                    funcoes: {
                        create: { funcao_id: fMembro.id }
                    }
                }
            });
        }

        revalidatePath('/admin/membros');
        revalidatePath(`/admin/membros/editar/${id}`);
        return { ok: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            const target = error.meta?.target?.[0] || 'campo';
            if (target === 'loyverse_id') return { ok: false, error: "Erro: Este ID do Loyverse já está atribuído!" };
            if (target === 'email') return { ok: false, error: "Erro: Este E-mail já está em uso!" };
            return { ok: false, error: `Erro de duplicação: Já existe um registo com este ${target}.` };
        }
        return { ok: false, error: "Ocorreu um erro ao guardar." };
    }
}

export async function associarMembroAFamilia(membroId: number, familiaId: number, parentesco: string) {
    try {
        const db = await getDb();
        await db.membro.update({
            where: { id: membroId },
            data: { familia_id: familiaId, parentesco: parentesco }
        });
        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Falha ao associar membro." };
    }
}

export async function removerEscalaAction(id: number) {
    try {
        const db = await getDb();
        await db.escala.delete({ where: { id } });
        revalidatePath('/membros/gestao/escalas');
        return { ok: true };
    } catch (error) {
        return { error: "Erro ao remover voluntário." };
    }
}

export async function atualizarEscalaAction(formData: FormData) {
    try {
        const db = await getDb();
        const id = Number(formData.get('id'));
        const funcao = formData.get('funcao') as string;
        const horario = formData.get('horario') as string;

        await db.escala.update({
            where: { id },
            data: { funcao, horario }
        });
        revalidatePath('/membros/gestao/escalas');
        return { ok: true };
    } catch (error) {
        return { error: "Erro ao atualizar a escala." };
    }
}

export async function excluirDepartamento(id: number) {
    try {
        const db = await getDb();
        await db.departamento.delete({ where: { id } });
        revalidatePath('/admin/configuracoes');
        return { ok: true };
    } catch (error: any) {
        if (error.code === 'P2003') return { ok: false, error: "Não é possível excluir: existem membros vinculados." };
        return { ok: false, error: "Erro ao excluir o departamento." };
    }
}

export async function vincularMembroDepartamento(formData: FormData) {
    try {
        const membroId = Number(formData.get('membro_id'));
        const deptoId = Number(formData.get('departamento_id'));

        // Lê TODOS os inputs ocultos gerados pelo formulário (o array de IDs das funções)
        const funcoesIdsStrings = formData.getAll('funcoes_ids');
        const funcoesIds = funcoesIdsStrings.map(id => Number(id));

        if (!membroId || !deptoId || funcoesIds.length === 0) {
            return { error: "Dados incompletos. Selecione membro e cargos." };
        }

        const db = await getDb(); // ou prisma

        // 1. OBTER O TENANT_ID DO DEPARTAMENTO (Correção P2003)
        // Precisamos saber a que tenant este departamento pertence para colocar o membro no mesmo tenant.
        const departamentoInfo = await db.departamento.findUnique({
            where: { id: deptoId },
            select: { tenant_id: true }
        });

        if (!departamentoInfo || !departamentoInfo.tenant_id) {
            return { error: "Erro de integridade: Departamento não tem um Tenant associado." };
        }

        // 2. GARANTIR QUE O MEMBRO ESTÁ NO DEPARTAMENTO
        // O upsert é perfeito: Se já existir, não faz nada (update: {}). Se não existir, cria.
        const integrante = await db.integranteDepartamento.upsert({
            where: {
                membro_id_departamento_id: {
                    membro_id: membroId,
                    departamento_id: deptoId
                }
            },
            update: {}, // Não muda nada se ele já for deste departamento
            create: {
                membro_id: membroId,
                departamento_id: deptoId,
                pode_gerir_escalas: false,
                tenant_id: departamentoInfo.tenant_id // 👈 CORREÇÃO: Usa o tenant real e válido do departamento!
            }
        });

        // 3. ADICIONAR OS MÚLTIPLOS CARGOS (Na tabela FuncaoSelecionada)
        let inseridos = 0;

        for (const fId of funcoesIds) {
            // Verifica se o membro já tem ESTE cargo específico para não duplicar
            const funcaoExiste = await db.funcaoSelecionada.findFirst({
                where: {
                    integrante_departamento_id: integrante.id,
                    funcao_id: fId
                }
            });

            // Se não tiver o cargo, adiciona!
            if (!funcaoExiste) {
                await db.funcaoSelecionada.create({
                    data: {
                        integrante_departamento_id: integrante.id,
                        funcao_id: fId
                    }
                });
                inseridos++;
            }
        }

        console.log(`✅ Concluído! O membro foi vinculado e ${inseridos} novos cargos foram atribuídos.`);

        // 4. Atualizar a interface
        revalidatePath('/admin/departamentos');
        return { ok: true };

    } catch (error: any) {
        console.error("Erro geral na action de vincular:", error);
        return { error: "Não foi possível vincular o membro aos cargos." };
    }
}

export async function removerMembroDepartamento(id: number) {
    try {
        const db = await getDb();
        await db.integranteDepartamento.delete({ where: { id } });
        revalidatePath("/admin/departamentos/gerenciar");
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Erro ao remover voluntário." };
    }
}

export async function adicionarFuncaoAoDepartamento(formData: FormData) {
    try {
        const db = await getDb();
        const nome = formData.get("nome") as string;
        const departamento_id = Number(formData.get("departamento_id"));

        await db.funcaoDepartamento.create({ data: { nome, departamento_id, tenant_id: 0, } });
        revalidatePath("/admin/configuracoes");
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Erro ao adicionar nova função." };
    }
}

export async function buscarMembrosPorDepartamento(deptoId: number) {
    try {
        const db = await getDb();
        const integrantes = await db.integranteDepartamento.findMany({
            where: { departamento_id: deptoId },
            include: {
                membro: { select: { id: true, first_name: true, last_name: true } },
                funcoes: { include: { funcao: true } }
            }
        });

        return integrantes.map(i => ({
            id: i.membro.id,
            nome: `${i.membro.first_name} ${i.membro.last_name}`,
            funcaoPadrao: (i as any).funcoes?.[0]?.funcao?.nome || 'Membro'
        }));
    } catch (error) {
        return [];
    }
}

export async function criarNovoMembroAction(formData: FormData) {
    const email = (formData.get("email") as string).toLowerCase().trim();
    const password = formData.get("password") as string;

    // Verificação Global (O E-mail é único em todo o sistema)
    const existe = await prismaGlobal.membro.findUnique({ where: { email } });
    if (existe) return { error: "Este e-mail já está registado em outro membro." };

    const hashedPassword = await bcrypt.hash(password, 10);
    const parseDate = (dateString: any) => {
        if (!dateString || dateString.trim() === "") return null;
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? null : d;
    };

    try {
        const db = await getDb();

        // 1. Extrair os IDs para as relações (se existirem)
        const escolaridadeId = formData.get("escolaridade_id") ? Number(formData.get("escolaridade_id")) : null;
        const congregacaoId = formData.get("congregacao_id") ? Number(formData.get("congregacao_id")) : null;

        const novoMembro = await db.membro.create({
            data: {
                // DADOS PESSOAIS
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                email: email,
                password: hashedPassword,
                phone_1: formData.get("phone_1") as string,
                gender: formData.get("gender") as string,
                marital_status: formData.get("marital_status") as string,
                birthdate: parseDate(formData.get("birthdate")),
                profession: formData.get("profession") as string || null,
                father_name: formData.get("father_name") as string || null,
                mother_name: formData.get("mother_name") as string || null,

                // 🌟 OS CAMPOS NOVOS QUE FALTAVAM
                tax_id: formData.get("tax_id") as string || null,
                nationality: (formData.get("nationality") as string) || "Portuguesa",
                gdpr_aceite: formData.get("gdpr_aceite") === "true",
                permanecer_aceite: formData.get("permanecer_aceite") === "true",
                conversion_date: parseDate(formData.get("conversion_date")),

                // MORADA
                address_1: formData.get("address_1") as string || null,
                address_number: formData.get("address_number") as string || null,
                postal_code: formData.get("postal_code") as string || null,
                neighborhood: formData.get("neighborhood") as string || null,
                id_city: formData.get("city") as string || null,
                state: formData.get("state") as string || null,
                country: (formData.get("country") as string) || "Portugal",

                // ECLESIÁSTICO & SISTEMA
                role: (formData.get("role") as any) || "USER",
                status: (formData.get("status") as string) || "ATIVO",
                loyverse_id: formData.get("loyverse_id") as string || null,
                church_role: formData.get("church_role") as string || "Membro",
                baptism_date: parseDate(formData.get("baptism_date")),
                data_admissao: parseDate(formData.get("admission_date")),
                notes: formData.get("notes") as string || null,

                // FAMÍLIA
                spouse_name: formData.get("spouse_name") as string || null,
                children_number: Number(formData.get("children_count")) || 0,

                is_active: true,
                tenant_id: 0, // A extensão trata de substituir pelo ID da Igreja

                // 🌟 RELAÇÕES (Usamos scalar IDs para satisfazer o UncheckedCreateInput e aceitar tenant_id: 0)
                escolaridade_id: escolaridadeId,
                congregacao_id: congregacaoId,
            }
        });

        // Atualiza a cache da página de lista de membros
        revalidatePath("/admin/membros");

        // Devolve o sucesso para o Frontend acionar o redirecionamento com o Toast!
        return { sucesso: true, id: novoMembro.id };

    } catch (error: any) {
        console.error("Erro na criação:", error);
        if (error.code === 'P2002') return { error: "Erro de Conflito: O E-mail ou o ID Loyverse já existem no sistema." };
        return { error: "Não foi possível gravar o membro na base de dados." };
    }
}

export async function salvarDepartamento(formData: FormData) {
    try {
        const db = await getDb();
        const idRaw = formData.get("id");
        const id = idRaw ? Number(idRaw) : null;
        const nome = formData.get("nome") as string;
        const descricao = formData.get("descricao") as string || null;
        const liderInput = formData.get("lider_id");
        const novoLiderId = liderInput && Number(liderInput) !== 0 ? Number(liderInput) : null;

        if (!nome) return { ok: false, error: "O nome do departamento é obrigatório." };

        await db.$transaction(async (tx) => {
            let currentDeptId = id;

            if (id) {
                const deptoAntigo = await tx.departamento.findUnique({ where: { id } });
                if (deptoAntigo && deptoAntigo.lider_id !== novoLiderId) {
                    if (deptoAntigo.lider_id) {
                        // Remove o vínculo de líder anterior
                        await tx.funcaoSelecionada.deleteMany({
                            where: {
                                integrante: { departamento_id: id, membro_id: deptoAntigo.lider_id },
                                funcao: { nome: 'Líder' }
                            }
                        });
                    }
                }
                await tx.departamento.update({ where: { id }, data: { nome, descricao, lider_id: novoLiderId } });
            } else {
                const novoDepto = await tx.departamento.create({ data: { nome, descricao, lider_id: novoLiderId, tenant_id: 0, } });
                currentDeptId = novoDepto.id;
            }

            if (novoLiderId && currentDeptId) {
                const funcaoLider = await tx.funcaoDepartamento.findFirst({ where: { departamento_id: currentDeptId, nome: 'Líder' } });
                if (!funcaoLider) await tx.funcaoDepartamento.create({ data: { nome: 'Líder', tenant_id: 0, departamento_id: currentDeptId } });

                // Verifica se o membro já é integrante do departamento
                let integrante = await tx.integranteDepartamento.findFirst({
                    where: { departamento_id: currentDeptId, membro_id: novoLiderId }
                });

                if (!integrante) {
                    integrante = await tx.integranteDepartamento.create({
                        data: { departamento_id: currentDeptId, membro_id: novoLiderId, tenant_id: 0 }
                    });
                }

                // Garante que tenha a função de líder
                const jaLider = await tx.funcaoSelecionada.findFirst({
                    where: { integrante_departamento_id: integrante.id, funcao_id: funcaoLider!.id }
                });

                if (!jaLider) {
                    await tx.funcaoSelecionada.create({
                        data: { integrante_departamento_id: integrante.id, funcao_id: funcaoLider!.id }
                    });
                }
            }
        });

        revalidatePath("/admin/configuracoes");
        revalidatePath("/admin/departamentos");
        revalidatePath("/membros/dashboard");
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Erro interno ao processar o departamento." };
    }
}

export async function salvarGrupoAction(formData: FormData) {
    try {
        const db = await getDb();
        const idRaw = formData.get("id");
        const id = idRaw ? Number(idRaw) : null;

        const nome = formData.get("nome") as string;
        const dia_semana = formData.get("dia_semana") as string;
        const horario = formData.get("horario") as string;
        const endereco = formData.get("endereco") as string;
        const bairro = formData.get("bairro") as string;
        const cidade = formData.get("cidade") as string;
        const estado = formData.get("estado") as string;
        const categoria = formData.get("categoria") as string || null;
        const perfil = formData.get("perfil") as string || null;
        const liderInput = formData.get("lider_id");
        const liderId = liderInput && Number(liderInput) !== 0 ? Number(liderInput) : null;

        if (id) {
            await db.grupo.update({
                where: { id },
                data: {
                    nome, dia_semana, horario, endereco, bairro, cidade, estado, categoria, perfil,
                    lideres: liderId ? { set: [{ id: liderId }] } : { set: [] },
                    membros: liderId ? { connect: [{ id: liderId }] } : undefined
                }
            });
        } else {
            await db.grupo.create({
                data: {
                    nome, dia_semana, horario, endereco, bairro, cidade, estado, categoria, perfil,
                    tenant_id: 0,
                    lideres: liderId ? { connect: [{ id: liderId }] } : undefined,
                    membros: liderId ? { connect: [{ id: liderId }] } : undefined
                }
            });
        }

        revalidatePath("/admin/grupos");
        revalidatePath("/membros/dashboard");
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Ocorreu um erro ao gravar o grupo." };
    }
}

export async function editarEscalaAction(formData: FormData) {
    try {
        const db = await getDb();
        const id = Number(formData.get('id'));
        const funcao = formData.get('funcao') as string;
        const horario = formData.get('horario') as string;

        await db.escala.update({
            where: { id: id },
            data: { funcao: funcao, horario: horario || null }
        });

        revalidatePath('/admin/escalas');
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Ocorreu um erro ao guardar as alterações." };
    }
}

export async function editarEventoAction(formData: FormData) {
    console.log('=== EDITAR EVENTO ===')
    console.log('id:', formData.get('id'))
    console.log('nome:', formData.get('nome'))
    try {
        const db = await getDb();
        console.log('db obtido com sucesso')

        const id = formData.get('id') as string;
        const nome = formData.get('nome') as string;
        const dataStr = formData.get('data') as string;
        const horaStr = formData.get('horario') as string;
        const descricao = formData.get('descricao') as string;

        const dataCompleta = new Date(`${dataStr}T${horaStr}:00`);

        await db.evento.update({
            where: { id: Number(id) },
            data: { nome, data: dataCompleta, descricao: descricao || null }
        });

        revalidatePath('/admin/escalas');
        revalidatePath('/membros/dashboard');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: "Erro ao atualizar o evento na base de dados." };
    }
}

export async function apagarEventoAction(id: number) {
    try {
        const db = await getDb();
        await db.evento.delete({ where: { id } });

        revalidatePath('/admin/escalas');
        return { ok: true };
    } catch (error) {
        return { ok: false, error: "Erro ao remover o evento. Verifica se existem escalas dependentes." };
    }
}
// Adicione no ficheiro @/actions/admin-actions.ts

export async function criarCongregacao(formData: FormData) {
    try {
        const db = await getDb();
        const nome = formData.get('nome') as string;
        const cidade = formData.get('cidade') as string;
        const endereco = formData.get('endereco') as string;

        if (!nome || !cidade) return { ok: false, error: "Nome e Cidade são obrigatórios." };

        await db.congregacao.create({
            data: {
                nome,
                cidade,
                endereco,
                tenant_id: 0 // O TypeScript pede, a nossa extensão substitui!
            }
        });

        revalidatePath('/admin/congregacoes');
        return { ok: true, message: "Congregação criada com sucesso!" };
    } catch (error) {
        console.error("Erro ao criar congregação:", error);
        return { ok: false, error: "Erro interno ao criar congregação." };
    }
}

export async function atualizarCongregacao(id: number, formData: FormData) {
    try {
        const db = await getDb();
        const nome = formData.get('nome') as string;
        const cidade = formData.get('cidade') as string;
        const endereco = formData.get('endereco') as string;

        if (!nome || !cidade) return { ok: false, error: "Nome e Cidade são obrigatórios." };

        await db.congregacao.update({
            where: { id },
            data: { nome, cidade, endereco } // No update não precisamos do tenant_id: 0
        });

        revalidatePath('/admin/congregacoes');
        return { ok: true, message: "Congregação atualizada com sucesso!" };
    } catch (error) {
        return { ok: false, error: "Erro ao atualizar congregação." };
    }
}

export async function excluirCongregacao(id: number) {
    try {
        const db = await getDb();
        await db.congregacao.delete({
            where: { id }
        });

        revalidatePath('/admin/congregacoes');
        return { ok: true, message: "Congregação eliminada com sucesso!" };
    } catch (error: any) {
        // Proteção essencial: Se houver membros nesta congregação, a BD não deixa apagar
        if (error.code === 'P2003') {
            return { ok: false, error: "Não é possível apagar: existem membros ou grupos associados a esta congregação." };
        }
        return { ok: false, error: "Erro ao excluir a congregação." };
    }
}

export async function buscarCongregacoes() {
    const db = await getDb();
    return await db.congregacao.findMany({ orderBy: { nome: 'asc' } });
}



// Função auxiliar para pegar o DB e o TenantID
async function getContext() {
    const headersList = await headers();
    const tenantId = Number(headersList.get('x-tenant-id'));
    if (!tenantId) throw new Error("Igreja não identificada.");
    const db = getTenantClient(tenantId);
    return { db, tenantId };
}

// --- EXPORTAR ---
export async function exportarMembrosCSV() {
    try {
        const { db } = await getContext();
        const membros = await db.membro.findMany({
            include: { congregacao: true, escolaridade: true }
        });

        if (membros.length === 0) return { error: "Nenhum membro encontrado para exportar." };

        // Cabeçalho com TODOS os campos importantes
        const header = [
            "ID", "Primeiro Nome", "Apelido", "Email", "Telefone", "Nascimento", "Genero",
            "Estado Civil", "Profissao", "NIF", "Morada", "Cidade", "Codigo Postal",
            "Congregacao", "Cargo", "Status", "Data Admissao", "Loyverse ID"
        ].join(";");

        const rows = membros.map(m => [
            m.id,
            m.first_name,
            m.last_name,
            m.email,
            m.phone_1,
            m.birthdate ? m.birthdate.toISOString().split('T')[0] : "",
            m.gender || "",
            m.marital_status || "",
            m.profession || "",
            m.tax_id || "",
            m.address_1 || "",
            m.id_city || "",
            m.postal_code || "",
            m.congregacao?.nome || "Sede",
            m.church_role || "Membro",
            m.status || "ATIVO",
            m.data_admissao ? m.data_admissao.toISOString().split('T')[0] : "",
            m.loyverse_id || ""
        ].join(";"));

        return { csv: [header, ...rows].join("\n") };
    } catch (e) {
        return { error: "Erro na exportação." };
    }
}

// --- ANALISAR CSV ---
export async function analisarCSV(formData: FormData) {
    try {
        const { db } = await getContext();
        const file = formData.get('file') as File;
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

        // Remove o cabeçalho e processa
        const dataRows = lines.slice(1);
        const resultados = [];

        for (let i = 0; i < dataRows.length; i++) {
            const cols = dataRows[i].split(";").map(c => c.trim());

            // Mapeamento baseado no cabeçalho da exportação acima
            const dados = {
                first_name: cols[1],
                last_name: cols[2],
                email: cols[3]?.toLowerCase(),
                phone_1: cols[4],
                birthdate: cols[5],
                id_city: cols[11],
                church_role: cols[14] || "Membro",
                status: cols[15] || "ATIVO",
            };

            if (!dados.email || !dados.first_name) {
                resultados.push({ linha: i + 2, status: 'ERRO', motivo: 'Dados obrigatórios em falta', dados });
                continue;
            }

            // Verifica se já existe no banco global (Email é unique no sistema todo)
            const existe = await prismaGlobal.membro.findUnique({ where: { email: dados.email } });

            resultados.push({
                linha: i + 2,
                status: existe ? 'DUPLICADO' : 'PRONTO',
                motivo: existe ? 'Email já registado' : '',
                dados
            });
        }

        return { resultados };
    } catch (e) {
        return { error: "Erro ao ler ficheiro." };
    }
}

// --- CONFIRMAR E GRAVAR ---
export async function confirmarImportacao(membrosValidos: any[]) {
    try {
        const { db, tenantId } = await getContext();
        const passwordPadrao = await bcrypt.hash("admvc123", 10);

        // Criamos em lote para performance
        const criacoes = membrosValidos.map(item => {
            const d = item.dados;
            return {
                first_name: d.first_name,
                last_name: d.last_name,
                email: d.email,
                password: passwordPadrao,
                phone_1: d.phone_1 || "",
                id_city: d.id_city || "",
                church_role: d.church_role,
                status: d.status,
                birthdate: d.birthdate ? new Date(d.birthdate) : null,
                tenant_id: 0, // A extensão substitui
                is_active: true
            };
        });

        await db.membro.createMany({ data: criacoes as any });

        revalidatePath('/admin/membros');
        return { ok: true };
    } catch (e) {
        console.error(e);
        return { error: "Erro ao gravar na base de dados." };
    }
}



export async function excluirMembroAction(id: number) {
    try {
        const db = await getDb();
        await db.membro.delete({
            where: { id }
        });
        revalidatePath("/admin/membros");
        return { ok: true };
    } catch (error) {
        console.error("Erro ao excluir:", error);
        return { error: "Não foi possível excluir o membro. Verifique se ele possui registros vinculados (escalas, dízimos, etc)." };
    }
}

export async function adicionarMembroAoDepto(membroId: number, deptoId: number, funcoesIds: number[]) {
    const db = await getDb();

    await db.integranteDepartamento.create({
        data: {
            membro_id: membroId,
            departamento_id: deptoId,
            tenant_id: 0,
            funcoes: {
                create: funcoesIds.map(id => ({
                    funcao_id: id
                }))
            }
        }
    });
}


// 1. Apaga apenas UMA função de um membro (O clique no X da tag)
export async function removerFuncaoDoMembro(funcaoSelecionadaId: number) {
    try {
        const db = await getDb();

        // Remove a função específica da tabela FuncaoSelecionada
        await db.funcaoSelecionada.delete({
            where: { id: funcaoSelecionadaId }
        });

        revalidatePath('/admin/departamentos');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao remover função:", error);
        return { error: "Não foi possível remover a função." };
    }
}

// 2. Apaga o MEMBRO INTEIRO do departamento (O clique no botão Remover Membro)
export async function removerMembroTotal(membroId: number, departamentoId: number) {
    try {
        const db = await getDb();

        // Como a tabela tem onDelete: Cascade, ao apagar o IntegranteDepartamento, 
        // todas as "FuncoesSelecionadas" dele neste departamento serão apagadas automaticamente!
        await db.integranteDepartamento.delete({
            where: {
                membro_id_departamento_id: {
                    membro_id: membroId,
                    departamento_id: departamentoId
                }
            }
        });

        revalidatePath('/admin/departamentos');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao remover membro completo:", error);
        return { error: "Não foi possível remover o membro do departamento." };
    }
}




export async function alternarPermissaoEscala(integranteId: number, statusAtual: boolean) {
    try {
        const headersList = await headers();
        const tenantId = headersList.get('x-tenant-id');
        if (!tenantId) return { ok: false, error: 'Sessão inválida.' };

        const db = getTenantClient(Number(tenantId));

        // Atualiza a permissão (inverte o valor atual)
        await db.integranteDepartamento.update({
            where: { id: integranteId },
            data: { pode_gerir_escalas: !statusAtual }
        });

        // Atualiza a página onde a equipa é listada
        revalidatePath('/admin/configuracoes');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao delegar permissão:", error);
        return { ok: false, error: "Não foi possível alterar as permissões." };
    }
}