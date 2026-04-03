'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ChevronLeft, Plus, GraduationCap, Users, User,
    BookOpen, Trash2, X, Loader2, Check, ChevronDown,
    Award, FileText, Calculator, Search, ClipboardList
} from 'lucide-react'
import {
    matricularAlunos, removerMatricula,
    criarAtividade, removerAtividade, salvarNotas,
    criarEBD, registarPresencasEBD, removerEBD,
    calcularAprovacao
} from '@/actions/pregacao-actions'

const TIPO_LABELS: Record<string, string> = {
    EXERCICIO: 'Exercicio',
    PROVA: 'Prova',
    TRABALHO: 'Trabalho',
    PARTICIPACAO: 'Participacao',
}

interface Membro { id: number; first_name: string; last_name: string }
interface Sermao { id: string; titulo: string; data_pregacao: string }

interface Matricula {
    id: number
    turma_id: string
    membro_id: number
    data_matricula: string
    status: string
    nota_final: number | null
    percentual_presenca: number | null
    aprovado: boolean | null
    membro: Membro
}

interface Aula {
    id: string
    titulo: string
    tema: string | null
    data: string
    professor: { first_name: string; last_name: string }
    sermao: { id: string; titulo: string } | null
    _count: { presencas: number }
    presencas: { membro_id: number }[]
}

interface Nota {
    id: number
    atividade_id: string
    membro_id: number
    nota: number | null
    entregue: boolean
    observacao: string | null
}

interface Atividade {
    id: string
    titulo: string
    tipo: string
    descricao: string | null
    data_entrega: string | null
    peso: number
    nota_maxima: number
    notas: Nota[]
    _count: { notas: number }
}

interface Curso {
    id: string
    titulo: string
    categoria: string
    trimestre: number | null
    ano: number
    carga_horaria: number | null
    nota_minima: number
    presenca_minima: number
    status: string
}

interface Turma {
    id: string
    nome: string
    faixa_etaria: string | null
    curso: Curso
    professor: { id: number; first_name: string; last_name: string }
    matriculas: Matricula[]
    aulas: Aula[]
    atividades: Atividade[]
}

interface Props {
    turma: Turma
    membros: Membro[]
    sermoes: Sermao[]
    podeGerir?: boolean
    basePath?: string
}

export default function TurmaClient({ turma, membros, sermoes, podeGerir = false, basePath = '/ebd' }: Props) {
    const router = useRouter()
    const [tab, setTab] = useState<'alunos' | 'aulas' | 'atividades' | 'resultados'>('alunos')
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Modals
    const [modalMatricula, setModalMatricula] = useState(false)
    const [modalAula, setModalAula] = useState(false)
    const [modalAtividade, setModalAtividade] = useState(false)
    const [modalNotas, setModalNotas] = useState<string | null>(null)
    const [presencaAulaId, setPresencaAulaId] = useState<string | null>(null)
    const [presentes, setPresentes] = useState<number[]>([])
    const [presencaLoading, setPresencaLoading] = useState(false)

    // Matricula
    const [matSearch, setMatSearch] = useState('')
    const [matSelecionados, setMatSelecionados] = useState<number[]>([])

    // Notas
    const [notasEdit, setNotasEdit] = useState<Record<number, { nota: string; entregue: boolean }>>({})

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (modalMatricula || modalAula || modalAtividade || modalNotas || presencaAulaId) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [modalMatricula, modalAula, modalAtividade, modalNotas, presencaAulaId])

    const jaMatriculados = new Set(turma.matriculas.map(m => m.membro_id))
    const membrosDisponiveis = membros.filter(m => !jaMatriculados.has(m.id))
    const membrosFiltrados = matSearch
        ? membrosDisponiveis.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(matSearch.toLowerCase()))
        : membrosDisponiveis

    // ── Handlers ──

    async function handleMatricular() {
        if (matSelecionados.length === 0) return
        setLoading(true)
        const res = await matricularAlunos(turma.id, matSelecionados)
        setLoading(false)
        if (res.ok) { setModalMatricula(false); setMatSelecionados([]); setMatSearch(''); router.refresh() }
        else alert(res.error)
    }

    async function handleRemoverMatricula(membroId: number) {
        if (!confirm('Remover este aluno da turma?')) return
        const res = await removerMatricula(turma.id, membroId)
        if (res.ok) router.refresh()
        else alert(res.error)
    }

    async function handleCriarAula(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)
        const perguntasRaw = form.get('perguntas_discussao') as string
        if (perguntasRaw) form.set('perguntas_discussao', JSON.stringify(perguntasRaw.split('\n').map(p => p.trim()).filter(Boolean)))
        const res = await criarEBD(form)
        setLoading(false)
        if (res.ok) { setModalAula(false); router.refresh() }
        else alert(res.error)
    }

    async function handleCriarAtividade(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)
        form.set('turma_id', turma.id)
        const res = await criarAtividade(form)
        setLoading(false)
        if (res.ok) { setModalAtividade(false); router.refresh() }
        else alert(res.error)
    }

    function abrirNotas(atividadeId: string) {
        const atv = turma.atividades.find(a => a.id === atividadeId)
        if (!atv) return
        const edits: Record<number, { nota: string; entregue: boolean }> = {}
        for (const mat of turma.matriculas) {
            const nota = atv.notas.find(n => n.membro_id === mat.membro_id)
            edits[mat.membro_id] = {
                nota: nota?.nota != null ? String(nota.nota) : '',
                entregue: nota?.entregue ?? false,
            }
        }
        setNotasEdit(edits)
        setModalNotas(atividadeId)
    }

    async function handleSalvarNotas() {
        if (!modalNotas) return
        setLoading(true)
        const notas = Object.entries(notasEdit).map(([membroId, v]) => ({
            membro_id: Number(membroId),
            nota: v.nota ? Number(v.nota) : null,
            entregue: v.entregue,
        }))
        const res = await salvarNotas(modalNotas, notas)
        setLoading(false)
        if (res.ok) { setModalNotas(null); router.refresh() }
        else alert(res.error)
    }

    function abrirPresencas(aula: Aula) {
        setPresencaAulaId(aula.id)
        setPresentes(aula.presencas.map(p => p.membro_id))
    }

    async function salvarPresencasHandler() {
        if (!presencaAulaId) return
        setPresencaLoading(true)
        const res = await registarPresencasEBD(presencaAulaId, presentes)
        setPresencaLoading(false)
        if (res.ok) { setPresencaAulaId(null); setPresentes([]); router.refresh() }
        else alert(res.error)
    }

    async function handleCalcularAprovacao() {
        if (!confirm('Calcular aprovacao para todos os alunos desta turma?')) return
        setLoading(true)
        const res = await calcularAprovacao(turma.id)
        setLoading(false)
        if (res.ok) router.refresh()
        else alert(res.error)
    }

    // ── Modais ──

    const matriculaModal = modalMatricula && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Matricular Alunos</h2>
                    <button onClick={() => { setModalMatricula(false); setMatSelecionados([]) }} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <div className="px-6 pt-4 flex-shrink-0">
                    <input value={matSearch} onChange={e => setMatSearch(e.target.value)} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Pesquisar membro..." />
                    <p className="text-[9px] font-bold text-figueira mt-2">{matSelecionados.length} selecionado{matSelecionados.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
                    {membrosFiltrados.map(m => {
                        const sel = matSelecionados.includes(m.id)
                        return (
                            <button key={m.id} onClick={() => setMatSelecionados(prev => sel ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${sel ? 'bg-figueira/10 border border-figueira/30' : 'bg-bg border border-soft hover:border-figueira/20'}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-figueira text-white' : 'border border-soft'}`}>
                                    {sel && <Check size={12} />}
                                </div>
                                <span className="text-[11px] font-bold text-fg">{m.first_name} {m.last_name}</span>
                            </button>
                        )
                    })}
                    {membrosFiltrados.length === 0 && <p className="text-center text-[10px] text-muted py-4">Nenhum membro disponivel.</p>}
                </div>
                <div className="px-6 py-4 border-t border-soft flex-shrink-0">
                    <button onClick={handleMatricular} disabled={loading || matSelecionados.length === 0} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'A matricular...' : 'Matricular'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null

    const aulaModalEl = modalAula && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Nova Aula</h2>
                    <button onClick={() => setModalAula(false)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleCriarAula} className="p-6 space-y-4">
                    <input type="hidden" name="turma_id" value={turma.id} />
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Titulo *</label>
                        <input name="titulo" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Professor *</label>
                            <select name="professor_id" required defaultValue={turma.professor.id} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                                {membros.map(m => (<option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Data *</label>
                            <input name="data" type="date" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Tema</label>
                        <input name="tema" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Sermao base</label>
                        <select name="sermao_id" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                            <option value="">Nenhum</option>
                            {sermoes.map(s => (<option key={s.id} value={s.id}>{s.titulo}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Perguntas (uma por linha)</label>
                        <textarea name="perguntas_discussao" rows={3} className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors resize-y" />
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

    const atividadeModalEl = modalAtividade && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Nova Atividade</h2>
                    <button onClick={() => setModalAtividade(false)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleCriarAtividade} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Titulo *</label>
                        <input name="titulo" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors" placeholder="Ex: Exercicio Licao 3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Tipo *</label>
                            <select name="tipo" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors">
                                <option value="EXERCICIO">Exercicio</option>
                                <option value="PROVA">Prova</option>
                                <option value="TRABALHO">Trabalho</option>
                                <option value="PARTICIPACAO">Participacao</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Data Entrega</label>
                            <input name="data_entrega" type="date" className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Peso</label>
                            <input name="peso" type="number" step="0.1" defaultValue={1} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Nota Maxima</label>
                            <input name="nota_maxima" type="number" step="0.1" defaultValue={10} className="w-full bg-bg border border-soft rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-figueira transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted mb-1">Descricao</label>
                        <textarea name="descricao" rows={2} className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs text-fg placeholder:text-muted/50 focus:outline-none focus:border-figueira transition-colors resize-y" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {loading ? 'A criar...' : 'Criar Atividade'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    ) : null

    const notasModalEl = modalNotas && mounted ? (() => {
        const atv = turma.atividades.find(a => a.id === modalNotas)
        if (!atv) return null
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Notas</h2>
                            <p className="text-[9px] text-muted font-bold">{atv.titulo} (max: {atv.nota_maxima})</p>
                        </div>
                        <button onClick={() => setModalNotas(null)} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
                        {turma.matriculas.map(mat => {
                            const edit = notasEdit[mat.membro_id] || { nota: '', entregue: false }
                            return (
                                <div key={mat.membro_id} className="flex items-center gap-3 bg-bg border border-soft rounded-xl px-4 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-fg truncate">{mat.membro.first_name} {mat.membro.last_name}</p>
                                    </div>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={edit.entregue}
                                            onChange={e => setNotasEdit(prev => ({ ...prev, [mat.membro_id]: { ...prev[mat.membro_id], entregue: e.target.checked } }))}
                                            className="w-4 h-4 rounded border-soft accent-figueira" />
                                        <span className="text-[8px] font-bold text-muted uppercase">Entregue</span>
                                    </label>
                                    <input type="number" step="0.1" min="0" max={atv.nota_maxima}
                                        value={edit.nota}
                                        onChange={e => setNotasEdit(prev => ({ ...prev, [mat.membro_id]: { ...prev[mat.membro_id], nota: e.target.value } }))}
                                        className="w-16 bg-bg2 border border-soft rounded-lg px-2 py-1.5 text-xs text-fg text-center focus:outline-none focus:border-figueira transition-colors"
                                        placeholder="--" />
                                </div>
                            )
                        })}
                    </div>
                    <div className="px-6 py-4 border-t border-soft flex-shrink-0">
                        <button onClick={handleSalvarNotas} disabled={loading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {loading ? 'A guardar...' : 'Guardar Notas'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )
    })() : null

    const presencaModalEl = presencaAulaId && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-bg2 border border-soft rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-bg2 border-b border-soft px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Marcar Presencas</h2>
                    <button onClick={() => { setPresencaAulaId(null); setPresentes([]) }} className="text-muted hover:text-fg transition-colors"><X size={18} /></button>
                </div>
                <div className="px-6 pt-3 flex-shrink-0">
                    <p className="text-[9px] font-bold text-figueira">{presentes.length} presente{presentes.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
                    {turma.matriculas.map(mat => {
                        const isP = presentes.includes(mat.membro_id)
                        return (
                            <button key={mat.membro_id} onClick={() => setPresentes(prev => isP ? prev.filter(id => id !== mat.membro_id) : [...prev, mat.membro_id])}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${isP ? 'bg-figueira/10 border border-figueira/30' : 'bg-bg border border-soft hover:border-figueira/20'}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isP ? 'bg-figueira text-white' : 'border border-soft'}`}>
                                    {isP && <Check size={12} />}
                                </div>
                                <span className="text-[11px] font-bold text-fg">{mat.membro.first_name} {mat.membro.last_name}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="px-6 py-4 border-t border-soft flex-shrink-0">
                    <button onClick={salvarPresencasHandler} disabled={presencaLoading} className="w-full py-3 bg-figueira text-white text-[10px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
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
            {/* Back + Header */}
            <div>
                <Link href={basePath} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors mb-4">
                    <ChevronLeft size={14} /> Voltar a EBD
                </Link>
                <header className="space-y-2">
                    <div className="flex items-center gap-2 text-figueira">
                        <GraduationCap size={16} />
                        <span className="font-black text-[10px] uppercase tracking-[0.3em]">
                            {turma.curso.titulo}
                            {turma.curso.trimestre ? ` — T${turma.curso.trimestre}/${turma.curso.ano}` : ` — ${turma.curso.ano}`}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        {turma.nome}<span className="text-muted/20">.</span>
                    </h1>
                    <p className="text-[10px] font-bold text-muted">
                        <User size={10} className="inline mr-1" />Prof. {turma.professor.first_name} {turma.professor.last_name}
                        {turma.faixa_etaria && <span className="ml-3">{turma.faixa_etaria}</span>}
                    </p>
                </header>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <Users size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{turma.matriculas.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Alunos</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <BookOpen size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{turma.aulas.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Aulas</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <ClipboardList size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{turma.atividades.length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Atividades</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-2xl p-4 text-center">
                    <Award size={16} className="mx-auto text-figueira mb-1" />
                    <p className="text-lg font-black text-fg">{turma.matriculas.filter(m => m.aprovado === true).length}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Aprovados</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-bg2 border border-soft rounded-2xl p-1 overflow-x-auto">
                {(['alunos', 'aulas', 'atividades', 'resultados'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap px-2 ${tab === t ? 'bg-figueira text-white' : 'text-muted hover:text-fg'}`}>
                        {t === 'alunos' ? 'Alunos' : t === 'aulas' ? 'Aulas' : t === 'atividades' ? 'Atividades' : 'Resultados'}
                    </button>
                ))}
            </div>

            {/* Tab: Alunos */}
            {tab === 'alunos' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{turma.matriculas.length} aluno{turma.matriculas.length !== 1 ? 's' : ''}</p>
                        {podeGerir && (
                            <button onClick={() => setModalMatricula(true)} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity">
                                <Plus size={12} /> Matricular
                            </button>
                        )}
                    </div>
                    {turma.matriculas.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <Users size={28} className="mx-auto text-muted/30 mb-3" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhum aluno matriculado.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {turma.matriculas.map(mat => (
                                <div key={mat.membro_id} className="flex items-center gap-3 bg-bg2 border border-soft rounded-xl px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-fg">{mat.membro.first_name} {mat.membro.last_name}</p>
                                        <p className="text-[9px] text-muted font-bold">
                                            {mat.status === 'ATIVA' ? 'Ativa' : mat.status === 'CONCLUIDA' ? 'Concluida' : mat.status}
                                            {mat.nota_final != null && <span className="ml-2">Nota: {mat.nota_final}</span>}
                                            {mat.percentual_presenca != null && <span className="ml-2">Presenca: {mat.percentual_presenca}%</span>}
                                            {mat.aprovado === true && <span className="ml-2 text-green-400">Aprovado</span>}
                                            {mat.aprovado === false && <span className="ml-2 text-red-400">Reprovado</span>}
                                        </p>
                                    </div>
                                    {podeGerir && (
                                        <button onClick={() => handleRemoverMatricula(mat.membro_id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Aulas */}
            {tab === 'aulas' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{turma.aulas.length} aula{turma.aulas.length !== 1 ? 's' : ''}</p>
                        {podeGerir && (
                            <button onClick={() => setModalAula(true)} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity">
                                <Plus size={12} /> Nova Aula
                            </button>
                        )}
                    </div>
                    {turma.aulas.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <BookOpen size={28} className="mx-auto text-muted/30 mb-3" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhuma aula registada.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {turma.aulas.map(a => (
                                <div key={a.id} className="flex items-center gap-3 bg-bg2 border border-soft rounded-xl px-4 py-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-bg border border-soft rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-figueira leading-none">{new Date(a.data).getDate()}</span>
                                        <span className="text-[7px] font-bold text-muted uppercase">{new Date(a.data).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-fg truncate">{a.titulo}</p>
                                        <p className="text-[9px] text-muted font-bold">{a.professor.first_name} {a.professor.last_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted"><Users size={10} className="inline mr-0.5" />{a._count.presencas}</span>
                                        {podeGerir && <button onClick={() => abrirPresencas(a)} className="text-[8px] font-black uppercase text-figueira hover:underline">Presencas</button>}
                                        {podeGerir && <button onClick={async () => { if (confirm('Remover aula?')) { const r = await removerEBD(a.id); if (r.ok) router.refresh() } }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={12} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Atividades */}
            {tab === 'atividades' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{turma.atividades.length} atividade{turma.atividades.length !== 1 ? 's' : ''}</p>
                        {podeGerir && (
                            <button onClick={() => setModalAtividade(true)} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity">
                                <Plus size={12} /> Nova Atividade
                            </button>
                        )}
                    </div>
                    {turma.atividades.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <ClipboardList size={28} className="mx-auto text-muted/30 mb-3" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhuma atividade criada.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {turma.atividades.map(atv => (
                                <div key={atv.id} className="flex items-center gap-3 bg-bg2 border border-soft rounded-xl px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-fg truncate">{atv.titulo}</p>
                                        <p className="text-[9px] text-muted font-bold">
                                            {TIPO_LABELS[atv.tipo] || atv.tipo} — Peso: {atv.peso} — Max: {atv.nota_maxima}
                                            {atv.data_entrega && <span className="ml-2">{new Date(atv.data_entrega).toLocaleDateString('pt-PT')}</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted">{atv._count.notas} notas</span>
                                        {podeGerir && <button onClick={() => abrirNotas(atv.id)} className="text-[8px] font-black uppercase text-figueira hover:underline">Lancar Notas</button>}
                                        {podeGerir && <button onClick={async () => { if (confirm('Remover atividade?')) { const r = await removerAtividade(atv.id); if (r.ok) router.refresh() } }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={12} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Resultados */}
            {tab === 'resultados' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                            Nota min: {turma.curso.nota_minima} | Presenca min: {turma.curso.presenca_minima}%
                        </p>
                        {podeGerir && (
                            <button onClick={handleCalcularAprovacao} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-[2.5rem] hover:opacity-90 transition-opacity disabled:opacity-50">
                                {loading ? <Loader2 size={12} className="animate-spin" /> : <Calculator size={12} />}
                                Calcular Aprovacao
                            </button>
                        )}
                    </div>

                    {turma.matriculas.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                            <Award size={28} className="mx-auto text-muted/30 mb-3" />
                            <p className="text-xs font-black uppercase text-muted tracking-widest">Nenhum aluno matriculado.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {turma.matriculas.map(mat => {
                                const aprovado = mat.aprovado
                                return (
                                    <div key={mat.membro_id} className={`flex items-center gap-3 bg-bg2 border rounded-xl px-4 py-3 ${aprovado === true ? 'border-green-600/30' : aprovado === false ? 'border-red-600/30' : 'border-soft'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-fg">{mat.membro.first_name} {mat.membro.last_name}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold">
                                            <span className={mat.nota_final != null && mat.nota_final >= turma.curso.nota_minima ? 'text-green-400' : mat.nota_final != null ? 'text-red-400' : 'text-muted'}>
                                                Nota: {mat.nota_final != null ? mat.nota_final : '--'}
                                            </span>
                                            <span className={mat.percentual_presenca != null && mat.percentual_presenca >= turma.curso.presenca_minima ? 'text-green-400' : mat.percentual_presenca != null ? 'text-red-400' : 'text-muted'}>
                                                Presenca: {mat.percentual_presenca != null ? `${mat.percentual_presenca}%` : '--'}
                                            </span>
                                            {aprovado === true && <span className="text-[8px] font-black uppercase tracking-wider bg-green-600/10 text-green-400 px-2 py-0.5 rounded-full border border-green-600/20">Aprovado</span>}
                                            {aprovado === false && <span className="text-[8px] font-black uppercase tracking-wider bg-red-600/10 text-red-400 px-2 py-0.5 rounded-full border border-red-600/20">Reprovado</span>}
                                            {aprovado == null && <span className="text-[8px] font-black uppercase tracking-wider bg-bg text-muted px-2 py-0.5 rounded-full border border-soft">Pendente</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {matriculaModal}
            {aulaModalEl}
            {atividadeModalEl}
            {notasModalEl}
            {presencaModalEl}
        </main>
    )
}
