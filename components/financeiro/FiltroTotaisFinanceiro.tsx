'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, Filter } from 'lucide-react'

interface Transacao {
    valor: number;
    data: string;
    categoria: string;
}

export default function FiltroTotaisFinanceiro({ transacoes }: { transacoes: Transacao[] }) {
    const [mes, setMes] = useState<string>('TODOS')
    const [categoria, setCategoria] = useState<string>('TODAS')

    // Nomes dos meses para o filtro
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    // Filtra as transações em tempo real
    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter(t => {
            const dataT = new Date(t.data)
            const matchMes = mes === 'TODOS' || dataT.getMonth() === parseInt(mes)

            // Agrupamos Dízimos e Ofertas na mesma categoria visual se o filtro for "CONTRIBUICOES"
            let catTransacao = t.categoria
            if (categoria === 'CONTRIBUICOES' && (t.categoria === 'DIZIMO' || t.categoria === 'OFERTA' || t.categoria === 'MISSOES')) {
                catTransacao = 'CONTRIBUICOES'
            }

            const matchCat = categoria === 'TODAS' || catTransacao === categoria

            return matchMes && matchCat
        })
    }, [transacoes, mes, categoria])

    // Calcula os totais baseados no filtro atual
    const totais = useMemo(() => {
        return transacoesFiltradas.reduce((acc, t) => {
            acc.geral += t.valor
            if (t.categoria === 'CARNE') acc.carnes += t.valor
            else if (t.categoria === 'RIFA') acc.rifas += t.valor
            else if (t.categoria === 'CANTINA') acc.cantina += t.valor
            else acc.contribuicoes += t.valor // Dízimos, Ofertas, Missões
            return acc
        }, { geral: 0, carnes: 0, rifas: 0, cantina: 0, contribuicoes: 0 })
    }, [transacoesFiltradas])

    const euro = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v)

    return (
        <section className="bg-bg2 border border-soft rounded-[3rem] p-8 md:p-10 shadow-sm relative overflow-hidden">

            {/* CABEÇALHO DO FILTRO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-fg flex items-center gap-3">
                        <Filter size={24} className="text-figueira" />
                        Relatório Consolidado
                    </h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                        Filtre as receitas para análise detalhada
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* FILTRO POR MÊS */}
                    <select
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        className="bg-bg border-2 border-soft rounded-2xl px-4 py-3 text-xs font-black text-fg focus:border-figueira outline-none cursor-pointer flex-1 md:flex-none"
                    >
                        <option value="TODOS">Todos os Meses</option>
                        {meses.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>

                    {/* FILTRO POR CATEGORIA */}
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="bg-bg border-2 border-soft rounded-2xl px-4 py-3 text-xs font-black text-fg focus:border-figueira outline-none cursor-pointer flex-1 md:flex-none"
                    >
                        <option value="TODAS">Todas as Origens</option>
                        <option value="CARNE">Apenas Carnês</option>
                        <option value="RIFA">Apenas Rifas</option>
                        <option value="CANTINA">Apenas Cantina</option>
                        <option value="CONTRIBUICOES">Dízimos e Ofertas</option>
                    </select>
                </div>
            </div>

            {/* CAIXA VERDE DE TOTAIS (Movida para aqui) */}
            <div className="bg-figueira text-white p-8 md:p-10 rounded-[2.5rem] shadow-lg shadow-figueira/20 relative overflow-hidden flex flex-col justify-between gap-6">
                <TrendingUp className="absolute -top-10 -right-10 w-64 h-64 text-white/5 rotate-12" />

                <div className="relative z-10">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-2">Total Arrecadado (Filtro Atual)</span>
                    <h4 className="text-5xl font-black italic text-white leading-none tracking-tighter">{euro(totais.geral)}</h4>
                </div>

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/10 mt-2">
                    <div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">Carnês</span>
                        <span className="text-lg font-black italic text-white/90">{euro(totais.carnes)}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">Rifas</span>
                        <span className="text-lg font-black italic text-white/90">{euro(totais.rifas)}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">Cantina</span>
                        <span className="text-lg font-black italic text-white/90">{euro(totais.cantina)}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">Dízimos/Ofertas</span>
                        <span className="text-lg font-black italic text-white/90">{euro(totais.contribuicoes)}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}