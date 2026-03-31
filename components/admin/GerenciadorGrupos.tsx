"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirGrupo, salvarGrupo } from "@/actions/admin-actions";
import {
    Search, X, Shield, Users, MapPin, Clock, Trash2,
    Edit3, Loader2, Check, AlignLeft, ArrowLeft,
    Building2, UserX, Plus, Calendar
} from "lucide-react";

interface GerenciadorProps {
    grupos: any[];
    departamentos: any[];
    membrosDisponiveis: any[];
}

export default function GerenciadorGrupos({ grupos, departamentos, membrosDisponiveis }: GerenciadorProps) {
    const router = useRouter();
    // ✅ useTransition em vez de window.location.reload()
    const [isPending, startTransition] = useTransition();

    const [modo, setModo] = useState<'lista' | 'form'>('lista');
    const [grupoAtual, setGrupoAtual] = useState<any>(null);
    const [salvando, setSalvando] = useState(false);
    const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
    const [buscaMembros, setBuscaMembros] = useState("");
    const [selecionadosMembros, setSelecionadosMembros] = useState<number[]>([]);
    const [selecionadosLideres, setSelecionadosLideres] = useState<number[]>([]);

    const abrirFormulario = (grupo: any = null) => {
        setGrupoAtual(grupo);
        setSelecionadosMembros(grupo?.membros?.map((m: any) => m.id) || []);
        setSelecionadosLideres(grupo?.lideres?.map((l: any) => l.id) || []);
        setBuscaMembros("");
        setModo('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const membrosFiltrados = useMemo(() => {
        if (buscaMembros.length < 2) return [];
        return membrosDisponiveis
            .filter((m: any) =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(buscaMembros.toLowerCase())
            )
            .slice(0, 6);
    }, [buscaMembros, membrosDisponiveis]);

    const toggleSelecao = (id: number, lista: number[], setLista: any, limit?: number) => {
        if (lista.includes(id)) {
            setLista(lista.filter((item: number) => item !== id));
        } else {
            if (limit && lista.length >= limit) return;
            setLista([...lista, id]);
        }
    };

    const selecionarPessoa = (id: number, tipo: 'LIDER' | 'MEMBRO') => {
        if (tipo === 'LIDER') {
            toggleSelecao(id, selecionadosLideres, setSelecionadosLideres, 2);
        } else {
            toggleSelecao(id, selecionadosMembros, setSelecionadosMembros);
        }
        setBuscaMembros("");
    };

    // ✅ USA router.refresh() em vez de window.location.reload()
    const handleSalvar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSalvando(true);

        const formData = new FormData(e.currentTarget);
        if (grupoAtual?.id) formData.append("id", grupoAtual.id.toString());
        selecionadosMembros.forEach(id => formData.append("membros_ids", id.toString()));
        selecionadosLideres.forEach(id => formData.append("lideres_ids", id.toString()));

        try {
            const res = await salvarGrupo(formData) as { sucesso: boolean; error?: string };
            if (res.sucesso) {
                setModo('lista');
                // ✅ Revalida apenas os dados da página sem reload completo
                startTransition(() => router.refresh());
            } else {
                alert(res.error || "Erro ao guardar o grupo.");
            }
        } catch {
            alert("Erro de ligação ao servidor.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id: number) => {
        setSalvando(true);
        const res = await excluirGrupo(id) as { sucesso: boolean };
        if (res.sucesso) {
            setConfirmarExclusao(null);
            startTransition(() => router.refresh());
        } else {
            alert("Erro ao excluir.");
            setConfirmarExclusao(null);
        }
        setSalvando(false);
    };

    // ─── HELPERS PARA OS CHIPS ───────────────────────────────────────────────
    const getNomeMembro = (id: number) => {
        const m = membrosDisponiveis.find((mem: any) => mem.id === id);
        return m ? `${m.first_name} ${m.last_name}` : '—';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── MODO LISTA ──────────────────────────────────────────────── */}
            {modo === 'lista' && (
                <>
                    <div className="flex justify-end">
                        <button
                            onClick={() => abrirFormulario()}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                        >
                            <Plus size={13} /> Novo Grupo
                        </button>
                    </div>

                    {isPending && (
                        <div className="flex items-center justify-center gap-2 py-4 text-[10px] font-black text-muted uppercase tracking-widest">
                            <Loader2 size={14} className="animate-spin text-emerald-500" /> A atualizar...
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grupos.map((grupo) => (
                            <div key={grupo.id} className="group relative bg-bg border border-soft rounded-[2rem] p-6 hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col justify-between">

                                {/* OVERLAY DE CONFIRMAÇÃO DE EXCLUSÃO */}
                                {confirmarExclusao === grupo.id && (
                                    <div className="absolute inset-0 bg-red-600/96 z-20 flex flex-col items-center justify-center p-6 text-center rounded-[2rem] animate-in zoom-in-95 duration-200">
                                        <Trash2 size={24} className="text-white mb-3" />
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest mb-5 leading-tight">
                                            Eliminar "{grupo.nome}"?
                                        </p>
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={() => handleExcluir(grupo.id)}
                                                disabled={salvando}
                                                className="flex-1 bg-white text-red-600 py-2.5 rounded-xl font-black text-[9px] uppercase hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                            >
                                                {salvando ? <Loader2 size={12} className="animate-spin" /> : null}
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setConfirmarExclusao(null)}
                                                className="flex-1 bg-white/20 text-white py-2.5 rounded-xl font-black text-[9px] uppercase hover:bg-white/30"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* CONTEÚDO DO CARD */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black italic tracking-tight uppercase text-fg leading-none line-clamp-1">
                                                    {grupo.nome}
                                                </h3>
                                                {grupo.categoria && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted">
                                                        {grupo.categoria}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setConfirmarExclusao(grupo.id)}
                                            className="p-1.5 text-muted hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 pl-1">
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-wide flex items-center gap-2">
                                            <MapPin size={10} className="text-emerald-500/60 shrink-0" />
                                            {grupo.bairro}, {grupo.cidade}
                                        </p>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-wide flex items-center gap-2">
                                            <Calendar size={10} className="text-emerald-500/60 shrink-0" />
                                            {grupo.dia_semana} · {grupo.horario}
                                        </p>
                                    </div>

                                    {/* CHIPS DE LÍDERES */}
                                    {grupo.lideres?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {grupo.lideres.map((l: any) => (
                                                <span key={l.id} className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-500/20">
                                                    {l.first_name} {l.last_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* CONTAGEM DE MEMBROS */}
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted uppercase tracking-widest">
                                        <Users size={10} />
                                        {grupo._count?.membros ?? grupo.membros?.length ?? 0} membros
                                    </div>
                                </div>

                                <button
                                    onClick={() => abrirFormulario(grupo)}
                                    className="mt-5 w-full py-3 bg-bg2 border border-soft text-fg rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={11} /> Editar
                                </button>
                            </div>
                        ))}

                        {grupos.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-soft rounded-3xl">
                                <Users size={32} className="mx-auto text-muted/30 mb-3" />
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Nenhum grupo criado.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── MODO FORMULÁRIO ─────────────────────────────────────────── */}
            {modo === 'form' && (
                <form onSubmit={handleSalvar} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">

                    {/* HEADER DO FORM */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg">
                                {grupoAtual ? `Editar: ${grupoAtual.nome}` : 'Novo Grupo'}
                            </h3>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">
                                Preencha os dados abaixo
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setModo('lista')}
                            className="flex items-center gap-2 bg-bg2 border border-soft text-muted px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-soft transition-all"
                        >
                            <ArrowLeft size={12} /> Voltar
                        </button>
                    </div>

                    {/* BLOCO 1: INFORMAÇÕES */}
                    <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2rem]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 mb-6 pb-3 border-b border-soft">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">1</span>
                            Informações Gerais
                        </p>

                        <div className="grid md:grid-cols-3 gap-5">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Nome do Grupo</label>
                                <input name="nome" defaultValue={grupoAtual?.nome || ''} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Perfil</label>
                                <select name="perfil" defaultValue={grupoAtual?.perfil || 'Misto'}
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none appearance-none">
                                    {['Misto', 'Mulheres', 'Homens', 'Jovens', 'Casais', 'Crianças'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5">
                                    <AlignLeft size={9} /> Descrição
                                </label>
                                <textarea name="descricao" rows={2} defaultValue={grupoAtual?.descricao || ''}
                                    placeholder="Objetivo e perfil do grupo..."
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none resize-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Dia</label>
                                <select name="dia_semana" defaultValue={grupoAtual?.dia_semana || 'Domingo'} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none appearance-none">
                                    {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Horário</label>
                                <input name="horario" type="time" defaultValue={grupoAtual?.horario || '19:30'} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Categoria</label>
                                <select name="categoria" defaultValue={grupoAtual?.categoria || 'Grupo'} // Ao inves de Grupo tinha Célula
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none appearance-none">
                                    {['Grupo', 'PG', 'Estudo Bíblico', 'Reunião de Oração', 'Equipa de Serviço'].map(c => ( // Ao inves de Grupo tinha Célula
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Localização */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Morada</label>
                                <div className="flex gap-2">
                                    <input name="endereco" placeholder="Rua..." defaultValue={grupoAtual?.endereco || ''} required
                                        className="flex-1 bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                                    <input name="numero" placeholder="Nº" defaultValue={grupoAtual?.numero || ''}
                                        className="w-20 shrink-0 bg-bg border border-soft rounded-xl px-3 py-3 text-sm font-bold focus:border-emerald-500 outline-none text-center" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Bairro</label>
                                <input name="bairro" defaultValue={grupoAtual?.bairro || ''} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Cidade</label>
                                <input name="cidade" defaultValue={grupoAtual?.cidade || ''} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Distrito</label>
                                <input name="estado" defaultValue={grupoAtual?.estado || ''} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">País</label>
                                <input name="pais" defaultValue={grupoAtual?.pais || 'Portugal'} required
                                    className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* BLOCO 2: EQUIPA */}
                    <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2rem] relative z-20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 mb-6 pb-3 border-b border-soft">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">2</span>
                            Gestão de Equipa
                        </p>

                        {/* BUSCADOR */}
                        <div className="relative max-w-xl mb-6 z-50">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="Pesquisar membro..."
                                value={buscaMembros}
                                onChange={(e) => setBuscaMembros(e.target.value)}
                                className="w-full bg-bg border border-soft rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                            />
                            {membrosFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden z-50">
                                    {membrosFiltrados.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between px-4 py-3 hover:bg-soft/50 transition-colors border-b border-soft/50 last:border-0">
                                            <span className="text-[11px] font-black text-fg uppercase tracking-wide">
                                                {m.first_name} {m.last_name}
                                            </span>
                                            <div className="flex gap-1.5">
                                                <button type="button" onClick={() => selecionarPessoa(m.id, 'LIDER')}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${selecionadosLideres.includes(m.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-bg border-soft text-muted hover:border-emerald-500 hover:text-emerald-600'}`}>
                                                    {selecionadosLideres.includes(m.id) ? '✓ Líder' : '+ Líder'}
                                                </button>
                                                <button type="button" onClick={() => selecionarPessoa(m.id, 'MEMBRO')}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${selecionadosMembros.includes(m.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-bg border-soft text-muted hover:border-blue-500 hover:text-blue-600'}`}>
                                                    {selecionadosMembros.includes(m.id) ? '✓ Membro' : '+ Membro'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CHIPS SELECIONADOS */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                    <Shield size={11} className="text-emerald-500" />
                                    Líderes ({selecionadosLideres.length}/2)
                                </p>
                                <div className="min-h-[72px] bg-bg border border-soft rounded-xl p-3 flex flex-wrap gap-2 content-start">
                                    {selecionadosLideres.length === 0
                                        ? <p className="text-[9px] italic text-muted m-auto">Nenhum líder</p>
                                        : selecionadosLideres.map(id => (
                                            <span key={id} className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide animate-in zoom-in-90">
                                                {getNomeMembro(id)}
                                                <X size={11} className="cursor-pointer opacity-70 hover:opacity-100"
                                                    onClick={() => toggleSelecao(id, selecionadosLideres, setSelecionadosLideres)} />
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Users size={11} className="text-blue-500" />
                                        Membros ({selecionadosMembros.length})
                                    </span>
                                    {selecionadosMembros.length > 0 && (
                                        <button type="button" onClick={() => setSelecionadosMembros([])}
                                            className="text-[8px] text-red-400 hover:text-red-600 flex items-center gap-1">
                                            <UserX size={10} /> Limpar
                                        </button>
                                    )}
                                </p>
                                <div className="min-h-[72px] max-h-[160px] overflow-y-auto bg-bg border border-soft rounded-xl p-3 flex flex-wrap gap-2 content-start custom-scrollbar">
                                    {selecionadosMembros.length === 0
                                        ? <p className="text-[9px] italic text-muted m-auto">Nenhum membro</p>
                                        : selecionadosMembros.map(id => (
                                            <span key={id} onClick={() => toggleSelecao(id, selecionadosMembros, setSelecionadosMembros)}
                                                className="flex items-center gap-1.5 bg-bg2 border border-soft text-fg px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide cursor-pointer hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors animate-in zoom-in-90">
                                                {getNomeMembro(id)}
                                                <X size={10} className="opacity-40" />
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOCO 3: RODAPÉ */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg2 border border-soft p-5 rounded-[2rem]">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5">
                                <Building2 size={10} /> Departamento
                            </label>
                            <select name="departamento_id" defaultValue={grupoAtual?.departamento_id || ''}
                                className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none appearance-none">
                                <option value="">Independente</option>
                                {departamentos.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.nome}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={salvando || isPending}
                            className="sm:self-end flex items-center justify-center gap-2 bg-emerald-500 text-white px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50 active:scale-95 min-w-[180px]">
                            {salvando || isPending
                                ? <><Loader2 size={14} className="animate-spin" /> A gravar...</>
                                : <><Check size={14} /> {grupoAtual ? 'Atualizar' : 'Criar Grupo'}</>
                            }
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}