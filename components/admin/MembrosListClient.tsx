"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Trash2, AlertTriangle, Search, MapPin, Download, Plus,
    Edit3, Eye, Phone, Mail, User, CheckCircle2, AlertCircle,
    ChevronLeft, ChevronRight, X, Loader2
} from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { excluirMembroAction } from '@/actions/admin-actions';

export default function MembrosListClient({ membros }: { membros: any[] }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [showToast, setShowToast] = useState(false)

    // ESTADOS PARA OS FILTROS E PAGINAÇÃO
    const [busca, setBusca] = useState("")
    const [filtroCidade, setFiltroCidade] = useState("TODAS")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState<number | "ALL">(20)

    // ESTADOS PARA EXCLUSÃO
    const [membroParaExcluir, setMembroParaExcluir] = useState<any>(null);
    const [excluindoId, setExcluindoId] = useState<number | null>(null);

    useEffect(() => {
        if (searchParams.get('sucesso') === 'true') {
            setShowToast(true)
            router.replace('/admin/membros', { scroll: false })
            const timer = setTimeout(() => setShowToast(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [searchParams, router])

    useEffect(() => {
        setCurrentPage(1);
    }, [busca, filtroCidade, itemsPerPage]);

    const cidadesUnicas = useMemo(() => {
        const cidades = membros.map(m => m.id_city).filter(Boolean)
        return Array.from(new Set(cidades)).sort()
    }, [membros])

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

    const paginatedMembros = useMemo(() => {
        if (itemsPerPage === "ALL") return membrosFiltrados;
        const start = (currentPage - 1) * itemsPerPage;
        return membrosFiltrados.slice(start, start + itemsPerPage);
    }, [membrosFiltrados, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === "ALL" ? 1 : Math.ceil(membrosFiltrados.length / itemsPerPage);

    const StatusTermo = ({ nome, aceite, validade }: { nome: string, aceite: boolean, validade: any }) => {
        const expirado = validade && new Date(validade) < new Date();
        const ok = aceite && !expirado;
        return (
            <div title={`${nome}: ${ok ? 'Assinado' : 'Pendente'}`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border transition-all shadow-sm w-fit
                 ${ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                {ok ? <CheckCircle2 size={8} /> : <AlertCircle size={8} />}
                {nome}
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {showToast && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-green-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-green-700">Membro registado com sucesso!</span>
                    </div>
                    <button onClick={() => setShowToast(false)} className="text-green-600 hover:bg-green-500/20 p-2 rounded-xl transition-all">
                        <X size={16} />
                    </button>
                </div>
            )}

            <Breadcrumb items={[
                { label: "Dashboard Global", href: "/admin/dashboard", isBackIcon: true },
                { label: "Administração", hideOnMobile: true },
                { label: "Painel de Membros" }
            ]} />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <User size={14} /> Gestão de Registos
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Membros <span className="text-muted/30">ADMVC.</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg2 border border-soft text-fg px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-soft transition-all">
                        <Download size={14} /> Exportar
                    </button>
                    <Link href="/admin/membros/cadastro" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-figueira text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira/90 transition-all shadow-lg shadow-figueira/20 active:scale-95">
                        <Plus size={16} /> Novo Cadastro
                    </Link>
                </div>
            </header>

            <div className="bg-bg2 border border-soft p-4 rounded-[2rem] flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-fg focus:border-figueira outline-none transition-all shadow-inner"
                    />
                </div>
                <div className="md:w-64 relative shrink-0">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <select
                        value={filtroCidade}
                        onChange={(e) => setFiltroCidade(e.target.value)}
                        className="w-full bg-bg border border-soft rounded-2xl py-3.5 pl-10 pr-4 text-xs font-bold text-fg focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="TODAS">Cidade (Todas)</option>
                        {cidadesUnicas.map((cidade: any) => (
                            <option key={cidade} value={cidade}>{cidade}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                        <thead>
                            <tr className="bg-bg border-b border-soft">
                                <th className="p-5 text-[9px] font-black text-muted uppercase tracking-widest pl-8">Membro</th>
                                <th className="p-5 text-[9px] font-black text-muted uppercase tracking-widest">Contacto</th>
                                <th className="p-5 text-[9px] font-black text-muted uppercase tracking-widest">Localidade</th>
                                <th className="p-5 text-[9px] font-black text-muted uppercase tracking-widest text-center">Compliance</th>
                                <th className="p-5 text-[9px] font-black text-muted uppercase tracking-widest text-right pr-8">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft text-fg">
                            {paginatedMembros.map((membro) => (
                                <tr key={membro.id} className="hover:bg-soft/20 transition-colors group">
                                    <td className="p-4 pl-8">
                                        <div className="flex items-center gap-3">
                                            {membro.avatar_file ? (
                                                <Image src={membro.avatar_file} alt={membro.first_name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover border border-soft" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-bg border border-soft flex items-center justify-center text-muted font-black text-[10px]">
                                                    {membro.first_name[0]}{membro.last_name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-xs uppercase italic tracking-tighter leading-none">{membro.first_name} {membro.last_name}</p>
                                                <span className="text-[8px] text-muted font-bold uppercase mt-1 block">ID #{membro.id}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUNA CONTACTO OTIMIZADA */}
                                    <td className="p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                <Phone size={8} className="text-figueira" /> {membro.phone_1 || '---'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted font-medium">
                                                <Mail size={8} /> {membro.email.length > 20 ? membro.email.substring(0, 20) + '...' : membro.email}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{membro.id_city || '---'}</p>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex justify-center gap-1">
                                            <StatusTermo nome="GDPR" aceite={membro.gdpr_aceite} validade={membro.gdpr_validade} />
                                            <StatusTermo nome="TERM" aceite={membro.permanecer_aceite} validade={membro.permanecer_validade} />
                                        </div>
                                    </td>

                                    <td className="p-4 pr-8 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Link href={`/admin/membros/visualizar/${membro.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg border border-soft text-muted hover:text-figueira transition-all" title="Ver">
                                                <Eye size={14} />
                                            </Link>
                                            <Link href={`/admin/membros/editar/${membro.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-figueira text-white hover:opacity-90 transition-all" title="Editar">
                                                <Edit3 size={14} />
                                            </Link>
                                            <button
                                                onClick={() => setMembroParaExcluir(membro)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINAÇÃO */}
                <div className="bg-bg border-t border-soft p-4 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                            className="bg-bg2 border border-soft text-fg text-[10px] font-black uppercase py-1.5 px-3 rounded-lg outline-none"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value="ALL">Todos</option>
                        </select>
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Por página</span>
                    </div>

                    {itemsPerPage !== "ALL" && (
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                {currentPage} / {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 border border-soft rounded-lg disabled:opacity-20"><ChevronLeft size={14} /></button>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 border border-soft rounded-lg disabled:opacity-20"><ChevronRight size={14} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EXCLUSÃO */}
            {membroParaExcluir && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border border-soft w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Confirmar Exclusão?</h3>
                            <p className="text-[11px] text-muted font-bold leading-relaxed">
                                Eliminar permanentemente o registo de:<br />
                                <span className="text-red-500 text-xs">{membroParaExcluir.first_name} {membroParaExcluir.last_name}</span>
                            </p>
                            <div className="flex flex-col gap-2 pt-4">
                                <button
                                    disabled={excluindoId !== null}
                                    onClick={async () => {
                                        setExcluindoId(membroParaExcluir.id);
                                        const res = await excluirMembroAction(membroParaExcluir.id);
                                        if (res.ok) setMembroParaExcluir(null);
                                        else alert(res.error);
                                        setExcluindoId(null);
                                    }}
                                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {excluindoId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Sim, Excluir
                                </button>
                                <button onClick={() => setMembroParaExcluir(null)} className="w-full bg-soft text-muted py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-bg transition-all">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}