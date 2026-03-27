"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Download, Plus, Edit3, Eye, Phone, Mail, User, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, FileSignature } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default function MembrosListClient({ membros }: { membros: any[] }) {
    // ESTADOS PARA OS FILTROS E PAGINAÇÃO
    const [busca, setBusca] = useState("")
    const [filtroCidade, setFiltroCidade] = useState("TODAS")

    // Paginação
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState<number | "ALL">(20)

    // Sempre que um filtro mudar, volta para a página 1
    useEffect(() => {
        setCurrentPage(1);
    }, [busca, filtroCidade, itemsPerPage]);

    // EXTRAIR CIDADES ÚNICAS PARA O DROPDOWN
    const cidadesUnicas = useMemo(() => {
        const cidades = membros.map(m => m.id_city).filter(Boolean)
        return Array.from(new Set(cidades)).sort()
    }, [membros])

    // LÓGICA DE FILTRAGEM
    const membrosFiltrados = useMemo(() => {
        return membros.filter(membro => {
            const termoBusca = busca.toLowerCase()
            const matchBusca =
                `${membro.first_name} ${membro.last_name}`.toLowerCase().includes(termoBusca) ||
                (membro.email && membro.email.toLowerCase().includes(termoBusca)) ||
                (membro.phone_1 && membro.phone_1.includes(termoBusca))

            const matchCidade = filtroCidade === "TODAS" || membro.id_city === filtroCidade

            return matchBusca && matchCidade
        })
    }, [membros, busca, filtroCidade])

    // LÓGICA DE PAGINAÇÃO
    const paginatedMembros = useMemo(() => {
        if (itemsPerPage === "ALL") return membrosFiltrados;
        const start = (currentPage - 1) * itemsPerPage;
        return membrosFiltrados.slice(start, start + itemsPerPage);
    }, [membrosFiltrados, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === "ALL" ? 1 : Math.ceil(membrosFiltrados.length / itemsPerPage);

    // COMPONENTE AUXILIAR PARA BADGES DE TERMOS
    const StatusTermo = ({ nome, aceite, validade }: { nome: string, aceite: boolean, validade: any }) => {
        const expirado = validade && new Date(validade) < new Date();
        const ok = aceite && !expirado;

        return (
            <div title={`${nome}: ${ok ? 'Assinado e Válido' : 'Pendente ou Expirado'}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm w-fit
                 ${ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                {ok ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                {nome}
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
{/* BREADCRUMB PADRONIZADO */}
            <Breadcrumb items={[
                { 
                    label: "Dashboard Global", 
                    href: "/admin/dashboard", 
                    isBackIcon: true 
                },
                { 
                    label: "Administração", 
                    hideOnMobile: true 
                },
                { 
                    label: "Painel de Membros" 
                }
            ]} />
            {/* CABEÇALHO DA PÁGINA */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <User size={14} /> Gestão de Registos
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Membros <span className="text-muted/30">ADMVC.</span>
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
                        Total de {membros.length} registos ativos no sistema
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg2 border border-soft text-fg px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-soft transition-all shadow-sm">
                        <Download size={14} /> Exportar
                    </button>
                    <Link href="/admin/membros/cadastro" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-figueira text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira/90 transition-all shadow-lg shadow-figueira/20 active:scale-95">
                        <Plus size={16} /> Novo Cadastro
                    </Link>
                </div>
            </header>

            {/* BARRA DE FILTROS MINIMALISTA */}
            <div className="bg-bg2 border border-soft p-4 rounded-[2rem] flex flex-col md:flex-row gap-4 shadow-sm">

                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, email ou telefone..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-fg focus:border-figueira outline-none transition-all shadow-inner"
                    />
                </div>

                {/* Filtro Cidade */}
                <div className="md:w-64 relative shrink-0">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <select
                        value={filtroCidade}
                        onChange={(e) => setFiltroCidade(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl py-3.5 pl-10 pr-4 text-xs font-bold text-fg focus:border-emerald-500 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                    >
                        <option value="TODAS">Cidade (Todas)</option>
                        {cidadesUnicas.map((cidade: any) => (
                            <option key={cidade} value={cidade}>{cidade}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABELA DE DADOS E PAGINAÇÃO */}
            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-bg border-b border-soft">
                                <th className="p-6 text-[9px] font-black text-muted uppercase tracking-widest pl-8">Membro</th>
                                <th className="p-6 text-[9px] font-black text-muted uppercase tracking-widest">Contacto</th>
                                <th className="p-6 text-[9px] font-black text-muted uppercase tracking-widest">Localidade</th>
                                <th className="p-6 text-[9px] font-black text-muted uppercase tracking-widest">Documentação Legal</th>
                                <th className="p-6 text-[9px] font-black text-muted uppercase tracking-widest text-right pr-8">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft">
                            {paginatedMembros.map((membro) => (
                                <tr key={membro.id} className="hover:bg-soft/20 transition-colors group">

                                    {/* 1. NOME E AVATAR */}
                                    <td className="p-4 pl-8">
                                        <div className="flex items-center gap-4">
                                            {membro.avatar_file ? (
                                                <Image
                                                    src={membro.avatar_file}
                                                    alt={membro.first_name}
                                                    width={44}
                                                    height={44}
                                                    className="w-11 h-11 rounded-2xl object-cover border border-soft group-hover:border-figueira/50 transition-all shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted font-black text-xs group-hover:border-figueira/50 group-hover:text-figueira transition-all shadow-sm">
                                                    {membro.first_name[0]}{membro.last_name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-sm text-fg uppercase italic tracking-tighter leading-none">
                                                    {membro.first_name} {membro.last_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
                                                        ID #{membro.id}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-soft"></span>
                                                    <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
                                                        {membro.gender || 'N/D'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. CONTACTO */}
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-fg flex items-center gap-1.5 uppercase tracking-widest">
                                                <Phone size={10} className="text-muted" /> {membro.phone_1 || '---'}
                                            </p>
                                            <p className="text-[10px] font-bold text-muted flex items-center gap-1.5 tracking-wide">
                                                <Mail size={10} className="opacity-50" /> {membro.email}
                                            </p>
                                        </div>
                                    </td>

                                    {/* 3. CIDADE */}
                                    <td className="p-4">
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                                            <MapPin size={12} className="text-figueira/50" />
                                            {membro.id_city || '---'}
                                        </p>
                                    </td>

                                    {/* 4. TERMOS ASSINADOS (GDPR & PERMANECER) */}
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <StatusTermo nome="GDPR" aceite={membro.gdpr_aceite} validade={membro.gdpr_validade} />
                                            <StatusTermo nome="Permanecer" aceite={membro.permanecer_aceite} validade={membro.permanecer_validade} />
                                        </div>
                                    </td>

                                    {/* 5. AÇÕES */}
                                    <td className="p-4 pr-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/membros/visualizar/${membro.id}`}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg border border-soft text-muted hover:text-figueira hover:border-figueira hover:bg-figueira/5 transition-all shadow-sm"
                                                title="Ver Ficha Completa"
                                            >
                                                <Eye size={14} />
                                            </Link>

                                            <Link
                                                href={`/admin/membros/editar/${membro.id}`}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-figueira text-white hover:bg-figueira/90 transition-all shadow-sm active:scale-95"
                                                title="Editar Perfil"
                                            >
                                                <Edit3 size={14} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* ESTADO VAZIO */}
                            {membrosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-soft rounded-2xl flex items-center justify-center text-muted mb-2">
                                                <Search size={20} />
                                            </div>
                                            <p className="text-sm font-black uppercase italic tracking-tighter text-fg">Nenhum membro encontrado</p>
                                            {busca || filtroCidade !== "TODAS" ? (
                                                <button
                                                    onClick={() => { setBusca(""); setFiltroCidade("TODAS"); }}
                                                    className="mt-4 text-[9px] font-black uppercase tracking-widest text-figueira border border-figueira/20 bg-figueira/5 px-4 py-2 rounded-lg hover:bg-figueira/10 transition-all"
                                                >
                                                    Limpar Filtros
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ========================================================= */}
                {/* RODAPÉ DA TABELA: PAGINAÇÃO                               */}
                {/* ========================================================= */}
                {membrosFiltrados.length > 0 && (
                    <div className="bg-bg border-t border-soft p-4 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

                        {/* Seletor de Itens por Página */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Mostrar:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setItemsPerPage(val === "ALL" ? "ALL" : Number(val));
                                }}
                                className="bg-bg2 border border-soft text-fg text-[10px] font-black uppercase tracking-widest py-2 pl-3 pr-8 rounded-xl outline-none cursor-pointer hover:border-figueira/50 transition-all appearance-none shadow-sm"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: "right 10px center", backgroundRepeat: "no-repeat" }}
                            >
                                <option value={20}>20 registos</option>
                                <option value={50}>50 registos</option>
                                <option value="ALL">Todos</option>
                            </select>
                        </div>

                        {/* Informação e Controlos de Página */}
                        {itemsPerPage !== "ALL" && (
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                                    Pág {currentPage} de {totalPages} <span className="mx-1">•</span> {membrosFiltrados.length} Total
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-soft text-fg hover:bg-soft hover:text-figueira disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-soft text-fg hover:bg-soft hover:text-figueira disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {itemsPerPage === "ALL" && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                                A mostrar todos os {membrosFiltrados.length} registos
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}