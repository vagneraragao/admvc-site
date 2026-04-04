//app/cantina/dashboard/page.tsx

import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { getSessionData, isAdmin as isAdminCheck } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Store, Settings, ExternalLink, MonitorPlay, Smartphone, Coffee, AlertTriangle } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories, getLoyverseTokenForTenant } from '@/lib/loyverse-api'
import CantinaManager from '@/components/cantina/CantinaManager'
import Breadcrumb from '@/components/ui/Breadcrumb'
export const dynamic = 'force-dynamic'

export default async function GestaoCantinaPage() {
    const db = await getDb()
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    const membroLogado = await db.membro.findUnique({
        where: { id: session.membroId },
        include: { ministerios: { include: { departamento: true } } }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = isAdminCheck(session.role);
    const isFinance = session.role === 'FINANCE';

    const isEquipaCantina = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('cantina');
    });

    // Se não tiver permissão, volta para a dashboard
    if (!isAdmin && !isFinance && !isEquipaCantina) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa da Cantina.');
    }

    const tenantId = await getTenantIdFromHeaders();
    const token = await getLoyverseTokenForTenant(tenantId);

    if (!token) {
        return (
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">
                <div className="bg-orange-50 border border-orange-200 p-8 rounded-3xl text-center space-y-2">
                    <AlertTriangle className="mx-auto text-orange-500" size={32} />
                    <h2 className="text-lg font-black uppercase text-orange-700">Loyverse nao configurado</h2>
                    <p className="text-sm text-orange-600">Configure o token Loyverse nas definicoes do tenant para utilizar esta funcionalidade.</p>
                </div>
            </main>
        );
    }

    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(token),
        getLoyverseInventory(token),
        getLoyverseCategories(token)
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

            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Cantina</h1>
                    <p className="text-xs text-muted">Gestao de produtos e stock.</p>
                </div>

                {/* Badge de Status do Loyverse */}
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Loyverse Sincronizado
                </div>
            </header>

            {/* --- ACESSOS RÁPIDOS (compactos) --- */}
            <section className="flex flex-wrap gap-2">
                <Link href="/departamentos/cantina/menu" target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-bg2 border border-soft rounded-2xl hover:border-figueira/50 transition-all text-[9px] font-black uppercase tracking-widest text-fg">
                    <Smartphone size={14} className="text-figueira" /> Menu Digital
                </Link>
                <Link href="/departamentos/cantina/tv" target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-bg2 border border-soft rounded-2xl hover:border-blue-500/50 transition-all text-[9px] font-black uppercase tracking-widest text-fg">
                    <MonitorPlay size={14} className="text-blue-500" /> Ecra TV
                </Link>
                <a href="https://r.loyverse.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-bg2 border border-soft rounded-2xl hover:border-emerald-500/50 transition-all text-[9px] font-black uppercase tracking-widest text-fg">
                    <Settings size={14} className="text-emerald-500" /> Loyverse <ExternalLink size={10} className="text-muted" />
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