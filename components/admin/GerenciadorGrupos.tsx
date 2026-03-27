"use client";

import { useState, useMemo } from "react";
import { excluirGrupo, salvarGrupo } from "@/actions/admin-actions";
import {
    Search, X, Shield, Users, MapPin, Calendar, Trash2,
    Edit3, Loader2, Check, AlignLeft, ArrowLeft, Building2, UserX
} from "lucide-react";

interface GerenciadorProps {
    grupos: any[];
    departamentos: any[];
    membrosDisponiveis: any[];
}

export default function GerenciadorGrupos({ grupos, departamentos, membrosDisponiveis }: GerenciadorProps) {
    const [modo, setModo] = useState<'lista' | 'form'>('lista');
    const [grupoAtual, setGrupoAtual] = useState<any>(null);
    const [salvando, setSalvando] = useState(false);
    const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);

    // Estados para o buscador e seleções
    const [buscaMembros, setBuscaMembros] = useState("");
    const [selecionadosMembros, setSelecionadosMembros] = useState<number[]>([]);
    const [selecionadosLideres, setSelecionadosLideres] = useState<number[]>([]);

    const abrirFormulario = (grupo: any = null) => {
        setGrupoAtual(grupo);
        setSelecionadosMembros(grupo?.membros?.map((m: any) => m.id) || []);
        setSelecionadosLideres(grupo?.lideres?.map((l: any) => l.id) || []);
        setBuscaMembros("");
        setModo('form');
    };

    const membrosFiltrados = useMemo(() => {
        if (buscaMembros.length < 2) return [];
        return membrosDisponiveis.filter((m: any) =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(buscaMembros.toLowerCase())
        ).slice(0, 5); // Mantém a lista suspensa curta e elegante
    }, [buscaMembros, membrosDisponiveis]);

    const selecionarPessoa = (id: number, tipo: 'LIDER' | 'MEMBRO') => {
        if (tipo === 'LIDER') {
            toggleSelecao(id, selecionadosLideres, setSelecionadosLideres, 2);
        } else {
            toggleSelecao(id, selecionadosMembros, setSelecionadosMembros);
        }
        setBuscaMembros(""); // Limpa e fecha o dropdown instantaneamente
    };

    const toggleSelecao = (id: number, lista: number[], setLista: any, limit?: number) => {
        if (lista.includes(id)) {
            setLista(lista.filter(item => item !== id));
        } else {
            if (limit && lista.length >= limit) {
                alert(`Limite de ${limit} atingido para esta função.`);
                return;
            }
            setLista([...lista, id]);
        }
    };

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
                window.location.reload();
            } else {
                alert(res.error || "Erro ao guardar o grupo.");
            }
        } catch (err) {
            alert("Erro de ligação ao servidor.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id: number) => {
        setSalvando(true);
        const res = await excluirGrupo(id);
        if (res.sucesso) window.location.reload();
        else {
            alert("Erro ao excluir.");
            setConfirmarExclusao(null);
            setSalvando(false);
        }
    };

    return (
        <section className="space-y-8 animate-in fade-in duration-500">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-soft pb-6">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-fg leading-none">
                        {modo === 'lista' ? "Grupos & PGs" : grupoAtual ? "Editar Grupo" : "Novo Grupo"}
                    </h2>
                    {modo === 'form' && (
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2">
                            Preencha os dados abaixo para configurar a equipa.
                        </p>
                    )}
                </div>

                {modo === 'lista' ? (
                    <button onClick={() => abrirFormulario()} className="bg-fg text-bg px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-figueira hover:text-white transition-all shadow-lg active:scale-95">
                        + Criar Novo Grupo
                    </button>
                ) : (
                    <button onClick={() => setModo('lista')} className="bg-bg2 border border-soft text-fg px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-soft transition-all flex items-center gap-2">
                        <ArrowLeft size={12} /> Voltar
                    </button>
                )}
            </header>

            {/* MODO LISTA */}
            {modo === 'lista' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    {grupos.map((grupo) => (
                        <div key={grupo.id} className="group bg-bg2 border border-soft p-8 rounded-[2.5rem] shadow-sm hover:border-figueira/40 transition-all relative overflow-hidden flex flex-col justify-between h-full">
                            {confirmarExclusao === grupo.id && (
                                <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
                                    <Trash2 size={32} className="text-white mb-4" />
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest mb-6 leading-tight">Eliminar permanentemente "{grupo.nome}"?</p>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => handleExcluir(grupo.id)} className="flex-1 bg-white text-red-600 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-red-50 transition-colors">Confirmar</button>
                                        <button onClick={() => setConfirmarExclusao(null)} className="flex-1 bg-black/20 text-white py-3 rounded-xl font-black text-[9px] uppercase hover:bg-black/30">Cancelar</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-figueira/10 text-figueira p-3 rounded-2xl">
                                        <Users size={20} />
                                    </div>
                                    <button onClick={() => setConfirmarExclusao(grupo.id)} className="p-2 text-muted hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-fg leading-none">{grupo.nome}</h3>
                                <div className="mt-4 space-y-2">
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-tight flex items-center gap-2">
                                        <MapPin size={12} className="text-figueira/50" /> {grupo.bairro}, {grupo.cidade}
                                    </p>
                                    <p className="text-[10px] text-fg font-black uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} className="text-figueira/50" /> {grupo.dia_semana} às {grupo.horario}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => abrirFormulario(grupo)} className="w-full mt-8 py-4 bg-bg border border-soft text-fg rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-fg hover:text-bg transition-all flex items-center justify-center gap-2 shadow-sm">
                                <Edit3 size={12} /> Editar
                            </button>
                        </div>
                    ))}
                    {grupos.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-bg2 border border-soft rounded-[3rem]">
                            <Users size={40} className="mx-auto text-muted/30 mb-4" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhum grupo cadastrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODO FORMULÁRIO */}
            {modo === 'form' && (
                <form onSubmit={handleSalvar} className="space-y-8 animate-in zoom-in-95 duration-300 max-w-5xl mx-auto pb-10">

                    {/* BLOCO 1: GERAL E LOCALIZAÇÃO (Unificados para design mais enxuto) */}
                    <div className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-8 border-b border-soft pb-4">
                            <span className="w-6 h-6 rounded-full bg-figueira text-white flex items-center justify-center text-[9px] font-black">1</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-fg">Informações e Local</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Nome do Grupo</label>
                                <input name="nome" defaultValue={grupoAtual?.nome || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira focus:ring-4 focus:ring-figueira/5 outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Perfil / Público</label>
                                <select name="perfil" defaultValue={grupoAtual?.perfil || 'Misto'} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm appearance-none">
                                    <option value="Misto">Misto (Geral)</option>
                                    <option value="Mulheres">Mulheres</option>
                                    <option value="Homens">Homens</option>
                                    <option value="Jovens">Jovens</option>
                                    <option value="Casais">Casais</option>
                                    <option value="Crianças">Crianças / Kids</option>
                                </select>
                            </div>

                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <AlignLeft size={10} /> Descrição / Objetivo do Grupo
                                </label>
                                <textarea name="descricao" rows={2} defaultValue={grupoAtual?.descricao || ''} placeholder="Breve resumo sobre o grupo..." className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none resize-none shadow-sm" />
                            </div>

                            {/* Separador */}
                            <div className="md:col-span-3 h-[1px] bg-soft my-2"></div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Dia da Reunião</label>
                                <select name="dia_semana" defaultValue={grupoAtual?.dia_semana || 'Domingo'} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm appearance-none">
                                    <option value="Segunda-feira">Segunda-feira</option>
                                    <option value="Terça-feira">Terça-feira</option>
                                    <option value="Quarta-feira">Quarta-feira</option>
                                    <option value="Quinta-feira">Quinta-feira</option>
                                    <option value="Sexta-feira">Sexta-feira</option>
                                    <option value="Sábado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Horário</label>
                                <input name="horario" type="time" defaultValue={grupoAtual?.horario || '19:30'} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Categoria</label>
                                <select name="categoria" defaultValue={grupoAtual?.categoria || 'Célula'} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm appearance-none">
                                    <option value="Célula">PG</option>
                                    <option value="Estudo Bíblico">Estudo Bíblico</option>
                                    <option value="Reunião de Oração">Reunião de Oração</option>
                                    <option value="Equipa de Serviço">Equipa de Serviço</option>
                                </select>
                            </div>

                            {/* Localização compacta */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Morada (Rua e Nº)</label>
                                <div className="flex gap-2">
                                    <input name="endereco" placeholder="Rua..." defaultValue={grupoAtual?.endereco || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                                    <input name="numero" placeholder="Nº" defaultValue={grupoAtual?.numero || ''} className="w-24 shrink-0 bg-bg border border-soft rounded-2xl px-4 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm text-center" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Bairro / Freguesia</label>
                                <input name="bairro" defaultValue={grupoAtual?.bairro || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Cidade</label>
                                <input name="cidade" defaultValue={grupoAtual?.cidade || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Distrito / Estado</label>
                                <input name="estado" defaultValue={grupoAtual?.estado || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">País</label>
                                <input name="pais" defaultValue={grupoAtual?.pais || 'Portugal'} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* BLOCO 2: MEMBROS E LÍDERES (Totalmente remodelado para UX minimalista) */}
                    <div className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm relative z-20">
                        <div className="flex items-center gap-3 mb-8 border-b border-soft pb-4">
                            <span className="w-6 h-6 rounded-full bg-figueira text-white flex items-center justify-center text-[9px] font-black">2</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-fg">Gestão de Equipa</h3>
                        </div>

                        {/* BARRA DE PESQUISA FLUTUANTE */}
                        <div className="relative max-w-2xl mx-auto mb-10 z-50">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Procurar membro para adicionar..."
                                value={buscaMembros}
                                onChange={(e) => setBuscaMembros(e.target.value)}
                                className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm transition-all"
                            />

                            {/* DROPDOWN LIMPO */}
                            {membrosFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-soft rounded-2xl shadow-2xl overflow-hidden divide-y divide-soft">
                                    {membrosFiltrados.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-4 hover:bg-soft/50 transition-colors">
                                            <span className="text-[10px] font-black text-fg uppercase tracking-widest">{m.first_name} {m.last_name}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selecionarPessoa(m.id, 'LIDER')}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${selecionadosLideres.includes(m.id) ? 'bg-figueira border-figueira text-white shadow-sm' : 'bg-bg text-muted hover:border-figueira hover:text-figueira'}`}
                                                >
                                                    {selecionadosLideres.includes(m.id) ? 'Líder ✓' : '+ Líder'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selecionarPessoa(m.id, 'MEMBRO')}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${selecionadosMembros.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-bg text-muted hover:border-blue-600 hover:text-blue-600'}`}
                                                >
                                                    {selecionadosMembros.includes(m.id) ? 'Membro ✓' : '+ Membro'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* LISTAS OTIMIZADAS COM MAX-HEIGHT E SCROLL */}
                        <div className="grid md:grid-cols-2 gap-8 relative z-10">

                            {/* CAIXA DE LÍDERES */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Shield size={12} className="text-figueira" /> Líderes ({selecionadosLideres.length}/2)</span>
                                </label>
                                <div className="bg-bg border border-soft rounded-[2rem] p-5 flex flex-wrap gap-2 content-start shadow-inner min-h-[100px]">
                                    {selecionadosLideres.length === 0 && <p className="text-[9px] font-bold text-muted uppercase italic m-auto">Nenhum selecionado</p>}
                                    {selecionadosLideres.map(id => {
                                        const m = membrosDisponiveis.find((mem: any) => mem.id === id);
                                        return (
                                            <div key={id} className="bg-figueira text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm animate-in zoom-in-90 group/chip">
                                                {m?.first_name} {m?.last_name}
                                                <X size={12} className="cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 transition-all" onClick={() => toggleSelecao(id, selecionadosLideres, setSelecionadosLideres)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CAIXA DE MEMBROS (COM SCROLLBAR INTERNO) */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Users size={12} className="text-blue-500" /> Membros ({selecionadosMembros.length})</span>
                                    {selecionadosMembros.length > 0 && (
                                        <button type="button" onClick={() => setSelecionadosMembros([])} className="text-[8px] text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                                            <UserX size={10} /> Limpar
                                        </button>
                                    )}
                                </label>
                                <div className="bg-bg border border-soft rounded-[2rem] p-5 flex flex-wrap gap-2 content-start shadow-inner min-h-[100px] max-h-[180px] overflow-y-auto custom-scrollbar">
                                    {selecionadosMembros.length === 0 && <p className="text-[9px] font-bold text-muted uppercase italic m-auto">Nenhum selecionado</p>}
                                    {selecionadosMembros.map(id => {
                                        const m = membrosDisponiveis.find((mem: any) => mem.id === id);
                                        return (
                                            <div key={id} className="bg-bg2 border border-soft text-fg px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-90 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" onClick={() => toggleSelecao(id, selecionadosMembros, setSelecionadosMembros)}>
                                                {m?.first_name} {m?.last_name}
                                                <X size={10} className="opacity-50" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOCO 3: FECHO E GUARDAR */}
                    <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                        <div className="space-y-1.5 w-full md:w-auto">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Building2 size={12} /> Departamento Associado
                            </label>
                            <select name="departamento_id" defaultValue={grupoAtual?.departamento_id || ''} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm font-bold focus:border-figueira outline-none shadow-sm min-w-[250px] appearance-none">
                                <option value="">Sem vínculo / PG Independente</option>
                                {departamentos.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.nome}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={salvando} className="w-full md:w-auto bg-fg text-bg px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95">
                            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {salvando ? "A Gravar..." : grupoAtual ? "Atualizar Grupo" : "Criar Grupo"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}