'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    X, Users, Clock, BookOpen, Camera,
    Plus, Loader2, Check, MapPin,
    UserCheck, ClipboardList, Pencil,
    CheckCircle2, Circle, Image as ImageIcon, Trash2
} from 'lucide-react'
import { atualizarHorarioGrupo, registarEncontro } from '@/actions/grupo-actions'

interface Membro {
    id: number
    first_name: string
    last_name: string
    avatar_file?: string | null
}

interface Encontro {
    id: number
    data: Date | string
    tema: string
    foto_url?: string | null
    criado_em: Date | string
    presentes: Membro[]
}

interface Grupo {
    id: number
    nome: string
    dia_semana: string
    horario: string
    bairro: string
    cidade: string
    categoria?: string | null
    descricao?: string | null
    membros: Membro[]
    lideres: Membro[]
    encontros?: Encontro[]
}

interface Props {
    grupo: Grupo
    membroId: number
    isLider: boolean
}

type Aba = 'encontros' | 'novo' | 'horario'

export default function ModalGestaoGrupo({ grupo, membroId, isLider }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [aberto, setAberto] = useState(false)
    const [aba, setAba] = useState<Aba>('encontros')

    const [salvando, setSalvando] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [presentes, setPresentes] = useState<number[]>([])
    const [tema, setTema] = useState('')
    const [dataEncontro, setDataEncontro] = useState(new Date().toISOString().split('T')[0])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fotoPreview, setFotoPreview] = useState<string | null>(null)
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(false)

    const [salvandoHorario, setSalvandoHorario] = useState(false)
    const [sucessoHorario, setSucessoHorario] = useState(false)

    // Lightbox
    const [fotoAmpliada, setFotoAmpliada] = useState<{ url: string; tema: string } | null>(null)

    const encontros: Encontro[] = grupo.encontros || []

    const togglePresente = (id: number) => {
        setPresentes(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
    }

    const selecionarTodos = () => {
        setPresentes(prev => prev.length === grupo.membros.length ? [] : grupo.membros.map(m => m.id))
    }

    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { alert('A foto não pode ter mais de 5MB.'); return }
        setFotoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setFotoPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const removerFoto = () => {
        setFotoFile(null)
        setFotoPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRegistarEncontro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // ✅ Captura ANTES de qualquer await
        const formData = new FormData(e.currentTarget)
        setSalvando(true)

        console.log('🟡 [ENCONTRO] Iniciando registo...')
        console.log('🟡 [ENCONTRO] Tema:', tema)
        console.log('🟡 [ENCONTRO] Data:', dataEncontro)
        console.log('🟡 [ENCONTRO] Presentes:', presentes)
        console.log('🟡 [ENCONTRO] Tem foto?', !!fotoFile, fotoFile ? `(${fotoFile.name}, ${(fotoFile.size / 1024).toFixed(1)}KB, ${fotoFile.type})` : '')

        try {
            let foto_url: string | null = null

            if (fotoFile) {
                setUploadProgress(true)
                console.log('🔵 [UPLOAD] A enviar foto para /api/upload/encontro-foto...')

                const uploadFormData = new FormData()
                uploadFormData.append('file', fotoFile)
                uploadFormData.append('grupo_id', grupo.id.toString())

                const uploadRes = await fetch('/api/upload/encontro-foto', {
                    method: 'POST',
                    body: uploadFormData
                })

                console.log('🔵 [UPLOAD] Status HTTP:', uploadRes.status, uploadRes.statusText)

                const uploadJson = await uploadRes.json()
                console.log('🔵 [UPLOAD] Resposta JSON:', uploadJson)

                if (!uploadRes.ok) {
                    throw new Error(uploadJson.error || `Erro HTTP ${uploadRes.status}`)
                }

                foto_url = uploadJson.url
                console.log('✅ [UPLOAD] URL gerada:', foto_url)
                setUploadProgress(false)
            }

            formData.append('grupo_id', grupo.id.toString())
            presentes.forEach(id => formData.append('presentes_ids', id.toString()))
            if (foto_url) formData.append('foto_url', foto_url)

            console.log('🔵 [ENCONTRO] A chamar Server Action registarEncontro...')
            console.log('🔵 [ENCONTRO] formData foto_url:', foto_url)

            const res = await registarEncontro(formData) as { sucesso: boolean; error?: string }
            console.log('🔵 [ENCONTRO] Resposta da action:', res)

            if (res.sucesso) {
                console.log('✅ [ENCONTRO] Registado com sucesso!')
                setSucesso(true)
                setTema(''); setPresentes([]); removerFoto()
                setTimeout(() => { setSucesso(false); setAba('encontros'); startTransition(() => router.refresh()) }, 1500)
            } else {
                console.error('❌ [ENCONTRO] Erro da action:', res.error)
                alert(res.error || 'Erro ao registar encontro.')
            }
        } catch (err: any) {
            console.error('❌ [ENCONTRO] Exceção capturada:', err)
            alert(err.message || 'Erro inesperado.')
            setUploadProgress(false)
        } finally {
            setSalvando(false)
        }
    }

    const handleAtualizarHorario = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSalvandoHorario(true)
        const formData = new FormData(e.currentTarget)
        formData.append('grupo_id', grupo.id.toString())
        try {
            const res = await atualizarHorarioGrupo(formData) as { sucesso: boolean; error?: string }
            if (res.sucesso) { setSucessoHorario(true); setTimeout(() => { setSucessoHorario(false); startTransition(() => router.refresh()) }, 1500) }
            else alert(res.error || 'Erro ao atualizar.')
        } catch { alert('Erro de ligação.') }
        finally { setSalvandoHorario(false) }
    }

    const formatarData = (data: Date | string) => new Date(data).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    const isLoading = salvando || uploadProgress

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setAberto(true) }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 bg-fg text-bg hover:bg-figueira"
            >
                <ClipboardList size={14} />
                {isLider ? 'Gerir Grupo' : 'Ver Encontros'}
            </button>

            {aberto && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setAberto(false)}>
                    <div className="bg-bg w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-soft flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92vh]" onClick={e => e.stopPropagation()}>

                        {/* CABEÇALHO */}
                        <div className="p-6 border-b border-soft flex items-start justify-between gap-4 shrink-0 bg-bg2 rounded-t-[2.5rem]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center shrink-0">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">{grupo.nome}</h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {grupo.dia_semana} · {grupo.horario}</span>
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> {grupo.bairro}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setAberto(false)} className="w-9 h-9 flex items-center justify-center bg-bg border border-soft text-muted rounded-xl hover:bg-soft transition-all shrink-0">
                                <X size={16} />
                            </button>
                        </div>

                        {/* TABS */}
                        <div className="flex gap-1 p-3 border-b border-soft shrink-0 bg-bg2 overflow-x-auto">
                            <TabBtn label="Histórico" icon={<BookOpen size={12} />} ativo={aba === 'encontros'} onClick={() => setAba('encontros')} />
                            {isLider && <>
                                <TabBtn label="Novo Encontro" icon={<Plus size={12} />} ativo={aba === 'novo'} onClick={() => setAba('novo')} destaque />
                                <TabBtn label="Horário" icon={<Pencil size={12} />} ativo={aba === 'horario'} onClick={() => setAba('horario')} />
                            </>}
                        </div>

                        {/* CONTEÚDO */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">

                            {/* HISTÓRICO */}
                            {aba === 'encontros' && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    {encontros.length === 0 ? (
                                        <div className="py-16 text-center border-2 border-dashed border-soft rounded-3xl">
                                            <BookOpen size={32} className="mx-auto text-muted/30 mb-3" />
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Nenhum encontro registado.</p>
                                            {isLider && (
                                                <button onClick={() => setAba('novo')} className="mt-4 text-[9px] font-black uppercase tracking-widest text-figueira hover:underline flex items-center gap-1 mx-auto">
                                                    <Plus size={11} /> Registar primeiro encontro
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        encontros.slice().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(enc => (
                                            <div key={enc.id} className="bg-bg2 border border-soft rounded-[1.5rem] overflow-hidden hover:border-figueira/30 transition-all">
                                                <div className="p-5 space-y-3">
                                                    <div className="flex items-start justify-between gap-3">

                                                        {/* DATA + TEMA */}
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="bg-fg text-bg rounded-xl p-2.5 text-center shrink-0 min-w-[50px]">
                                                                <span className="block text-[8px] font-black uppercase opacity-60">{new Date(enc.data).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                                                <span className="block text-lg font-black italic leading-none">{new Date(enc.data).toLocaleDateString('pt-PT', { day: '2-digit' })}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-black uppercase italic tracking-tight text-fg leading-tight truncate">{enc.tema}</h4>
                                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{formatarData(enc.data)}</p>
                                                                {/* BADGE DE FOTO (quando não há thumbnail visível) */}
                                                                {enc.foto_url && (
                                                                    <button
                                                                        onClick={() => setFotoAmpliada({ url: enc.foto_url!, tema: enc.tema })}
                                                                        className="mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-figueira hover:underline"
                                                                    >
                                                                        <Camera size={10} /> Ver foto
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {/* THUMBNAIL CLICÁVEL */}
                                                            {enc.foto_url && (
                                                                <button
                                                                    onClick={() => setFotoAmpliada({ url: enc.foto_url!, tema: enc.tema })}
                                                                    className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-soft hover:border-figueira transition-all group/thumb shrink-0 shadow-sm"
                                                                    title="Ver foto ampliada"
                                                                >
                                                                    <img src={enc.foto_url} alt={enc.tema} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-all flex items-center justify-center">
                                                                        <Camera size={14} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </button>
                                                            )}
                                                            {/* BADGE PRESENÇAS */}
                                                            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl">
                                                                <UserCheck size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">{enc.presentes.length}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {enc.presentes.length > 0 && (
                                                        <div className="pt-2 border-t border-soft">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-2">Presentes</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {enc.presentes.map(p => (
                                                                    <span key={p.id} className="text-[8px] font-black uppercase tracking-wide bg-bg border border-soft px-2 py-1 rounded-lg text-fg">
                                                                        {p.first_name} {p.last_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* LIGHTBOX */}
                            {fotoAmpliada && (
                                <div
                                    className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200"
                                    onClick={() => setFotoAmpliada(null)}
                                >
                                    <div className="relative max-w-3xl w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                        <img
                                            src={fotoAmpliada.url}
                                            alt={fotoAmpliada.tema}
                                            className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                                            <p className="text-white font-black uppercase italic tracking-tight text-sm">{fotoAmpliada.tema}</p>
                                        </div>
                                        <button
                                            onClick={() => setFotoAmpliada(null)}
                                            className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-xl flex items-center justify-center transition-all backdrop-blur-sm"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* NOVO ENCONTRO */}
                            {aba === 'novo' && isLider && (
                                <form onSubmit={handleRegistarEncontro} className="space-y-5 animate-in fade-in duration-200">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest">Data do Encontro</label>
                                            <input type="date" name="data" required value={dataEncontro} onChange={e => setDataEncontro(e.target.value)}
                                                className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-figueira outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest">Tema / Título</label>
                                            <input type="text" name="tema" required placeholder="Ex: Oração e Fé..." value={tema} onChange={e => setTema(e.target.value)}
                                                className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-figueira outline-none placeholder:text-muted/40" />
                                        </div>
                                    </div>

                                    {/* UPLOAD FOTO */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Camera size={11} /> Foto do Encontro <span className="text-muted/50">(opcional)</span>
                                        </label>
                                        {fotoPreview ? (
                                            <div className="relative rounded-2xl overflow-hidden border border-soft">
                                                <img src={fotoPreview} alt="Preview" className="w-full h-48 object-cover" />
                                                <div className="absolute inset-0 bg-black/20" />
                                                <button type="button" onClick={removerFoto} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all shadow-md">
                                                    <Trash2 size={14} />
                                                </button>
                                                <span className="absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-widest text-white bg-black/50 px-2 py-1 rounded-lg">{fotoFile?.name}</span>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                                className="w-full h-32 border-2 border-dashed border-soft rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-figueira/40 hover:bg-figueira/5 transition-all group">
                                                <div className="w-10 h-10 bg-soft rounded-xl flex items-center justify-center group-hover:bg-figueira/10 transition-all">
                                                    <ImageIcon size={18} className="text-muted group-hover:text-figueira transition-colors" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-figueira transition-colors">Clica para adicionar foto</span>
                                                <span className="text-[8px] text-muted/50 uppercase tracking-widest">JPG, PNG ou WEBP · máx. 5MB</span>
                                            </button>
                                        )}
                                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFotoChange} className="hidden" />
                                    </div>

                                    {/* LISTA DE PRESENÇA */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                                <UserCheck size={11} /> Presenças ({presentes.length}/{grupo.membros.length})
                                            </label>
                                            <button type="button" onClick={selecionarTodos} className="text-[8px] font-black uppercase tracking-widest text-figueira hover:underline">
                                                {presentes.length === grupo.membros.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                            </button>
                                        </div>
                                        <div className="bg-bg border border-soft rounded-2xl overflow-hidden divide-y divide-soft/50">
                                            {grupo.membros.length === 0
                                                ? <p className="text-[10px] text-muted italic p-4 text-center">Nenhum membro no grupo.</p>
                                                : grupo.membros.map(m => {
                                                    const presente = presentes.includes(m.id)
                                                    return (
                                                        <button key={m.id} type="button" onClick={() => togglePresente(m.id)}
                                                            className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left ${presente ? 'bg-emerald-500/5' : 'hover:bg-soft/30'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-bg2 border border-soft flex items-center justify-center text-xs font-black text-muted overflow-hidden shrink-0">
                                                                    {m.avatar_file ? <img src={m.avatar_file} alt="" className="w-full h-full object-cover" /> : m.first_name[0]}
                                                                </div>
                                                                <span className={`text-[11px] font-black uppercase tracking-wide transition-colors ${presente ? 'text-emerald-700' : 'text-fg'}`}>
                                                                    {m.first_name} {m.last_name}
                                                                </span>
                                                            </div>
                                                            {presente ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <Circle size={18} className="text-soft shrink-0" />}
                                                        </button>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>

                                    {uploadProgress && (
                                        <div className="flex items-center gap-3 bg-figueira/5 border border-figueira/20 rounded-2xl px-4 py-3">
                                            <Loader2 size={14} className="animate-spin text-figueira shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-figueira">A fazer upload da foto...</span>
                                        </div>
                                    )}

                                    <button type="submit" disabled={isLoading || sucesso}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 shadow-md ${sucesso ? 'bg-emerald-500 text-white' : 'bg-figueira text-white hover:brightness-110'}`}>
                                        {isLoading
                                            ? <><Loader2 size={14} className="animate-spin" />{uploadProgress ? 'A enviar foto...' : 'A guardar...'}</>
                                            : sucesso ? <><Check size={14} /> Registado!</>
                                                : <><Plus size={14} /> Registar Encontro</>}
                                    </button>
                                </form>
                            )}

                            {/* HORÁRIO */}
                            {aba === 'horario' && isLider && (
                                <form onSubmit={handleAtualizarHorario} className="space-y-5 animate-in fade-in duration-200">
                                    <div className="bg-bg2 border border-soft rounded-2xl p-5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted">Configuração Atual</p>
                                        <p className="text-sm font-black text-fg uppercase italic mt-1">{grupo.dia_semana} às {grupo.horario}</p>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest">Dia da Semana</label>
                                            <select name="dia_semana" defaultValue={grupo.dia_semana} required className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-figueira outline-none appearance-none">
                                                {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest">Horário</label>
                                            <input type="time" name="horario" defaultValue={grupo.horario} required className="w-full bg-bg border border-soft rounded-xl px-4 py-3 text-sm font-bold focus:border-figueira outline-none" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={salvandoHorario || sucessoHorario}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 shadow-md ${sucessoHorario ? 'bg-emerald-500 text-white' : 'bg-figueira text-white hover:brightness-110'}`}>
                                        {salvandoHorario ? <><Loader2 size={14} className="animate-spin" /> A guardar...</> : sucessoHorario ? <><Check size={14} /> Atualizado!</> : <><Pencil size={14} /> Atualizar Horário</>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function TabBtn({ label, icon, ativo, onClick, destaque }: { label: string; icon: React.ReactNode; ativo: boolean; onClick: () => void; destaque?: boolean }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${ativo ? (destaque ? 'bg-figueira text-white shadow-md' : 'bg-fg text-bg shadow-sm') : 'text-muted hover:text-fg hover:bg-soft/50'}`}>
            {icon} {label}
        </button>
    )
}