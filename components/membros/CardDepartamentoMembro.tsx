'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ShieldCheck, Calendar, Users,
    ChevronDown, ChevronUp, LayoutGrid, Edit3
} from 'lucide-react'

export default function CardDepartamentoMembro({ depto, membroId, role }: any) {
    const [mostrarOpcoes, setMostrarOpcoes] = useState(false)

    // Identificadores de tipo
    const isGrupo = depto.tipo === 'GRUPO';

    // Lógica de Funções e Permissões
    let funcoesDoMembro = depto.funcoes ? [...depto.funcoes] : [];
    const ehLiderPeloID = depto.lider_id === membroId;
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
            p-6 rounded-[2.5rem] transition-all group relative overflow-hidden shadow-sm border-2 
            ${podeGerenciar
                ? 'bg-figueira border-white ring-4 ring-figueira/5 shadow-lg'
                : 'bg-bg2 border-soft hover:border-figueira/30'
            }
        `}>

            {/* ÍCONE DE FUNDO DECORATIVO (Sempre Muted/Soft) */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                {isGrupo ? <Users size={120} /> : <LayoutGrid size={120} />}
            </div>

            <div className="space-y-4 relative z-10">

                {/* TOPO: BADGES E BOTÃO REVELAR */}
                <div className="flex justify-between items-center h-6">
                    <div className="flex items-center gap-2">
                        {podeGerenciar ? (
                            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                <ShieldCheck size={10} className="text-white" />
                                <span className="text-[7px] font-black uppercase text-white tracking-widest">Gestão Ativa</span>
                            </div>
                        ) : (
                            <div className="px-2 py-0.5 rounded-full border border-soft bg-soft text-muted text-[7px] font-black uppercase tracking-widest">
                                {isGrupo ? 'Célula / Grupo' : 'Departamento'}
                            </div>
                        )}
                    </div>

                    {podeGerenciar && (
                        <button
                            onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
                            className="bg-white/20 hover:bg-white/40 p-1.5 rounded-lg text-white transition-all active:scale-90"
                        >
                            {mostrarOpcoes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                </div>

                {/* TÍTULO E ÍCONE PRINCIPAL */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${podeGerenciar ? 'bg-white/20 text-white' : 'bg-figueira text-white'}`}>
                        {isGrupo ? <Users size={18} /> : <LayoutGrid size={18} />}
                    </div>
                    <h4 className={`text-lg font-black uppercase italic leading-none tracking-tighter ${podeGerenciar ? 'text-white' : 'text-fg'}`}>
                        {depto.nome}
                    </h4>
                </div>

                {/* FUNÇÕES DESIGNADAS */}
                <div className={`p-3 rounded-xl border ${podeGerenciar ? 'bg-white/10 border-white/10' : 'bg-bg border-soft'}`}>
                    <p className={`text-[9px] font-bold leading-tight uppercase tracking-tight ${podeGerenciar ? 'text-white/90' : 'text-fg/70'}`}>
                        <span className={`opacity-50 block text-[7px] mb-0.5 ${podeGerenciar ? 'text-white' : 'text-muted'}`}>Minha Função:</span>
                        {funcoesTexto}
                    </p>
                </div>

                {/* OPÇÕES REVELADAS (GESTÃO) */}
                {podeGerenciar && mostrarOpcoes && (
                    <div className="grid grid-cols-1 gap-2 mt-2 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                        {isGrupo ? (
                            <Link href={`/membros/gestao/grupo/${depto.id}`} className="flex items-center justify-center gap-2 bg-white text-figueira py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all shadow-md">
                                <Edit3 size={12} /> Gerir Grupo
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
            </div>

            {/* EFEITO DE BRILHO AO FUNDO */}
            {podeGerenciar && (
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            )}
        </div>
    )
}