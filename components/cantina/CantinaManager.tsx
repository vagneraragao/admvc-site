// components/cantina/CantinaManager.tsx
'use client'

import { useState } from 'react'
import { Search, Package, Star, AlertTriangle, Coffee, Filter, Settings } from 'lucide-react'

export default function CantinaManager({ produtos }: { produtos: any[] }) {
    const [busca, setBusca] = useState('');
    const [filtro, setFiltro] = useState('TODOS'); // TODOS, DESTAQUES, ESGOTADOS

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    // Filtragem de Dados
    const produtosFiltrados = produtos.filter(p => {
        const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());

        if (filtro === 'DESTAQUES') return matchBusca && p.isDestaque;
        if (filtro === 'ESGOTADOS') return matchBusca && p.stock <= 0;
        return matchBusca;
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    // KPIs (Estatísticas rápidas)
    const totalProdutos = produtos.length;
    const totalDestaques = produtos.filter(p => p.isDestaque).length;
    const totalEsgotados = produtos.filter(p => p.stock <= 0).length;

    return (
        <div className="space-y-8">

            {/* CARDS DE RESUMO (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm">
                    <div className="p-4 bg-fg text-bg rounded-2xl"><Package size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total de Produtos</p>
                        <p className="text-3xl font-black italic tracking-tighter text-fg">{totalProdutos}</p>
                    </div>
                </div>

                <div className="bg-bg2 border border-figueira/30 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5"><Star size={100} /></div>
                    <div className="p-4 bg-figueira/10 text-figueira rounded-2xl relative z-10"><Star size={24} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Em Destaque (TV)</p>
                        <p className="text-3xl font-black italic tracking-tighter text-fg">{totalDestaques}</p>
                    </div>
                </div>

                <div className={`bg-bg2 border ${totalEsgotados > 0 ? 'border-red-500/30' : 'border-soft'} p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm`}>
                    <div className={`p-4 rounded-2xl ${totalEsgotados > 0 ? 'bg-red-500/10 text-red-500' : 'bg-soft text-muted'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Stock Esgotado</p>
                        <p className={`text-3xl font-black italic tracking-tighter ${totalEsgotados > 0 ? 'text-red-500' : 'text-fg'}`}>{totalEsgotados}</p>
                    </div>
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-bg2 border border-soft p-4 rounded-3xl shadow-sm">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar produto pelo nome..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-fg outline-none focus:border-figueira transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    <Filter size={14} className="text-muted ml-2 shrink-0" />
                    {['TODOS', 'DESTAQUES', 'ESGOTADOS'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFiltro(f)}
                            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${filtro === f ? 'bg-figueira text-white shadow-md' : 'bg-bg text-muted border border-soft hover:bg-soft'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-soft/30 border-b border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                <th className="p-5 pl-8">Produto</th>
                                <th className="p-5">Preço</th>
                                <th className="p-5">Em Stock</th>
                                <th className="p-5">Status (TV)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft">
                            {produtosFiltrados.length > 0 ? (
                                produtosFiltrados.map(p => (
                                    <tr key={p.id} className="hover:bg-soft/20 transition-colors group">
                                        <td className="p-5 pl-8 flex items-center gap-4">
                                            {/* Foto ou Cor Placeholder */}
                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-soft bg-bg flex items-center justify-center relative">
                                                {p.imagem ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-50" style={{ backgroundColor: p.cor }}>
                                                        <Coffee size={20} className="text-white mix-blend-overlay" />
                                                    </div>
                                                )}
                                                {p.isDestaque && (
                                                    <div className="absolute top-0 right-0 bg-figueira text-white p-0.5 rounded-bl-lg">
                                                        <Star size={10} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase text-fg group-hover:text-figueira transition-colors">{p.nome}</h4>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5 opacity-50">ID: {p.id.split('-')[0]}...</p>
                                            </div>
                                        </td>

                                        <td className="p-5">
                                            <span className="text-sm font-black italic text-fg">{euro(p.preco)}</span>
                                        </td>

                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${p.stock > 10 ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                p.stock > 0 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {p.stock > 0 ? `${Math.floor(p.stock)} UN` : 'Esgotado'}
                                            </span>
                                        </td>

                                        <td className="p-5">
                                            <div className="flex flex-col gap-1">
                                                {p.isDestaque ? (
                                                    <span className="text-[9px] font-black text-figueira flex items-center gap-1 uppercase tracking-widest">
                                                        <Star size={12} fill="currentColor" /> Destaque
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-muted flex items-center gap-1 uppercase tracking-widest">
                                                        Comum
                                                    </span>
                                                )}

                                                {!p.isDestaque && (
                                                    <p className="text-[8px] text-muted italic font-medium">Adicione um hífen (-) no início do nome no Loyverse para destacar.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted">Nenhum produto encontrado.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DICA DE UTILIZAÇÃO */}
            <div className="bg-figueira/5 border border-figueira/20 p-6 rounded-[2rem] flex gap-4 items-start">
                <Settings size={20} className="text-figueira shrink-0 mt-1" />
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-figueira mb-1">Sincronização com o Loyverse</h4>
                    <p className="text-xs font-medium text-muted leading-relaxed">
                        Este painel é um espelho do seu <strong>Loyverse POS</strong>. Para alterar o preço de um produto, adicionar stock ou alterar a fotografia, utilize a aplicação do telemóvel ou o Backoffice web do Loyverse. O site e a TV da Cantina atualizarão os dados automaticamente num prazo máximo de 60 segundos.
                    </p>
                </div>
            </div>

        </div>
    )
}