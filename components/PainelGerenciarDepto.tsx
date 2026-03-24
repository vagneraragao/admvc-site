"use client"
import { useState, useRef } from 'react'
import {
    atualizarDepartamento,
    adicionarFuncaoAoDepto,
    removerFuncaoDoDepto,
    vincularMembroDepartamento,
    removerMembroDepartamento
} from '@/actions/admin-actions'

export default function PainelGerenciarDepto({ depto, membrosDisponiveis, onClose }: any) {
    const [aba, setAba] = useState<'equipe' | 'funcoes' | 'dados'>('equipe');
    const formFuncaoRef = useRef<HTMLFormElement>(null);
    const formEquipeRef = useRef<HTMLFormElement>(null);

    // --- LÓGICA DE AGRUPAMENTO DE MEMBROS ---
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
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-fg/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            {/* Painel Lateral */}
            <div className="relative w-full max-w-xl bg-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

                {/* HEADER FIXO */}
                <header className="p-8 border-b border-soft bg-bg2">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-figueira font-black text-[9px] uppercase tracking-[0.3em]">Gestão Setorial</span>
                            <h2 className="text-3xl font-black italic uppercase text-fg leading-none mt-1">{depto.nome}</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-soft/30 hover:bg-soft transition-all">✕</button>
                    </div>

                    <div className="flex gap-6 mt-8">
                        {['equipe', 'funcoes', 'dados'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setAba(t as any)}
                                className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${aba === t ? 'border-figueira text-fg' : 'border-transparent text-muted hover:text-fg'}`}
                            >
                                {t === 'equipe' ? '👥 Equipe' : t === 'funcoes' ? '⚙️ Cargos' : '📝 Dados'}
                            </button>
                        ))}
                    </div>
                </header>

                {/* CONTEÚDO SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* ABA: DADOS DO DEPARTAMENTO */}
                    {aba === 'dados' && (
                        <form action={async (formData) => {
                            const res = await atualizarDepartamento(formData);
                            if (res?.ok) alert("Informações atualizadas!");
                        }} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <input type="hidden" name="id" value={depto.id} />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-2">Nome Oficial</label>
                                <input name="nome" defaultValue={depto.nome} required className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold focus:border-figueira outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-2">Responsável (Líder)</label>
                                <select name="lider_id" defaultValue={depto.lider_id || ""} className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs focus:border-figueira outline-none">
                                    <option value="">Sem líder associado</option>
                                    {membrosDisponiveis.map((m: any) => (
                                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-2">Descrição / Notas</label>
                                <textarea name="descricao" defaultValue={depto.descricao} rows={4} className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold focus:border-figueira outline-none resize-none" />
                            </div>

                            <button className="w-full bg-fg text-bg py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-figueira transition-all shadow-xl">
                                Salvar Alterações
                            </button>
                        </form>
                    )}

                    {/* ABA: FUNÇÕES (CADASTRO DE CARGOS DO SETOR) */}
                    {aba === 'funcoes' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <form
                                ref={formFuncaoRef}
                                action={async (fd) => {
                                    await adicionarFuncaoAoDepto(fd);
                                    formFuncaoRef.current?.reset();
                                }}
                                className="flex gap-2"
                            >
                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <input name="nome" placeholder="Nova função (ex: Tecladista)" required className="flex-1 bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira" />
                                <button className="bg-figueira text-white px-8 rounded-2xl font-black text-[10px] uppercase hover:shadow-lg hover:shadow-figueira/20 transition-all">Add</button>
                            </form>

                            <div className="grid grid-cols-1 gap-2">
                                <h3 className="text-[10px] font-black uppercase text-muted ml-2 mb-2 tracking-widest">Cargos Habilitados</h3>
                                {depto.funcoes?.map((f: any) => (
                                    <div key={f.id} className="group flex justify-between items-center p-4 bg-bg2 border border-soft rounded-2xl hover:border-figueira/30 transition-all">
                                        <span className="text-xs font-black uppercase text-fg tracking-tight">{f.nome}</span>
                                        <button
                                            onClick={() => confirm("Excluir esta função?") && removerFuncaoDoDepto(f.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ABA: EQUIPE (VÍNCULO AGRUPADO) */}
                    {aba === 'equipe' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <form
                                ref={formEquipeRef}
                                action={async (fd) => {
                                    const res = await vincularMembroDepartamento(fd);
                                    if (res?.ok) formEquipeRef.current?.reset();
                                    else if (res?.error) alert(res.error);
                                }}
                                className="bg-bg2 p-6 rounded-[2.5rem] border border-soft shadow-sm space-y-4"
                            >
                                <input type="hidden" name="departamento_id" value={depto.id} />
                                <div className="space-y-4">
                                    <select name="membro_id" required className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold focus:border-figueira outline-none">
                                        <option value="">Selecionar Pessoa...</option>
                                        {membrosDisponiveis.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                        ))}
                                    </select>

                                    <select name="funcao" required className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold focus:border-figueira outline-none">
                                        <option value="">Atribuir Função...</option>
                                        {depto.funcoes?.map((f: any) => (
                                            <option key={f.id} value={f.nome}>{f.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <button className="w-full bg-figueira text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-figueira/20 transition-all">
                                    Adicionar à Equipe
                                </button>
                            </form>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest">Integrantes e Atribuições</h3>

                                {listaIntegrantesAgrupados.map((grupo: any) => (
                                    <div key={grupo.membro.id} className={`flex gap-4 p-5 border rounded-[1.8rem] transition-all bg-bg2 border-soft ${grupo.membro.id === depto.lider_id ? 'border-figueira/30 bg-figueira/[0.02]' : ''}`}>
                                        {/* Avatar Iniciais */}
                                        <div className="w-12 h-12 rounded-2xl bg-bg border border-soft flex items-center justify-center text-[10px] font-black text-figueira shadow-sm flex-shrink-0">
                                            {grupo.membro.first_name[0]}{grupo.membro.last_name[0]}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-[12px] font-black uppercase text-fg truncate">{grupo.membro.first_name} {grupo.membro.last_name}</p>
                                                {grupo.membro.id === depto.lider_id && <span className="text-[7px] bg-figueira text-white px-2 py-0.5 rounded-full font-black uppercase">Líder</span>}
                                            </div>

                                            {/* LISTA DE TAGS DE FUNÇÃO */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {grupo.atribuicoes.map((atrib: any) => (
                                                    <div key={atrib.id} className="group/atrib flex items-center gap-1.5 bg-white border border-soft px-2.5 py-1 rounded-full hover:border-figueira/30 transition-all">
                                                        <span className="text-[9px] font-bold text-figueira uppercase italic tracking-wide">{atrib.nome}</span>
                                                        <button
                                                            onClick={() => confirm(`Remover a função ${atrib.nome}?`) && removerMembroDepartamento(atrib.id)}
                                                            className="text-muted hover:text-red-500 transition-all text-[8px] font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {depto.integrantes?.length === 0 && (
                                    <p className="text-[10px] text-center text-muted py-8 font-bold uppercase tracking-widest">Nenhum integrante vinculado</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}