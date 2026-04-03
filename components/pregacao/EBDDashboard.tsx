'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ChevronLeft, ChevronRight, Plus, GraduationCap,
    Calendar, User, Users, BookOpen, Trash2,
    X, Loader2, Check, ChevronDown, Layers, Clock,
    Award, TrendingUp, AlertTriangle
} from 'lucide-react'
import {
    criarCurso, removerCurso,
    criarTurma, criarEBD, removerEBD, registarPresencasEBD
} from '@/actions/pregacao-actions'

const MESES = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PLANEADO: { label: 'Planeado', color: 'text-blue-400 bg-blue-600/10 border-blue-600/20' },
    EM_CURSO: { label: 'Em Curso', color: 'text-green-400 bg-green-600/10 border-green-600/20' },
    CONCLUIDO: { label: 'Concluido', color: 'text-muted bg-bg border-soft' },
    CANCELADO: { label: 'Cancelado', color: 'text-red-400 bg-red-600/10 border-red-600/20' },
}

interface Turma {
    id: string
    nome: string
    faixa_etaria: string | null
    professor: { first_name: string; last_name: string }
    _count: { matriculas: number; aulas: number; atividades: number }
}

interface Curso {
    id: string
    titulo: string
    descricao: string | null
    trimestre: number
    ano: number
    data_inicio: string
    data_fim: string
    material_ref: string | null
    nota_minima: number
    presenca_minima: number
    status: string
    turmas: Turma[]
    _count: { turmas: number }
}

interface Aula {
    id: string
    titulo: string
    tema: string | null
    data: string
    professor: { first_name: string; last_name: string }
    sermao: { id: string; titulo: string } | null
    turma: { id: string; nome: string } | null
    _count: { presencas: number }
    presencas: { membro_id: number }[]
}

interface Membro { id: number; first_name: string; last_name: string }
interface Sermao { id: string; titulo: string; data_pregacao: string }

interface Props {
    cursos: Curso[]
    aulas: Aula[]
    membros: Membro[]
    sermoes: Sermao[]
    mes: number
    ano: number
    sermaoIdInicial: string | null
}

export default function EBDDashboard({ cursos, aulas, membros, sermoes, mes, ano, sermaoIdInicial }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [tab, setTab] = useState<'cursos' | 'aulas'>('cursos')
    const [modalCurso, setModalCurso] = useState(false)
    const [modalTurma, setModalTurma] = useState<string | null>(null) // curso_id
    const [modalAula, setModalAula] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Presence
    const [presencaAulaId, setPresencaAulaId] = useState<string | null>(null)
    const [presentes, setPresentes] = useState<number[]>([])
    const [presencaLoading, setPresencaLoading] = useState(false)
    const [presencaSearch, setPresencaSearch] = useState('')

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (sermaoIdInicial) {
            setTab('aulas')
            setModalAula(true)
        }
    }, [sermaoIdInicial])

    useEffect(() => {
        if (modalCurso || modalTurma || modalAula || presencaAulaId) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [modalCurso, modalTurma, modalAula, presencaAulaId])

    function navegar(params: Record<string, string | undefined>) {
        const sp = new URLSearchParams(searchParams.toString())
        Object.entries(params).forEach(([k, v]) => {
            if (v === undefined) sp.delete(k)
            else sp.set(k, v)
        })
        sp.delete('sermao_id')
        const qs = sp.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    function mesAnterior() {
        const m = mes === 1 ? 12 : mes - 1
        const a = mes === 1 ? ano - 1 : ano
        navegar({ mes: String(m), ano: String(a) })
    }

    function mesSeguinte() {
        const m = mes === 12 ? 1 : mes + 1
        const a = mes === 12 ? ano + 1 : ano
        navegar({ mes: String(m), ano: String(a) })
    }

    // ── Handlers ──

    async function handleCriarCurso(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const res = await criarCurso(new FormData(e.currentTarget))
        setLoading(false)
        if (res.ok) { setModalCurso(false); router.refresh() }
        else alert(res.error || 'Erro ao criar curso.')
    }

    async function handleCriarTurma(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)
        form.set('curso_id', modalTurma!)
        const res = await criarTurma(form)
        setLoading(false)
        if (res.ok) { setModalTurma(null); router.refresh() }
        else alert(res.error || 'Erro ao criar turma.')
    }

    async function handleCriarAula(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)
        const perguntasRaw = form.get('perguntas_discussao') as string
        if (perguntasRaw) {
            form.set('perguntas_discussao', JSON.stringify(perguntasRaw.split('\n').map(p => p.trim()).filter(Boolean)))
        }
        const res = await criarEBD(form)
        setLoading(false)
        if (res.ok) { setModalAula(false); router.refresh() }
        else alert(res.error || 'Erro ao criar aula.')
    }

    async function handleRemoverCurso(id: string) {
        if (!confirm('Remover este curso e todas as turmas associadas?')) return
        const res = await removerCurso(id)
        if (res.ok) router.refresh()
        else alert(res.error || 'Erro ao remover.')
    }

    async function handleRemoverAula(id: string) {
        if (!confirm('Remover esta aula?')) return
        const res = await removerEBD(id)
        if (res.ok) router.refresh()
        else alert(res.error || 'Erro ao remover.')
    }

    function abrirPresencas(aula: Aula) {
        setPresencaAulaId(aula.id)
        setPresentes(aula.presencas.map(p => p.membro_id))
        setPresencaSearch('')
    }

    async function salvarPresencas() {
        if (!presencaAulaId) return
        setPresencaLoading(true)
        const res = await registarPresencasEBD(presencaAulaId, presentes)
        setPresencaLoading(false)
        if (res.ok) { setPresencaAulaId(null); setPresentes([]); router.refresh() }
        else alert(res.error || 'Erro ao registar presencas.')
    }

    const membrosFiltrados = presencaSearch
        ? membros.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(presencaSearch.toLowerCase()))
        : membros

    const cursosEmCurso = cursos.filter(c => c.status === 'EM_CURSO')
    const totalAlunos = cursosEmCurso.reduce((acc, c) => acc + c.turmas.reduce((a, t) => a + t._count.matriculas, 0), 0)

    // ── Modais ──

    const cursoModal = modalCurso && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Novo Curso EBD</h2>
                    <button onClick={() => setModalCurso(false)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleCriarCurso} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Titulo *</label>
                        <input name="titulo" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Ex: Frutos do Espirito" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Descricao</label>
                        <textarea name="descricao" rows={2} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors resize-y" placeholder="Descricao do curso..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Trimestre *</label>
                            <select name="trimestre" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                                <option value="1">1o Trimestre (Jan-Mar)</option>
                                <option value="2">2o Trimestre (Abr-Jun)</option>
                                <option value="3">3o Trimestre (Jul-Set)</option>
                                <option value="4">4o Trimestre (Out-Dez)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Ano *</label>
                            <input name="ano" type="number" required defaultValue={ano} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Data Inicio *</label>
                            <input name="data_inicio" type="date" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Data Fim *</label>
                            <input name="data_fim" type="date" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Material de Referencia</label>
                        <input name="material_ref" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Ex: Revista CPAD - Adultos T2/2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Nota Minima</label>
                            <input name="nota_minima" type="number" step="0.1" defaultValue={7} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Presenca Minima (%)</label>
                            <input name="presenca_minima" type="number" step="1" defaultValue={75} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'A criar...' : 'Criar Curso'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    ) : null

    const turmaModal = modalTurma && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Nova Turma</h2>
                    <button onClick={() => setModalTurma(null)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleCriarTurma} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Nome da Turma *</label>
                        <input name="nome" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Ex: Adultos, Jovens, Criancas" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Faixa Etaria</label>
                        <input name="faixa_etaria" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Ex: 18-35 anos" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Professor *</label>
                        <select name="professor_id" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                            <option value="">Selecionar...</option>
                            {membros.map(m => (
                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'A criar...' : 'Criar Turma'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    ) : null

    const aulaModal = modalAula && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Nova Aula EBD</h2>
                    <button onClick={() => setModalAula(false)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleCriarAula} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Titulo *</label>
                        <input name="titulo" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Titulo da aula" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Tema</label>
                        <input name="tema" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Tema da aula" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Professor *</label>
                            <select name="professor_id" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                                <option value="">Selecionar...</option>
                                {membros.map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Data *</label>
                            <input name="data" type="date" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Sermao base (opcional)</label>
                        <select name="sermao_id" defaultValue={sermaoIdInicial || ''} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                            <option value="">Nenhum</option>
                            {sermoes.map(s => (<option key={s.id} value={s.id}>{s.titulo} — {new Date(s.data_pregacao).toLocaleDateString('pt-PT')}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Perguntas de Discussao (uma por linha)</label>
                        <textarea name="perguntas_discussao" rows={3} className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors resize-y" placeholder="O que significa este texto?" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Material de Apoio</label>
                        <textarea name="material_apoio" rows={2} className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors resize-y" placeholder="Links, livros, recursos..." />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'A criar...' : 'Criar Aula'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    ) : null

    const presencaModal = presencaAulaId && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Marcar Presencas</h2>
                    <button onClick={() => { setPresencaAulaId(null); setPresentes([]) }} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <div className="px-6 pt-4 flex-shrink-0">
                    <input value={presencaSearch} onChange={e => setPresencaSearch(e.target.value)} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Pesquisar membro..." />
                    <p className="text-[9px] font-bold text-figueira mt-2">{presentes.length} presente{presentes.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
                    {membrosFiltrados.map(m => {
                        const isP = presentes.includes(m.id)
                        return (
                            <button key={m.id} onClick={() => setPresentes(prev => isP ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${isP ? 'bg-figueira/10 border border-figueira/30' : 'bg-bg border border-soft hover:border-figueira/20'}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isP ? 'bg-figueira text-white' : 'border border-soft'}`}>
                                    {isP && <Check size={12} />}
                                </div>
                                <span className="text-[11px] font-bold text-fg">{m.first_name} {m.last_name}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="px-6 py-4 border-t border-soft flex-shrink-0">
                    <button onClick={salvarPresencas} disabled={presencaLoading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {presencaLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {presencaLoading ? 'A guardar...' : 'Guardar Presencas'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null

    return (
        <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 text-figueira">
                    <GraduationCap size={16} />
                    <span className="font-black text-[10px] uppercase tracking-[0.3em]">Escola Biblica Dominical</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                    EBD<span className="text-muted/20">.</span>
                </h1>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <Layers size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{cursos.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Cursos</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <Clock size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{cursosEmCurso.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Em Curso</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <Users size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{totalAlunos}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Alunos</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <BookOpen size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{aulas.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Aulas / Mes</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-bg2 border border-soft rounded-2xl p-1">
                <button onClick={() => setTab('cursos')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'cursos' ? 'bg-figueira text-white' : 'text-muted hover:text-fg'}`}>
                    Cursos & Turmas
                </button>
                <button onClick={() => setTab('aulas')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'aulas' ? 'bg-figueira text-white' : 'text-muted hover:text-fg'}`}>
                    Aulas do Mes
                </button>
            </div>

            {/* Tab: Cursos */}
            {tab === 'cursos' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'}</p>
                        <button onClick={() => setModalCurso(true)} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity">
                            <Plus size={12} /> Novo Curso
                        </button>
                    </div>

                    {cursos.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <Layers size={32} className="mx-auto text-muted/30 mb-4" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhum curso criado.</p>
                            <p className="text-[10px] text-muted/60 mt-1">Crie o primeiro curso trimestral para organizar a EBD.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cursos.map(curso => {
                                const st = STATUS_LABELS[curso.status] || STATUS_LABELS.PLANEADO
                                return (
                                    <details key={curso.id} className="group bg-bg2 border border-soft rounded-2xl overflow-hidden transition-all hover:border-figueira/30" open={curso.status === 'EM_CURSO'}>
                                        <summary className="cursor-pointer px-5 py-4 flex items-center gap-4 list-none [&::-webkit-details-marker]:hidden">
                                            <div className="flex-shrink-0 w-12 h-12 bg-bg border border-soft rounded-xl flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-black text-figueira leading-none">T{curso.trimestre}</span>
                                                <span className="text-[8px] font-bold text-muted">{curso.ano}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xs font-black uppercase tracking-wide text-fg truncate">{curso.titulo}</h3>
                                                <p className="text-[9px] font-bold text-muted mt-0.5">
                                                    {curso._count.turmas} turma{curso._count.turmas !== 1 ? 's' : ''}
                                                    {curso.material_ref && <span className="ml-2 text-figueira/70">{curso.material_ref}</span>}
                                                </p>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${st.color}`}>
                                                {st.label}
                                            </span>
                                            <ChevronDown size={14} className="text-muted group-open:rotate-180 transition-transform flex-shrink-0" />
                                        </summary>

                                        <div className="px-5 pb-5 pt-2 border-t border-soft space-y-4">
                                            {curso.descricao && (
                                                <p className="text-[10px] text-fg/70">{curso.descricao}</p>
                                            )}
                                            <div className="flex flex-wrap gap-3 text-[9px] text-muted font-bold">
                                                <span><Calendar size={10} className="inline mr-1" />{new Date(curso.data_inicio).toLocaleDateString('pt-PT')} — {new Date(curso.data_fim).toLocaleDateString('pt-PT')}</span>
                                                <span><TrendingUp size={10} className="inline mr-1" />Nota min: {curso.nota_minima}</span>
                                                <span><Users size={10} className="inline mr-1" />Presenca min: {curso.presenca_minima}%</span>
                                            </div>

                                            {/* Turmas */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Turmas</p>
                                                    <button onClick={() => setModalTurma(curso.id)} className="text-[8px] font-black uppercase tracking-widest text-figueira hover:underline flex items-center gap-1">
                                                        <Plus size={10} /> Adicionar Turma
                                                    </button>
                                                </div>
                                                {curso.turmas.length === 0 ? (
                                                    <p className="text-[10px] text-muted/50 text-center py-4">Nenhuma turma criada para este curso.</p>
                                                ) : (
                                                    <div className="grid gap-2">
                                                        {curso.turmas.map(turma => (
                                                            <Link key={turma.id} href={`/ebd/turma/${turma.id}`}
                                                                className="flex items-center gap-3 bg-bg border border-soft rounded-xl px-4 py-3 hover:border-figueira/30 transition-all">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-black uppercase tracking-wide text-fg">{turma.nome}</p>
                                                                    <p className="text-[9px] text-muted font-bold">
                                                                        <User size={9} className="inline mr-0.5" />
                                                                        {turma.professor.first_name} {turma.professor.last_name}
                                                                        {turma.faixa_etaria && <span className="ml-2">{turma.faixa_etaria}</span>}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[9px] font-bold text-muted">
                                                                    <span><Users size={10} className="inline mr-0.5" />{turma._count.matriculas}</span>
                                                                    <span><BookOpen size={10} className="inline mr-0.5" />{turma._count.aulas}</span>
                                                                    <span><Award size={10} className="inline mr-0.5" />{turma._count.atividades}</span>
                                                                </div>
                                                                <ChevronRight size={14} className="text-muted flex-shrink-0" />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <button onClick={() => handleRemoverCurso(curso.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-600/20 transition-colors ml-auto">
                                                    <Trash2 size={10} /> Remover
                                                </button>
                                            </div>
                                        </div>
                                    </details>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Aulas do Mês */}
            {tab === 'aulas' && (
                <section className="space-y-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between bg-bg2 border border-soft rounded-2xl px-4 py-3">
                        <button onClick={mesAnterior} className="p-2 hover:bg-bg rounded-xl transition-colors text-muted hover:text-fg"><ChevronLeft size={18} /></button>
                        <div className="text-center">
                            <p className="text-sm font-black uppercase tracking-widest text-fg">{MESES[mes - 1]}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{ano}</p>
                        </div>
                        <button onClick={mesSeguinte} className="p-2 hover:bg-bg rounded-xl transition-colors text-muted hover:text-fg"><ChevronRight size={18} /></button>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}</p>
                        <button onClick={() => setModalAula(true)} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity">
                            <Plus size={12} /> Nova Aula
                        </button>
                    </div>

                    {aulas.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <GraduationCap size={32} className="mx-auto text-muted/30 mb-4" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhuma aula neste mes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {aulas.map(a => (
                                <details key={a.id} className="group bg-bg2 border border-soft rounded-2xl overflow-hidden transition-all hover:border-figueira/30">
                                    <summary className="cursor-pointer px-5 py-4 flex items-center gap-4 list-none [&::-webkit-details-marker]:hidden">
                                        <div className="flex-shrink-0 w-12 h-12 bg-bg border border-soft rounded-xl flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black text-figueira leading-none">{new Date(a.data).getDate()}</span>
                                            <span className="text-[8px] font-bold text-muted uppercase">{new Date(a.data).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black uppercase tracking-wide text-fg truncate">{a.titulo}</h3>
                                            <p className="text-[9px] font-bold text-muted mt-0.5">
                                                <User size={9} className="inline mr-1" />{a.professor.first_name} {a.professor.last_name}
                                                {a.turma && <span className="ml-2 text-figueira"><Layers size={9} className="inline mr-0.5" />{a.turma.nome}</span>}
                                                {a.sermao && <span className="ml-2 text-figueira/70"><BookOpen size={9} className="inline mr-0.5" />{a.sermao.titulo}</span>}
                                            </p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1.5 bg-bg border border-soft rounded-full px-3 py-1">
                                            <Users size={10} className="text-figueira" />
                                            <span className="text-[9px] font-black text-fg">{a._count.presencas}</span>
                                        </div>
                                        <ChevronDown size={14} className="text-muted group-open:rotate-180 transition-transform flex-shrink-0" />
                                    </summary>
                                    <div className="px-5 pb-5 pt-2 border-t border-soft">
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <button onClick={() => abrirPresencas(a)} className="flex items-center gap-1.5 px-4 py-2 bg-figueira/10 border border-figueira/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-figueira hover:bg-figueira/20 transition-colors">
                                                <Users size={10} /> Marcar Presencas
                                            </button>
                                            <button onClick={() => handleRemoverAula(a.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-600/20 transition-colors ml-auto">
                                                <Trash2 size={10} /> Remover
                                            </button>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {cursoModal}
            {turmaModal}
            {aulaModal}
            {presencaModal}
        </main>
    )
}
