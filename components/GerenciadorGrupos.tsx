"use client";

import { useState } from "react";
import { excluirGrupo, salvarGrupo } from "@/actions/admin-actions";

interface GerenciadorProps {
    grupos: any[];
    departamentos: any[];
    membrosDisponiveis: any[]; // Adiciona esta prop vinda do server
}

export default function GerenciadorGrupos({ grupos, departamentos, membrosDisponiveis }: GerenciadorProps) {
    const [modo, setModo] = useState<'lista' | 'form'>('lista');
    const [grupoAtual, setGrupoAtual] = useState<any>(null);
    const [salvando, setSalvando] = useState(false);
    const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);

    const handleSalvar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSalvando(true);
        const formData = new FormData(e.currentTarget);

        if (grupoAtual?.id) formData.append("id", grupoAtual.id.toString());

        try {
            const res = await salvarGrupo(formData);
            if (res.sucesso) {
                setModo('lista');
                window.location.reload();
            } else {
                alert("Erro ao guardar o grupo.");
            }
        } catch (err) {
            alert("Erro de conexão.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id: number) => {
        setSalvando(true);
        const res = await excluirGrupo(id);
        if (res.sucesso) {
            window.location.reload();
        } else {
            alert("Erro ao excluir. Verifique se o grupo possui membros.");
            setConfirmarExclusao(null);
            setSalvando(false);
        }
    };

    return (
        <section className="bg-bg2 p-8 md:p-10 rounded-[3rem] border border-soft shadow-xl space-y-8 animate-in fade-in duration-500">

            {/* CABEÇALHO */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-soft pb-6">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-fg">
                        {modo === 'lista' ? "Grupos & Células" : grupoAtual ? "Editar Grupo" : "Novo Grupo"}
                    </h2>
                </div>
                {modo === 'lista' ? (
                    <button onClick={() => { setGrupoAtual(null); setModo('form'); }} className="bg-fg text-bg px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-figueira transition-all shadow-lg">+ Novo Grupo</button>
                ) : (
                    <button onClick={() => setModo('lista')} className="bg-soft text-fg px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-fg hover:text-bg transition-all">← Cancelar</button>
                )}
            </header>

            {/* MODO LISTA */}
            {modo === 'lista' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    {grupos.map((grupo) => (
                        <div key={grupo.id} className="group bg-bg border border-soft p-6 rounded-3xl shadow-sm hover:border-figueira/50 transition-all relative overflow-hidden">

                            {confirmarExclusao === grupo.id && (
                                <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center animate-in zoom-in-95">
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Excluir Grupo?</p>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => handleExcluir(grupo.id)} className="flex-1 bg-white text-red-600 py-2 rounded-xl font-black text-[9px] uppercase hover:bg-gray-100">Sim</button>
                                        <button onClick={() => setConfirmarExclusao(null)} className="flex-1 bg-black/20 text-white py-2 rounded-xl font-black text-[9px] uppercase">Não</button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black italic tracking-tighter uppercase text-fg">{grupo.nome}</h3>
                                <button onClick={() => setConfirmarExclusao(grupo.id)} className="text-muted hover:text-red-500 transition-colors">🗑️</button>
                            </div>
                            <div className="space-y-1 mb-6">
                                <p className="text-[10px] text-muted font-bold uppercase tracking-tight">📍 {grupo.bairro}, {grupo.cidade}</p>
                                <p className="text-[10px] text-figueira font-black uppercase tracking-widest">{grupo.dia_semana} às {grupo.horario}</p>
                            </div>
                            <button onClick={() => { setGrupoAtual(grupo); setModo('form'); }} className="w-full py-3 border border-soft text-fg rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all">Editar Dados</button>
                        </div>
                    ))}
                </div>
            )}

            {/* MODO FORMULÁRIO */}
            {modo === 'form' && (
                <form onSubmit={handleSalvar} className="space-y-10 animate-in zoom-in-95 duration-300">

                    {/* SEÇÃO 1: INFORMAÇÕES GERAIS */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">01. Informações Gerais</span>
                            <div className="h-[1px] flex-1 bg-soft"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Nome do Grupo</label>
                                <input name="nome" defaultValue={grupoAtual?.nome || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Categoria</label>
                                <select name="categoria" defaultValue={grupoAtual?.categoria || ''} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none">
                                    <option value="Célula">Célula</option>
                                    <option value="Estudo Bíblico">Estudo Bíblico</option>
                                    <option value="Reunião de Oração">Reunião de Oração</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Dia da Semana</label>
                                <select name="dia_semana" defaultValue={grupoAtual?.dia_semana || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none">
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
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Horário</label>
                                <input name="horario" type="time" defaultValue={grupoAtual?.horario || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Perfil</label>
                                <input name="perfil" defaultValue={grupoAtual?.perfil || ''} placeholder="Ex: Jovens" className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: LOCALIZAÇÃO */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">02. Localização</span>
                            <div className="h-[1px] flex-1 bg-soft"></div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Endereço</label>
                                <input name="endereco" defaultValue={grupoAtual?.endereco || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Nº</label>
                                <input name="numero" defaultValue={grupoAtual?.numero || ''} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Bairro</label>
                                <input name="bairro" defaultValue={grupoAtual?.bairro || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Cidade</label>
                                <input name="cidade" defaultValue={grupoAtual?.cidade || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Estado</label>
                                <input name="estado" defaultValue={grupoAtual?.estado || ''} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">País</label>
                                <input name="pais" defaultValue={grupoAtual?.pais || 'Portugal'} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 4: MEMBROS E LÍDERES (NOVA) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-figueira">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">03. Membros & Liderança</span>
                            <div className="h-[1px] flex-1 bg-soft"></div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Seleção de Líderes */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Líderes do Grupo</label>
                                <div className="bg-bg border border-soft rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                    {membrosDisponiveis.map(m => (
                                        <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-soft rounded-xl cursor-pointer transition-all">
                                            <input
                                                type="checkbox"
                                                name="lideres_ids"
                                                value={m.id}
                                                //defaultChecked={grupoAtual?.lideres?.some((l: any) => l.id === m.id)}
                                                defaultChecked={grupoAtual?.lideres?.some((l: any) => l.id === m.id) || false}
                                                className="w-4 h-4 accent-figueira"
                                            />
                                            <span className="text-xs font-bold uppercase">{m.first_name} {m.last_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Seleção de Membros */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Membros do Grupo</label>
                                <div className="bg-bg border border-soft rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                    {membrosDisponiveis.map(m => (
                                        <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-soft rounded-xl cursor-pointer transition-all">
                                            <input
                                                type="checkbox"
                                                name="membros_ids"
                                                value={m.id}
                                                defaultChecked={grupoAtual?.membros?.some((mem: any) => mem.id === m.id)}
                                                className="w-4 h-4 accent-figueira"
                                            />
                                            <span className="text-xs font-bold uppercase">{m.first_name} {m.last_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO FINAL: VÍNCULO E DESCRIÇÃO */}
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Departamento Responsável</label>
                                <select name="departamento_id" defaultValue={grupoAtual?.departamento_id || ''} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none">
                                    <option value="">Nenhum</option>
                                    {departamentos.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Descrição</label>
                                <textarea name="descricao" rows={3} defaultValue={grupoAtual?.descricao || ''} className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-sm focus:border-figueira outline-none resize-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-soft flex justify-end">
                        <button type="submit" disabled={salvando} className="bg-fg text-bg px-16 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-2xl disabled:opacity-50">
                            {salvando ? "A Processar..." : grupoAtual ? "Atualizar Grupo" : "Finalizar Cadastro"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}