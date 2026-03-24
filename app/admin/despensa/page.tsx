// app/admin/despensa/page.tsx
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, HeartHandshake, PackageOpen } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'
import DespensaManager from '@/components/despensa/DespensaManager'

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

    // Valida se faz parte da equipa de Ação Social / Despensa
    const isEquipaSocial = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('social') || nomeDepto.includes('despensa') || nomeDepto.includes('assistência');
    });

    if (!isAdmin && !isFinance && !isEquipaSocial) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa de Ação Social.');
    }

    // Busca os dados do Loyverse
    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories()
    ]);

    // 1. Encontra as categorias de Assistência e Despensa
    const categoriasAlvo = categories.filter((c: any) => {
        const n = c.name.toLowerCase();
        return n.includes('despensa') || n.includes('assistencia') || n.includes('assistência');
    });
    const categoriasAlvoIds = categoriasAlvo.map((c: any) => c.id);

    // 2. Filtra os Itens para mostrar SÓ os destas categorias
    const itensDespensa = items.filter((item: any) => categoriasAlvoIds.includes(item.category_id));

    // 3. Processa o Stock
    const produtosProcessados = itensDespensa.map((item: any) => {
        const variantePrincipal = item.variants[0];
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);

        // Encontra o nome da categoria para mostrar na tabela
        const categoriaNome = categoriasAlvo.find((c: any) => c.id === item.category_id)?.name || 'Outro';

        return {
            id: item.id,
            nome: item.item_name,
            categoria: categoriaNome,
            stock: stockInfo?.in_stock || 0,
            imagem: item.image_url || null,
        };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href={isAdmin || isFinance ? "/admin/dashboard" : "/membros/dashboard"} className="hover:text-blue-500 transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Voltar
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Ação Social & Despensa</span>
            </nav>

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

            {/* Passamos as categorias para poder escolhê-las no formulário de cadastro */}
            <DespensaManager produtos={produtosProcessados} categorias={categoriasAlvo} />

        </main>
    )
}