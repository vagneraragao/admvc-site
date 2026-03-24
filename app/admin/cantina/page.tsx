// app/admin/cantina/page.tsx
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Store, Settings, ExternalLink } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory } from '@/lib/loyverse-api'
import CantinaManager from '@/components/cantina/CantinaManager'

export const dynamic = 'force-dynamic'

export default async function AdminCantinaPage() {
    // ========================================================================
    // 1. SEGURANÇA E VERIFICAÇÃO DE ACESSO
    // ========================================================================
    const session = await getSessionData();
    if (!session) {
        redirect('/membros/login?error=Sessão expirada');
    }

    // Busca os departamentos a que o membro logado pertence
    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: {
            ministerios: {
                include: { departamento: true }
            }
        }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = session.role === 'ADMIN';
    const isFinance = session.role === 'FINANCE';

    // Verifica se faz parte da equipa da Cantina
    const isEquipaCantina = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('cantina');
    });

    // Bloqueia se não for Admin, Financeiro nem da Cantina
    if (!isAdmin && !isFinance && !isEquipaCantina) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa da Cantina.');
    }

    // ========================================================================
    // 2. BUSCA DADOS DO LOYVERSE
    // ========================================================================
    const [items, inventory] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory()
    ]);

    // ========================================================================
    // 3. PROCESSA OS DADOS (Junta o stock e verifica destaques)
    // ========================================================================
    const produtosProcessados = items.map((item: any) => {
        const variantePrincipal = item.variants[0];
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
        const stock = stockInfo?.in_stock || 0;

        let nomeOriginal = item.item_name.trim();
        let isDestaque = nomeOriginal.startsWith('-');
        let nomeLimpo = isDestaque ? nomeOriginal.replace(/^-+/, '').trim() : nomeOriginal;

        return {
            id: item.id,
            nome: nomeLimpo,
            nomeOriginal: nomeOriginal,
            isDestaque: isDestaque,
            preco: variantePrincipal?.price || 0,
            imagem: item.image_url || null,
            cor: item.color || '#4b5563',
            stock: stock,
            varianteId: variantePrincipal?.variant_id,
        };
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* NAVEGAÇÃO / BREADCRUMBS */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href={isAdmin || isFinance ? "/admin/dashboard" : "/membros/dashboard"} className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> {(isAdmin || isFinance) ? "Painel Admin" : "Voltar à Dashboard"}
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Gestão da Cantina</span>
            </nav>

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Store size={14} /> Loyverse POS Sync
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Gestão de <span className="text-muted/20">Cantina.</span>
                    </h1>
                </div>

                <div className="shrink-0 flex gap-3">
                    <a href="https://r.loyverse.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-bg2 border border-soft text-fg px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-figueira hover:text-figueira transition-all shadow-sm">
                        <Settings size={14} /> Backoffice Loyverse <ExternalLink size={10} className="ml-1 opacity-50" />
                    </a>
                </div>
            </header>

            {/* PAINEL INTERATIVO CLIENT-SIDE */}
            <CantinaManager produtos={produtosProcessados} />

        </main>
    )
}