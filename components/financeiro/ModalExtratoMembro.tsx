'use client'

import { useState, useEffect } from 'react'
import { FileText, X, Printer, Download, Loader2, Building2 } from 'lucide-react'
import { buscarExtratoFinanceiroMembro } from '@/actions/financeiro-actions' 

export default function ModalExtratoMembro({ membro }: { membro: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transacoes, setTransacoes] = useState<any[]>([]);
    
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    
    // Filtros
    const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
    const [mesSelecionado, setMesSelecionado] = useState(0); // 0 = Ano Inteiro

    const mesesNome = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    useEffect(() => {
        if (!isOpen || !membro) return;

        async function carregarDados() {
            setLoading(true);
            const res = await buscarExtratoFinanceiroMembro(membro.id, anoSelecionado, mesSelecionado);
            if (res.sucesso) {
                setTransacoes(res.transacoes);
            }
            setLoading(false);
        }
        carregarDados();
    }, [isOpen, anoSelecionado, mesSelecionado, membro]);

    // Lógica para agrupar as transações por TIPO (Dízimos, Ofertas, Campanhas)
    const resumoPorTipo = transacoes.reduce((acc: any, t: any) => {
        if (!acc[t.tipo]) acc[t.tipo] = 0;
        acc[t.tipo] += t.valor;
        return acc;
    }, {});

    const totalGeral = transacoes.reduce((sum, t) => sum + t.valor, 0);
    const euro = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

    const handlePrint = () => {
        window.print();
    };

    // Título Dinâmico do Relatório
    const tituloRelatorio = mesSelecionado === 0 
        ? `Extrato Financeiro Anual • ${anoSelecionado}` 
        : `Extrato Financeiro Mensal • ${mesesNome[mesSelecionado - 1]} ${anoSelecionado}`;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-bg2 text-fg border border-soft hover:border-figueira hover:text-figueira transition-all text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2"
            >
                <FileText size={14} /> Gerar Extrato
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm print:bg-white print:p-0 animate-in fade-in">
                    
                    <div className="bg-bg2 w-full max-w-4xl border border-soft p-8 md:p-12 rounded-[3rem] shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar print:max-h-none print:shadow-none print:border-none print:rounded-none print:p-8 print:w-full print:absolute print:top-0 print:left-0 print:bg-white print:text-black">
                        
                        {/* ========================================= */}
                        {/* BARRA DE FERRAMENTAS (Escondida na Impressão) */}
                        {/* ========================================= */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 print:hidden">
                            
                            {/* Filtros de Data Lado a Lado */}
                            <div className="flex items-center gap-2 bg-bg p-1.5 rounded-2xl border border-soft shadow-sm w-full md:w-auto">
                                
                                <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-soft/30 rounded-xl transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">Ano:</span>
                                    <select 
                                        value={anoSelecionado}
                                        onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                                        className="bg-transparent text-xs font-black text-fg focus:outline-none cursor-pointer"
                                    >
                                        {[anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3].map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="w-[1px] h-6 bg-soft"></div> {/* Separador Visual */}

                                <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-soft/30 rounded-xl transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">Mês:</span>
                                    <select 
                                        value={mesSelecionado}
                                        onChange={(e) => setMesSelecionado(Number(e.target.value))}
                                        className="bg-transparent text-xs font-black text-fg focus:outline-none cursor-pointer"
                                    >
                                        <option value={0}>Todos (Ano Inteiro)</option>
                                        {mesesNome.map((m, index) => (
                                            <option key={index + 1} value={index + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button onClick={handlePrint} className="bg-figueira text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all flex items-center gap-2 shadow-sm">
                                    <Printer size={14} /> Imprimir / PDF
                                </button>
                                <button onClick={() => setIsOpen(false)} className="bg-soft/50 text-muted p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* ========================================= */}
                        {/* DOCUMENTO PARA IMPRESSÃO                  */}
                        {/* ========================================= */}
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center text-figueira gap-4 print:hidden">
                                <Loader2 size={40} className="animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">A compilar relatório...</span>
                            </div>
                        ) : (
                            <div id="extrato-print" className="space-y-10 print:text-black">
                                
                                {/* CABEÇALHO DO DOCUMENTO */}
                                <div className="flex justify-between items-start border-b-2 border-soft print:border-gray-200 pb-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-figueira print:text-black">
                                            <Building2 size={24} />
                                            <h1 className="text-2xl font-black uppercase tracking-tighter">Assembleia de Deus</h1>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted print:text-gray-500">
                                            {tituloRelatorio}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase text-fg print:text-black">{membro.first_name} {membro.last_name}</p>
                                        <p className="text-[10px] font-bold text-muted print:text-gray-500 mt-1">Data de Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
                                    </div>
                                </div>

                                {/* RESUMO AGRUPADO (BOXES) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                                    {Object.entries(resumoPorTipo).map(([tipo, valor]: any) => (
                                        <div key={tipo} className="bg-bg border border-soft rounded-2xl p-4 print:border-gray-300 print:bg-transparent">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted print:text-gray-500">{tipo}</p>
                                            <p className="text-lg font-black text-fg mt-1 print:text-black">{euro(valor)}</p>
                                        </div>
                                    ))}
                                    <div className="bg-figueira/10 border border-figueira/20 rounded-2xl p-4 print:border-black print:bg-gray-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-figueira print:text-black">Total Geral</p>
                                        <p className="text-xl font-black text-figueira mt-1 print:text-black">{euro(totalGeral)}</p>
                                    </div>
                                </div>

                                {/* LISTAGEM DETALHADA */}
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-muted print:text-gray-500 mb-4 border-b border-soft print:border-gray-200 pb-2">
                                        Detalhamento de Entradas
                                    </h3>
                                    
                                    {transacoes.length === 0 ? (
                                        <p className="text-xs italic text-muted print:text-gray-500 py-4">Nenhum registo encontrado para o período selecionado.</p>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-soft print:border-gray-300">
                                                    <th className="py-3 text-[9px] font-black uppercase tracking-widest text-muted print:text-gray-500 w-24">Data</th>
                                                    <th className="py-3 text-[9px] font-black uppercase tracking-widest text-muted print:text-gray-500 w-32">Categoria</th>
                                                    <th className="py-3 text-[9px] font-black uppercase tracking-widest text-muted print:text-gray-500">Descrição</th>
                                                    <th className="py-3 text-[9px] font-black uppercase tracking-widest text-muted print:text-gray-500 text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-soft/50 print:divide-gray-200">
                                                {transacoes.map((t) => (
                                                    <tr key={t.id} className="hover:bg-soft/10 print:hover:bg-transparent">
                                                        <td className="py-4 text-xs font-bold text-fg print:text-black">
                                                            {new Date(t.data).toLocaleDateString('pt-PT')}
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="text-[9px] font-black uppercase tracking-widest bg-bg border border-soft px-2 py-1 rounded-md print:border-none print:p-0 print:text-black">
                                                                {t.tipo}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-xs font-medium text-muted print:text-gray-700">
                                                            {t.descricao}
                                                        </td>
                                                        <td className="py-4 text-sm font-black text-fg print:text-black text-right">
                                                            {euro(t.valor)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* ASSINATURA */}
                                <div className="pt-24 pb-8 flex justify-center hidden print:flex">
                                    <div className="text-center">
                                        <div className="w-64 h-[1px] bg-black mb-2"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-black">Departamento de Tesouraria</p>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}