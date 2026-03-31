import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL

    // We need a pool for PrismaPg
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool as any)

    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// O teu cliente global base (com acesso a tudo)
const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// ============================================================================
// 🛡️ EXTENSÃO MULTITENANT
// ============================================================================

export const getTenantClient = (tenantId: number) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {

                    // Lista rigorosa de TODAS as tabelas operacionais (privadas)
                    const protectedModels = [
                        'Congregacao', 'Membro', 'Familia', 'Departamento',
                        'IntegranteDepartamento', 'Grupo', 'EncontroGrupo',
                        'Evento', 'Escala', 'FuncaoDepartamento', 'ObjetivoFinanceiro',
                        'LancamentoFinanceiro', 'Rifa', 'RifaNumero', 'PedidoSaldoCantina',
                        'Contribuicao', 'Visitante', 'AcompanhamentoVisitante',
                        'ProjetoObra', 'EtapaObra', 'AvisoMural', 'Agenda',
                        'Compromisso', 'RepertorioEvento'
                    ];

                    // Se a tabela NÃO for protegida (ex: Musica, Cargo, Tenant), executa normalmente
                    if (!protectedModels.includes(model)) {
                        return query(args);
                    }

                    const anyArgs = args as any;

                    // 1. Interceta Buscas e Contagens (Injeta WHERE tenant_id)
                    if (['findMany', 'findFirst', 'count', 'aggregate', 'updateMany', 'deleteMany'].includes(operation)) {
                        anyArgs.where = { ...anyArgs.where, tenant_id: tenantId };
                    }

                    // 2. Interceta Criações (Injeta o tenant_id no DATA)
                    if (['create', 'createMany'].includes(operation)) {
                        if (anyArgs.data) {
                            if (Array.isArray(anyArgs.data)) {
                                // Se for um array (createMany)
                                anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, tenant_id: tenantId }));
                            } else {
                                // Se for um objeto único (create)
                                anyArgs.data.tenant_id = tenantId;
                            }
                        }
                    }

                    // 3. Interceta Updates e Deletes singulares
                    if (['update', 'delete'].includes(operation)) {
                        anyArgs.where = { ...anyArgs.where, tenant_id: tenantId };
                    }

                    return query(anyArgs);
                },
            },
        },
    });
};