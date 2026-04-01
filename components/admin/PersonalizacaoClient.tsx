'use client'

import { useState, useRef } from 'react'
import { atualizarBranding, resetBranding } from '@/actions/branding-actions'
import {
    Palette, Upload, RotateCcw, Save, Loader2, CheckCircle2,
    Image as ImageIcon, Eye
} from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

interface TenantData {
    cor_primaria: string
    cor_secundaria: string
    cor_fundo: string
    logo_url: string | null
    nome: string
}

export default function PersonalizacaoClient({ tenant }: { tenant: TenantData }) {
    const [corPrimaria, setCorPrimaria] = useState(tenant.cor_primaria)
    const [corSecundaria, setCorSecundaria] = useState(tenant.cor_secundaria)
    const [corFundo, setCorFundo] = useState(tenant.cor_fundo)
    const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logo_url)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => setLogoPreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setStatus(null)

        const formData = new FormData(e.currentTarget)
        formData.set('cor_primaria', corPrimaria)
        formData.set('cor_secundaria', corSecundaria)
        formData.set('cor_fundo', corFundo)

        const res = await atualizarBranding(formData)
        if (res.ok) {
            setStatus({ type: 'success', msg: 'Visual atualizado! Recarregue a pagina para ver as alteracoes.' })
        } else {
            setStatus({ type: 'error', msg: res.error || 'Erro ao guardar.' })
        }
        setSaving(false)
        setTimeout(() => setStatus(null), 5000)
    }

    async function handleReset() {
        setSaving(true)
        setStatus(null)
        const res = await resetBranding()
        if (res.ok) {
            setCorPrimaria('#3F6B4F')
            setCorSecundaria('#7FAE93')
            setCorFundo('#0b0d0c')
            setLogoPreview(null)
            setStatus({ type: 'success', msg: 'Visual restaurado para o padrao ADMVC.' })
        } else {
            setStatus({ type: 'error', msg: res.error || 'Erro ao restaurar.' })
        }
        setSaving(false)
        setTimeout(() => setStatus(null), 5000)
    }

    return (
        <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
            <Breadcrumb items={[
                { label: 'Dashboard', href: '/admin/dashboard', isBackIcon: true },
                { label: 'Personalizacao' }
            ]} />

            <header>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-fg flex items-center gap-3">
                    <Palette size={24} className="text-figueira" />
                    Personalizacao Visual
                </h1>
                <p className="text-xs text-muted mt-1">
                    Personalize as cores e o logotipo do portal da sua igreja.
                </p>
            </header>

            {status && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <CheckCircle2 size={14} /> {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* CORES */}
                <section className="bg-bg2 border border-soft rounded-[2rem] p-6 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
                        <Palette size={14} /> Paleta de Cores
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Cor Primaria */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                                Cor Primaria
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={corPrimaria}
                                    onChange={e => setCorPrimaria(e.target.value)}
                                    className="w-12 h-12 rounded-xl border border-soft cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={corPrimaria}
                                    onChange={e => setCorPrimaria(e.target.value)}
                                    className="flex-1 bg-bg border border-soft rounded-xl px-3 py-2 text-xs font-mono text-fg outline-none focus:border-figueira"
                                    maxLength={7}
                                />
                            </div>
                            <p className="text-[9px] text-muted/60">Botoes, links e destaques principais</p>
                        </div>

                        {/* Cor Secundaria */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                                Cor Secundaria
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={corSecundaria}
                                    onChange={e => setCorSecundaria(e.target.value)}
                                    className="w-12 h-12 rounded-xl border border-soft cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={corSecundaria}
                                    onChange={e => setCorSecundaria(e.target.value)}
                                    className="flex-1 bg-bg border border-soft rounded-xl px-3 py-2 text-xs font-mono text-fg outline-none focus:border-figueira"
                                    maxLength={7}
                                />
                            </div>
                            <p className="text-[9px] text-muted/60">Hover, badges e elementos de suporte</p>
                        </div>

                        {/* Cor Fundo */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                                Fundo do Portal
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={corFundo}
                                    onChange={e => setCorFundo(e.target.value)}
                                    className="w-12 h-12 rounded-xl border border-soft cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={corFundo}
                                    onChange={e => setCorFundo(e.target.value)}
                                    className="flex-1 bg-bg border border-soft rounded-xl px-3 py-2 text-xs font-mono text-fg outline-none focus:border-figueira"
                                    maxLength={7}
                                />
                            </div>
                            <p className="text-[9px] text-muted/60">Cor de fundo geral do portal</p>
                        </div>
                    </div>

                    {/* PREVIEW */}
                    <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-3">
                            <Eye size={12} /> Pre-visualizacao
                        </p>
                        <div className="rounded-2xl border border-soft overflow-hidden" style={{ backgroundColor: corFundo }}>
                            <div className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: corPrimaria }} />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-2.5 rounded-full w-32" style={{ backgroundColor: corPrimaria }} />
                                    <div className="h-2 rounded-full w-24" style={{ backgroundColor: corSecundaria, opacity: 0.6 }} />
                                </div>
                                <div className="px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase" style={{ backgroundColor: corPrimaria }}>
                                    Botao
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LOGOTIPO */}
                <section className="bg-bg2 border border-soft rounded-[2rem] p-6 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
                        <ImageIcon size={14} /> Logotipo
                    </h2>

                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Preview do logo */}
                        <div className="w-24 h-24 rounded-2xl border border-soft bg-bg flex items-center justify-center overflow-hidden shrink-0">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon size={32} className="text-muted/30" />
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            <p className="text-xs text-muted">
                                Faca upload do logotipo da sua igreja. Recomendamos PNG com fundo transparente, minimo 128x128px.
                            </p>
                            <input
                                ref={fileRef}
                                type="file"
                                name="logo"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg border border-soft text-xs font-black uppercase tracking-widest text-fg hover:border-figueira transition-all"
                            >
                                <Upload size={14} /> Escolher Imagem
                            </button>
                            <p className="text-[9px] text-muted/60">Maximo 2MB. Formatos: PNG, JPG, WebP</p>
                        </div>
                    </div>
                </section>

                {/* ACCOES */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-bg2 border border-soft text-xs font-black uppercase tracking-widest text-muted hover:border-red-500/30 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                        <RotateCcw size={14} /> Restaurar Padrao
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-figueira text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Guardar Alteracoes
                    </button>
                </div>
            </form>
        </main>
    )
}
