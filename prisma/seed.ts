// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

//const prisma = new PrismaClient({ adapter })
//const prisma = new PrismaClient()


async function main() {
    console.log('🌱 Iniciando a Sementeira (Seed)...')

    // =====================================================================
    // 1. CRIAR CARGOS INICIAIS
    // =====================================================================
    const cargos = [
        { nome: 'Pastor(a)' },
        { nome: 'Diácono/Diaconisa' },
        { nome: 'Presbítero' },
        { nome: 'Evangelista' },
        { nome: 'Missionário(a)' },
        { nome: 'Membro' },
        { nome: 'Voluntário' },
        { nome: 'Líder de Louvor' }
    ]

    for (const cargo of cargos) {
        await prisma.cargo.upsert({
            where: { nome: cargo.nome },
            update: {},
            create: cargo,
        })
    }
    console.log('✅ Cargos criados.')

    // =====================================================================
    // 2. CRIAR DEPARTAMENTOS (Inclui os de Gestão do Site)
    // =====================================================================
    const departamentos = [
        { nome: 'Ministério de Diaconia', descricao: 'Serviço e ordem nos cultos' },
        { nome: 'Ministério de Louvor', descricao: 'Música e adoração' },
        { nome: 'Evangelismo e Missões', descricao: 'Expansão do reino e evangelismo' },
        { nome: 'Mídia e Comunicação', descricao: 'Som, imagem, redes sociais e transmissões' },
        { nome: 'Acolhimento e Integração', descricao: 'Receção e acompanhamento de visitantes' },
        { nome: 'Cantina', descricao: 'Gestão da cafetaria e alimentação' },
        { nome: 'Ação Social', descricao: 'Despensa, cabazes e assistência à comunidade' }
    ]

    for (const depto of departamentos) {
        await prisma.departamento.upsert({
            where: { nome: depto.nome },
            update: {},
            create: depto,
        })
    }
    console.log('✅ Departamentos criados.')

    // ========================================================================
    // DEPARTAMENTOS E AS SUAS RESPETIVAS FUNÇÕES (CARGOS)
    // ========================================================================
    console.log('🌱 A semear Departamentos e Funções Ministeriais...');

    const departamentosComFuncoes = [
        {
            nome: "Ministério de Diaconia",
            descricao: "Serviço prático, ordem do culto e assistência à Ceia do Senhor.",
            funcoes: [
                'Diácono', 'Diaconisa', 'Líder de Diaconia', 'Auxiliar de Santa Ceia',
                'Recepção Interna', 'Recepção Externa', 'Estacionamento', 'Limpeza',
                'Nave', 'Crianças', 'Líder de Turno'
            ]
        },
        {
            nome: "Ministério de Louvor",
            descricao: "Responsável pela música, adoração e canto nos cultos e eventos.",
            funcoes: [
                'Ministro(a) de Louvor', 'Vocalista', 'Backing Vocal', 'Baterista',
                'Tecladista', 'Baixista', 'Guitarrista', 'Violonista', 'Saxsofonista',
                'Percussionista', 'Diretor(a) Musical', 'Líder', 'Técnico(a) de som',
                'Líder de Turno', 'Mesa de Som', 'Sonoplasta'
            ]
        },
        {
            nome: "Evangelismo e Missões",
            descricao: "Focado em alcançar vidas fora da igreja e apoiar missões.",
            funcoes: [
                'Líder de Evangelismo', 'Evangelista', 'Promotor(a) de Missões', 'Discipulador(a)',
                'Coordenador(a) de campo', 'Missionário(a)', 'Intercessor(a) de apoio missionário'
            ]
        },
        {
            nome: "Mídia e Comunicação",
            descricao: "Responsável pela projeção, som, fotografia, vídeo e redes sociais.",
            funcoes: [
                'Operador(a) de Som', 'Operador(a) de Projeção',
                'Fotógrafo(a)', 'Redes Sociais', 'Iluminador(a)', 'Líder',
                'Diretor(a) de mídia e comunicação',
                'Coordenador(a) de equipe', 'Operador(a) de Live',
                'Cinegrafista', 'Editor(a) de vídeo',
                'Designer gráfico', 'Operador(a) de transmissão',
                'Roteirista / produtor(a) de conteúdo'
            ]
        },
        {
            nome: "Acolhimento e Integração",
            descricao: "Receção aos membros, visitantes e orientação geral no edifício.",
            funcoes: [
                'Líder de Acolhimento', 'Rececionista', 'Porteiro(a)',
                'Conselheiro(a) de Novos Convertidos', 'Orientador(a) de Parqueamento'
            ]
        },
        {
            nome: "Ação Social",
            descricao: "Assistência a famílias carenciadas e gestão de donativos.",
            funcoes: [
                'Coordenador(a) de Ação Social', 'Assistente Social',
                'Voluntário(a) de Distribuição', 'Gestor(a) de Donativos'
            ]
        },
        {
            nome: "Cantina",
            descricao: "Preparação de refeições e gestão do espaço de comunhão.",
            funcoes: [
                'Responsável da Cantina', 'Cozinheiro(a)',
                'Atendente de Caixa', 'Auxiliar de Logística e Limpeza'
            ]
        }
    ];

    for (const depto of departamentosComFuncoes) {
        // 1. Cria ou Atualiza o Departamento
        const departamentoCriado = await prisma.departamento.upsert({
            where: { nome: depto.nome },
            update: { descricao: depto.descricao }, // Atualiza a descrição se já existir
            create: {
                nome: depto.nome,
                descricao: depto.descricao
            }
        });

        // 2. Cria as Funções vinculadas ao ID deste Departamento
        for (const nomeFuncao of depto.funcoes) {
            await prisma.funcaoDepartamento.upsert({
                where: {
                    nome_departamento_id: { // O nome gerado pelo Prisma para a sua regra @@unique
                        nome: nomeFuncao,
                        departamento_id: departamentoCriado.id
                    }
                },
                update: {}, // Não faz nada se a função já existir
                create: {
                    nome: nomeFuncao,
                    departamento_id: departamentoCriado.id
                }
            });
        }
    }

    console.log(`✅ ${departamentosComFuncoes.length} Departamentos e as suas Funções foram semeados com sucesso!`);


    // CRIAR ESCOLARIDADES INICIAIS
    const escolaridades = [
        { nome: 'Ensino Básico' },
        { nome: 'Ensino Secundário' },
        { nome: 'Ensino Profissional' },
        { nome: 'Licenciatura' },
        { nome: 'Mestrado' },
        { nome: 'Doutoramento' },
        { nome: 'Outro' }
    ]

    for (const esc of escolaridades) {
        await prisma.escolaridade.upsert({
            where: { nome: esc.nome },
            update: {},
            create: esc,
        })
    }
    console.log('✅ Escolaridades criadas.')

    // =====================================================================
    // 3. CRIAR GRUPOS (SOMOS 1)
    // =====================================================================
    const gruposNomes = [
        'SOMOS 1 - HOMENS',
        'SOMOS 1 - MULHERES',
        'SOMOS 1 - KIDS',
        'SOMOS 1 - TEENS',
        'SOMOS 1 - YOUTH'
    ]

    for (const nomeGrupo of gruposNomes) {
        // O modelo Grupo não tem @unique no nome, por isso usamos o findFirst para evitar duplicados
        const exists = await prisma.grupo.findFirst({ where: { nome: nomeGrupo } })

        if (!exists) {
            await prisma.grupo.create({
                data: {
                    nome: nomeGrupo,
                    dia_semana: 'A definir',
                    horario: 'A definir',
                    perfil: nomeGrupo.replace('SOMOS 1 - ', ''),
                    categoria: 'Comunhão',
                    descricao: `Grupo destinado a ${nomeGrupo.replace('SOMOS 1 - ', '').toLowerCase()}`,
                    endereco: 'Sede ADMVC',
                    bairro: 'Centro',
                    cidade: 'Figueira da Foz',
                    estado: 'Coimbra',
                    pais: 'Portugal'
                }
            })
        }
    }
    console.log('✅ Grupos (SOMOS 1) criados.')

    // =====================================================================
    // 4. CRIAR SUPER ADMIN INICIAL
    // =====================================================================
    const hashedAdminPassword = await bcrypt.hash('admin123', 10) // Mude após o primeiro login

    await prisma.membro.upsert({
        where: { email: 'admin@admvc.com' },
        update: {},
        create: {
            first_name: 'Administrador',
            last_name: 'Sistema',
            email: 'admin@admvc.com',
            password: hashedAdminPassword,
            role: 'ADMIN',
            status: 'ATIVO',
            phone_1: '912345678',
            gender: 'Masculino',
            is_active: true,
            termo_aceite: true // Já aceitou os termos para não ser barrado
        },
    })
    console.log('👑 Super Admin criado: admin@admvc.com / admin123')

    console.log('🚀 SEED CONCLUÍDO COM SUCESSO! A casa está limpa e arrumada.')
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })