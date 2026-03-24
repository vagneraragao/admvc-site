import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import VisualizarMembroClient from "@/components/membros/VisualizarMembroClient";

export default async function VisualizarMembroPage({
    params
}: {
    params: Promise<{ id: string }> | { id: string }
}) {
    // Tratamento compatível com Next.js 14 e 15 (onde params pode ser Promise)
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
        return notFound();
    }

    const membro = await prisma.membro.findUnique({
        where: { id: id },
        include: {
            familia: true,
            escolaridade: true,
            ministerios: {
                include: {
                    departamento: true
                }
            },
            grupos: true,
            cargos: true
        }
    });

    if (!membro) {
        return notFound();
    }

    return (
        <div className="bg-bg min-h-screen pb-20">
            <VisualizarMembroClient membro={membro} />
        </div>
    );
}