"use client"
import { useState, useRef, useMemo } from 'react'
import {
    atualizarDepartamento,
    adicionarFuncaoAoDepto,
    removerFuncaoDoDepto,
    vincularMembroDepartamento,
    removerMembroDepartamento
} from '@/actions/admin-actions'
import {
    Users, Settings, FileText, X, Search, Plus, Trash2,
    Check, ShieldCheck, UserPlus, Briefcase, Loader2, AlignLeft
} from 'lucide-react'

export default function PainelGerenciarDepto({ depto, membrosDisponiveis, onClose }: any) {
    const [aba, setAba] = useState<'equipe' | 'funcoes' | 'dados'>('dados');
    const [loading, setLoading] = useState(false);

    const formFuncaoRef = useRef<HTMLFormElement>(null);
    const formEquipeRef = useRef<HTMLFormElement>(null);

    // ========================================================================
    // PESQUISA INTELIGENTE: EQUIPA
    // ========================================================================
    const [buscaEquipe, setBuscaEquipe] = useState("");
    const [membroEquipeSelecionado, setMembroEquipeSelecionado] = useState<any>(null);

    const membrosEquipeFiltrados = useMemo(() => {
        if (buscaEquipe.length < 2) return [];
        return membrosDisponiveis.filter((m: any) =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(buscaEquipe.toLowerCase())
        ).slice(0, 5);
    }, [buscaEquipe, membrosDisponiveis]);

    // ========================================================================
    // PESQUISA INTELIGENTE: LÍDER DO SETOR
    // ========================================================================
    const [buscaLider, setBuscaLider] = useState("");
    const liderAtualInfo = membrosDisponiveis.find((m: any) => m.id === depto.lider_id);
    const [liderSelecionado, setLiderSelecionado] = useState<any>(liderAtualInfo || null);

    const membrosLiderFiltrados = useMemo(() => {
        if (buscaLider.length < 2) return [];
        return membrosDisponiveis.filter((m: any) =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(buscaLider.toLowerCase())
        ).slice(0, 5);
    }, [buscaLider, membrosDisponiveis]);

    // ========================================================================
    // LÓGICA DE AGRUPAMENTO DE MEMBROS
    // ========================================================================
    const integrantesAgrupadosMap = new Map<number, any>();

    depto.integrantes?.forEach((item: any) => {
        const membroId = item.membro_id;
        if (!integrantesAgrupadosMap.has(membroId)) {
            integrantesAgrupadosMap.set(membroId, {
                membro: item.membro,
                atribuicoes: []
            });
        }
        integrantesAgrupadosMap.get(membroId).atribuicoes.push({
            id: item.id,
            nome: item.funcao
        });
    });

    const listaIntegrantesAgrupados = Array.from(integrantesAgrupadosMap.values());

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop com desfoque refinado */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            {/* Painel Lateral */}
            <div className="relative w-full max-w-2xl bg-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[2.5rem] overflow-hidden">

                {/* HEADER FIXO E ELEGANTE */}
                <header className="px-10 pt-10 pb-0 border-b border-soft bg-bg2 shrink-0 relative z-30">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="flex items-center gap-2 text-figueira font-black text-[9px] uppercase tracking-[0.3em] mb-2">
                                <Briefcase size={12} /> Gestão Setorial
                            </span>
                            <h2 className="text-3xl font-black italic uppercase text-fg leading-none tracking-tighter">{depto.nome}</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-bg border border-soft text-muted hover:text-fg hover:border-figueira/50 transition-all shadow-sm active:scale-90">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex gap-8">
                        <button onClick={() => setAba('dados')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${aba === 'dados' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <Settings size={14} className={aba === 'dados' ? 'text-figueira' : ''} /> Definições
                        </button>
                        <button onClick={() => setAba('equipe')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${aba === 'equipe' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <Users size={14} className={aba === 'equipe' ? 'text-figueira' : ''} /> Equipa
                        </button>
                        <button onClick={() => setAba('funcoes')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${aba === 'funcoes' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <ShieldCheck size={14} className={aba === 'funcoes' ? 'text-figueira' : ''} /> Cargos
                        </button>

                    </div>
                </header>

                {/* CONTEÚDO SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-bg relative z-20">

                    {/* ===================================================== */}
                    {/* ABA: EQUIPE (VÍNCULO AGRUPADO) */}
                    {/* ===================================================== */}
                    {aba === 'equipe' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">

                            {/* FORMULÁRIO DE ADIÇÃO (CLEAN) */}
                            <form
                                ref={formEquipeRef}
                                action={async (fd) => {
                                    if (!membroEquipeSelecionado) return alert("Selecione um membro.");
                                    setLoading(true);
                                    const res = await vincularMembroDepartamento(fd);
                                    if (res?.ok) {
                                        formEquipeRef.current?.reset();
                                        setMembroEquipeSelecionado(null);
                                        setBuscaEquipe("");
                                    } else if (res?.error) {
                                        alert(res.error);
                                    }
                                    setLoading(false);
                                }}
                                className="bg-bg2 p-8 rounded-[2.5rem] border border-soft shadow-sm space-y-6 relative z-50"
                            >
                                <div className="flex items-center gap-3 border-b border-soft pb-4 mb-2">
                                    <div className="bg-figueira/10 p-2 rounded-xl text-figueira"><UserPlus size={16} /></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-fg">Adicionar à Equipa</h3>
                                </div>

                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <input type="hidden" name="membro_id" value={membroEquipeSelecionado?.id || ""} />

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* PESQUISA DE MEMBRO */}
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[9px] font-black uppercase text-muted ml-2">Pessoa</label>

                                        {membroEquipeSelecionado ? (
                                            <div className="flex items-center justify-between bg-bg border border-figueira px-4 py-3.5 rounded-2xl shadow-inner">
                                                <span className="text-xs font-bold text-fg uppercase">{membroEquipeSelecionado.first_name} {membroEquipeSelecionado.last_name}</span>
                                                <button type="button" onClick={() => setMembroEquipeSelecionado(null)} className="text-muted hover:text-red-500 transition-colors"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                                <input
                                                    type="text"
                                                    placeholder="Procurar membro..."
                                                    value={buscaEquipe}
                                                    onChange={(e) => setBuscaEquipe(e.target.value)}
                                                    className="w-full bg-bg border border-soft pl-10 pr-4 py-3.5 rounded-2xl text-xs font-bold focus:border-figueira outline-none transition-all shadow-sm"
                                                />
                                                {/* RESULTADOS DA PESQUISA */}
                                                {membrosEquipeFiltrados.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden z-[100]">
                                                        {membrosEquipeFiltrados.map((m: any) => (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => { setMembroEquipeSelecionado(m); setBuscaEquipe(""); }}
                                                                className="px-4 py-3 hover:bg-soft cursor-pointer text-[10px] font-black uppercase tracking-widest border-b border-soft last:border-0 transition-colors"
                                                            >
                                                                {m.first_name} {m.last_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* SELEÇÃO DE FUNÇÃO */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-muted ml-2">Atribuição / Cargo</label>
                                        <select name="funcao" required className="w-full bg-bg border border-soft px-4 py-3.5 rounded-2xl text-xs font-bold focus:border-figueira outline-none shadow-sm appearance-none">
                                            <option value="">Selecionar...</option>
                                            {depto.funcoes?.map((f: any) => (
                                                <option key={f.id} value={f.nome}>{f.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button disabled={loading || !membroEquipeSelecionado} className="w-full bg-fg text-bg py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Vincular ao Departamento
                                </button>
                            </form>

                            {/* LISTA DE INTEGRANTES */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                                    <Users size={12} /> Integrantes Cadastrados ({listaIntegrantesAgrupados.length})
                                </h3>

                                <div className="grid gap-3">
                                    {listaIntegrantesAgrupados.map((grupo: any) => (
                                        <div key={grupo.membro.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[2rem] transition-all border ${grupo.membro.id === depto.lider_id ? 'border-figueira/40 bg-figueira/5 shadow-sm' : 'bg-bg2 border-soft hover:border-soft/80'}`}>

                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-bg border border-soft flex items-center justify-center text-[10px] font-black text-figueira shadow-sm shrink-0">
                                                    {grupo.membro.first_name[0]}{grupo.membro.last_name[0]}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-black uppercase text-fg truncate flex items-center gap-2">
                                                        {grupo.membro.first_name} {grupo.membro.last_name}
                                                        {grupo.membro.id === depto.lider_id && <span className="shrink-0 text-[7px] bg-figueira text-white px-2 py-0.5 rounded-md font-black uppercase tracking-widest">Líder</span>}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{grupo.atribuicoes.length} função(ões)</p>
                                                </div>
                                            </div>

                                            {/* TAGS DE FUNÇÃO */}
                                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                                {grupo.atribuicoes.map((atrib: any) => (
                                                    <div key={atrib.id} className="group/atrib flex items-center gap-2 bg-bg border border-soft px-3 py-1.5 rounded-xl hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer shadow-sm" onClick={() => confirm(`Remover a função ${atrib.nome}?`) && removerMembroDepartamento(atrib.id)}>
                                                        <span className="text-[9px] font-bold text-fg uppercase tracking-wide group-hover/atrib:text-red-700">{atrib.nome}</span>
                                                        <X size={10} className="text-muted group-hover/atrib:text-red-500 transition-colors" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {depto.integrantes?.length === 0 && (
                                        <div className="p-12 text-center bg-bg2 border-2 border-dashed border-soft rounded-[3rem]">
                                            <Users size={32} className="text-muted/30 mx-auto mb-3" />
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">A equipa está vazia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* ABA: FUNÇÕES (CARGOS) */}
                    {/* ===================================================== */}
                    {aba === 'funcoes' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <form
                                ref={formFuncaoRef}
                                action={async (fd) => {
                                    setLoading(true);
                                    await adicionarFuncaoAoDepto(fd);
                                    formFuncaoRef.current?.reset();
                                    setLoading(false);
                                }}
                                className="bg-bg2 p-6 rounded-[2.5rem] border border-soft shadow-sm flex flex-col sm:flex-row gap-3"
                            >
                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <div className="relative flex-1">
                                    <ShieldCheck size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                    <input name="nome" placeholder="Nome do novo cargo (ex: Tecladista)" required className="w-full bg-bg border border-soft pl-12 pr-6 py-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira shadow-inner transition-all" />
                                </div>
                                <button disabled={loading} className="bg-figueira text-white px-8 py-4 sm:py-0 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-figueira/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar Cargo
                                </button>
                            </form>

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest">Cargos Habilitados</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {depto.funcoes?.map((f: any) => (
                                        <div key={f.id} className="group flex justify-between items-center p-5 bg-bg2 border border-soft rounded-[2rem] hover:border-figueira/40 transition-all shadow-sm">
                                            <span className="text-xs font-black uppercase text-fg tracking-widest flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-figueira block"></span> {f.nome}
                                            </span>
                                            <button
                                                onClick={() => confirm("Excluir esta função permanentemente?") && removerFuncaoDoDepto(f.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg border border-soft hover:bg-red-50 hover:border-red-200 text-muted hover:text-red-500 transition-all shadow-sm"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {depto.funcoes?.length === 0 && (
                                        <p className="col-span-full text-[10px] text-center text-muted py-8 font-bold uppercase tracking-widest italic">Nenhum cargo registado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* ABA: DADOS DO DEPARTAMENTO */}
                    {/* ===================================================== */}
                    {aba === 'dados' && (
                        <form action={async (formData) => {
                            setLoading(true);
                            const res = await atualizarDepartamento(formData);
                            setLoading(false);
                            if (res?.ok) alert("Informações atualizadas com sucesso!");
                        }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 relative z-10">

                            <div className="bg-bg2 p-8 md:p-10 rounded-[3rem] border border-soft shadow-sm space-y-6">
                                <input type="hidden" name="id" value={depto.id} />

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">Nome Oficial</label>
                                    <input name="nome" defaultValue={depto.nome} required className="w-full bg-bg border border-soft p-5 rounded-3xl text-sm font-bold focus:border-figueira outline-none shadow-sm transition-all" />
                                </div>

                                <div className="space-y-1.5 relative">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">Responsável (Líder)</label>
                                    <input type="hidden" name="lider_id" value={liderSelecionado?.id || ""} />

                                    {liderSelecionado ? (
                                        <div className="flex items-center justify-between bg-bg border border-figueira p-5 rounded-3xl shadow-inner transition-all">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck size={16} className="text-figueira" />
                                                <span className="text-xs font-black text-fg uppercase tracking-widest">{liderSelecionado.first_name} {liderSelecionado.last_name}</span>
                                            </div>
                                            <button type="button" onClick={() => setLiderSelecionado(null)} className="bg-soft/50 hover:bg-red-100 p-2 rounded-xl text-muted hover:text-red-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                            <input
                                                type="text"
                                                placeholder="Procurar novo líder..."
                                                value={buscaLider}
                                                onChange={(e) => setBuscaLider(e.target.value)}
                                                className="w-full bg-bg border border-soft pl-12 pr-5 py-5 rounded-3xl text-sm font-bold focus:border-figueira outline-none shadow-sm transition-all"
                                            />
                                            {membrosLiderFiltrados.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden z-[100]">
                                                    {membrosLiderFiltrados.map((m: any) => (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => { setLiderSelecionado(m); setBuscaLider(""); }}
                                                            className="px-5 py-4 hover:bg-soft cursor-pointer text-[10px] font-black uppercase tracking-widest border-b border-soft last:border-0 transition-colors"
                                                        >
                                                            {m.first_name} {m.last_name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2">
                                        <AlignLeft size={10} /> Descrição / Notas
                                    </label>
                                    <textarea name="descricao" defaultValue={depto.descricao} rows={4} className="w-full bg-bg border border-soft p-5 rounded-3xl text-xs font-bold focus:border-figueira outline-none resize-none shadow-sm leading-relaxed" />
                                </div>
                            </div>

                            <button disabled={loading} className="w-full bg-fg text-bg py-5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {loading ? "A Guardar..." : "Guardar Alterações"}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    )
}