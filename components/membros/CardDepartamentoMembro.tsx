'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ShieldCheck, Calendar, Users,
    ChevronDown, ChevronUp, LayoutGrid, Edit3, ArrowRight
} from 'lucide-react'

export default function CardDepartamentoMembro({ depto, membroId, role }: any) {
    // Agora este estado controla o card inteiro para TODOS os utilizadores
    const [expandido, setExpandido] = useState(false)

    // Identificadores de tipo
    const isGrupo = depto.tipo === 'GRUPO';

    // Lógica de Funções e Permissões
    let funcoesDoMembro = depto.funcoes ? [...depto.funcoes] : [];

    // Suporte ao novo array de líderes
    const ehLiderPeloID = depto.lideres?.some((lider: any) => lider.id === membroId) || depto.lider_id === membroId;
    const ehAdmin = role === 'ADMIN';

    let temPalavraLider = funcoesDoMembro.some(f =>
        f.toLowerCase().includes('lider') || f.toLowerCase().includes('líder')
    );

    if (ehLiderPeloID && !temPalavraLider) {
        funcoesDoMembro.unshift('Líder');
        temPalavraLider = true;
    }

    if (funcoesDoMembro.length === 0) funcoesDoMembro.push(isGrupo ? 'Participante' : 'Voluntário');

    const funcoesTexto = funcoesDoMembro.join(' • ');
    const podeGerenciar = ehAdmin || temPalavraLider || ehLiderPeloID;

    return (
        <div className={`
            p-6 rounded-[2.5rem] transition-all group relative overflow-hidden shadow-sm border-2 flex flex-col justify-between
            ${podeGerenciar
                ? 'bg-figueira border-white ring-4 ring-figueira/5 shadow-lg'
                : 'bg-bg2 border-soft hover:border-blue-500/30'
            }
        `}>

            {/* ÍCONE DE FUNDO DECORATIVO */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                {isGrupo ? <Users size={120} /> : <LayoutGrid size={120} />}
            </div>

            <div className="space-y-4 relative z-10">

                {/* CABEÇALHO CLICÁVEL (CONTRAÍDO/EXPANDIDO) */}
                <div
                    onClick={() => setExpandido(!expandido)}
                    className="cursor-pointer select-none space-y-4"
                >
                    {/* TOPO: BADGES E BOTÃO REVELAR */}
                    <div className="flex justify-between items-center h-6">
                        <div className="flex items-center gap-2">
                            {podeGerenciar ? (
                                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                    <ShieldCheck size={10} className="text-white" />
                                    <span className="text-[7px] font-black uppercase text-white tracking-widest">Gestão Ativa</span>
                                </div>
                            ) : (
                                <div className="px-2 py-0.5 rounded-full border border-soft bg-soft text-muted text-[7px] font-black uppercase tracking-widest transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200">
                                    {isGrupo ? 'Célula / Grupo' : 'Departamento'}
                                </div>
                            )}
                        </div>

                        {/* A SETINHA AGORA APARECE PARA TODOS */}
                        <button
                            className={`p-1.5 rounded-lg transition-all active:scale-90 ${podeGerenciar ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-soft hover:bg-blue-100 text-muted hover:text-blue-600'}`}
                        >
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>

                    {/* TÍTULO E ÍCONE PRINCIPAL */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${expandido ? 'scale-110' : ''} ${podeGerenciar ? 'bg-white/20 text-white' : (isGrupo ? 'bg-blue-600 text-white' : 'bg-figueira text-white')}`}>
                            {isGrupo ? <Users size={18} /> : <LayoutGrid size={18} />}
                        </div>
                        <h4 className={`text-lg font-black uppercase italic leading-none tracking-tighter ${podeGerenciar ? 'text-white' : 'text-fg'}`}>
                            {depto.nome}
                        </h4>
                    </div>
                </div>

                {/* DETALHES EXPANDIDOS (SÓ APARECEM SE CLICAR) */}
                {expandido && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4 pt-2">

                        {/* FUNÇÕES DESIGNADAS */}
                        <div className={`p-3 rounded-xl border ${podeGerenciar ? 'bg-white/10 border-white/10' : 'bg-bg border-soft'}`}>
                            <p className={`text-[9px] font-bold leading-tight uppercase tracking-tight ${podeGerenciar ? 'text-white/90' : 'text-fg/70'}`}>
                                <span className={`opacity-50 block text-[7px] mb-0.5 ${podeGerenciar ? 'text-white' : 'text-muted'}`}>Minha Função:</span>
                                {funcoesTexto}
                            </p>
                        </div>

                        {/* OPÇÕES REVELADAS (GESTÃO - PARA LÍDERES) */}
                        {podeGerenciar && (
                            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/10">
                                {isGrupo ? (
                                    <Link href={`/membros/gestao/grupo/${depto.id}`} className="flex items-center justify-center gap-2 bg-white text-blue-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all shadow-md">
                                        <Edit3 size={12} /> Gerir Célula
                                    </Link>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/membros/gestao/escalas/${depto.id}`} className="flex items-center justify-center gap-2 bg-white text-figueira py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all shadow-md">
                                            <Calendar size={12} /> Escalas
                                        </Link>
                                        <Link href={`/membros/gestao/equipa/${depto.id}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border border-white/20 text-white hover:bg-white/10">
                                            <Users size={12} /> Equipa
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* BOTÃO VISUALIZAR (PARA MEMBROS COMUNS) */}
                        {!podeGerenciar && isGrupo && (
                            <div className="pt-2 border-t border-soft">
                                <Link href={`/membros/gestao/grupo/${depto.id}`} className="flex items-center justify-center gap-2 bg-bg border border-soft text-fg py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm group/btn">
                                    <Users size={12} className="text-blue-500 group-hover/btn:text-white transition-colors" /> Acessar Célula <ArrowRight size={12} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* EFEITO DE BRILHO AO FUNDO */}
            {podeGerenciar && (
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
            )}
        </div>
    )
}