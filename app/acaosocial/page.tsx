import { getDb } from '@/lib/db'
import { getSessionData, isAdmin as isAdminCheck } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, HeartHandshake } from 'lucide-react'
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'
import DespensaManager from '@/components/cantina/DespensaManager'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AdminDespensaPage() {
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
            <header className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Despensa</h1>
                <p className="text-xs text-muted">Controlo de donativos e insumos.</p>
            </header>

            <DespensaManager produtos={produtosProcessados} categorias={categoriasAlvo} />
        </main>
    )
}