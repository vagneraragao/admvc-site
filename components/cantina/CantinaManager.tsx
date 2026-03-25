'use client'

import { useState } from 'react'
import { Search, Loader2, Check, X, Minus, Plus, Package, AlertCircle, Star, HeartHandshake, Eye, EyeOff } from 'lucide-react'
import { atualizarStockLoyverseAction, atualizarPropriedadesItemLoyverse } from '@/actions/despensa-actions'
import ModalEditarItem from './ModalEditarItem'

export default function CantinaManager({ produtos, categorias }: { produtos: any[], categorias: any[] }) {
    const [busca, setBusca] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState<'TODOS' | 'DESTAQUES' | 'ESGOTADOS' | 'DESPENSA' | 'ASSISTENCIA' | 'OCULTOS'>('TODOS');

    const produtosFiltrados = produtos.filter(p => {
        const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
        let matchFiltro = true;
        if (filtroAtivo === 'ESGOTADOS') matchFiltro = p.stock <= 0;
        if (filtroAtivo === 'DESTAQUES') matchFiltro = p.isDestaque;
        if (filtroAtivo === 'DESPENSA') matchFiltro = p.categoria.toLowerCase().includes('despensa');
        if (filtroAtivo === 'ASSISTENCIA') matchFiltro = p.categoria.toLowerCase().includes('assistência') || p.categoria.toLowerCase().includes('assistencia');
        if (filtroAtivo === 'OCULTOS') matchFiltro = !p.isAvailable; // AGORA VERIFICA SE NÃO ESTÁ DISPONÍVEL
        return matchBusca && matchFiltro;
    });

    const esgotadosCount = produtos.filter(p => p.stock <= 0).length;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm">
                    <div className="p-4 bg-figueira/10 text-figueira rounded-2xl"><Package size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total de Produtos</p>
                        <p className="text-3xl font-black italic tracking-tighter text-fg">{produtos.length}</p>
                    </div>
                </div>

                <div className={`border p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm transition-colors ${esgotadosCount > 0 ? 'bg-red-50 border-red-100' : 'bg-bg2 border-soft'}`}>
                    <div className={`p-4 rounded-2xl ${esgotadosCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {esgotadosCount > 0 ? <AlertCircle size={24} /> : <Check size={24} />}
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${esgotadosCount > 0 ? 'text-red-500' : 'text-muted'}`}>Ruptura de Stock</p>
                        <p className={`text-3xl font-black italic tracking-tighter ${esgotadosCount > 0 ? 'text-red-600' : 'text-fg'}`}>{esgotadosCount}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center bg-bg2 border border-soft p-4 rounded-3xl shadow-sm relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input type="text" placeholder="Pesquisar produto na cantina..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-fg outline-none focus:border-figueira transition-colors" />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFiltroAtivo('TODOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroAtivo === 'TODOS' ? 'bg-fg text-bg shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-fg'}`}>Todos</button>
                    <button onClick={() => setFiltroAtivo('DESTAQUES')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filtroAtivo === 'DESTAQUES' ? 'bg-yellow-500 text-white shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-yellow-500'}`}><Star size={12} /> Destaques</button>
                    <button onClick={() => setFiltroAtivo('ESGOTADOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filtroAtivo === 'ESGOTADOS' ? 'bg-red-500 text-white shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-red-500'}`}><AlertCircle size={12} /> Esgotados</button>
                    <button onClick={() => setFiltroAtivo('DESPENSA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filtroAtivo === 'DESPENSA' ? 'bg-blue-500 text-white shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-blue-500'}`}><Package size={12} /> Despensa</button>
                    <button onClick={() => setFiltroAtivo('ASSISTENCIA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filtroAtivo === 'ASSISTENCIA' ? 'bg-orange-500 text-white shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-orange-500'}`}><HeartHandshake size={12} /> Assistência</button>
                    <button onClick={() => setFiltroAtivo('OCULTOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filtroAtivo === 'OCULTOS' ? 'bg-gray-700 text-white shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-gray-500'}`}><EyeOff size={12} /> Fora de Venda</button>
                </div>
            </div>

            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-soft/30 border-b border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                <th className="p-5 pl-8">Produto</th>
                                <th className="p-5">Categoria & Preço</th>
                                <th className="p-5 text-center">Configurações</th>
                                <th className="p-5 text-right pr-8 w-48">Gestão de Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft">
                            {produtosFiltrados.length > 0 ? (
                                produtosFiltrados.map(p => (
                                    <tr key={p.id} className={`transition-colors group ${!p.isAvailable ? 'bg-soft/30 opacity-70 hover:opacity-100' : 'hover:bg-soft/20'}`}>
                                        <td className="p-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                {/* IMAGEM MANTIDA! */}
                                                {p.imagem ? (
                                                    <img src={p.imagem} alt={p.nome} className="w-12 h-12 rounded-xl object-cover border border-soft shadow-sm shrink-0" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-soft flex items-center justify-center text-muted shrink-0">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-black uppercase text-sm text-fg flex items-center gap-2">
                                                        {p.nome}
                                                    </span>
                                                    {!p.isAvailable && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Oculto na Venda</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 space-y-1">
                                            <div className="bg-soft text-muted px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest inline-block">
                                                {p.categoria}
                                            </div>
                                            <div className="font-black text-xs text-fg">
                                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(p.preco)}
                                            </div>
                                        </td>

                                        <td className="p-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <ModalEditarItem item={p} categorias={categorias} />
                                                <BotaoToggleDestaque itemId={p.id} isDestaque={p.isDestaque} nomeLimpo={p.nome} nomeOriginal={p.nomeOriginal} />
                                                <BotaoToggleVisivel itemId={p.id} isAvailable={p.isAvailable} />
                                            </div>
                                        </td>

                                        <td className="p-5 pr-8">
                                            <AjustadorStock itemId={p.id} variantId={p.varianteId} stockAtual={p.stock} trackStock={p.trackStock} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-muted text-xs font-black uppercase tracking-widest">
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// COMPONENTES MINI PARA OS BOTÕES INDIVIDUAIS
// ============================================================================
function BotaoToggleDestaque({ itemId, isDestaque, nomeLimpo, nomeOriginal }: any) {
    const [loading, setLoading] = useState(false);
    const handleToggle = async () => {
        setLoading(true);
        const novoNome = isDestaque ? nomeLimpo : `-${nomeLimpo}`;
        // Enviamos o nome novo, os outros undefined não alteram o que já está!
        const res = await atualizarPropriedadesItemLoyverse(itemId, novoNome, undefined, undefined);
        if (res.error) alert(res.error);
        setLoading(false);
    }
    return (
        <button onClick={handleToggle} disabled={loading} className={`p-2.5 rounded-xl border transition-all ${isDestaque ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shadow-sm' : 'bg-bg text-muted border-soft hover:text-yellow-500 hover:border-yellow-500/50'}`} title={isDestaque ? 'Remover dos Destaques' : 'Adicionar aos Destaques'}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} className={isDestaque ? "fill-yellow-600" : ""} />}
        </button>
    )
}

function BotaoToggleVisivel({ itemId, isAvailable }: any) {
    const [loading, setLoading] = useState(false);
    const handleToggle = async () => {
        setLoading(true);
        // O nome não vai ser mexido na nossa Action nova, por isso vai undefined
        const res = await atualizarPropriedadesItemLoyverse(itemId, undefined, !isAvailable, undefined);
        if (res.error) alert(res.error);
        setLoading(false);
    }
    return (
        <button onClick={handleToggle} disabled={loading} className={`p-2.5 rounded-xl border transition-all ${isAvailable ? 'bg-green-500/10 text-green-600 border-green-500/20 shadow-sm' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-sm'}`} title={isAvailable ? 'À Venda na Cantina (Ocultar)' : 'Fora de Venda (Ativar)'}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isAvailable ? <Eye size={16} /> : <EyeOff size={16} />)}
        </button>
    )
}

// ============================================================================
// COMPONENTE DE AJUSTE DE STOCK INLINE
// ============================================================================
function AjustadorStock({ itemId, variantId, stockAtual, trackStock }: any) {
    const [valor, setValor] = useState(Math.floor(stockAtual));
    const [isSaving, setIsSaving] = useState(false);

    const foiAlterado = valor !== Math.floor(stockAtual);

    const handleAtivarControlo = async () => {
        setIsSaving(true);
        const res = await atualizarPropriedadesItemLoyverse(itemId, undefined, undefined, true);
        if (res.error) alert(res.error);
        setIsSaving(false);
    }

    if (!trackStock) {
        return (
            <div className="flex justify-end">
                <button onClick={handleAtivarControlo} disabled={isSaving} className="text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-500 p-2.5 rounded-xl flex items-center gap-1.5 hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />} Ativar Controlo
                </button>
            </div>
        )
    }

    const handleSave = async () => {
        setIsSaving(true);
        const res = await atualizarStockLoyverseAction(variantId, valor);
        if (res.error) {
            alert(res.error);
            setValor(Math.floor(stockAtual));
        }
        setIsSaving(false);
    };

    return (
        <div className="flex items-center justify-end gap-2">
            <div className="flex items-center bg-bg border border-soft rounded-xl overflow-hidden shadow-sm">
                <button type="button" onClick={() => setValor(v => Math.max(0, v - 1))} className="p-2.5 text-muted hover:text-fg hover:bg-soft transition-colors active:bg-soft/50" disabled={isSaving}>
                    <Minus size={14} />
                </button>
                <input type="number" value={valor} onChange={(e) => setValor(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 text-center text-xs font-black text-fg outline-none bg-transparent appearance-none" disabled={isSaving} />
                <button type="button" onClick={() => setValor(v => v + 1)} className="p-2.5 text-muted hover:text-fg hover:bg-soft transition-colors active:bg-soft/50" disabled={isSaving}>
                    <Plus size={14} />
                </button>
            </div>

            {foiAlterado && !isSaving && (
                <div className="flex animate-in fade-in slide-in-from-right-2">
                    <button onClick={handleSave} className="p-2.5 text-green-500 hover:bg-green-50 rounded-xl transition-colors" title="Guardar no Loyverse"><Check size={16} strokeWidth={3} /></button>
                    <button onClick={() => setValor(Math.floor(stockAtual))} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Cancelar"><X size={16} strokeWidth={3} /></button>
                </div>
            )}

            {isSaving && (
                <div className="p-2.5">
                    <Loader2 size={16} className="animate-spin text-figueira" />
                </div>
            )}
        </div>
    )
}