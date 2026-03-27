//app/cantina/dashboard/page.tsx

import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Store, Settings, ExternalLink, MonitorPlay, Smartphone, Coffee } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'
import CantinaManager from '@/components/cantina/CantinaManager'
import Breadcrumb from '@/components/ui/Breadcrumb'
export const dynamic = 'force-dynamic'

export default async function GestaoCantinaPage() {
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: { ministerios: { include: { departamento: true } } }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = session.role === 'ADMIN';
    const isFinance = session.role === 'FINANCE';

    const isEquipaCantina = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('cantina');
    });

    // Se não tiver permissão, volta para a dashboard
    if (!isAdmin && !isFinance && !isEquipaCantina) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa da Cantina.');
    }

    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories()
    ]);

    const produtosProcessados = items.map((item: any) => {
        const variantePrincipal = item.variants?.[0] || {};
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
        const stock = stockInfo?.in_stock || 0;

        let nomeOriginal = item.item_name.trim();
        let isDestaque = nomeOriginal.startsWith('-');
        let nomeLimpo = isDestaque ? nomeOriginal.replace(/^-+/, '').trim() : nomeOriginal;

        const categoriaObj = categories.find((c: any) => c.id === item.category_id);
        const categoriaNome = categoriaObj?.name || 'Outra';

        const precoReal = variantePrincipal?.default_price ?? variantePrincipal?.stores?.[0]?.price ?? 0;
        const isAvailable = variantePrincipal?.stores?.[0]?.available_for_sale ?? true;

        return {
            id: item.id,
            nome: nomeLimpo,
            nomeOriginal: nomeOriginal,
            isDestaque: isDestaque,
            categoria: categoriaNome,
            preco: precoReal,
            categoriaId: item.category_id,
            imagem: item.image_url || null,
            cor: item.color || '#4b5563',
            stock: stock,
            varianteId: variantePrincipal?.variant_id,
            isHidden: item.is_hidden || false,
            trackStock: item.track_stock || false,
            isAvailable: isAvailable
        };
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">

{/* BREADCRUMB PADRONIZADO E INTELIGENTE */}
            <Breadcrumb items={[
                { 
                    label: (isAdmin || isFinance) ? "Painel Admin" : "Dashboard", 
                    href: (isAdmin || isFinance) ? "/admin/dashboard" : "/membros/dashboard", 
                    isBackIcon: true 
                },
                { 
                    label: "Logística / Cantina", 
                    hideOnMobile: true 
                },
                { 
                    label: "Gestão da Cantina" 
                }
            ]} />

            {/* --- CABEÇALHO --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-soft pb-6">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Store size={14} /> Módulo Operacional
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Gestão de <span className="text-muted/20">Cantina.</span>
                    </h1>
                </div>

                {/* Badge de Status do Loyverse */}
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Loyverse Sincronizado
                </div>
            </header>

            {/* --- ACESSOS RÁPIDOS (Menu, TV, Backoffice) --- */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* 1. Menu Público */}
                <Link href="/departamentos/cantina/menu" target="_blank" className="bg-bg2 border border-soft p-6 rounded-[2rem] hover:border-figueira hover:shadow-lg hover:shadow-figueira/10 transition-all group flex flex-col justify-between gap-4 h-full">
                    <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase text-fg">Menu Digital</h3>
                        <p className="text-[10px] font-bold text-muted mt-1 leading-relaxed">Ver o menu como os membros o veem nos seus telemóveis.</p>
                    </div>
                </Link>

                {/* 2. TV / Video Wall */}
                <Link href="/departamentos/cantina/tv" target="_blank" className="bg-bg2 border border-soft p-6 rounded-[2rem] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col justify-between gap-4 h-full">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MonitorPlay size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase text-fg">Ecrã TV (Video Wall)</h3>
                        <p className="text-[10px] font-bold text-muted mt-1 leading-relaxed">Abrir painel para o ecrã pendurado na zona da cantina.</p>
                    </div>
                </Link>

                {/* 3. Loyverse Backoffice */}
                <a href="https://r.loyverse.com/dashboard" target="_blank" rel="noopener noreferrer" className="bg-bg2 border border-soft p-6 rounded-[2rem] hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group flex flex-col justify-between gap-4 h-full">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase text-fg flex items-center gap-2">
                            Backoffice Loyverse <ExternalLink size={12} className="opacity-50" />
                        </h3>
                        <p className="text-[10px] font-bold text-muted mt-1 leading-relaxed">Aceder ao sistema central para gerir impressoras e caixas.</p>
                    </div>
                </a>

            </section>

            {/* --- GESTOR DE PRODUTOS --- */}
            <section className="space-y-6 pt-6 border-t border-soft">
                <div className="flex items-center gap-4">
                    <Coffee size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Stock e Produtos</h2>
                    <div className="h-[1px] flex-1 bg-soft"></div>
                </div>

                <CantinaManager produtos={produtosProcessados} categorias={categories} />
            </section>

        </main>
    )
}