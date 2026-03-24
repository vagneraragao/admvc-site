// app/admin/membros/importar/actions.ts
'use server'

import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

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

// 3. CONFIRMAR: Gravação em massa
export async function confirmarImportacao(membrosValidos: any[]) {
    const session = await getSessionData();
    if (!session || session.role !== 'ADMIN') return { error: 'Acesso negado.' };

    try {
        const dataToInsert = membrosValidos.map(m => ({
            ...m.dados,
            is_active: true,
            termo_aceite: false
        }));

        await prisma.membro.createMany({ data: dataToInsert });

        revalidatePath('/admin/membros');
        return { ok: true, contagem: dataToInsert.length };
    } catch (error: any) {
        return { error: 'Erro na gravação: ' + error.message };
    }
}