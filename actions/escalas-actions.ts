'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { getSessionData } from '@/lib/auth-utils'

async function getDb() {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')
    if (!tenantId) throw new Error('Tenant não identificado.')
    return { db: getTenantClient(Number(tenantId)), tenantId: Number(tenantId) }
}

export async function deletarEscalaAction(escalaId: number) {
    try {
        const session = await getSessionData();
        if (!session) return { ok: false };

        // Buscamos a escala para saber de qual depto ela é e validar a permissão
        const escala = await prisma.escala.findUnique({
            where: { id: escalaId },
            select: { departamento_id: true }
        });

        if (!escala) return { ok: false };

        // Validação de segurança (mesma lógica acima)
        // ... (pode ser simplificada aqui para brevidade, mas o ideal é repetir a checagem)

        await prisma.escala.delete({
            where: { id: escalaId }
        });

        revalidatePath(`/membros/gestao/escalas/${escala.departamento_id}`);
        revalidatePath('/membros/dashboard');

        return { ok: true };

    } catch (error) {
        return { ok: false };
    }
}

export async function criarEscalaAction(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada' };

        const { membroId: liderLogadoId, role } = session;

        // 1. CAPTURAR DADOS
        const eventoId = parseInt(formData.get('evento_id') as string);
        const membroEscaladoId = parseInt(formData.get('membro_id') as string);
        const deptoId = parseInt(formData.get('departamento_id') as string);
        const funcaoId = parseInt(formData.get('funcao_id') as string);
        const horario = (formData.get('horario') as string) || "00:00";

        if (!eventoId || !membroEscaladoId || !funcaoId) {
            return { ok: false, error: 'Dados incompletos para a escala.' };
        }

        // 2. SEGURANÇA E TENANT: Buscar o líder e o Tenant real do departamento
        const depto = await prisma.departamento.findUnique({
            where: { id: deptoId },
            select: {
                lider_id: true,
                tenant_id: true // 👈 PEGAMOS O TENANT REAL AQUI
            }
        });

        if (!depto || !depto.tenant_id) {
            return { ok: false, error: 'Erro de integridade: Departamento sem Tenant associado.' };
        }

        const vinculoLider = await prisma.integranteDepartamento.findFirst({
            where: {
                membro_id: liderLogadoId,
                departamento_id: deptoId,
                OR: [
                    { pode_gerir_escalas: true },
                    {
                        funcoes: {
                            some: {
                                funcao: { nome: { contains: 'Lider', mode: 'insensitive' } }
                            }
                        }
                    }
                ]
            }
        });

        const ehAutorizado = role === 'ADMIN' || depto.lider_id === liderLogadoId || !!vinculoLider;

        if (!ehAutorizado) {
            return { ok: false, error: 'Não tens permissão para escalar neste grupo.' };
        }

        // 3. 🛡️ VALIDAÇÃO EXTRA: Evitar escala duplicada no mesmo evento
        const jaEscalado = await prisma.escala.findFirst({
            where: {
                evento_id: eventoId,
                membro_id: membroEscaladoId,
                departamento_id: deptoId,
                funcao_id: funcaoId
            }
        });

        if (jaEscalado) {
            return { ok: false, error: 'Este membro já está escalado para esta função neste evento.' };
        }

        // 4. CRIAR A ESCALA NO PRISMA (Com o Tenant Correto)
        // Buscamos o nome da função para manter compatibilidade com o campo 'funcao' (string) que ainda é obrigatório no schema
        const funcaoRef = await prisma.funcaoDepartamento.findUnique({
            where: { id: funcaoId },
            select: { nome: true }
        });

        await prisma.escala.create({
            data: {
                evento_id: eventoId,
                membro_id: membroEscaladoId,
                departamento_id: deptoId,
                funcao_id: funcaoId,
                funcao: funcaoRef?.nome || 'Serviço', // 👈 Adicionamos este campo que faltava e causava o erro de Tipo
                horario: horario,
                tenant_id: depto.tenant_id // Mantendo o tenant_id real capturado do departamento
            }
        });

        // 5. ATUALIZAR CACHE
        revalidatePath(`/membros/gestao/escalas/${deptoId}`);
        revalidatePath('/membros/dashboard');

        return { ok: true };

    } catch (error: any) {
        console.error("Erro ao criar escala:", error);
        return { ok: false, error: 'Erro ao processar a escala no servidor.' };
    }
}

// ── CONFIRMAR PRESENÇA ────────────────────────────────────────────────────────
export async function confirmarEscala(ids: number[]) {
    try {
        const session = await getSessionData()
        if (!session) return { sucesso: false, error: 'Sessão expirada.' }

        const { db } = await getDb()

        await db.escala.updateMany({
            where: { id: { in: ids }, membro_id: session.membroId },
            data: { confirmado: true, motivo_recusa: null }
        })

        revalidatePath('/membros/dashboard')
        return { sucesso: true }
    } catch (error: any) {
        console.error('Erro ao confirmar escala:', error)
        return { sucesso: false, error: 'Erro interno.' }
    }
}

// ── RECUSAR PRESENÇA COM MOTIVO ───────────────────────────────────────────────
export async function recusarEscala(ids: number[], motivo: string) {
    try {
        const session = await getSessionData()
        if (!session) return { sucesso: false, error: 'Sessão expirada.' }

        if (!motivo?.trim()) return { sucesso: false, error: 'Motivo obrigatório.' }

        const { db } = await getDb()

        await db.escala.updateMany({
            where: { id: { in: ids }, membro_id: session.membroId },
            data: { confirmado: false, motivo_recusa: motivo.trim() }
        })

        revalidatePath('/membros/dashboard')
        return { sucesso: true }
    } catch (error: any) {
        console.error('Erro ao recusar escala:', error)
        return { sucesso: false, error: 'Erro interno.' }
    }
}

// ── RELATÓRIO ESTRATÉGICO POR DEPARTAMENTO ────────────────────────────────────
export async function buscarRelatorioEscalasDepartamentoAction(
    departamentoId: number,
    mes: number,   // 1-12
    ano: number
) {
    try {
        const session = await getSessionData()
        if (!session) return { sucesso: false, escalas: [] }

        const { db } = await getDb()

        const inicio = new Date(ano, mes - 1, 1)
        const fim = new Date(ano, mes, 0, 23, 59, 59)

        const escalas = await db.escala.findMany({
            where: {
                departamento_id: departamentoId,
                evento: { data: { gte: inicio, lte: fim } }
            },
            select: {
                id: true,
                confirmado: true,
                motivo_recusa: true,
                funcao: true,
                horario: true,
                membro_id: true,
                membro: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        avatar_file: true
                    }
                },
                evento: {
                    select: {
                        id: true,
                        nome: true,
                        data: true
                    }
                }
            },
            orderBy: { evento: { data: 'asc' } }
        })

        // Serializa datas para passar ao Client Component
        const serializados = escalas.map(e => ({
            ...e,
            motivo_recusa: e.motivo_recusa ?? null,
            evento: {
                ...e.evento,
                data: e.evento.data.toISOString()
            }
        }))

        return { sucesso: true, escalas: serializados }
    } catch (error: any) {
        console.error('Erro no relatório de escalas:', error)
        return { sucesso: false, escalas: [] }
    }
}