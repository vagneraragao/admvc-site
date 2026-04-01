'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-utils'
import { type PlanoId, type Modulo, PLANOS, MODULOS } from '@/lib/planos'

export async function criarNovaIgreja(formData: FormData) {
    await requireRole(['ADMIN'])

    // 1. Dados da Igreja
    const nomeIgreja = formData.get('nomeIgreja') as string;
    const slug = formData.get('slug') as string; // Ex: 'assembleia-central'

    // 2. Dados do Primeiro Admin (Pastor/Líder)
    const adminNome = formData.get('adminNome') as string;
    const adminEmail = formData.get('adminEmail') as string;
    const adminPassword = formData.get('adminPassword') as string;

    try {
        // Validação básica
        if (!nomeIgreja || !slug || !adminEmail || !adminPassword) {
            return { error: 'Por favor, preencha todos os campos obrigatórios.' };
        }

        // Verifica se o slug ou o email já existem (agora usando o prisma base global)
        const emailExiste = await prisma.membro.findUnique({ where: { email: adminEmail } });
        if (emailExiste) return { error: 'Este e-mail já está em uso em outra conta.' };

        const slugExiste = await prisma.tenant.findUnique({ where: { slug } });
        if (slugExiste) return { error: 'Este identificador (slug) já está em uso.' };

        // Hash da senha do novo admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // 3. A MÁGICA: Transação para criar o Tenant e o Membro juntos
        const novaIgreja = await prisma.$transaction(async (tx) => {
            // A. Cria o Tenant (Igreja)
            const tenant = await tx.tenant.create({
                data: {
                    nome: nomeIgreja,
                    slug: slug.toLowerCase().replace(/\s+/g, '-'), // Garante que o slug é válido
                    plano: 'PRO', // Ou 'FREE', dependendo da sua regra de negócio
                }
            });

            // B. Cria o primeiro Membro como ADMIN vinculado a este novo Tenant
            await tx.membro.create({
                data: {
                    first_name: adminNome,
                    last_name: 'Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    phone_1: '000000000', // Valor padrão, ele pode alterar depois
                    role: 'ADMIN',
                    is_active: true,
                    tenant_id: tenant.id, // <- Vinculando o admin à nova igreja
                }
            });

            return tenant;
        });

        revalidatePath('/admin/dashboard'); // Atualiza a página do super admin
        return { success: true, message: `Igreja ${novaIgreja.nome} criada com sucesso!` };

    } catch (error) {
        console.error("Erro ao criar igreja:", error);
        return { error: 'Erro interno ao tentar criar a nova igreja.' };
    }
}


// Adicione isto no final de @/actions/super-admin-actions.ts

export async function atualizarIgreja(id: number, formData: FormData) {
    await requireRole(['ADMIN'])

    const nome = formData.get('nomeIgreja') as string;
    const slug = formData.get('slug') as string;
    const plano = formData.get('plano') as string || 'FREE';

    try {
        // Usamos o prisma global porque estamos a editar um Tenant
        const slugExiste = await prisma.tenant.findFirst({
            where: { slug, NOT: { id } }
        });

        if (slugExiste) return { error: 'Este identificador (slug) já está a ser usado por outra igreja.' };

        await prisma.tenant.update({
            where: { id },
            data: {
                nome,
                slug: slug.toLowerCase().replace(/\s+/g, '-'),
                plano
            }
        });

        revalidatePath('/super-admin/igrejas'); // Ajuste para a rota onde o painel vai ficar
        return { success: true, message: `Igreja atualizada com sucesso!` };

    } catch (error) {
        console.error("Erro ao atualizar igreja:", error);
        return { error: 'Erro interno ao tentar atualizar a igreja.' };
    }
}

// ── GESTÃO DE PLANOS E MÓDULOS ───────────────────────────────────────────────

export async function buscarIgrejaComModulos(igrejaId: number) {
    await requireRole(['ADMIN'])

    try {
        const igreja = await prisma.tenant.findUnique({
            where: { id: igrejaId },
            include: {
                _count: { select: { membros: true, congregacoes: true, departamentos: true } }
            }
        })

        if (!igreja) return { error: 'Igreja não encontrada.' }

        return { ok: true, data: igreja }
    } catch (error) {
        return { error: 'Erro ao buscar dados da igreja.' }
    }
}

export async function atualizarPlanoIgreja(igrejaId: number, plano: string) {
    await requireRole(['ADMIN'])

    try {
        if (!PLANOS[plano as PlanoId]) {
            return { error: 'Plano inválido.' }
        }

        await prisma.tenant.update({
            where: { id: igrejaId },
            data: { plano, modulos_custom: null } // Reset custom ao mudar de plano
        })

        revalidatePath('/super-admin/igrejas')
        revalidatePath(`/super-admin/igrejas/${igrejaId}/modulos`)
        return { ok: true }
    } catch (error) {
        return { error: 'Erro ao atualizar plano.' }
    }
}

export async function atualizarModulosCustom(igrejaId: number, modulos: string[]) {
    await requireRole(['ADMIN'])

    try {
        // Valida que todos os módulos são válidos
        const modulosValidos = Object.values(MODULOS) as string[]
        const invalidos = modulos.filter(m => !modulosValidos.includes(m))
        if (invalidos.length > 0) {
            return { error: `Módulos inválidos: ${invalidos.join(', ')}` }
        }

        await prisma.tenant.update({
            where: { id: igrejaId },
            data: { modulos_custom: modulos.length > 0 ? modulos : null }
        })

        revalidatePath('/super-admin/igrejas')
        revalidatePath(`/super-admin/igrejas/${igrejaId}/modulos`)
        return { ok: true }
    } catch (error) {
        return { error: 'Erro ao atualizar módulos.' }
    }
}