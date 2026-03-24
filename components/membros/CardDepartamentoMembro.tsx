'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react'

export default function CardDepartamentoMembro({ depto, membroId, role }: any) {
    const [mostrarOpcoes, setMostrarOpcoes] = useState(false)

    let funcoesDoMembro = [...depto.funcoes];
    const ehLiderPeloID = depto.lider_id === membroId;
    const ehAdmin = role === 'ADMIN';

    let temPalavraLider = funcoesDoMembro.some(f =>
        f.toLowerCase().includes('lider') || f.toLowerCase().includes('líder')
    );

    if (ehLiderPeloID && !temPalavraLider) {
        funcoesDoMembro.unshift('Líder');
        temPalavraLider = true;
    }

    if (funcoesDoMembro.length === 0) funcoesDoMembro.push('Voluntário');

    const funcoesTexto = funcoesDoMembro.join(' • ');
    const podeGerenciar = ehLiderPeloID || ehAdmin || temPalavraLider;

    return (
        <div className={`p-6 rounded-[2.5rem] transition-all group relative overflow-hidden shadow-sm border-2 ${podeGerenciar ? 'bg-figueira border-white ring-4 ring-figueira/5 shadow-lg' : 'bg-bg2 border-soft'}`}>
            <div className="space-y-4 relative z-10">

                {/* TOPO: ÍCONE E BOTÃO REVELAR */}
                <div className="flex justify-between items-center h-5">
                    <div className="flex items-center gap-2">
                        {podeGerenciar && (
                            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                <ShieldCheck size={12} className="text-white" />
                                <span className="text-[8px] font-black uppercase text-white tracking-widest">Gestão</span>
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

                {/* TÍTULO DO DEPARTAMENTO (REDUZIDO) */}
                <h4 className={`text-xl font-black uppercase italic leading-none tracking-tighter ${podeGerenciar ? 'text-white' : 'text-fg'}`}>
                    {depto.nome}
                </h4>

                {/* FUNÇÕES DESIGNADAS (MAIS COMPACTO) */}
                <div className={`p-3 rounded-xl border ${podeGerenciar ? 'bg-white/10 border-white/10' : 'bg-bg border-soft'}`}>
                    <p className={`text-[10px] font-bold leading-tight italic ${podeGerenciar ? 'text-white/90' : 'text-fg/80'}`}>
                        {funcoesTexto}
                    </p>
                </div>

                {/* OPÇÕES REVELADAS COM ANIMAÇÃO */}
                {podeGerenciar && mostrarOpcoes && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-white/10 animate-in slide-in-from-top-1 duration-300">
                        <Link href={`/membros/gestao/escalas/${depto.id}`} className="flex items-center justify-center gap-2 bg-white text-figueira py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-fg hover:text-bg transition-all w-full shadow-md">
                            <Calendar size={12} /> Escalas
                        </Link>
                        <Link href={`/membros/gestao/equipa/${depto.id}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all w-full border border-white/20 text-white hover:bg-white/10">
                            <Users size={12} /> Ver Equipa
                        </Link>
                    </div>
                )}
            </div>

            {/* EFEITO DE BRILHO AO FUNDO */}
            {podeGerenciar && <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>}
        </div>
    )
}