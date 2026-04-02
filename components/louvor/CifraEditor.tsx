'use client'

import { useState } from 'react'
import { Save, Loader2, X, Eye, Edit3, HelpCircle } from 'lucide-react'
import { parseCifra } from '@/lib/cifra'
import { salvarCifraInternaAction } from '@/actions/louvor-actions'

interface Props {
    musicaId: string
    titulo: string
    cifraAtual?: string | null
    onClose: () => void
    onSaved?: () => void
}

export default function CifraEditor({ musicaId, titulo, cifraAtual, onClose, onSaved }: Props) {
    const [texto, setTexto] = useState(cifraAtual || '')
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState(false)
    const [showHelp, setShowHelp] = useState(false)

    const { linhas } = parseCifra(texto)

    async function handleSave() {
        setSaving(true)
        const res = await salvarCifraInternaAction(musicaId, texto)
        setSaving(false)
        if (res.ok) {
            onSaved?.()
            onClose()
        } else {
            alert(res.error || 'Erro ao guardar.')
        }
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Editor de Cifra</p>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-white">{titulo}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowHelp(!showHelp)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg ${showHelp ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>
                            <HelpCircle size={14} />
                        </button>
                        <button onClick={() => setPreview(!preview)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg ${preview ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}`}>
                            {preview ? <Edit3 size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:text-red-400">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* HELP */}
                {showHelp && (
                    <div className="px-5 py-3 border-b border-white/10 bg-blue-500/10 text-blue-300 text-[10px] leading-relaxed shrink-0">
                        <p className="font-black uppercase tracking-widest mb-1">Como escrever:</p>
                        <p>Coloca os acordes entre <strong>[colchetes]</strong> antes da silaba:</p>
                        <p className="font-mono mt-1 bg-black/30 px-2 py-1 rounded">
                            [Am]Quando eu chorei Tu en[G]xugaste as minhas la[F]grimas
                        </p>
                        <p className="mt-1">Linhas em branco separam estrofes. Podes usar [Em] [Am7] [F#m] etc.</p>
                    </div>
                )}

                {/* BODY */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {preview ? (
                        <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-sm whitespace-pre-wrap">
                            {linhas.map((segs, i) => (
                                <div key={i} className="min-h-[1.5em] leading-relaxed">
                                    {segs.length === 0 && <br />}
                                    {segs.map((seg, j) => (
                                        seg.tipo === 'acorde' ? (
                                            <span key={j} className="text-emerald-400 font-black text-base">{seg.valor}</span>
                                        ) : (
                                            <span key={j} className="text-white/80">{seg.valor}</span>
                                        )
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            value={texto}
                            onChange={e => setTexto(e.target.value)}
                            placeholder={`[Am]Quando eu chorei Tu en[G]xugaste as minhas la[F]grimas\n[Dm]Quando clamei Tu me ou[Am]viste\n\n[C]Grande es Tu Se[G]nhor`}
                            className="flex-1 bg-black/50 text-white font-mono text-sm p-5 outline-none resize-none placeholder:text-white/20 leading-relaxed"
                            spellCheck={false}
                            autoFocus
                        />
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 shrink-0">
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">
                        {texto.split('\n').length} linhas
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/20">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
