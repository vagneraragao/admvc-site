// app/admin/membros/importar/page.tsx
'use client'

import { useState } from 'react'
import { Download, Upload, CheckCircle2, AlertTriangle, XCircle, ArrowRight, FileSpreadsheet, Loader2 } from 'lucide-react'
import { analisarCSV, exportarMembrosCSV, confirmarImportacao } from './actions'
import Link from 'next/link'

export default function ImportExportPage() {
    const [loadingExport, setLoadingExport] = useState(false);
    const [loadingImport, setLoadingImport] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [analise, setAnalise] = useState<any[] | null>(null);
    const [sucesso, setSucesso] = useState(false);

    // --- FUNÇÃO PARA EXPORTAR ---
    async function handleExport() {
        setLoadingExport(true);
        const res = await exportarMembrosCSV();
        setLoadingExport(false);

        if (res.csv) {
            // Cria um ficheiro virtual e força o download no navegador
            const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `membros_admvc_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(res.error || 'Erro ao exportar.');
        }
    }

    // --- FUNÇÃO PARA ANALISAR O FICHEIRO ---
    async function handleAnalyze(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;

        setLoadingImport(true);
        const formData = new FormData();
        formData.append('file', file);

        const res = await analisarCSV(formData);
        setLoadingImport(false);

        if (res.resultados) {
            setAnalise(res.resultados);
        } else {
            alert(res.error || 'Erro ao analisar ficheiro.');
        }
    }

    // --- FUNÇÃO PARA CONFIRMAR E GRAVAR ---
    async function handleConfirm() {
        if (!analise) return;

        const validos = analise.filter(item => item.status === 'PRONTO');
        if (validos.length === 0) return alert('Não há membros válidos para importar.');

        setLoadingImport(true);
        const res = await confirmarImportacao(validos);
        setLoadingImport(false);

        if (res.ok) {
            setSucesso(true);
            setAnalise(null);
            setFile(null);
        } else {
            alert(res.error || 'Erro ao gravar.');
        }
    }

    const validosCount = analise?.filter(i => i.status === 'PRONTO').length || 0;

    return (
        <main className="max-w-5xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700">

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg leading-none flex items-center gap-3">
                        <FileSpreadsheet className="text-figueira" /> Importar / Exportar
                    </h1>
                    <p className="text-xs text-muted font-bold tracking-widest uppercase mt-2">
                        Gerencie os dados dos membros em massa (CSV).
                    </p>
                </div>
                <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors">
                    Voltar ao Admin
                </Link>
            </header>

            <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* BLOCO 1: EXPORTAR */}
                <section className="bg-bg2 border border-soft p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center space-y-5">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
                        <Download size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-fg">Exportar Membros</h3>
                        <p className="text-xs text-muted font-medium mt-2 max-w-xs">
                            Faça o download de todos os membros ativos e inativos num ficheiro Excel/CSV.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={loadingExport}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loadingExport ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Baixar Ficheiro CSV
                    </button>
                </section>

                {/* BLOCO 2: IMPORTAR */}
                <section className="bg-bg2 border border-soft p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center space-y-5">
                    <div className="w-16 h-16 bg-figueira/10 text-figueira rounded-3xl flex items-center justify-center shadow-lg">
                        <Upload size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-fg">Importar Membros</h3>
                        <p className="text-xs text-muted font-medium mt-2 max-w-xs">
                            Envie um CSV com as colunas: <strong>Nome; Apelido; Email; Telefone</strong>
                        </p>
                    </div>

                    {!analise && !sucesso && (
                        <form onSubmit={handleAnalyze} className="w-full space-y-4">
                            <input
                                type="file"
                                accept=".csv"
                                required
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full text-xs text-muted file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-soft file:text-fg hover:file:bg-figueira hover:file:text-white transition-all cursor-pointer bg-bg border border-soft rounded-2xl p-2"
                            />
                            <button
                                type="submit"
                                disabled={!file || loadingImport}
                                className="w-full flex items-center justify-center gap-2 bg-fg text-bg py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loadingImport ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                Analisar Ficheiro
                            </button>
                        </form>
                    )}

                    {sucesso && (
                        <div className="w-full bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-green-600 space-y-3">
                            <CheckCircle2 size={32} className="mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest">Importação Concluída!</p>
                            <button onClick={() => setSucesso(false)} className="underline text-[10px] font-bold tracking-widest uppercase">Importar outro</button>
                        </div>
                    )}
                </section>
            </div>

            {/* BLOCO 3: PRÉ-VISUALIZAÇÃO DA ANÁLISE (Só aparece após enviar o CSV) */}
            {analise && (
                <section className="bg-bg2 border border-soft rounded-[2.5rem] shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-bg border-b border-soft p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-fg">Relatório de Análise</h3>
                            <p className="text-xs text-muted font-medium mt-1">
                                Encontrados <strong>{validosCount} registos válidos</strong> de um total de {analise.length} linhas.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setAnalise(null)} className="px-5 py-3 rounded-xl border border-soft text-muted text-[10px] font-black uppercase tracking-widest hover:bg-soft transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={validosCount === 0 || loadingImport}
                                className="flex items-center gap-2 bg-figueira text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loadingImport ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Confirmar e Gravar
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] custom-scrollbar p-6">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                    <th className="pb-3 px-2">Linha</th>
                                    <th className="pb-3 px-2">Status</th>
                                    <th className="pb-3 px-2">Nome</th>
                                    <th className="pb-3 px-2">Email</th>
                                    <th className="pb-3 px-2">Motivo / Aviso</th>
                                </tr>
                            </thead>
                            {/* Substitua o tbody antigo por este que lê de item.dados */}
                            <tbody>
                                {analise.map((item, idx) => (
                                    <tr key={idx} className="border-b border-soft/50 hover:bg-soft/30 transition-colors">
                                        <td className="py-3 px-2 text-xs text-muted font-bold">{item.linha}</td>
                                        <td className="py-3 px-2">
                                            {item.status === 'PRONTO' && <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">Pronto</span>}
                                            {item.status === 'DUPLICADO' && <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">Repetido</span>}
                                            {item.status === 'ERRO' && <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">Erro</span>}
                                        </td>
                                        <td className="py-3 px-2 text-xs font-bold text-fg">
                                            {item.dados?.first_name} {item.dados?.last_name}
                                        </td>
                                        <td className="py-3 px-2 text-xs text-muted">
                                            {item.dados?.email || item.email}
                                        </td>
                                        <td className="py-3 px-2 text-[10px] text-muted italic">
                                            {item.status === 'PRONTO' ? `Cidade: ${item.dados?.id_city || 'N/A'}` : item.motivo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

        </main>
    )
}