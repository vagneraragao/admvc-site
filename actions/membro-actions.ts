'use server'

import prisma, { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs' // Recomendo bcryptjs para evitar problemas de compilação em Edge Runtime
import { put } from '@vercel/blob' // <-- Importação do Blob Storage
import { getSessionData } from '@/lib/auth-utils'

// ============================================================================
// 🛠️ FUNÇÕES AUXILIARES PARA MULTITENANT
// ============================================================================
async function getDb() {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');
    if (!tenantId) throw new Error("Sessão inválida. Igreja não identificada.");
    return getTenantClient(Number(tenantId));
}

async function getContext() {
    const headersList = await headers();
    const tenantId = Number(headersList.get('x-tenant-id'));
    if (!tenantId) throw new Error("Igreja não identificada.");
    const db = getTenantClient(tenantId);
    return { db, tenantId };
}

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
        // 1. Instanciamos o banco de dados blindado (Multitenant)
        const db = await getDb();

        const passwordRaw = (formData.get('password') as string) || "membro123";
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        // Captura de IDs estrangeiros
        const escolaridade_id = formData.get('escolaridade_id') ? Number(formData.get('escolaridade_id')) : null;
        const congregacao_id = formData.get('congregacao_id') ? Number(formData.get('congregacao_id')) : null;

        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;

        // VERIFICAÇÃO DE CHECKBOXES (HTML envia "on" quando marcado)
        const isFamilyAdmin = formData.get('is_family_admin') === 'on' || formData.get('is_family_admin') === 'true' || formData.get('is_family_admin') === 'Sim';
        const hasChildren = formData.get('has_children') === 'on' || formData.get('has_children') === 'true' || formData.get('has_children') === 'Sim';
        const spouseChristian = formData.get('spouse_christian') === 'on' || formData.get('spouse_christian') === 'true' || formData.get('spouse_christian') === 'Sim';
        const isActive = formData.get('is_active') === 'on' || formData.get('is_active') === 'true' || formData.get('is_active') === 'Sim';

        // 2. Gravação no banco de dados
        const novo = await db.membro.create({
            data: {
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
                status: (formData.get('status') as string) || "ATIVO",
                role: (formData.get('role') as any) || "USER",
                is_active: isActive !== undefined ? isActive : true,
                conversion_date: conversion_date,

                // --- A CORREÇÃO DO TYPESCRIPT ESTÁ AQUI ---
                // Usamos o ID diretamente em vez de 'connect' para satisfazer o UncheckedCreateInput
                escolaridade_id: escolaridade_id,

                // Já deixei preparado para gravar a congregação (Filial) se ela vier no form
                congregacao_id: congregacao_id,

                // MULTITENANT: Obrigatório para o TypeScript, a extensão substitui pelo ID real!
                tenant_id: 0
            }
        });

        revalidatePath('/admin/membros');
        return { sucesso: true, id: novo.id };
    } catch (error: any) {
        console.error("Erro ao cadastrar:", error);

        // Tratamento de erro amigável se o email já existir
        if (error.code === 'P2002') {
            return { erro: "Este e-mail já está a ser utilizado por outro membro." };
        }

        return { erro: error.message || "Erro interno ao guardar o membro." };
    }
}

export async function atualizarDadosMembro(membroId: number, formData: FormData) {
    try {
        console.log(`\n=============================================`);
        console.log(`👤 [DEBUG EDIÇÃO PERFIL] O membro ID ${membroId} está a atualizar os próprios dados`);

        const escolaridade_id = formData.get('escolaridade_id') ? Number(formData.get('escolaridade_id')) : null;
        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;
        const entry_date = formData.get('entry_date') ? new Date(formData.get('entry_date') as string) : null;
        const baptism_date = formData.get('baptism_date') ? new Date(formData.get('baptism_date') as string) : null;
        const wedding_date = formData.get('wedding_date') ? new Date(formData.get('wedding_date') as string) : null;
        const spouse_christian = formData.get('spouse_christian') === 'true';
        const has_children = formData.get('has_children') === 'true';
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
            entry_date: entry_date,
            baptism_date: baptism_date,
            notes: formData.get('notes') as string || null,
            previous_church: formData.get('previous_church') as string || null,
            church_role: formData.get('church_role') as string || null,
            ministry: formData.get('ministry') as string || null,
            nationality: formData.get('nationality') as string || null,
            tax_id: formData.get('tax_id') as string || null,
            id_card_number: formData.get('id_card_number') as string || null,
            marital_status: formData.get('marital_status') as string || null,
            lang: formData.get('lang') as string || 'pt',
            spouse_christian: spouse_christian,
            wedding_date: wedding_date,
            has_children: has_children,
        };

        // 2. LÓGICA DA NOVA SENHA (Exatamente igual à do Admin)
        const novaSenha = formData.get('nova_senha') as string;
        const avatarFile = formData.get('avatar') as File | null;
        if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
            console.log(`📸 A fazer upload da nova foto (${avatarFile.name}) para o Blob Storage...`);

            const blob = await put(`avatars/membro-${membroId}-${Date.now()}-${avatarFile.name}`, avatarFile, {
                access: 'public',
            });

            dataToUpdate.avatar_file = blob.url; // Guarda o link público na base de dados
            console.log(`✅ Upload concluído! URL: ${blob.url}`);
        }
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

export async function buscarRelatorioEscalasAction(membroId: number, mes: number, ano: number) {
    try {
        // Define o primeiro e o último dia do mês escolhido
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);

        const escalas = await prisma.escala.findMany({
            where: {
                membro_id: membroId,
                evento: {
                    data: {
                        gte: dataInicio,
                        lte: dataFim
                    }
                }
            },
            include: {
                evento: true,
                departamento: true
            },
            orderBy: {
                evento: { data: 'asc' }
            }
        });

        return { sucesso: true, escalas };
    } catch (error) {
        console.error("Erro ao buscar relatório:", error);
        return { sucesso: false, erro: "Falha ao carregar o relatório." };
    }
}

// Auxiliar para formatar datas para o CSV
const formatDate = (date: Date | null) => date ? date.toISOString().split('T')[0] : '';

// 1. EXPORTAR: Agora com todos os 23 campos solicitados
export async function exportarMembrosCSV() {
    const session = await getSessionData();
    if (!session || session.role !== 'ADMIN') return { error: 'Acesso negado.' };

    const membros = await prisma.membro.findMany({
        include: { escolaridade: true }
    });

    const cabecalho = [
        "First Name", "Last Name", "Email", "Phone 1", "Role", "Status", "Gender",
        "Address 1", "Address 2", "Number", "Postal Code", "City", "State", "Country",
        "Birthdate", "Marital Status", "Scholarity", "Spouse Name", "Conversion Date",
        "Baptism Status", "Baptism Date", "Avatar URL", "Created At"
    ].join(';');

    const linhas = membros.map(m => [
        m.first_name, m.last_name, m.email, m.phone_1, m.role, m.status, m.gender || '',
        m.address_1 || '', m.address_2 || '', m.address_number || '', m.postal_code || '',
        m.id_city || '', m.state || '', m.country || 'Portugal',
        formatDate(m.birthdate), m.marital_status || '', m.escolaridade?.nome || '',
        m.spouse_name || '', formatDate(m.conversion_date),
        m.baptism_status || '', formatDate(m.baptism_date), m.avatar_file || '',
        formatDate(m.created_at)
    ].join(';')).join('\n');

    return { csv: cabecalho + '\n' + linhas };
}

// 2. ANALISAR: Com lógica para converter nome da Escolaridade em ID
export async function analisarCSV(formData: FormData) {
    const session = await getSessionData();
    if (!session || session.role !== 'ADMIN') return { error: 'Acesso negado.' };

    const file = formData.get('file') as File;
    if (!file) return { error: 'Nenhum ficheiro enviado.' };

    const text = await file.text();
    const linhas = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Busca tabelas auxiliares para validação
    const membrosAtuais = await prisma.membro.findMany({ select: { email: true } });
    const escolaridadesValidas = await prisma.escolaridade.findMany();

    const emailsNaDB = new Set(membrosAtuais.map(m => m.email.toLowerCase()));
    const mapaEscolaridade = new Map(escolaridadesValidas.map(e => [e.nome.toLowerCase(), e.id]));

    const resultados = [];
    const emailsNoFicheiro = new Set();

    for (let i = 1; i < linhas.length; i++) {
        const col = linhas[i].split(';');
        const email = col[2]?.trim().toLowerCase();

        if (!col[0] || !email) {
            resultados.push({ linha: i + 1, status: 'ERRO', motivo: 'Nome e Email são obrigatórios.' });
            continue;
        }

        if (emailsNaDB.has(email) || emailsNoFicheiro.has(email)) {
            resultados.push({ linha: i + 1, email, nome: col[0], status: 'DUPLICADO', motivo: 'Email já existe ou está repetido no ficheiro.' });
            continue;
        }

        emailsNoFicheiro.add(email);

        // Tenta encontrar o ID da escolaridade pelo nome
        const escNome = col[16]?.trim().toLowerCase();
        const escId = mapaEscolaridade.get(escNome) || null;

        resultados.push({
            linha: i + 1,
            status: 'PRONTO',
            dados: {
                first_name: col[0], last_name: col[1], email: email, phone_1: col[3],
                role: (col[4] as any) || 'USER', status: col[5] || 'ATIVO', gender: col[6],
                address_1: col[7], address_2: col[8], address_number: col[9], postal_code: col[10],
                id_city: col[11], state: col[12], country: col[13] || 'Portugal',
                birthdate: col[14] ? new Date(col[14]) : null,
                marital_status: col[15], escolaridade_id: escId, spouse_name: col[17],
                conversion_date: col[18] ? new Date(col[18]) : null,
                baptism_status: col[19], baptism_date: col[20] ? new Date(col[20]) : null,
                avatar_file: col[21]
            }
        });
    }

    return { resultados };
}

// --- CONFIRMAR E GRAVAR COM LOOKUP DE CONGREGAÇÃO ---
export async function confirmarImportacao(membrosValidos: any[]) {
    try {
        const { db, tenantId } = await getContext();
        const passwordPadrao = await bcrypt.hash("admvc123", 10);

        // 1. Buscar todas as congregações desta igreja para mapear Nome -> ID
        const congregacoesExistentes = await db.congregacao.findMany({
            select: { id: true, nome: true }
        });

        // Criar um mapa simples: { "Sede": 1, "Porto": 5, ... }
        // Usamos toLowerCase() para evitar erros de digitação (ex: "sede" vs "Sede")
        const mapaCongregacoes = new Map(
            congregacoesExistentes.map(c => [c.nome.toLowerCase().trim(), c.id])
        );

        // 2. Preparar os dados para o Prisma
        const criacoes = membrosValidos.map(item => {
            const d = item.dados;

            // Tentar encontrar o ID da congregação pelo nome enviado no CSV
            const nomeNoCsv = d.congregacao_nome?.toLowerCase().trim();
            const congregacaoIdEncontrado = nomeNoCsv ? mapaCongregacoes.get(nomeNoCsv) : null;

            return {
                first_name: d.first_name,
                last_name: d.last_name,
                email: d.email,
                password: passwordPadrao,
                phone_1: d.phone_1 || "",
                id_city: d.id_city || "",
                church_role: d.church_role || "Membro",
                status: d.status || "ATIVO",
                birthdate: d.birthdate ? new Date(d.birthdate) : null,

                // Se achou a congregação, usa o ID. Se não, fica null (Sede/Geral)
                congregacao_id: congregacaoIdEncontrado,

                tenant_id: 0, // A extensão Multitenant trata do resto
                is_active: true
            };
        });

        // 3. Gravação em massa (Transaction implicita)
        await db.membro.createMany({
            data: criacoes as any,
            skipDuplicates: true // Segurança extra
        });

        revalidatePath('/admin/membros');
        return { ok: true, message: `${membrosValidos.length} membros importados com sucesso!` };

    } catch (e) {
        console.error("ERRO IMPORTAÇÃO:", e);
        return { error: "Erro crítico ao gravar membros. Verifique se os dados do CSV são válidos." };
    }
}


export async function buscarMembrosPorFuncao(departamentoId: number, funcaoId: number) {
    const db = await getDb();

    // Procura integrantes que tenham a função selecionada vinculada
    const qualificados = await db.integranteDepartamento.findMany({
        where: {
            departamento_id: departamentoId,
            funcoes: {
                some: { funcao_id: funcaoId }
            }
        },
        include: {
            membro: {
                select: { id: true, first_name: true, last_name: true, avatar_file: true }
            }
        }
    });

    return qualificados.map(q => q.membro);
}