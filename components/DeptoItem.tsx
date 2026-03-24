"use client"
import { useState } from 'react'
import PainelGerenciarDepto from '@/components/PainelGerenciarDepto'

export default function DeptoItem({ depto, membrosDisponiveis, onExcluir }: any) {
    const [painelAberto, setPainelAberto] = useState(false);
    const total = depto._count?.integrantes || 0;

    // Cores aleatórias baseadas no ID para o gradiente de fundo se não houver foto
    const gradients = [
        "from-figueira to-orange-400",
        "from-blue-600 to-cyan-400",
        "from-purple-600 to-pink-400",
        "from-emerald-500 to-teal-400"
    ];
    const myGradient = gradients[depto.id % gradients.length];

    return (
        <>
            <div className="group bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:border-figueira/30 transition-all duration-500">

                {/* ÁREA DA IMAGEM / ÍCONE */}
                <div className={`w-full md:w-40 h-32 md:h-auto bg-gradient-to-br ${myGradient} flex items-center justify-center relative overflow-hidden`}>
                    {/* Um padrão de fundo sutil */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-wrap gap-2 p-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border border-white" />
                        ))}
                    </div>

                    <span className="text-white text-4xl font-black italic drop-shadow-md relative z-10">
                        {depto.nome[0].toUpperCase()}
                    </span>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-figueira font-black text-[8px] uppercase tracking-[0.2em] mb-1 block">Setor Ativo</span>
                            <h4 className="text-xl font-black uppercase italic text-fg leading-tight">
                                {depto.nome}
                            </h4>
                            <p className="text-[10px] font-bold text-muted mt-1 uppercase">
                                <span className="text-figueira">Líder:</span> {depto.lider ? `${depto.lider.first_name} ${depto.lider.last_name}` : "Não definido"}
                            </p>
                        </div>

                        <button
                            onClick={() => confirm("Excluir?") && onExcluir(depto.id)}
                            className="text-muted hover:text-red-500 p-2 transition-colors"
                        >✕</button>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <div className="flex gap-2">
                            <span className="text-[8px] font-black bg-soft/50 px-3 py-1 rounded-full uppercase text-muted">
                                {total} Pessoas
                            </span>
                            <span className="text-[8px] font-black bg-soft/50 px-3 py-1 rounded-full uppercase text-muted">
                                {depto.funcoes?.length || 0} Funções
                            </span>
                        </div>

                        <button
                            onClick={() => setPainelAberto(true)}
                            className="bg-fg text-bg px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-figueira transition-all shadow-sm active:scale-95"
                        >
                            Gerenciar
                        </button>
                    </div>
                </div>
            </div>

            {painelAberto && (
                <PainelGerenciarDepto
                    depto={depto}
                    membrosDisponiveis={membrosDisponiveis}
                    onClose={() => setPainelAberto(false)}
                />
            )}
        </>
    )
}