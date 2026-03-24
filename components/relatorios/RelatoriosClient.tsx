'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, ChevronRight, BarChart3, Users, Briefcase,
    Cake, CalendarHeart, Heart, Droplet, MapPin, ShieldCheck,
    X, PieChart, TrendingUp, ClipboardCheck, FileSignature
} from 'lucide-react'

export default function RelatoriosClient({ membros }: { membros: any[] }) {
    const [relatorioAtivo, setRelatorioAtivo] = useState<string | null>(null);

    // ------------------------------------------------------------------------
    // FUNÇÕES DE AGREGAÇÃO (Processamento de Dados Instantâneo)
    // ------------------------------------------------------------------------
    const dadosProcessados = useMemo(() => {
        if (!relatorioAtivo || membros.length === 0) return [];

        const agruparPor = (campo: string) => {
            const contagem = membros.reduce((acc: any, membro: any) => {
                const chave = membro[campo] || 'Não Informado';
                acc[chave] = (acc[chave] || 0) + 1;
                return acc;
            }, {});
            return Object.entries(contagem)
                .map(([label, valor]) => ({ label, valor: valor as number }))
                .sort((a, b) => b.valor - a.valor); // Ordena do maior para o menor
        };

        switch (relatorioAtivo) {
            case 'cargos': return agruparPor('church_role');
            case 'sexo': return agruparPor('gender');
            case 'estado_civil': return agruparPor('marital_status');
            case 'batismo': return agruparPor('baptism_status');
            case 'permissoes': return agruparPor('role');
            case 'cidade': return agruparPor('id_city');
            case 'bairro': return agruparPor('state');
            case 'gdpr':
                let assinados = 0;
                let pendentes = 0;
                membros.forEach(m => {
                    // Se o campo for true, conta como assinado, senão, pendente
                    if (m.termo_aceite) assinados++;
                    else pendentes++;
                });
                return [
                    { label: 'Assinado (Consentiu)', valor: assinados },
                    { label: 'Pendente / Faltam Assinar', valor: pendentes }
                ];
            case 'idade':
                const faixas = { '0-12': 0, '13-17': 0, '18-30': 0, '31-50': 0, '51+': 0, 'Desconhecida': 0 };
                membros.forEach(m => {
                    if (!m.birthdate) { faixas['Desconhecida']++; return; }
                    const idade = new Date().getFullYear() - new Date(m.birthdate).getFullYear();
                    if (idade <= 12) faixas['0-12']++;
                    else if (idade <= 17) faixas['13-17']++;
                    else if (idade <= 30) faixas['18-30']++;
                    else if (idade <= 50) faixas['31-50']++;
                    else faixas['51+']++;
                });
                return Object.entries(faixas).map(([label, valor]) => ({ label, valor })).filter(f => f.valor > 0);

            case 'aniversarios':
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const niverPorMes = Array(12).fill(0);
                let semData = 0;
                membros.forEach(m => {
                    if (m.birthdate) niverPorMes[new Date(m.birthdate).getMonth()]++;
                    else semData++;
                });
                const resNiver = meses.map((mes, i) => ({ label: mes, valor: niverPorMes[i] })).filter(m => m.valor > 0);
                if (semData > 0) resNiver.push({ label: 'Não Informado', valor: semData });
                return resNiver;

            case 'conversao':
                const anos = membros.reduce((acc: any, m: any) => {
                    const ano = m.admission_date ? new Date(m.admission_date).getFullYear().toString() : 'Desconhecido';
                    acc[ano] = (acc[ano] || 0) + 1;
                    return acc;
                }, {});
                return Object.entries(anos).map(([label, valor]) => ({ label, valor: valor as number })).sort((a, b) => b.label.localeCompare(a.label)); // Ordena por ano

            default: return [];
        }
    }, [relatorioAtivo, membros]);

    // ------------------------------------------------------------------------
    // CONFIGURAÇÃO DOS BOTÕES
    // ------------------------------------------------------------------------
    const relatoriosDisponiveis = [
        { id: 'cargos', label: 'Cargos e Funções', icon: <Briefcase size={18} /> },
        { id: 'idade', label: 'Faixa Etária', icon: <PieChart size={18} /> },
        { id: 'aniversarios', label: 'Aniversários', icon: <Cake size={18} /> },
        { id: 'sexo', label: 'Distribuição por Sexo', icon: <Users size={18} /> },
        { id: 'estado_civil', label: 'Estado Civil', icon: <Heart size={18} /> },
        { id: 'batismo', label: 'Status de Batismo', icon: <Droplet size={18} /> },
        { id: 'conversao', label: 'Admissão / Conversão', icon: <TrendingUp size={18} /> },
        { id: 'cidade', label: 'Cidades', icon: <MapPin size={18} /> },
        { id: 'bairro', label: 'Distritos e Bairros', icon: <MapPin size={18} /> },
        { id: 'permissoes', label: 'Permissões (Sistema)', icon: <ShieldCheck size={18} /> },
        { id: 'gdpr', label: 'Termo GDPR / Permanecer', icon: <FileSignature size={18} /> },
    ];

    // Para encontrar o título do modal
    const relatorioAtual = relatoriosDisponiveis.find(r => r.id === relatorioAtivo);

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Painel Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Relatórios</span>
            </nav>

            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <BarChart3 size={14} /> Módulo Analítico
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Métricas & <span className="text-muted/20">Relatórios.</span>
                    </h1>
                </div>
            </header>

            {/* --- CAIXA DE RELATÓRIOS (MEMBROS) --- */}
            <section className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm">
                <div className="flex items-center gap-4 border-b border-soft pb-8 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-fg text-bg flex items-center justify-center shrink-0 shadow-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-fg leading-none">Utilizadores & Membresia</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">
                            Análise demográfica de {membros.length} membros ativos
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {relatoriosDisponiveis.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setRelatorioAtivo(btn.id)}
                            className="group flex flex-col items-center justify-center gap-4 p-6 bg-bg border border-soft rounded-3xl hover:border-figueira hover:shadow-lg hover:shadow-figueira/10 transition-all active:scale-95 text-center"
                        >
                            <div className="text-muted group-hover:text-figueira group-hover:-translate-y-1 transition-all duration-300">
                                {btn.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-fg leading-tight">
                                {btn.label}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* --- MODAL DE VISUALIZAÇÃO DO RELATÓRIO --- */}
            {relatorioAtivo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-bg2 w-full max-w-2xl border border-soft p-8 md:p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

                        {/* Botão Fechar */}
                        <button
                            onClick={() => setRelatorioAtivo(null)}
                            className="absolute top-8 right-8 p-3 bg-soft text-muted rounded-full hover:bg-fg hover:text-bg transition-colors"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>

                        {/* Cabeçalho do Modal */}
                        <div className="mb-8 pr-12">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                {relatorioAtual?.icon} {relatorioAtual?.label}
                            </h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">
                                Amostragem total: {membros.length} registos
                            </p>
                        </div>

                        {/* Conteúdo (Gráfico em Barras Horizontal Nativo) */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {dadosProcessados.length > 0 ? dadosProcessados.map((item: any, index: number) => {
                                const percentagem = Math.round((item.valor / membros.length) * 100);
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-fg">
                                            <span>{item.label}</span>
                                            <span className="text-muted">{item.valor} <span className="text-[8px] font-bold lowercase">({percentagem}%)</span></span>
                                        </div>
                                        <div className="w-full bg-bg border border-soft h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-figueira h-full transition-all duration-1000 ease-out"
                                                style={{ width: `${percentagem}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="py-10 text-center text-muted">
                                    <p className="text-[10px] font-black uppercase tracking-widest italic">Não há dados suficientes para gerar este relatório.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}