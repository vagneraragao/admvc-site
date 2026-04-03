'use server'

import prisma, { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-utils'

async function getDb() {
    const h = await headers()
    const tenantId = Number(h.get('x-tenant-id') || 0)
    if (!tenantId) throw new Error('Igreja nao identificada.')
    return getTenantClient(tenantId)
}

// ── SERMÕES ─────────────────────────────────────────────────────────────────

export async function listarSermoes(mes: number, ano: number) {
    try {
        await requireAuth()
        const db = await getDb()

        const inicio = new Date(ano, mes - 1, 1)
        const fim = new Date(ano, mes, 1)

        const sermoes = await db.sermao.findMany({
            where: {
                data_pregacao: { gte: inicio, lt: fim },
            },
            include: {
                pregador: { select: { first_name: true, last_name: true } },
                evento: { select: { nome: true, data: true } },
            },
            orderBy: { data_pregacao: 'desc' },
        })

        return { ok: true, data: sermoes }
    } catch (error: any) {
        console.error('Erro ao listar sermões:', error)
        return { ok: false, error: error.message || 'Erro ao listar sermões.' }
    }
}

export async function buscarSermao(id: string) {
    try {
        await requireAuth()
        const db = await getDb()

        const sermao = await db.sermao.findUnique({
            where: { id },
            include: {
                pregador: { select: { id: true, first_name: true, last_name: true } },
                evento: { select: { id: true, nome: true, data: true } },
                escolasBiblicas: {
                    select: { id: true, titulo: true, data: true },
                },
            },
        })

        if (!sermao) return { ok: false, error: 'Sermão não encontrado.' }

        return { ok: true, data: sermao }
    } catch (error: any) {
        console.error('Erro ao buscar sermão:', error)
        return { ok: false, error: error.message || 'Erro ao buscar sermão.' }
    }
}

export async function criarSermao(formData: FormData) {
    try {
        await requireAuth()
        const db = await getDb()
        const tenantId = Number((await headers()).get('x-tenant-id') || 0)

        const titulo = formData.get('titulo') as string
        const texto_corpo = formData.get('texto_corpo') as string | null
        const referencias_biblicas = formData.get('referencias_biblicas') as string | null
        const notas_privadas = formData.get('notas_privadas') as string | null
        const tagsStr = formData.get('tags') as string | null
        const data_pregacao = formData.get('data_pregacao') as string
        const pregador_id = Number(formData.get('pregador_id'))
        const evento_id_raw = formData.get('evento_id')
        const evento_id = evento_id_raw ? Number(evento_id_raw) : null
        const publicado = formData.get('publicado') === 'true' || formData.get('publicado') === 'on'

        if (!titulo || !data_pregacao || !pregador_id) {
            return { ok: false, error: 'Preencha todos os campos obrigatórios (título, data, pregador).' }
        }

        const sermao = await db.sermao.create({
            data: {
                titulo,
                texto_corpo: texto_corpo || null,
                referencias_biblicas: referencias_biblicas ? JSON.parse(referencias_biblicas) : undefined,
                notas_privadas: notas_privadas || null,
                tags: tagsStr ? JSON.parse(tagsStr) : undefined,
                data_pregacao: new Date(data_pregacao),
                pregador_id,
                evento_id: evento_id || undefined,
                publicado,
                tenant_id: tenantId,
            },
        })

        revalidatePath('/pregacao')
        return { ok: true, data: sermao }
    } catch (error: any) {
        console.error('Erro ao criar sermão:', error)
        return { ok: false, error: error.message || 'Erro ao criar sermão.' }
    }
}

export async function atualizarSermao(id: string, formData: FormData) {
    try {
        await requireAuth()
        const db = await getDb()

        const titulo = formData.get('titulo') as string
        const texto_corpo = formData.get('texto_corpo') as string | null
        const referencias_biblicas = formData.get('referencias_biblicas') as string | null
        const notas_privadas = formData.get('notas_privadas') as string | null
        const tagsStr = formData.get('tags') as string | null
        const data_pregacao = formData.get('data_pregacao') as string
        const pregador_id = Number(formData.get('pregador_id'))
        const evento_id_raw = formData.get('evento_id')
        const evento_id = evento_id_raw ? Number(evento_id_raw) : null
        const publicado = formData.get('publicado') === 'true' || formData.get('publicado') === 'on'

        if (!titulo || !data_pregacao || !pregador_id) {
            return { ok: false, error: 'Preencha todos os campos obrigatórios (título, data, pregador).' }
        }

        const sermao = await db.sermao.update({
            where: { id },
            data: {
                titulo,
                texto_corpo: texto_corpo || null,
                referencias_biblicas: referencias_biblicas ? JSON.parse(referencias_biblicas) : undefined,
                notas_privadas: notas_privadas || null,
                tags: tagsStr ? JSON.parse(tagsStr) : undefined,
                data_pregacao: new Date(data_pregacao),
                pregador_id,
                evento_id: evento_id || null,
                publicado,
            },
        })

        revalidatePath('/pregacao')
        return { ok: true, data: sermao }
    } catch (error: any) {
        console.error('Erro ao atualizar sermão:', error)
        return { ok: false, error: error.message || 'Erro ao atualizar sermão.' }
    }
}

export async function removerSermao(id: string) {
    try {
        await requireAuth()
        const db = await getDb()

        await db.sermao.delete({ where: { id } })

        revalidatePath('/pregacao')
        return { ok: true }
    } catch (error: any) {
        console.error('Erro ao remover sermão:', error)
        return { ok: false, error: error.message || 'Erro ao remover sermão.' }
    }
}

export async function partilharSermaoWhatsApp(id: string) {
    try {
        await requireAuth()
        const db = await getDb()

        const sermao = await db.sermao.findUnique({
            where: { id },
            include: {
                pregador: { select: { first_name: true, last_name: true } },
            },
        })

        if (!sermao) return { ok: false, error: 'Sermão não encontrado.' }

        await db.sermao.update({
            where: { id },
            data: { partilhado_whatsapp: true },
        })

        const refs = Array.isArray(sermao.referencias_biblicas)
            ? (sermao.referencias_biblicas as any[])
                .map((r: any) => `${r.livro} ${r.capitulo}:${r.versiculo_inicio}${r.versiculo_fim ? '-' + r.versiculo_fim : ''}`)
                .join(', ')
            : ''

        const dataFormatada = new Date(sermao.data_pregacao).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })

        const mensagem = [
            `📖 *${sermao.titulo}*`,
            `🗓 ${dataFormatada}`,
            `🎤 ${sermao.pregador.first_name} ${sermao.pregador.last_name}`,
            refs ? `📜 ${refs}` : '',
            '',
            sermao.texto_corpo
                ? sermao.texto_corpo.replace(/<[^>]*>/g, '').substring(0, 500)
                : '',
        ]
            .filter(Boolean)
            .join('\n')

        revalidatePath('/pregacao')
        return { ok: true, data: mensagem }
    } catch (error: any) {
        console.error('Erro ao partilhar sermão:', error)
        return { ok: false, error: error.message || 'Erro ao partilhar sermão.' }
    }
}

// ── ESCOLA BÍBLICA DOMINICAL (EBD) ─────────────────────────────────────────

export async function listarEBD(mes: number, ano: number) {
    try {
        await requireAuth()
        const db = await getDb()

        const inicio = new Date(ano, mes - 1, 1)
        const fim = new Date(ano, mes, 1)

        const aulas = await db.escolaBiblica.findMany({
            where: {
                data: { gte: inicio, lt: fim },
            },
            include: {
                professor: { select: { first_name: true, last_name: true } },
                sermao: { select: { id: true, titulo: true } },
                _count: { select: { presencas: true } },
            },
            orderBy: { data: 'desc' },
        })

        return { ok: true, data: aulas }
    } catch (error: any) {
        console.error('Erro ao listar EBD:', error)
        return { ok: false, error: error.message || 'Erro ao listar aulas de EBD.' }
    }
}

export async function criarEBD(formData: FormData) {
    try {
        await requireAuth()
        const db = await getDb()
        const tenantId = Number((await headers()).get('x-tenant-id') || 0)

        const titulo = formData.get('titulo') as string
        const tema = formData.get('tema') as string | null
        const data = formData.get('data') as string
        const material_apoio = formData.get('material_apoio') as string | null
        const perguntas_discussao = formData.get('perguntas_discussao') as string | null
        const professor_id = Number(formData.get('professor_id'))
        const sermao_id_raw = formData.get('sermao_id')
        const sermao_id = sermao_id_raw ? (sermao_id_raw as string) : null

        if (!titulo || !data || !professor_id) {
            return { ok: false, error: 'Preencha todos os campos obrigatórios (título, data, professor).' }
        }

        const aula = await db.escolaBiblica.create({
            data: {
                titulo,
                tema: tema || null,
                data: new Date(data),
                material_apoio: material_apoio || null,
                perguntas_discussao: perguntas_discussao ? JSON.parse(perguntas_discussao) : undefined,
                professor_id,
                sermao_id: sermao_id || undefined,
                tenant_id: tenantId,
            },
        })

        revalidatePath('/pregacao')
        return { ok: true, data: aula }
    } catch (error: any) {
        console.error('Erro ao criar EBD:', error)
        return { ok: false, error: error.message || 'Erro ao criar aula de EBD.' }
    }
}

export async function atualizarEBD(id: string, formData: FormData) {
    try {
        await requireAuth()
        const db = await getDb()

        const titulo = formData.get('titulo') as string
        const tema = formData.get('tema') as string | null
        const data = formData.get('data') as string
        const material_apoio = formData.get('material_apoio') as string | null
        const perguntas_discussao = formData.get('perguntas_discussao') as string | null
        const professor_id = Number(formData.get('professor_id'))
        const sermao_id_raw = formData.get('sermao_id')
        const sermao_id = sermao_id_raw ? (sermao_id_raw as string) : null

        if (!titulo || !data || !professor_id) {
            return { ok: false, error: 'Preencha todos os campos obrigatórios (título, data, professor).' }
        }

        const aula = await db.escolaBiblica.update({
            where: { id },
            data: {
                titulo,
                tema: tema || null,
                data: new Date(data),
                material_apoio: material_apoio || null,
                perguntas_discussao: perguntas_discussao ? JSON.parse(perguntas_discussao) : undefined,
                professor_id,
                sermao_id: sermao_id || null,
            },
        })

        revalidatePath('/pregacao')
        return { ok: true, data: aula }
    } catch (error: any) {
        console.error('Erro ao atualizar EBD:', error)
        return { ok: false, error: error.message || 'Erro ao atualizar aula de EBD.' }
    }
}

export async function removerEBD(id: string) {
    try {
        await requireAuth()
        const db = await getDb()

        await db.escolaBiblica.delete({ where: { id } })

        revalidatePath('/pregacao')
        return { ok: true }
    } catch (error: any) {
        console.error('Erro ao remover EBD:', error)
        return { ok: false, error: error.message || 'Erro ao remover aula de EBD.' }
    }
}

export async function registarPresencasEBD(escolaBiblicaId: string, presenteIds: number[]) {
    try {
        await requireAuth()
        const db = await getDb()

        // Apaga todas as presenças existentes para esta aula
        await db.presencaEBD.deleteMany({
            where: { escola_biblica_id: escolaBiblicaId },
        })

        // Cria as novas presenças
        if (presenteIds.length > 0) {
            await db.presencaEBD.createMany({
                data: presenteIds.map((membroId) => ({
                    escola_biblica_id: escolaBiblicaId,
                    membro_id: membroId,
                    presente: true,
                })),
            })
        }

        revalidatePath('/pregacao')
        return { ok: true }
    } catch (error: any) {
        console.error('Erro ao registar presenças:', error)
        return { ok: false, error: error.message || 'Erro ao registar presenças.' }
    }
}

export async function buscarRelatorioEBD() {
    try {
        await requireAuth()
        const db = await getDb()

        // Total de aulas
        const totalAulas = await db.escolaBiblica.count()

        // Total de presenças
        const totalPresencas = await db.presencaEBD.count({
            where: { presente: true },
        })

        // Membros mais assíduos
        const membrosAssíduos = await db.presencaEBD.groupBy({
            by: ['membro_id'],
            where: { presente: true },
            _count: { membro_id: true },
            orderBy: { _count: { membro_id: 'desc' } },
            take: 10,
        })

        // Buscar nomes dos membros
        const membrosIds = membrosAssíduos.map((m) => m.membro_id)
        const membros = await db.membro.findMany({
            where: { id: { in: membrosIds } },
            select: { id: true, first_name: true, last_name: true },
        })

        const membrosMap = new Map(membros.map((m) => [m.id, m]))

        const membrosRanking = membrosAssíduos.map((m) => {
            const membro = membrosMap.get(m.membro_id)
            return {
                membro_id: m.membro_id,
                nome: membro ? `${membro.first_name} ${membro.last_name}` : 'Desconhecido',
                presencas: m._count.membro_id,
            }
        })

        // Top 5 temas mais abordados
        const aulas = await db.escolaBiblica.findMany({
            where: { tema: { not: null } },
            select: { tema: true },
        })

        const temaContagem: Record<string, number> = {}
        for (const aula of aulas) {
            if (aula.tema) {
                const tema = aula.tema.trim()
                temaContagem[tema] = (temaContagem[tema] || 0) + 1
            }
        }

        const topTemas = Object.entries(temaContagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tema, count]) => ({ tema, count }))

        revalidatePath('/pregacao')
        return {
            ok: true,
            data: {
                totalAulas,
                totalPresencas,
                membrosRanking,
                topTemas,
            },
        }
    } catch (error: any) {
        console.error('Erro ao buscar relatório EBD:', error)
        return { ok: false, error: error.message || 'Erro ao buscar relatório.' }
    }
}
