// components/despensa/DespensaManager.tsx
'use client'

import { useState } from 'react'
import { Search, PackageOpen, Package, Plus, X, HeartHandshake, Loader2, Save } from 'lucide-react'
import { cadastrarItemLoyverse } from '@/app/admin/despensa/actions'

export default function DespensaManager({ produtos, categorias }: { produtos: any[], categorias: any[] }) {
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [loading, setLoading] = useState(false);

    const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
    const totalItens = produtos.reduce((acc, curr) => acc + curr.stock, 0);

    async function handleCadastrar(formData: FormData) {
        setLoading(true);
        const res = await cadastrarItemLoyverse(formData);
        setLoading(false);

        if (res.error) {
            alert(res.error);
        } else {
            setModalAberto(false);
        }
    }

    return (
        <div className="space-y-8">

            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm">
                    <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><Package size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Variedade de Produtos</p>
                        <p className="text-3xl font-black italic tracking-tighter text-fg">{produtos.length}</p>
                    </div>
                </div>

                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm">
                    <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl"><HeartHandshake size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total de Unidades em Stock</p>
                        <p className="text-3xl font-black italic tracking-tighter text-fg">{Math.floor(totalItens)}</p>
                    </div>
                </div>
            </div>

            {/* BARRA DE PESQUISA E BOTÃO DE CADASTRO */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-bg2 border border-soft p-4 rounded-3xl shadow-sm">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar donativo / insumo..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-fg outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <button
                    onClick={() => setModalAberto(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20 shrink-0"
                >
                    <Plus size={16} /> Cadastrar Novo Item
                </button>
            </div>

            {/* TABELA DE INVENTÁRIO */}
            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-soft/30 border-b border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                <th className="p-5 pl-8">Nome do Item</th>
                                <th className="p-5">Categoria</th>
                                <th className="p-5 text-right pr-8">Em Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft">
                            {produtosFiltrados.length > 0 ? (
                                produtosFiltrados.map(p => (
                                    <tr key={p.id} className="hover:bg-soft/20 transition-colors group">
                                        <td className="p-5 pl-8 font-black uppercase text-sm text-fg">
                                            {p.nome}
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-soft text-muted px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                                {p.categoria}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right pr-8">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border ${p.stock > 5 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                p.stock > 0 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {Math.floor(p.stock)} UN
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center text-muted text-xs font-black uppercase tracking-widest">
                                        Nenhum item encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CADASTRO */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg2 w-full max-w-lg border border-soft p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200">

                        <button onClick={() => setModalAberto(false)} className="absolute top-6 right-6 p-2 bg-soft text-muted rounded-full hover:bg-red-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                <PackageOpen size={24} className="text-blue-500" /> Cadastrar Item
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                Registe um novo mantimento na base de dados.
                            </p>
                        </div>

                        <form action={handleCadastrar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-4">Nome do Produto</label>
                                <input
                                    name="nome"
                                    required
                                    placeholder="Ex: Arroz Agulha 1Kg"
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-xs font-bold text-fg focus:border-blue-500 outline-none shadow-sm transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-4">Selecione a Categoria</label>
                                <select
                                    name="categoria_id"
                                    required
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-xs font-bold text-fg focus:border-blue-500 outline-none shadow-sm transition-all appearance-none cursor-pointer"
                                >
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-[10px] text-blue-700 font-bold uppercase tracking-widest leading-relaxed">
                                ℹ️ Nota: Para adicionar unidades (ex: Recebemos 50kg de Arroz), utilize a secção "Inventário" no Backoffice do Loyverse após cadastrar o item aqui.
                            </div>

                            <button disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {loading ? 'A Gravar...' : 'Salvar no Loyverse'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}