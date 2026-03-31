// app/admin/membros/visualizar/[id]/page.tsx (ou o caminho correto)
import { getTenantClient } from "@/lib/prisma"; // 🔄 Importamos o multitenant
import { headers } from "next/headers"; // 🔄 Importamos os headers
import { notFound, redirect } from "next/navigation";
import VisualizarMembroClient from "@/components/membros/VisualizarMembroClient";

export default async function VisualizarMembroPage({
    params
}: {
    params: Promise<{ id: string }> | { id: string }
}) {
    // 1. Tratamento de Params
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
        return notFound();
    }

    // 2. Multitenant: Identificar a Igreja
    const headersList = await headers();
    const tenantIdStr = headersList.get('x-tenant-id');

    if (!tenantIdStr) {
        return redirect('/admin/login?error=Igreja não identificada.');
    }

    const db = getTenantClient(Number(tenantIdStr));

    // 3. Busca Segura (Trocamos findUnique por findFirst)
    const membro = await db.membro.findFirst({
        where: { id: id },
        include: {
            familia: true,
            escolaridade: true,
            ministerios: {
                include: {
                    departamento: true,
                    funcoes: {
                        include: { funcao: true }
                    }
                }
            },
            grupos: true,
            cargos: true
        }
    });

    // Se o membro não existir OU for de outra igreja, o findFirst retorna null!
    if (!membro) {
        return notFound();
    }

    return (
        <div className="bg-bg min-h-screen pb-20">
            <VisualizarMembroClient membro={membro} />
        </div>
    );
}