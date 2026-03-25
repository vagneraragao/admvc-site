"use client";

import { useState, useMemo } from "react";
import { excluirGrupo, salvarGrupo } from "@/actions/admin-actions";
import {
    Search, UserPlus, X, UserCheck, Shield, Users,
    MapPin, Clock, Calendar, Trash2, Edit3, Loader2, Check, AlignLeft, Info
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
        ).slice(0, 6);
    }, [buscaMembros, membrosDisponiveis]);

    // Função melhorada para fechar a busca ao selecionar
    const selecionarPessoa = (id: number, tipo: 'LIDER' | 'MEMBRO') => {
        if (tipo === 'LIDER') {
            toggleSelecao(id, selecionadosLideres, setSelecionadosLideres, 2);
        } else {
            toggleSelecao(id, selecionadosMembros, setSelecionadosMembros);
        }
        // Limpa a busca e fecha os resultados
        setBuscaMembros("");
    };

    const toggleSelecao = (id: number, lista: number[], setLista: any, limit?: number) => {
        if (lista.includes(id)) {
            setLista(lista.filter(item => item !== id));
        } else {
            if (limit && lista.length >= limit) {
                alert(`Limite de ${limit} líderes atingido.`);
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
            // Tipamos o resultado para que o TS reconheça o '.error'
            const res = await salvarGrupo(formData) as { sucesso: boolean; error?: string };

            if (res.sucesso) {
                setModo('lista');
                window.location.reload();
            } else {
                // Agora o erro deve desaparecer pois 'res' tem a propriedade 'error' opcional
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
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-fg">
                    {modo === 'lista' ? "Grupos & Células" : grupoAtual ? "Editar Grupo" : "Novo Grupo"}
                </h2>
                {modo === 'lista' ? (
                    <button onClick={() => abrirFormulario()} className="bg-fg text-bg px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-figueira hover:text-white transition-all shadow-lg active:scale-95">
                        + Criar Novo Grupo
                    </button>
                ) : (
                    <button onClick={() => setModo('lista')} className="bg-soft text-fg px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-fg hover:text-bg transition-all">
                        ← Cancelar e Voltar
                    </button>
                )}
            </header>

            {modo === 'lista' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    {grupos.map((grupo) => (
                        <div key={grupo.id} className="group bg-bg border border-soft p-8 rounded-[2.5rem] shadow-sm hover:border-figueira/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
                            {confirmarExclusao === grupo.id && (
                                <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
                                    <Trash2 size={32} className="text-white mb-4" />
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest mb-6 leading-tight">Eliminar o grupo "{grupo.nome}"?</p>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => handleExcluir(grupo.id)} className="flex-1 bg-white text-red-600 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-gray-100 transition-colors">Sim</button>
                                        <button onClick={() => setConfirmarExclusao(null)} className="flex-1 bg-black/20 text-white py-3 rounded-xl font-black text-[9px] uppercase">Não</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-figueira/10 text-figueira p-3 rounded-2xl">
                                        <Users size={20} />
                                    </div>
                                    <button onClick={() => setConfirmarExclusao(grupo.id)} className="p-2 text-muted hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
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
                            <button onClick={() => abrirFormulario(grupo)} className="w-full mt-8 py-4 border border-soft text-fg rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all flex items-center justify-center gap-2">
                                <Edit3 size={14} /> Editar Grupo
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {modo === 'form' && (
                <form onSubmit={handleSalvar} className="space-y-12 animate-in zoom-in-95 duration-300 max-w-5xl mx-auto">

                    {/* INFO GERAL */}
                    <div className="bg-bg border border-soft p-8 md:p-10 rounded-[3rem] space-y-8 shadow-sm">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="w-8 h-8 rounded-full bg-figueira text-white flex items-center justify-center text-[10px] font-black">01</span>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Configurações Base</span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Nome do Grupo</label>
                                <input name="nome" defaultValue={grupoAtual?.nome || ''} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Perfil / Público</label>
                                <select name="perfil" defaultValue={grupoAtual?.perfil || 'Misto'} className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none appearance-none">
                                    <option value="Misto">Misto (Geral)</option>
                                    <option value="Mulheres">Mulheres</option>
                                    <option value="Homens">Homens</option>
                                    <option value="Jovens">Jovens</option>
                                    <option value="Casais">Casais</option>
                                    <option value="Crianças">Crianças / Kids</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Dia da Semana</label>
                                <select name="dia_semana" defaultValue={grupoAtual?.dia_semana || 'Domingo'} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none">
                                    <option value="Segunda-feira">Segunda-feira</option>
                                    <option value="Terça-feira">Terça-feira</option>
                                    <option value="Quarta-feira">Quarta-feira</option>
                                    <option value="Quinta-feira">Quinta-feira</option>
                                    <option value="Sexta-feira">Sexta-feira</option>
                                    <option value="Sábado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Horário</label>
                                <input name="horario" type="time" defaultValue={grupoAtual?.horario || '19:30'} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Categoria</label>
                                <select name="categoria" defaultValue={grupoAtual?.categoria || 'Célula'} className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none">
                                    <option value="Célula">Célula</option>
                                    <option value="Estudo Bíblico">Estudo Bíblico</option>
                                    <option value="Reunião de Oração">Reunião de Oração</option>
                                    <option value="Equipa de Serviço">Equipa de Serviço</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <AlignLeft size={10} /> Descrição / Objetivo do Grupo
                                </label>
                                <textarea name="descricao" rows={2} defaultValue={grupoAtual?.descricao || ''} placeholder="Breve resumo sobre o grupo..." className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* LOCALIZAÇÃO */}
                    <div className="bg-bg border border-soft p-8 md:p-10 rounded-[3rem] space-y-8 shadow-sm">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="w-8 h-8 rounded-full bg-figueira text-white flex items-center justify-center text-[10px] font-black">02</span>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Localização</span>
                        </div>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Endereço (Rua/Avenida)</label>
                                <input name="endereco" defaultValue={grupoAtual?.endereco || ''} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Nº</label>
                                <input name="numero" defaultValue={grupoAtual?.numero || ''} className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Bairro</label>
                                <input name="bairro" defaultValue={grupoAtual?.bairro || ''} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Cidade</label>
                                <input name="cidade" defaultValue={grupoAtual?.cidade || ''} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Estado / Região</label>
                                <input name="estado" defaultValue={grupoAtual?.estado || ''} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">País</label>
                                <input name="pais" defaultValue={grupoAtual?.pais || 'Portugal'} required className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* LIVE SEARCH: LIDERANÇA E MEMBROS */}
                    <div className="bg-bg border border-soft p-8 md:p-10 rounded-[3rem] space-y-10 shadow-sm relative z-30">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="w-8 h-8 rounded-full bg-figueira text-white flex items-center justify-center text-[10px] font-black">03</span>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Equipa e Membros</span>
                        </div>

                        <div className="relative max-w-lg mx-auto">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Pesquisar por nome..."
                                value={buscaMembros}
                                onChange={(e) => setBuscaMembros(e.target.value)}
                                className="w-full bg-bg2 border-2 border-soft rounded-[2rem] pl-14 pr-6 py-5 text-sm font-black uppercase tracking-widest focus:border-figueira outline-none shadow-inner transition-all"
                            />

                            {/* RESULTADOS (Fecha-se ao escolher) */}
                            {membrosFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-bg border border-soft rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                                    {membrosFiltrados.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-5 hover:bg-soft border-b border-soft last:border-0 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{m.first_name} {m.last_name}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selecionarPessoa(m.id, 'LIDER')}
                                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${selecionadosLideres.includes(m.id) ? 'bg-figueira text-white shadow-md' : 'bg-bg2 text-muted hover:text-figueira border border-soft'}`}
                                                >
                                                    {selecionadosLideres.includes(m.id) ? 'Líder ✓' : '+ Líder'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selecionarPessoa(m.id, 'MEMBRO')}
                                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${selecionadosMembros.includes(m.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-bg2 text-muted hover:text-blue-600 border border-soft'}`}
                                                >
                                                    {selecionadosMembros.includes(m.id) ? 'Membro ✓' : '+ Membro'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                    <Shield size={12} className="text-figueira" /> Líderes (Máx. 2)
                                </label>
                                <div className="bg-bg2 border-2 border-dashed border-soft rounded-[2.5rem] p-6 min-h-[120px] flex flex-wrap gap-2 content-start">
                                    {selecionadosLideres.length === 0 && <p className="text-[9px] font-bold text-muted uppercase italic m-auto">Nenhum líder</p>}
                                    {selecionadosLideres.map(id => {
                                        const m = membrosDisponiveis.find((mem: any) => mem.id === id);
                                        return (
                                            <div key={id} className="bg-figueira text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in-90">
                                                {m?.first_name} <X size={14} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => toggleSelecao(id, selecionadosLideres, setSelecionadosLideres)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                    <Users size={12} className="text-blue-500" /> Membros ({selecionadosMembros.length})
                                </label>
                                <div className="bg-bg2 border-2 border-dashed border-soft rounded-[2.5rem] p-6 min-h-[120px] flex flex-wrap gap-2 content-start max-h-[250px] overflow-y-auto custom-scrollbar">
                                    {selecionadosMembros.length === 0 && <p className="text-[9px] font-bold text-muted uppercase italic m-auto">Nenhum membro</p>}
                                    {selecionadosMembros.map(id => {
                                        const m = membrosDisponiveis.find((mem: any) => mem.id === id);
                                        return (
                                            <div key={id} className="bg-bg border border-soft text-fg px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in-90 group/chip hover:border-figueira transition-all">
                                                {m?.first_name} {m?.last_name}
                                                <X size={12} className="cursor-pointer text-muted group-hover/chip:text-red-500 transition-colors" onClick={() => toggleSelecao(id, selecionadosMembros, setSelecionadosMembros)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg border border-soft p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative z-10">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Departamento Vinculado</label>
                            <select name="departamento_id" defaultValue={grupoAtual?.departamento_id || ''} className="w-full bg-bg2 border-2 border-soft rounded-2xl px-6 py-4 text-sm font-bold focus:border-figueira outline-none min-w-[250px]">
                                <option value="">Sem vínculo</option>
                                {departamentos.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.nome}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={salvando} className="w-full md:w-auto bg-fg text-bg px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-figueira hover:text-white transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95">
                            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {salvando ? "A Gravar..." : grupoAtual ? "Atualizar Grupo" : "Criar Grupo"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}