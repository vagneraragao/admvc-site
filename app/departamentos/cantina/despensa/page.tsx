import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, HeartHandshake } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'
import DespensaManager from '@/components/cantina/DespensaManager'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AdminDespensaPage() {
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: { ministerios: { include: { departamento: true } } }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = session.role === 'ADMIN';
    const isFinance = session.role === 'FINANCE';

    const isEquipaSocial = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('social') || nomeDepto.includes('despensa') || nomeDepto.includes('assistência');
    });

    if (!isAdmin && !isFinance && !isEquipaSocial) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa de Ação Social.');
    }

    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories()
    ]);

    const categoriasAlvo = categories.filter((c: any) => {
        const n = c.name.toLowerCase();
        return n.includes('despensa') || n.includes('assistencia') || n.includes('assistência');
    });
    const categoriasAlvoIds = categoriasAlvo.map((c: any) => c.id);

    const itensDespensa = items.filter((item: any) => categoriasAlvoIds.includes(item.category_id));

    const produtosProcessados = itensDespensa.map((item: any) => {
        const variantePrincipal = item.variants[0];
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
        const categoriaNome = categoriasAlvo.find((c: any) => c.id === item.category_id)?.name || 'Outro';

        return {
            id: item.id,
            nome: item.item_name,
            categoria: categoriaNome,
            stock: stockInfo?.in_stock || 0,
            imagem: item.image_url || null,
            varianteId: variantePrincipal?.variant_id
        };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">
            {/* BREADCRUMB PADRONIZADO E INTELIGENTE */}
            <Breadcrumb items={[
                {
                    label: (isAdmin || isFinance) ? "Painel Admin" : "Dashboard",
                    href: (isAdmin || isFinance) ? "/admin/dashboard" : "/membros/dashboard",
                    isBackIcon: true
                },
                {
                    label: "Ministérios",
                    hideOnMobile: true
                },
                {
                    label: "Ação Social & Despensa"
                }
            ]} />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <HeartHandshake size={14} /> Controlo de Donativos e Insumos
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Despensa & <span className="text-muted/20">Apoio.</span>
                    </h1>
                </div>
            </header>

            <DespensaManager produtos={produtosProcessados} categorias={categoriasAlvo} />
        </main>
    )
}