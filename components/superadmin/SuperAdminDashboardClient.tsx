'use client'

import { useState } from 'react'
import {
    Building, Users, Globe2, Activity, Search,
    ArrowUpRight, Crown, Settings, Database, Server
} from 'lucide-react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'

// Adicionei = [] e = {} como proteção extra!
export default function SuperAdminDashboardClient({ igrejas = [], kpis = {} }: { igrejas: any[], kpis: any }) {
    const [busca, setBusca] = useState('');

    // Agora é impossível dar erro de undefined
    const igrejasFiltradas = igrejas.filter(igreja =>
        igreja?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        igreja?.slug?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700">

            {/* CABEÇALHO E BREADCRUMB */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-soft pb-6">
                <div>
                    <Breadcrumb items={[{ label: "Plataforma" }, { label: "Dashboard Super Admin" }]} />
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-fg flex items-center gap-3 mt-4">
                        <Server size={32} className="text-figueira" /> Controle Global
                    </h1>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                        Visão analítica de todos os Tenants e infraestrutura
                    </p>
                </div>

                <Link
                    href="/super-admin/igrejas"
                    className="bg-fg text-bg px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-figueira transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    <Building size={16} /> Gerir Organizações
                </Link>
            </div>

            {/* GRELHA DE KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* KPI 1 */}
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-figueira/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center">
                            <Building size={24} />
                        </div>
                        <span className="bg-green-500/10 text-green-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Activity size={10} /> Online
                        </span>
                    </div>
                    <div className="mt-6 relative z-10">
                        <h3 className="text-4xl font-black text-fg tracking-tighter leading-none">{kpis.totalIgrejas || 0}</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Igrejas Registadas</p>
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <h3 className="text-4xl font-black text-fg tracking-tighter leading-none">{(kpis.totalMembros || 0).toLocaleString('pt-PT')}</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Membros na Plataforma</p>
                    </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-bg2 border border-soft p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Globe2 size={24} />
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <h3 className="text-4xl font-black text-fg tracking-tighter leading-none">{kpis.totalCongregacoes || 0}</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Congregações / Filiais</p>
                    </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-fg text-bg p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-inner">
                            <Crown size={24} />
                        </div>
                        <span className="bg-white/20 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/10">
                            Receita
                        </span>
                    </div>
                    <div className="mt-6 relative z-10">
                        <h3 className="text-4xl font-black text-white tracking-tighter leading-none">{kpis.igrejasPro || 0}</h3>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-2">Assinaturas Premium (PRO)</p>
                    </div>
                </div>

            </div>

            {/* TABELA DE DADOS DOS TENANTS */}
            <div className="bg-bg2 border border-soft rounded-[3rem] shadow-sm overflow-hidden flex flex-col">

                <div className="p-6 md:p-8 border-b border-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg/50">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-fg italic flex items-center gap-2">
                            <Database size={20} className="text-figueira" /> Organizações (Tenants)
                        </h2>
                    </div>

                    {/* BARRA DE PESQUISA */}
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Procurar igreja ou slug..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full bg-bg border border-soft rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-fg outline-none focus:border-figueira transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-bg/80 border-b border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                <th className="p-5 pl-8">Organização</th>
                                <th className="p-5">Plano</th>
                                <th className="p-5 text-center">Membros</th>
                                <th className="p-5 text-center">Congregações</th>
                                <th className="p-5">Criação</th>
                                <th className="p-5 pr-8 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {igrejasFiltradas.length > 0 ? (
                                igrejasFiltradas.map((igreja) => (
                                    <tr key={igreja.id} className="border-b border-soft/50 hover:bg-soft/30 transition-colors group">

                                        <td className="p-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-figueira/10 text-figueira flex items-center justify-center font-black text-lg shadow-sm shrink-0 border border-figueira/20">
                                                    {igreja.nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-fg uppercase italic tracking-tighter leading-tight">{igreja.nome}</p>
                                                    <p className="text-[10px] text-muted font-bold tracking-widest mt-0.5 flex items-center gap-1">
                                                        <Globe2 size={10} /> {igreja.slug}.admvc.com
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${igreja.plano === 'PRO' || igreja.plano === 'ENTERPRISE'
                                                    ? 'bg-figueira/10 text-figueira border-figueira/20'
                                                    : 'bg-soft text-muted border-soft/50'
                                                }`}>
                                                {igreja.plano}
                                            </span>
                                        </td>

                                        <td className="p-5 text-center">
                                            <div className="inline-flex items-center justify-center gap-2 bg-bg px-3 py-1.5 rounded-lg border border-soft shadow-sm">
                                                <Users size={14} className="text-blue-500" />
                                                <span className="text-xs font-black text-fg">{igreja._count?.membros || 0}</span>
                                            </div>
                                        </td>

                                        <td className="p-5 text-center">
                                            <div className="inline-flex items-center justify-center gap-2 bg-bg px-3 py-1.5 rounded-lg border border-soft shadow-sm">
                                                <Building size={14} className="text-orange-500" />
                                                <span className="text-xs font-black text-fg">{igreja._count?.congregacoes || 0}</span>
                                            </div>
                                        </td>

                                        <td className="p-5">
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                                {new Date(igreja.createdAt).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>

                                        <td className="p-5 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-muted hover:text-figueira hover:bg-figueira/10 rounded-xl transition-all" title="Ver Detalhes (Em breve)">
                                                    <ArrowUpRight size={16} />
                                                </button>
                                                <Link href="/super-admin/igrejas" className="p-2 text-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Gerir Tenant">
                                                    <Settings size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center">
                                        <div className="inline-flex flex-col items-center justify-center text-muted space-y-3">
                                            <Search size={32} className="opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma organização encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}