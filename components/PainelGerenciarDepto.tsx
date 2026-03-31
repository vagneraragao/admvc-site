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
    Users, Settings, X, Search, Plus, Trash2, UserMinus, CalendarDays,
    Check, ShieldCheck, UserPlus, Briefcase, Loader2, AlignLeft, CheckCircle2
} from 'lucide-react'

import { alternarPermissaoEscala } from '@/actions/admin-actions'


// E adicione estas duas novas actions no topo:
import { removerFuncaoDoMembro, removerMembroTotal } from '@/actions/admin-actions'



export default function PainelGerenciarDepto({ depto, membrosDisponiveis, onClose }: any) {
    const [aba, setAba] = useState<'equipe' | 'dados' | 'funcoes'>('equipe');
    const [loading, setLoading] = useState(false);

    const formFuncaoRef = useRef<HTMLFormElement>(null);
    const formEquipeRef = useRef<HTMLFormElement>(null);

    // ========================================================================
    // ESTADOS: VÍNCULO MÚLTIPLO (ABA EQUIPA)
    // ========================================================================
    const [funcoesSelecionadas, setFuncoesSelecionadas] = useState<number[]>([]);
    const [buscaEquipe, setBuscaEquipe] = useState("");
    const [membroEquipeSelecionado, setMembroEquipeSelecionado] = useState<any>(null);

    const toggleFuncao = (id: number) => {
        setFuncoesSelecionadas(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const membrosEquipeFiltrados = useMemo(() => {
        if (buscaEquipe.length < 2) return [];
        return membrosDisponiveis.filter((m: any) =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(buscaEquipe.toLowerCase())
        ).slice(0, 5);
    }, [buscaEquipe, membrosDisponiveis]);

    // ========================================================================
    // ESTADOS: GESTÃO DE LÍDER (ABA DADOS)
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
    // LÓGICA DE AGRUPAMENTO
    // ========================================================================
    const integrantesAgrupadosMap = new Map<number, any>();

    depto.integrantes?.forEach((item: any) => {
        const membroId = item.membro_id;
        if (!integrantesAgrupadosMap.has(membroId)) {
            integrantesAgrupadosMap.set(membroId, {
                membro: item.membro,
                atribuicoes: [],
                pode_gerir_escalas: item.pode_gerir_escalas,
                integrante_id: item.id // 👈 GUARDAMOS O ID DO VÍNCULO AQUI
            });
        }

        const grupo = integrantesAgrupadosMap.get(membroId);

        if (item.funcoes && item.funcoes.length > 0) {
            item.funcoes.forEach((f: any) => {
                if (!grupo.atribuicoes.find((a: any) => a.id === f.id)) {
                    grupo.atribuicoes.push({ id: f.id, nome: f.funcao?.nome || 'Cargo Desconhecido' });
                }
            });
        } else if (item.funcao) {
            grupo.atribuicoes.push({ id: item.id, nome: item.funcao });
        }
    });

    const listaIntegrantesAgrupados = Array.from(integrantesAgrupadosMap.values());

    return (
        // 👇 AQUI MUDA DE JUSTIFY-END PARA CENTER (MODAL CENTRALIZADO)
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />

            {/* 👇 LARGURA MÁXIMA AUMENTADA (max-w-4xl) E CANTOS ARREDONDADOS (rounded-[3rem]) */}
            <div className="relative w-full max-w-4xl bg-bg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-soft">

                {/* HEADER FIXO DO MODAL */}
                <header className="px-8 md:px-12 pt-10 pb-0 border-b border-soft bg-bg2 shrink-0 relative z-30">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="flex items-center gap-2 text-figueira font-black text-[9px] uppercase tracking-[0.3em] mb-2">
                                <Briefcase size={12} /> Painel do Departamento
                            </span>
                            <h2 className="text-3xl font-black italic uppercase text-fg leading-none tracking-tighter">{depto.nome}</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-bg border border-soft text-muted hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-90">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex gap-8 overflow-x-auto custom-scrollbar">
                        <button onClick={() => setAba('equipe')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${aba === 'equipe' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <Users size={14} /> Equipa & Voluntários
                        </button>
                        <button onClick={() => setAba('funcoes')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${aba === 'funcoes' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <ShieldCheck size={14} /> Estrutura de Cargos
                        </button>
                        <button onClick={() => setAba('dados')} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${aba === 'dados' ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
                            <Settings size={14} /> Definições Gerais
                        </button>
                    </div>
                </header>

                {/* ÁREA DE SCROLL (CORPO DO MODAL) */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-bg relative z-20">

                    {/* ===================================================== */}
                    {/* ABA: EQUIPA */}
                    {/* ===================================================== */}
                    {aba === 'equipe' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">

                            {/* FORMULÁRIO */}
                            <form
                                ref={formEquipeRef}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!membroEquipeSelecionado) return alert("Selecione um membro.");
                                    if (funcoesSelecionadas.length === 0) return alert("Selecione pelo menos um cargo.");
                                    setLoading(true);
                                    const fd = new FormData(e.currentTarget);
                                    const res = await vincularMembroDepartamento(fd);
                                    if (res?.ok) {
                                        setMembroEquipeSelecionado(null);
                                        setFuncoesSelecionadas([]);
                                        setBuscaEquipe("");
                                        formEquipeRef.current?.reset();
                                    } else if (res?.error) {
                                        alert(res.error);
                                    }
                                    setLoading(false);
                                }}
                                className="bg-bg2 p-8 rounded-[2.5rem] border border-soft shadow-sm space-y-8"
                            >
                                <div className="flex items-center gap-3 border-b border-soft pb-6">
                                    <div className="bg-figueira/10 p-2.5 rounded-xl text-figueira"><UserPlus size={18} /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-fg">Vincular Novo Integrante</h3>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Selecione o membro e os cargos múltiplos.</p>
                                    </div>
                                </div>

                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <input type="hidden" name="membro_id" value={membroEquipeSelecionado?.id || ""} />
                                {funcoesSelecionadas.map(id => <input key={id} type="hidden" name="funcoes_ids" value={id} />)}

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* COLUNA ESQUERDA: MEMBRO */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black uppercase text-muted ml-2">Pesquisar Membro</label>
                                        {membroEquipeSelecionado ? (
                                            <div className="flex items-center justify-between bg-bg border border-figueira px-5 py-4 rounded-2xl shadow-sm">
                                                <span className="text-xs font-black text-fg uppercase tracking-wide">{membroEquipeSelecionado.first_name} {membroEquipeSelecionado.last_name}</span>
                                                <button type="button" onClick={() => setMembroEquipeSelecionado(null)} className="text-muted hover:text-red-500 transition-colors bg-soft hover:bg-red-50 p-1.5 rounded-lg"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                                <input type="text" placeholder="Escreva o nome..." value={buscaEquipe} onChange={(e) => setBuscaEquipe(e.target.value)} className="w-full bg-bg border border-soft pl-12 pr-4 py-4 rounded-2xl text-xs font-bold focus:border-figueira outline-none shadow-sm transition-all" />
                                                {membrosEquipeFiltrados.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden z-[100]">
                                                        {membrosEquipeFiltrados.map((m: any) => (
                                                            <div key={m.id} onClick={() => { setMembroEquipeSelecionado(m); setBuscaEquipe(""); }} className="px-5 py-4 hover:bg-soft cursor-pointer text-[10px] font-black uppercase tracking-widest border-b border-soft transition-colors">{m.first_name} {m.last_name}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* COLUNA DIREITA: CARGOS */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-[0.1em]">Cargos a Atribuir</label>
                                        <div className="flex flex-wrap gap-2">
                                            {depto.funcoes?.map((f: any) => {
                                                const selected = funcoesSelecionadas.includes(f.id);
                                                return (
                                                    <button key={f.id} type="button" onClick={() => toggleFuncao(f.id)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${selected ? 'bg-figueira border-figueira text-white shadow-md scale-105' : 'bg-bg border-soft text-muted hover:border-figueira/50 hover:text-fg'}`}>
                                                        {selected ? <CheckCircle2 size={12} /> : <Plus size={12} />} {f.nome}
                                                    </button>
                                                );
                                            })}
                                            {depto.funcoes?.length === 0 && <p className="text-[10px] text-muted italic p-2">Nenhum cargo criado na aba "Cargos".</p>}
                                        </div>
                                    </div>
                                </div>
                                <button disabled={loading || !membroEquipeSelecionado || funcoesSelecionadas.length === 0} className="w-full bg-fg text-bg py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all mt-4">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirmar Vínculo à Equipa
                                </button>
                            </form>

                            {/* LISTA DE INTEGRANTES - AGORA COM BOTÃO DE REMOVER MEMBRO */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase text-fg ml-2 tracking-widest flex items-center gap-2 border-b border-soft pb-4">
                                    <Users size={16} className="text-muted" /> Voluntários Cadastrados
                                    <span className="bg-soft text-muted px-2 py-0.5 rounded-md text-[9px]">{listaIntegrantesAgrupados.length}</span>
                                </h3>

                                <div className="grid gap-4">
                                    {listaIntegrantesAgrupados.map((grupo: any) => (
                                        <div key={grupo.membro.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all ${grupo.membro.id === depto.lider_id ? 'border-figueira/40 bg-figueira/5 shadow-sm' : 'bg-bg2 border-soft hover:border-soft/80'}`}>

                                            {/* INFO DO MEMBRO E BOTÕES DE AÇÃO */}
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center text-[12px] font-black text-figueira shrink-0 shadow-sm">
                                                    {grupo.membro.first_name[0]}{grupo.membro.last_name[0]}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-base font-black uppercase text-fg truncate flex items-center gap-3">
                                                        {grupo.membro.first_name} {grupo.membro.last_name}
                                                        {grupo.membro.id === depto.lider_id && <span className="text-[8px] bg-figueira text-white px-2 py-1 rounded-md tracking-widest">Líder</span>}
                                                    </p>

                                                    {/* BARRA DE FERRAMENTAS DO MEMBRO */}
                                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">ID #{grupo.membro.id}</p>

                                                        {/* 👇 NOVO BOTÃO: DELEGAR ESCALAS (Não aparece para o líder, pois ele já tem acesso) */}
                                                        {grupo.membro.id !== depto.lider_id && (
                                                            <button
                                                                disabled={loading}
                                                                onClick={async () => {
                                                                    setLoading(true);
                                                                    const res = await alternarPermissaoEscala(grupo.integrante_id, grupo.pode_gerir_escalas);
                                                                    setLoading(false);
                                                                }}
                                                                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 border ${grupo.pode_gerir_escalas
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                    : 'bg-bg text-muted border-soft hover:bg-soft hover:text-fg'
                                                                    }`}
                                                            >
                                                                <CalendarDays size={10} />
                                                                {grupo.pode_gerir_escalas ? 'Delegado: Faz Escalas' : 'Pode Fazer Escalas?'}
                                                            </button>
                                                        )}

                                                        {/* BOTÃO REMOVER MEMBRO COMPLETO */}
                                                        <button
                                                            disabled={loading}
                                                            onClick={async () => {
                                                                if (confirm(`Tem certeza que deseja remover ${grupo.membro.first_name} de todos os cargos deste departamento?`)) {
                                                                    setLoading(true);
                                                                    await removerMembroTotal(grupo.membro.id, depto.id);
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded-lg disabled:opacity-50"
                                                        >
                                                            <UserMinus size={10} /> Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* TAGS (CARGOS) NO LADO DIREITO */}
                                            <div className="flex flex-wrap gap-2 md:justify-end shrink-0 max-w-sm">
                                                {grupo.atribuicoes.map((atrib: any) => (
                                                    <button
                                                        key={atrib.id}
                                                        disabled={loading}
                                                        onClick={async () => {
                                                            if (confirm(`Remover o cargo de ${atrib.nome}?`)) {
                                                                setLoading(true);
                                                                await removerFuncaoDoMembro(atrib.id);
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        className="group/atrib flex items-center gap-2 bg-bg border border-soft px-3 py-1.5 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-figueira group-hover/atrib:bg-red-500 transition-colors"></div>
                                                        <span className="text-[10px] font-bold text-fg uppercase tracking-wider group-hover/atrib:text-red-700">{atrib.nome}</span>
                                                        <X size={12} className="text-muted/50 group-hover/atrib:text-red-500 transition-colors ml-1" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {listaIntegrantesAgrupados.length === 0 && (
                                        <div className="py-16 text-center bg-bg2 border-2 border-dashed border-soft rounded-[3rem]">
                                            <Users size={32} className="text-muted/30 mx-auto mb-4" />
                                            <p className="text-xs text-muted font-bold uppercase tracking-widest">Este departamento ainda não tem membros.</p>
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
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <form action={async (fd) => {
                                setLoading(true);
                                await adicionarFuncaoAoDepto(fd);
                                formFuncaoRef.current?.reset();
                                setLoading(false);
                            }} className="bg-bg2 p-8 rounded-[2.5rem] border border-soft shadow-sm flex flex-col md:flex-row gap-4 items-end">
                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <div className="relative flex-1 w-full space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest">Nome do Cargo</label>
                                    <div className="relative">
                                        <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                        <input name="nome" placeholder="Ex: Guitarrista, Sonoplasta..." required className="w-full bg-bg border border-soft pl-14 pr-6 py-5 rounded-2xl font-bold text-sm outline-none focus:border-figueira shadow-inner transition-all" />
                                    </div>
                                </div>
                                <button disabled={loading} className="w-full md:w-auto bg-figueira text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar Cargo
                                </button>
                            </form>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-fg ml-2 border-b border-soft pb-4">Cargos Disponíveis</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {depto.funcoes?.map((f: any) => (
                                        <div key={f.id} className="group flex justify-between items-center p-6 bg-bg2 border border-soft rounded-[2rem] hover:border-figueira/40 transition-all shadow-sm">
                                            <span className="text-xs font-black uppercase text-fg tracking-widest flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-figueira block shadow-sm shadow-figueira/50"></span> {f.nome}
                                            </span>
                                            <button onClick={() => confirm("Excluir esta função permanentemente?") && removerFuncaoDoDepto(f.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg border border-soft hover:bg-red-50 hover:border-red-200 text-muted hover:text-red-500 transition-all shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {depto.funcoes?.length === 0 && (
                                        <p className="col-span-full text-[10px] text-center text-muted py-12 font-bold uppercase tracking-widest italic bg-bg2 border border-soft rounded-[2rem]">Nenhum cargo configurado.</p>
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
                            if (res?.ok) alert("Informações atualizadas!");
                        }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-bg2 p-10 md:p-12 rounded-[3rem] border border-soft shadow-sm space-y-8">
                                <input type="hidden" name="id" value={depto.id} />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest">Nome Oficial</label>
                                    <input name="nome" defaultValue={depto.nome} required className="w-full bg-bg border border-soft p-5 rounded-2xl text-sm font-bold focus:border-figueira outline-none shadow-sm transition-all" />
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest">Responsável (Líder)</label>
                                    <input type="hidden" name="lider_id" value={liderSelecionado?.id || ""} />

                                    {liderSelecionado ? (
                                        <div className="flex items-center justify-between bg-bg border border-figueira p-5 rounded-2xl shadow-sm transition-all">
                                            <div className="flex items-center gap-4">
                                                <ShieldCheck size={20} className="text-figueira" />
                                                <span className="text-sm font-black text-fg uppercase tracking-widest">{liderSelecionado.first_name} {liderSelecionado.last_name}</span>
                                            </div>
                                            <button type="button" onClick={() => setLiderSelecionado(null)} className="bg-soft hover:bg-red-100 p-2.5 rounded-xl text-muted hover:text-red-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                            <input type="text" placeholder="Procurar novo líder..." value={buscaLider} onChange={(e) => setBuscaLider(e.target.value)} className="w-full bg-bg border border-soft pl-14 pr-5 py-5 rounded-2xl text-sm font-bold focus:border-figueira outline-none shadow-sm transition-all" />
                                            {membrosLiderFiltrados.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden z-[100]">
                                                    {membrosLiderFiltrados.map((m: any) => (
                                                        <div key={m.id} onClick={() => { setLiderSelecionado(m); setBuscaLider(""); }} className="px-6 py-5 hover:bg-soft cursor-pointer text-xs font-black uppercase tracking-widest border-b border-soft last:border-0 transition-colors">
                                                            {m.first_name} {m.last_name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                                        <AlignLeft size={12} /> Notas e Observações
                                    </label>
                                    <textarea name="descricao" defaultValue={depto.descricao} rows={5} className="w-full bg-bg border border-soft p-5 rounded-2xl text-sm font-bold focus:border-figueira outline-none resize-none shadow-sm leading-relaxed" />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button disabled={loading} className="w-full md:w-auto bg-fg text-bg px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}