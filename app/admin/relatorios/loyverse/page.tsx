import { ShieldCheck, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getLoyverseData() {
    const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;
    const res = await fetch(`https://api.loyverse.com/v1.0/customers?limit=250`, {
        headers: { 'Authorization': `Bearer ${loyverseToken}` },
        next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.customers;
}

export default async function DiagnosticoLoyversePage() {
    const clientes = await getLoyverseData();

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-8 animate-in fade-in duration-700">
            {/* NAVEGAÇÃO */}
            <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira flex items-center gap-2">
                    <ArrowLeft size={14} /> Painel Admin
                </Link>
            </nav>

            <header className="flex justify-between items-end border-b border-soft pb-8">
                <div>
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                        <ShieldCheck size={14} /> Diagnóstico de Integração
                    </span>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-fg">
                        Clientes <span className="text-muted/20">Loyverse.</span>
                    </h1>
                </div>
                <div className="bg-bg2 border border-soft px-6 py-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Sincronizado</p>
                    <p className="text-2xl font-black italic text-figueira">{clientes?.length || 0}</p>
                </div>
            </header>

            {/* TABELA DE DADOS */}
            <section className="bg-bg2 border border-soft rounded-[3rem] overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-soft/30 border-b border-soft text-[10px] font-black uppercase tracking-widest text-muted">
                            <th className="px-8 py-6">Nome / Email</th>
                            <th className="px-8 py-6">ID Real (UUID) - Usar no Cadastro</th>
                            <th className="px-8 py-6">Código Antigo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft">
                        {clientes?.map((c: any) => (
                            <tr key={c.id} className="hover:bg-soft/10 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="text-xs font-black uppercase text-fg leading-tight">{c.name}</p>
                                    <p className="text-[10px] font-bold text-muted lowercase mt-0.5">{c.email || 'sem-email@loyverse.com'}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <code className="bg-bg border border-soft px-3 py-1.5 rounded-lg text-[10px] font-mono text-figueira select-all">
                                        {c.id}
                                    </code>
                                </td>
                                <td className="px-8 py-6 text-[10px] font-bold text-muted italic">
                                    {c.customer_code || '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!clientes && (
                    <div className="p-20 text-center space-y-4">
                        <RefreshCw className="mx-auto text-muted animate-spin" size={32} />
                        <p className="text-xs font-black uppercase text-muted tracking-widest">Erro ao conectar à API Loyverse. Verifica o Token.</p>
                    </div>
                )}
            </section>
        </main>
    );
}